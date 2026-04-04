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

  // Prefer AZURE_* names from .env/local.settings; fall back to generic TENANT/CLIENT names
  const tenant = process.env.AZURE_TENANT_ID || process.env.TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID || process.env.CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET || process.env.CLIENT_SECRET;
  let driveId = process.env.TARGET_DRIVE_ID;
  let folderId = process.env.TARGET_FOLDER_ID;

  const fetch = require('node-fetch');

  function shareIdFromUrl(url) {
    const b = Buffer.from(url).toString('base64');
    const safe = b.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    return `u!${safe}`;
  }

  async function resolveShareUrl(url) {
    const tokenRes = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&scope=${encodeURIComponent('https://graph.microsoft.com/.default')}&grant_type=client_credentials`
    });
    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson.access_token;
    if (!accessToken) throw new Error('Failed to obtain access token');
    const shareId = shareIdFromUrl(url);
    const res = await fetch(`https://graph.microsoft.com/v1.0/shares/${encodeURIComponent(shareId)}/driveItem`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Failed to resolve share URL: ${res.status} ${txt}`);
    }
    const body = await res.json();
    const id = body.id || (body.remoteItem && body.remoteItem.id) || null;
    const resolvedDriveId = (body.parentReference && body.parentReference.driveId) || (body.remoteItem && body.remoteItem.parentReference && body.remoteItem.parentReference.driveId) || body.driveId || null;
    return { id, driveId: resolvedDriveId };
  }

  // If TEST_TARGET_URL provided, resolve it to driveId/folderId
  if (process.env.TEST_TARGET_URL && (!driveId || !folderId)) {
    try {
      console.log('Resolving TEST_TARGET_URL for check-target');
      const r = await resolveShareUrl(process.env.TEST_TARGET_URL);
      if (r.driveId && r.id) {
        driveId = r.driveId;
        folderId = r.id;
        console.log('Resolved target for check-target ->', driveId, folderId);
      }
    } catch (err) {
      console.error('Failed to resolve TEST_TARGET_URL', err && err.message ? err.message : err);
      process.exit(1);
    }
  }

  if (!tenant || !clientId || !clientSecret) {
    console.error('Missing AZURE credentials (AZURE_TENANT_ID,AZURE_CLIENT_ID,AZURE_CLIENT_SECRET)');
    process.exit(1);
  }
  if (!driveId || !folderId) {
    console.error('Missing TARGET_DRIVE_ID or TARGET_FOLDER_ID in local.settings.json');
    process.exit(1);
  }

  try {
    const tokenRes = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&scope=${encodeURIComponent('https://graph.microsoft.com/.default')}&grant_type=client_credentials`
    });
    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson.access_token;
    if (!accessToken) {
      console.error('Failed to obtain access token', tokenJson);
      process.exit(1);
    }

    const url = `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(folderId)}/children`;
    const resp = await fetch(url, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const text = await resp.text();
    console.log('List status', resp.status);
    console.log(text);
  } catch (err) {
    console.error('Error listing target folder', err && err.message ? err.message : err);
    process.exit(1);
  }
}

main();
