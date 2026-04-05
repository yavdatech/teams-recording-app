// run-local-batch-devcopy.js
// Usage: node run-local-batch-devcopy.js [limit] [suffix]
// Reads azure/functions/copy-worker/local.settings.json, resolves TEST_SOURCE_URL to drive/item IDs,
// lists children, picks up to [limit] mp4 files, and invokes the copy-worker handler with a batch payload
// where each file is renamed with the provided suffix (default "-devcopy") to force copy even if duplicates exist.

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

async function main() {
  const limit = parseInt(process.argv[2], 10) || 10;
  const suffix = process.argv[3] || '-devcopy';
  // optional 3rd arg can be an ISO timestamp or epoch to act as a 'since' filter
  const sinceArg = process.argv[4] || null;
  const base = __dirname;
  const settingsPath = path.join(base, 'local.settings.json');
  if (!fs.existsSync(settingsPath)) {
    console.error('local.settings.json missing; create it before running this script');
    process.exit(1);
  }
  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  const values = settings.Values || settings.values || {};
  for (const k of Object.keys(values)) process.env[k] = values[k];

  const tenant = process.env.AZURE_TENANT_ID || process.env.TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID || process.env.CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET || process.env.CLIENT_SECRET;
  if (!tenant || !clientId || !clientSecret) {
    console.error('Missing AAD/AZURE client credentials in local.settings.json (AZURE_TENANT_ID/AZURE_CLIENT_ID/AZURE_CLIENT_SECRET)');
    process.exit(1);
  }

  if (!process.env.TEST_SOURCE_URL) {
    console.error('TEST_SOURCE_URL is not set in local.settings.json');
    process.exit(1);
  }

  function shareIdFromUrl(url) {
    const b = Buffer.from(url).toString('base64');
    const safe = b.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    return `u!${safe}`;
  }

  async function getAccessToken() {
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
    if (!res.ok) {
      console.error('Failed to get token', json);
      throw new Error('token error');
    }
    return json.access_token;
  }

  async function resolveShareUrl(url) {
    const token = await getAccessToken();
    const shareId = shareIdFromUrl(url);
    const res = await fetch(`https://graph.microsoft.com/v1.0/shares/${encodeURIComponent(shareId)}/driveItem`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Failed to resolve share URL: ${res.status} ${txt}`);
    }
    const body = await res.json();
    const id = body.id || (body.remoteItem && body.remoteItem.id) || null;
    const driveId = (body.parentReference && body.parentReference.driveId) || (body.remoteItem && body.remoteItem.parentReference && body.remoteItem.parentReference.driveId) || body.driveId || null;
    return { id, driveId, raw: body };
  }

  try {
    console.log('Resolving TEST_SOURCE_URL...');
    const resolved = await resolveShareUrl(process.env.TEST_SOURCE_URL);
    if (!resolved || !resolved.driveId || !resolved.id) {
      console.error('Could not resolve TEST_SOURCE_URL to driveId/itemId', resolved);
      process.exit(1);
    }
    console.log('Resolved TEST_SOURCE_URL ->', resolved.driveId, resolved.id);

    const token = await getAccessToken();
    const listUrl = `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(resolved.driveId)}/items/${encodeURIComponent(resolved.id)}/children?$select=id,name,file,folder`;
    console.log('Listing children from', listUrl);
    const resp = await fetch(listUrl, { headers: { Authorization: `Bearer ${token}` } });
    if (!resp.ok) {
      const txt = await resp.text();
      console.error('Failed to list children', resp.status, txt);
      process.exit(1);
    }
    const j = await resp.json();
    const children = j.value || [];
    const mp4s = children.filter(c => c.file && (c.name || '').toLowerCase().endsWith('.mp4'));
    console.log('Found mp4 count in folder:', mp4s.length);
    const selected = mp4s.slice(0, limit);
    console.log(`Selected ${selected.length} items to test (limit=${limit})`);

    const items = selected.map(c => {
      const baseName = (c.name || '').replace(/\.mp4$/i, '');
      return { sourceDriveId: resolved.driveId, itemId: c.id, newName: `${baseName}${suffix}.mp4` };
    });

    const batchPayload = { items, targetDriveId: process.env.TARGET_DRIVE_ID, targetFolderId: process.env.TARGET_FOLDER_ID };
    if (sinceArg) batchPayload.since = sinceArg;

    console.log('Invoking copy-worker with batch (renamed files to force copy)...');
    const context = { log: function () { console.log.apply(console, arguments); } };
    context.log.error = function () { console.error.apply(console, arguments); };

    const copyWorker = require('./index');
    await copyWorker(context, batchPayload);
    console.log('copy-worker batch invocation complete');
  } catch (err) {
    console.error('Error running local dev batch:', err && err.message ? err.message : err);
    if (err && err.stack) console.error(err.stack);
    process.exit(1);
  }
}

main();
