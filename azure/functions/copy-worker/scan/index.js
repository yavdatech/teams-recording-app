// Load .env for local development if available
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not installed in production; ignore
}

const fetch = require('node-fetch');

// Prefer the AZURE_* names from the repository .env; fall back to generic TENANT/CLIENT names
const tenant = process.env.AZURE_TENANT_ID || process.env.TENANT_ID;
const clientId = process.env.AZURE_CLIENT_ID || process.env.CLIENT_ID;
const clientSecret = process.env.AZURE_CLIENT_SECRET || process.env.CLIENT_SECRET;
const TARGET_DRIVE_ID = process.env.TARGET_DRIVE_ID;
const TARGET_FOLDER_ID = process.env.TARGET_FOLDER_ID;
const LOG_PREFIX = '[scan-schedule]';

async function getAccessToken() {
  if (!tenant || !clientId || !clientSecret) throw new Error('Missing AZURE_TENANT_ID/AZURE_CLIENT_ID/AZURE_CLIENT_SECRET');
  const params = new URLSearchParams();
  params.append('client_id', clientId);
  params.append('scope', 'https://graph.microsoft.com/.default');
  params.append('client_secret', clientSecret);
  params.append('grant_type', 'client_credentials');

  const res = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
    method: 'POST',
    body: params,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`${LOG_PREFIX} token request failed: ${JSON.stringify(json)}`);
  return json.access_token;
}

async function graphSearch(accessToken) {
  const body = {
    requests: [
      {
        entityTypes: ['driveItem'],
        query: { queryString: 'filetype:mp4' },
        size: 500
      }
    ]
  };
  const res = await fetch('https://graph.microsoft.com/v1.0/search/query', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`${LOG_PREFIX} graph search failed: ${JSON.stringify(json)}`);
  const hits = (json.value && json.value[0] && json.value[0].hitsContainers && json.value[0].hitsContainers[0] && json.value[0].hitsContainers[0].hits) || [];
  return hits.map(h => h.resource).filter(Boolean);
}

async function targetHasFile(accessToken, filename) {
  // Deprecated: scan now resolves target drive/folder at runtime. Keep for compatibility.
  return false;
}

async function copyToTarget(accessToken, sourceDriveId, itemId, filename) {
  // Old signature kept for compatibility. New callers should pass explicit target ids.
  const url = `https://graph.microsoft.com/v1.0/drives/${sourceDriveId}/items/${itemId}/copy`;
  const body = {
    parentReference: { driveId: TARGET_DRIVE_ID, id: TARGET_FOLDER_ID },
    name: filename
  };
  const res = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (res.status === 202 || res.status === 201 || res.status === 200) {
    return { ok: true, status: res.status };
  }
  const txt = await res.text();
  return { ok: false, status: res.status, body: txt };
}

// New helper: copy with explicit target drive/folder ids
async function copyToTargetExplicit(accessToken, sourceDriveId, itemId, filename, targetDriveId, targetFolderId) {
  const url = `https://graph.microsoft.com/v1.0/drives/${sourceDriveId}/items/${itemId}/copy`;
  const body = {
    parentReference: { driveId: targetDriveId, id: targetFolderId },
    name: filename
  };
  const res = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (res.status === 202 || res.status === 201 || res.status === 200) return { ok: true, status: res.status };
  const txt = await res.text();
  return { ok: false, status: res.status, body: txt };
}

// Resolve a SharePoint TARGET_URL into a driveId and folderId via Graph
async function resolveTargetFromUrl(accessToken, targetUrl) {
  try {
    const u = new URL(targetUrl);
    const hostname = u.hostname; // e.g., contoso.sharepoint.com
    let serverRelative = u.searchParams.get('id');
    if (serverRelative) serverRelative = decodeURIComponent(serverRelative);
    else {
      const m = u.pathname.match(/\/sites\/([^\/]+)/i);
      if (m && m[1]) serverRelative = `/sites/${m[1]}`;
    }
    if (!serverRelative) return null;
    const parts = serverRelative.split('/').filter(Boolean);
    if (parts.length < 2 || parts[0].toLowerCase() !== 'sites') return null;
    const siteName = parts[1];
    let libPathParts = parts.slice(2);
    if (libPathParts.length && libPathParts[0].toLowerCase() === 'shared documents') libPathParts = libPathParts.slice(1);
    const libPath = libPathParts.join('/');

    const siteUrl = `https://graph.microsoft.com/v1.0/sites/${hostname}:/sites/${encodeURIComponent(siteName)}:`;
    const siteRes = await fetch(siteUrl, { method: 'GET', headers: { Authorization: `Bearer ${accessToken}` } });
    if (!siteRes.ok) return null;
    const siteJson = await siteRes.json();
    const siteId = siteJson.id;

    const encodedPath = libPath ? encodeURIComponent(libPath).replace(/%2F/g, '/') : '';
    const driveItemUrl = encodedPath
      ? `https://graph.microsoft.com/v1.0/sites/${encodeURIComponent(siteId)}/drive/root:/${encodedPath}`
      : `https://graph.microsoft.com/v1.0/sites/${encodeURIComponent(siteId)}/drive/root`;
    const diRes = await fetch(driveItemUrl, { method: 'GET', headers: { Authorization: `Bearer ${accessToken}` } });
    if (!diRes.ok) return null;
    const diJson = await diRes.json();
    const driveId = diJson.parentReference && diJson.parentReference.driveId ? diJson.parentReference.driveId : diJson.driveId || null;
    const folderId = diJson.id;
    if (!driveId || !folderId) return null;
    return { driveId, folderId };
  } catch (e) {
    return null;
  }
}

