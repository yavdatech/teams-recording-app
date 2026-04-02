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
  if (!TARGET_DRIVE_ID || !TARGET_FOLDER_ID) return false;
  const url = `https://graph.microsoft.com/v1.0/drives/${TARGET_DRIVE_ID}/items/${TARGET_FOLDER_ID}/children?$select=name,id`;
  const res = await fetch(url, { method: 'GET', headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`${LOG_PREFIX} error listing target folder: ${res.status} ${txt}`);
  }
  const json = await res.json();
  return (json.value || []).some(i => i.name === filename);
}

async function copyToTarget(accessToken, sourceDriveId, itemId, filename) {
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

module.exports = async function (context, myTimer) {
  context.log(`${LOG_PREFIX} invoked`);
  try {
    const accessToken = await getAccessToken();
    context.log(`${LOG_PREFIX} acquired token`);
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
        // skip if item already lives inside the target folder
        if (item.parentReference && item.parentReference.driveId === TARGET_DRIVE_ID && item.parentReference.id === TARGET_FOLDER_ID) { skipped++; continue; }
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
        const exists = await targetHasFile(accessToken, name);
        if (exists) { skipped++; continue; }
        const res = await copyToTarget(accessToken, item.parentReference.driveId, item.id, name);
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
