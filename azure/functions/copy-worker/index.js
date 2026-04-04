const fetch = require('node-fetch');
const appInsights = require('applicationinsights');

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

let aiClient = null;
try {
  if (process.env.APPINSIGHTS_CONNECTION_STRING || process.env.APPINSIGHTS_INSTRUMENTATIONKEY) {
    if (process.env.APPINSIGHTS_CONNECTION_STRING) {
      appInsights.setup(process.env.APPINSIGHTS_CONNECTION_STRING);
    } else {
      appInsights.setup();
      if (process.env.APPINSIGHTS_INSTRUMENTATIONKEY) {
        appInsights.defaultClient.config.instrumentationKey = process.env.APPINSIGHTS_INSTRUMENTATIONKEY;
      }
    }
    appInsights.start();
    aiClient = appInsights.defaultClient;
  }
} catch (e) {
  // ignore telemetry init errors
}

function trackMetric(name, value = 1, properties) {
  if (!aiClient) return;
  try {
    if (typeof aiClient.trackMetric === 'function') {
      aiClient.trackMetric({ name, value });
    }
    if (properties && typeof aiClient.trackEvent === 'function') {
      aiClient.trackEvent({ name: `${name}_props`, properties });
    }
  } catch (e) {
    // swallow telemetry errors
  }
}

function sLog(context, level, event, data) {
  const base = { ts: new Date().toISOString(), level, event };
  const payload = Object.assign(base, data || {});
  try {
    context.log(JSON.stringify(payload));
  } catch (e) {
    context.log(level, event, data);
  }
  try {
    if (aiClient && typeof aiClient.trackTrace === 'function') {
      aiClient.trackTrace({ message: JSON.stringify(payload) });
    }
  } catch (e) {
    // ignore telemetry errors
  }
}

async function listAllChildren(driveId, folderId, accessToken) {
  const items = [];
  // include timestamps so callers can filter incrementally
  let url = `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(folderId)}/children?$select=id,name,file,folder,createdDateTime,lastModifiedDateTime`;
  while (url) {
    const resp = await fetch(url, { method: 'GET', headers: { Authorization: `Bearer ${accessToken}` } });
    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`Failed to list children: ${resp.status} ${txt}`);
    }
    const json = await resp.json();
    (json.value || []).forEach((i) => items.push(i));
    url = json['@odata.nextLink'] || null;
  }
  return items;
}

async function pollOperation(location, accessToken, maxPolls = 12, intervalMs = 2000) {
  if (!location) return false;
  for (let i = 0; i < maxPolls; i++) {
    await sleep(i === 0 ? 500 : intervalMs);
    try {
      const resp = await fetch(location, { method: 'GET', headers: { Authorization: `Bearer ${accessToken}` } });
      // 202 means still processing
      if (resp.status === 202) continue;
      if (resp.ok) return true; // finished
      const txt = await resp.text();
      throw new Error(`Operation polling returned ${resp.status}: ${txt}`);
    } catch (e) {
      // continue polling until maxPolls
    }
  }
  return false;
}

async function attemptCopyWithRetry(copyUrl, copyBody, accessToken, context, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const resp = await fetch(copyUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(copyBody)
      });

      if (resp.status === 202) {
        const location = resp.headers.get('Location') || resp.headers.get('location') || resp.headers.get('Content-Location') || resp.headers.get('content-location');
        sLog(context, 'info', 'copy_initiated', { copyUrl, attempt, location });
        const ok = await pollOperation(location, accessToken);
        if (ok) return { ok: true, status: 'completed' };
        sLog(context, 'warn', 'copy_poll_timeout', { copyUrl, attempt });
      } else if (resp.ok) {
        return { ok: true, status: 'completed' };
      } else {
        const text = await resp.text();
        // If the target already exists, detect and return a special flag so callers can treat it as a skip
        if (resp.status === 409) {
          try {
            const js = JSON.parse(text || '{}');
            const code = js && js.error && js.error.code;
            if (code === 'nameAlreadyExists' || (js && JSON.stringify(js).toLowerCase().includes('namealreadyexists'))) {
              sLog(context, 'info', 'copy_request_already_exists', { copyUrl, attempt, status: resp.status, body: text });
              return { ok: false, exists: true, status: 'already_exists' };
            }
          } catch (e) {
            // ignore parse errors and fall through to default logging
          }
        }
        sLog(context, 'warn', 'copy_request_failed', { copyUrl, attempt, status: resp.status, body: text });
      }
    } catch (e) {
      sLog(context, 'error', 'copy_attempt_error', { copyUrl, attempt, message: e && e.message ? e.message : String(e) });
    }
    // backoff before retrying
    await sleep(500 * attempt);
  }
  return { ok: false };
}