module.exports = async function (context, myTimer) {
  context.log(`${LOG_PREFIX} invoked`);
  try {
    const accessToken = await getAccessToken();
    context.log(`${LOG_PREFIX} acquired token`);
    // Resolve SharePoint target (if TARGET_URL provided) so we can copy into it
    let resolvedTarget = null;
    if (process.env.TARGET_URL) {
      resolvedTarget = await resolveTargetFromUrl(accessToken, process.env.TARGET_URL);
      context.log(`${LOG_PREFIX} resolved TARGET_URL -> ${resolvedTarget ? JSON.stringify(resolvedTarget) : 'null'}`);
    }
    const items = await graphSearch(accessToken);
    context.log(`${LOG_PREFIX} found ${items.length} mp4 items`);
      // Determine last run time from the timer trigger schedule status (if available)
      let sinceDate = null;
      try {
        if (myTimer && myTimer.scheduleStatus && myTimer.scheduleStatus.last) {
          const d = new Date(myTimer.scheduleStatus.last);
          if (!isNaN(d.getTime())) sinceDate = d;
        }
      } catch (e) {
        // ignore
      }
      if (sinceDate) context.log(`${LOG_PREFIX} applying incremental since filter: ${sinceDate.toISOString()}`);
    let copied = 0, skipped = 0, failed = 0;
    for (const item of items) {
      try {
        const name = item.name || 'unknown.mp4';
        // determine effective target ids (resolved from TARGET_URL takes precedence)
        const targetDriveId = resolvedTarget && resolvedTarget.driveId ? resolvedTarget.driveId : TARGET_DRIVE_ID;
        const targetFolderId = resolvedTarget && resolvedTarget.folderId ? resolvedTarget.folderId : TARGET_FOLDER_ID;
        // skip if item already lives inside the target folder
        if (item.parentReference && targetDriveId && targetFolderId && item.parentReference.driveId === targetDriveId && item.parentReference.id === targetFolderId) { skipped++; continue; }
        // incremental filter: skip items older than sinceDate
        if (sinceDate) {
          const created = item.createdDateTime || (item.fileSystemInfo && item.fileSystemInfo.createdDateTime) || item.lastModifiedDateTime || (item.fileSystemInfo && item.fileSystemInfo.lastModifiedDateTime);
          if (created) {
            const cd = new Date(created);
            if (!isNaN(cd.getTime()) && cd <= sinceDate) {
              skipped++; context.log(`${LOG_PREFIX} skipping older item '${name}' created ${created}`); continue;
            }
          }
        }
        // List target folder children and delete matching name to implement replace behavior
        let matchingTargetItem = null;
        if (targetDriveId && targetFolderId) {
          try {
            const listUrl = `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(targetDriveId)}/items/${encodeURIComponent(targetFolderId)}/children?$select=name,id`;
            const lr = await fetch(listUrl, { method: 'GET', headers: { Authorization: `Bearer ${accessToken}` } });
            if (lr.ok) {
              const lj = await lr.json();
              matchingTargetItem = (lj.value || []).find(i => i.name === name) || null;
            } else {
              const txt = await lr.text();
              context.log(`${LOG_PREFIX} error listing target folder: ${lr.status} ${txt}`);
            }
          } catch (e) {
            context.log(`${LOG_PREFIX} error listing target folder: ${e && e.message ? e.message : String(e)}`);
          }
        }
        if (matchingTargetItem) {
          try {
            const delUrl = `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(targetDriveId)}/items/${encodeURIComponent(matchingTargetItem.id)}`;
            const dr = await fetch(delUrl, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } });
            if (dr.status === 204) {
              context.log(`${LOG_PREFIX} removed existing target item '${name}' (id=${matchingTargetItem.id}) to replace`);
            } else {
              const txt = await dr.text();
              context.log(`${LOG_PREFIX} failed to delete existing target item: ${dr.status} ${txt}`);
              skipped++; continue;
            }
          } catch (e) {
            context.log(`${LOG_PREFIX} error deleting target item: ${e && e.message ? e.message : String(e)}`);
            skipped++; continue;
          }
        }
        const res = await copyToTargetExplicit(accessToken, item.parentReference.driveId, item.id, name, targetDriveId, targetFolderId);
        if (res.ok) { copied++; context.log(`${LOG_PREFIX} copied '${name}'`); } else { failed++; context.log(`${LOG_PREFIX} failed to copy '${name}': ${res.status} ${res.body}`); }
      } catch (e) {
        failed++; context.log(`${LOG_PREFIX} item error: ${e && e.message ? e.message : String(e)}`);
      }
    }
    context.log(`${LOG_PREFIX} done. copied=${copied}, skipped=${skipped}, failed=${failed}`);
  } catch (e) {
    context.log.error(`${LOG_PREFIX} error: ${e && e.message ? e.message : String(e)}`);
    throw e;
  }
};
