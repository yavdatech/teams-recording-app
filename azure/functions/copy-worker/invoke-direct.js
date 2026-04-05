// invoke-direct.js
// Directly invoke the copy-worker handler (bypasses queues/Azurite)
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

async function main() {
  const settingsPath = path.join(__dirname, 'local.settings.json');
  if (!fs.existsSync(settingsPath)) {
    console.error('local.settings.json missing; create it before running this script');
    process.exit(1);
  }
  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  const values = settings.Values || settings.values || {};
  for (const k of Object.keys(values)) process.env[k] = values[k];

  function logger() { console.log.apply(console, arguments); }
  logger.error = function () { console.error.apply(console, arguments); };
  const context = { log: logger };

  const item = {
    // default values; may be replaced below if TEST_SOURCE_URL provided
    sourceDriveId: process.env.TARGET_DRIVE_ID,
    itemId: process.env.TEST_ITEM_ID || '015CQKELSNMA2FLWX3ORBLGBQEBJYPPLKI',
    newName: 'direct-test-copy.mp4',
    // optional target overrides
    targetDriveId: process.env.TARGET_DRIVE_ID,
    targetFolderId: process.env.TARGET_FOLDER_ID
  };

  console.log('Invoking copy-worker with:', item);
  // If TEST_SOURCE_URL or TEST_TARGET_URL are set, resolve them to drive/item IDs
  // Prefer AZURE_* env names for local testing
  const tenant = process.env.AZURE_TENANT_ID || process.env.TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID || process.env.CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET || process.env.CLIENT_SECRET;

  async function getAccessToken() {
    const tokenRes = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&scope=${encodeURIComponent('https://graph.microsoft.com/.default')}&grant_type=client_credentials`
    });
    const tokenJson = await tokenRes.json();
    return tokenJson.access_token;
  }

  function shareIdFromUrl(url) {
    const b = Buffer.from(url).toString('base64');
    const safe = b.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    return `u!${safe}`;
  }

  async function resolveShareUrl(url) {
    const token = await getAccessToken();
    if (!token) throw new Error('Failed to get access token for resolving share URL');
    const shareId = shareIdFromUrl(url);
    const res = await fetch(`https://graph.microsoft.com/v1.0/shares/${encodeURIComponent(shareId)}/driveItem`, {
      headers: { 'Authorization': `Bearer ${token}` }
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
    if (process.env.TEST_SOURCE_URL) {
      console.log('Resolving TEST_SOURCE_URL to drive/item IDs');
      const resolved = await resolveShareUrl(process.env.TEST_SOURCE_URL);
      if (resolved.driveId && resolved.id) {
        item.sourceDriveId = resolved.driveId;
        item.itemId = resolved.id;
        console.log('Resolved source ->', resolved.driveId, resolved.id);
      } else {
        console.warn('Could not fully resolve TEST_SOURCE_URL', JSON.stringify(resolved));
      }
    }
    if (process.env.TEST_TARGET_URL) {
      console.log('Resolving TEST_TARGET_URL to drive/item IDs');
      const r2 = await resolveShareUrl(process.env.TEST_TARGET_URL);
      if (r2.driveId && r2.id) {
        item.targetDriveId = r2.driveId;
        item.targetFolderId = r2.id;
        // also set these into env so check-target.js can pick them up
        process.env.TARGET_DRIVE_ID = r2.driveId;
        process.env.TARGET_FOLDER_ID = r2.id;
        console.log('Resolved target ->', r2.driveId, r2.id);
      } else {
        console.warn('Could not fully resolve TEST_TARGET_URL', JSON.stringify(r2));
      }
    }
  } catch (err) {
    console.error('Error resolving TEST URLs', err && err.message ? err.message : err);
  }

  const copyWorker = require('./index');
  try {
    if (String(process.env.TEST_BATCH || '').toLowerCase() === 'true' && process.env.TEST_SOURCE_URL) {
      // Build a batch payload by listing children of the resolved TEST_SOURCE_URL folder
      console.log('Building batch payload from TEST_SOURCE_URL');
      const token = await getAccessToken();
      const share = shareIdFromUrl(process.env.TEST_SOURCE_URL);
      const resolved = await resolveShareUrl(process.env.TEST_SOURCE_URL);
      if (!resolved || !resolved.driveId || !resolved.id) {
        throw new Error('Could not resolve TEST_SOURCE_URL for batch');
      }
      const listUrl = `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(resolved.driveId)}/items/${encodeURIComponent(resolved.id)}/children?$select=id,name,file,folder`;
      const resp = await fetch(listUrl, { headers: { Authorization: `Bearer ${token}` } });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`Failed to list children for batch: ${resp.status} ${txt}`);
      }
      const j = await resp.json();
      const children = j.value || [];
      const items = children.filter(c => c.file && (c.name || '').toLowerCase().endsWith('.mp4')).map(c => ({ sourceDriveId: resolved.driveId, itemId: c.id, fileName: c.name }));
      const batchPayload = { items, targetDriveId: process.env.TARGET_DRIVE_ID, targetFolderId: process.env.TARGET_FOLDER_ID };
      console.log('Invoking copy-worker with batch of', items.length, 'items');
      await copyWorker(context, batchPayload);
      console.log('copy-worker batch invocation complete');
    } else {
      await copyWorker(context, item);
      console.log('copy-worker invocation complete');
    }
  } catch (err) {
    console.error('copy-worker threw:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

main();