module.exports = async function (context, myQueueItem) {
  sLog(context, 'info', 'processing_queue_item', { item: myQueueItem });
  trackMetric('invocations', 1);

  // Prefer AZURE_* environment variable names; allow per-message overrides via the queue payload
  const tenant = process.env.AZURE_TENANT_ID || (myQueueItem && myQueueItem.tenant) || process.env.TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID || (myQueueItem && myQueueItem.clientId) || process.env.CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET || (myQueueItem && myQueueItem.clientSecret) || process.env.CLIENT_SECRET;
  const targetDriveId = process.env.TARGET_DRIVE_ID || (myQueueItem && myQueueItem.targetDriveId);
  const targetFolderId = process.env.TARGET_FOLDER_ID || (myQueueItem && myQueueItem.targetFolderId);

  if (!tenant || !clientId || !clientSecret) {
    sLog(context, 'error', 'missing_credentials', { reason: 'Missing AZURE_TENANT_ID/AZURE_CLIENT_ID/AZURE_CLIENT_SECRET' });
    return;
  }

  // Determine optional incremental filter timestamp (ISO string or epoch)
  let sinceIso = null;
  if (myQueueItem && myQueueItem.since) sinceIso = myQueueItem.since;
  else if (process.env.SINCE_ISO) sinceIso = process.env.SINCE_ISO;
  else if (process.env.LAST_RUN_ISO) sinceIso = process.env.LAST_RUN_ISO;
  else if (process.env.LAST_RUN) sinceIso = process.env.LAST_RUN;

  let sinceDate = null;
  if (sinceIso) {
    // try ISO parse first, then numeric epoch (seconds or ms)
    const parsed = new Date(sinceIso);
    if (!isNaN(parsed.getTime())) {
      sinceDate = parsed;
    } else {
      const n = Number(sinceIso);
      if (!isNaN(n)) {
        // if seconds (10 digits), convert to ms
        sinceDate = new Date(n.toString().length === 10 ? n * 1000 : n);
        if (isNaN(sinceDate.getTime())) sinceDate = null;
      }
    }
  }
  if (sinceDate) sLog(context, 'info', 'since_filter', { since: sinceDate.toISOString() });

  // helper that processes a single message object (either from a batch or single payload)
  async function processSingle(item, accessToken, existingNames) {
    if (!item || !item.sourceDriveId || !item.itemId) {
      sLog(context, 'warn', 'invalid_item_skipped', { item });
      return;
    }

    const { sourceDriveId, itemId, newName } = item;

    // Fetch metadata
    let meta;
    try {
      const metaUrl = `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(sourceDriveId)}/items/${encodeURIComponent(itemId)}?$select=name,file,folder,createdDateTime,lastModifiedDateTime`;
      const metaResp = await fetch(metaUrl, { method: 'GET', headers: { Authorization: `Bearer ${accessToken}` } });
      if (!metaResp.ok) {
        const txt = await metaResp.text();
        sLog(context, 'error', 'fetch_metadata_failed', { status: metaResp.status, body: txt, item });
        return;
      }
      meta = await metaResp.json();
    } catch (metaErr) {
      sLog(context, 'error', 'meta_fetch_error', { message: metaErr && metaErr.message ? metaErr.message : String(metaErr), item });
      return;
    }

    const copyRecordings = String(process.env.ALLOW_RECORDINGS || '').toLowerCase() === 'true';

    // If source is a folder, enumerate children and copy any .mp4 files
      if (meta.folder) {
      sLog(context, 'info', 'enumerate_source_folder', { sourceDriveId, itemId });
      try {
          // request timestamps for each child so we can filter incrementally
          let listUrl = `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(sourceDriveId)}/items/${encodeURIComponent(itemId)}/children?$select=id,name,file,folder,createdDateTime,lastModifiedDateTime`;
          while (listUrl) {
            const listResp = await fetch(listUrl, { method: 'GET', headers: { Authorization: `Bearer ${accessToken}` } });
          if (!listResp.ok) {
            const txt = await listResp.text();
            sLog(context, 'error', 'list_children_failed', { status: listResp.status, body: txt, item });
            break;
          }
          const listJson = await listResp.json();
          const children = listJson.value || [];
          for (const child of children) {
              // optional incremental filter: skip items older than `sinceDate` (if provided)
              if (sinceDate) {
                const childTimeStr = child.createdDateTime || (child.fileSystemInfo && child.fileSystemInfo.createdDateTime) || child.lastModifiedDateTime || (child.fileSystemInfo && child.fileSystemInfo.lastModifiedDateTime);
                if (childTimeStr) {
                  const childTime = new Date(childTimeStr);
                  if (!isNaN(childTime.getTime()) && childTime <= sinceDate) {
                    sLog(context, 'info', 'skip_old_child', { id: child.id, name: child.name, created: childTimeStr, since: sinceDate.toISOString() });
                    trackMetric('skip_old', 1);
                    continue;
                  }
                }
              }
            const childName = (child.name || '').toLowerCase();
            const childExt = childName.includes('.') ? childName.split('.').pop() : '';
            if (child.file && childExt === 'mp4') {
              if (existingNames && existingNames.has(childName)) {
                sLog(context, 'info', 'skip_duplicate', { id: child.id, name: child.name });
                trackMetric('skip_duplicate', 1);
                continue;
              }

              const copyBody = { parentReference: {} };
              if (targetDriveId) copyBody.parentReference.driveId = targetDriveId;
              if (targetFolderId) copyBody.parentReference.id = targetFolderId;
              copyBody.name = child.name;

              const copyUrl = `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(sourceDriveId)}/items/${encodeURIComponent(child.id)}/copy`;
              const result = await attemptCopyWithRetry(copyUrl, copyBody, accessToken, context, 3);
              if (result.ok) {
                sLog(context, 'info', 'copy_success', { id: child.id, name: child.name });
                trackMetric('copy_success', 1);
                if (existingNames) existingNames.add(childName);
              } else if (result.exists) {
                sLog(context, 'info', 'skip_existing', { id: child.id, name: child.name });
                trackMetric('skip_duplicate', 1);
                if (existingNames) existingNames.add(childName);
              } else {
                sLog(context, 'error', 'copy_failed_after_retries', { id: child.id, name: child.name });
                trackMetric('copy_failed', 1);
              }
            } else {
              sLog(context, 'debug', 'skip_non_mp4_child', { id: child.id, name: child.name });
            }
          }
          listUrl = listJson['@odata.nextLink'] || null;
        }
      } catch (errChildren) {
        sLog(context, 'error', 'error_enumerating_children', { message: errChildren && errChildren.message ? errChildren.message : String(errChildren), item });
      }
      return;
    }

    // If source is a file, copy if it's an mp4 or if testing override enabled
    if (meta.file) {
      const name = (meta.name || '').toLowerCase();
      const ext = name.includes('.') ? name.split('.').pop() : '';
      // incremental filter: skip file if it is older than sinceDate
      if (sinceDate) {
        const metaTimeStr = meta.createdDateTime || (meta.fileSystemInfo && meta.fileSystemInfo.createdDateTime) || meta.lastModifiedDateTime || (meta.fileSystemInfo && meta.fileSystemInfo.lastModifiedDateTime);
        if (metaTimeStr) {
          const metaTime = new Date(metaTimeStr);
          if (!isNaN(metaTime.getTime()) && metaTime <= sinceDate) {
            sLog(context, 'info', 'skip_old_file', { itemId, name: meta.name, created: metaTimeStr, since: sinceDate.toISOString() });
            trackMetric('skip_old', 1);
            return;
          }
        }
      }

      if (ext === 'mp4' || copyRecordings) {
        // Deduplicate by the name that will be used in the target. If caller provided newName, use that for dedupe.
        const dedupeName = (newName && typeof newName === 'string') ? newName.toLowerCase() : name;
        if (existingNames && existingNames.has(dedupeName)) {
          sLog(context, 'info', 'skip_duplicate_file', { itemId, name: dedupeName });
          trackMetric('skip_duplicate', 1);
          return;
        }
        const copyBody = { parentReference: {} };
        if (targetDriveId) copyBody.parentReference.driveId = targetDriveId;
        if (targetFolderId) copyBody.parentReference.id = targetFolderId;
        if (newName) copyBody.name = newName;

        const copyUrl = `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(sourceDriveId)}/items/${encodeURIComponent(itemId)}/copy`;
        const result = await attemptCopyWithRetry(copyUrl, copyBody, accessToken, context, 3);
        if (result.ok) {
          sLog(context, 'info', 'copy_success', { itemId, name });
          trackMetric('copy_success', 1);
          // mark the created name in the dedupe index so subsequent items in this batch are skipped
          const dedupeName = (newName && typeof newName === 'string') ? newName.toLowerCase() : name;
          if (existingNames) existingNames.add(dedupeName);
        } else if (result.exists) {
          const dedupeName = (newName && typeof newName === 'string') ? newName.toLowerCase() : name;
          sLog(context, 'info', 'skip_existing_file', { itemId, name: dedupeName });
          trackMetric('skip_duplicate', 1);
          if (existingNames) existingNames.add(dedupeName);
        } else {
          sLog(context, 'error', 'copy_failed_after_retries', { itemId, name });
          trackMetric('copy_failed', 1);
        }
        return;
      }
      // otherwise fall back to previous transcript-only logic
      const allowedExts = ['vtt', 'txt', 'srt', 'json'];
      const looksLikeTranscript = copyRecordings || name.includes('transcript') || allowedExts.includes(ext) || (meta.file && meta.file.mimeType && meta.file.mimeType.startsWith('text'));
      if (!looksLikeTranscript) {
        sLog(context, 'info', 'skip_non_transcript', { itemId, name });
        return;
      }

      // proceed to copy transcript-like file
      const copyBody = { parentReference: {} };
      if (targetDriveId) copyBody.parentReference.driveId = targetDriveId;
      if (targetFolderId) copyBody.parentReference.id = targetFolderId;
      if (newName) copyBody.name = newName;

      const copyUrl = `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(sourceDriveId)}/items/${encodeURIComponent(itemId)}/copy`;
      const result = await attemptCopyWithRetry(copyUrl, copyBody, accessToken, context, 3);
      if (result.ok) {
        sLog(context, 'info', 'copy_success', { itemId, name });
        trackMetric('copy_success', 1);
        if (existingNames) existingNames.add((newName && typeof newName === 'string') ? newName.toLowerCase() : name);
      } else {
        sLog(context, 'error', 'copy_failed_after_retries', { itemId, name });
        trackMetric('copy_failed', 1);
      }
      return;
    }
  }

  try {
    // Acquire token once per invocation
    const tokenRes = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&scope=${encodeURIComponent('https://graph.microsoft.com/.default')}&grant_type=client_credentials`
    });
    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson.access_token;
    if (!accessToken) {
      sLog(context, 'error', 'token_failure', { tokenJson });
      return;
    }

    // Batch support: process `items` array if provided
    if (myQueueItem && Array.isArray(myQueueItem.items)) {
      sLog(context, 'info', 'processing_batch', { count: myQueueItem.items.length });
      trackMetric('batch_invocations', 1);
      trackMetric('items_in_batch', myQueueItem.items.length);

      // Build dedupe index once
      let existingNames = new Set();
      if (targetDriveId && targetFolderId) {
        try {
          const tChildren = await listAllChildren(targetDriveId, targetFolderId, accessToken);
          tChildren.forEach((c) => existingNames.add((c.name || '').toLowerCase()));
          sLog(context, 'info', 'loaded_target_index', { count: existingNames.size });
          trackMetric('target_index_size', existingNames.size);
        } catch (e) {
          sLog(context, 'warn', 'failed_load_target_index', { message: e && e.message ? e.message : String(e) });
        }
      } else {
        sLog(context, 'warn', 'no_target_configured', { targetDriveId, targetFolderId });
      }

      for (const it of myQueueItem.items) {
        try {
          await processSingle(it, accessToken, existingNames);
        } catch (e) {
          sLog(context, 'error', 'batch_item_processing_error', { message: e && e.message ? e.message : String(e), item: it });
        }
      }
      return;
    }

    // Single-message path: process the single item
    // Build dedupe index
    let existingNames = new Set();
    if (targetDriveId && targetFolderId) {
      try {
        const tChildren = await listAllChildren(targetDriveId, targetFolderId, accessToken);
        tChildren.forEach((c) => existingNames.add((c.name || '').toLowerCase()));
        sLog(context, 'info', 'loaded_target_index', { count: existingNames.size });
        trackMetric('target_index_size', existingNames.size);
      } catch (e) {
        sLog(context, 'warn', 'failed_load_target_index', { message: e && e.message ? e.message : String(e) });
      }
    } else {
      sLog(context, 'warn', 'no_target_configured', { targetDriveId, targetFolderId });
    }

    await processSingle(myQueueItem, accessToken, existingNames);

  } catch (err) {
    sLog(context, 'error', 'processing_error', { message: err && err.message ? err.message : String(err) });
  }
};
