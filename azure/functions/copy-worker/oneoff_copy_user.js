// One-off script to copy top-N mp4 files for a specific user to the target drive/folder.
// Usage: node oneoff_copy_user.js <user-substring-or-upn> [limit]

const path = require('path');
const fetch = require('node-fetch');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '..', '.env') });
const fs = require('fs');

// Fallback: load TARGET_URL directly from .env file if dotenv didn't populate it into process.env
let TARGET_URL_ENV = process.env.TARGET_URL;
if (!TARGET_URL_ENV) {
  try {
    const envPath = path.resolve(__dirname, '..', '..', '..', '.env');
    console.log('[oneoff-scan] looking for .env at ' + envPath + ' exists=' + fs.existsSync(envPath));
    const txt = fs.readFileSync(envPath, 'utf8');
    const m = txt.match(/^TARGET_URL=(.*)$/m);
    if (m && m[1]) TARGET_URL_ENV = m[1].trim();
  } catch (e) {
    console.log('[oneoff-scan] .env read error: ' + (e && e.message ? e.message : String(e)));
  }
}
console.log('[oneoff-scan] env TARGET_URL=' + TARGET_URL_ENV);

const tenant = process.env.AZURE_TENANT_ID || process.env.TENANT_ID;
const clientId = process.env.AZURE_CLIENT_ID || process.env.CLIENT_ID;
const clientSecret = process.env.AZURE_CLIENT_SECRET || process.env.CLIENT_SECRET;
const TARGET_DRIVE_ID = process.env.TARGET_DRIVE_ID;
const TARGET_FOLDER_ID = process.env.TARGET_FOLDER_ID;
const LOG_PREFIX = '[oneoff-scan]';

async function getAccessToken() {
  if (!tenant || !clientId || !clientSecret) throw new Error('Missing AZURE_TENANT_ID/AZURE_CLIENT_ID/AZURE_CLIENT_SECRET in env');
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
  // The search/query endpoint can require additional parameters when using app-only tokens
  // and may return errors like "Region is required when request with application permission.".
  // For our recording-specific flow we will prefer to list the user's /recordings folder directly.
  return [];
}

async function listRecordingsForUser(accessToken, userUpn, folderPath = 'recordings', limit = 10) {
  // Recursively traverse user's drive:/recordings folder and collect .mp4 files
  const results = [];

  async function listChildrenByUrl(url) {
    const out = [];
    let next = url;
    while (next && results.length < limit) {
      const r = await fetch(next, { method: 'GET', headers: { Authorization: `Bearer ${accessToken}` } });
      if (!r.ok) {
        const txt = await r.text();
        throw new Error(`${LOG_PREFIX} error listing children: ${r.status} ${txt}`);
      }
      const j = await r.json();
      if (j.value && j.value.length) out.push(...j.value);
      next = j['@odata.nextLink'] || null;
    }
    return out;
  }

  async function traverseFolderByPath(path) {
    // Initial call: use /drive/root:/{path}:/children
    const encoded = encodeURIComponent(path).replace(/%2F/g, '/');
    const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(userUpn)}/drive/root:/${encoded}:/children`;
    let children = [];
    try {
      children = await listChildrenByUrl(url);
    } catch (e) {
      // if folder doesn't exist, try other drives the user has access to (e.g., SharePoint/drives)
      if (e && e.message && e.message.includes('404')) {
        console.log(`${LOG_PREFIX} folder not found in user's primary drive; enumerating drives for alternatives`);
        // enumerate drives for the user
        const drivesUrl = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(userUpn)}/drives`;
        const drivesRes = await fetch(drivesUrl, { method: 'GET', headers: { Authorization: `Bearer ${accessToken}` } });
        if (!drivesRes.ok) {
          const txt = await drivesRes.text();
          throw new Error(`${LOG_PREFIX} error listing drives: ${drivesRes.status} ${txt}`);
        }
        const drivesJson = await drivesRes.json();
        const drives = drivesJson.value || [];
        for (const d of drives) {
          if (results.length >= limit) break;
          try {
            const driveChildrenUrl = `https://graph.microsoft.com/v1.0/drives/${d.id}/root:/${encoded}:/children`;
            const childrenInDrive = await listChildrenByUrl(driveChildrenUrl);
            if (childrenInDrive && childrenInDrive.length) {
              await traverseItems(childrenInDrive);
              if (results.length >= limit) break;
            }
          } catch (e2) {
            // ignore and continue to next drive
            continue;
          }
        }
        return;
      }
      // otherwise rethrow
      throw e;
    }
    await traverseItems(children);
  }

  async function traverseItems(items) {
    for (const item of items) {
      if (results.length >= limit) break;
      if (item.folder) {
        // list this folder's children by item id
        const childUrl = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(userUpn)}/drive/items/${item.id}/children`;
        const children = await listChildrenByUrl(childUrl);
        await traverseItems(children);
      } else if (item.name && item.name.toLowerCase().endsWith('.mp4')) {
        results.push(item);
        if (results.length >= limit) break;
      }
    }
  }

  // Start traversal at given folderPath
  await traverseFolderByPath(folderPath);
  return results;
}

async function targetHasFile(accessToken, filename) {
  // caller must pass target drive/folder ids via closure or resolved target
  // This function kept for backward compatibility but not used in the new flow.
  return false;
}

async function copyToTarget(accessToken, sourceDriveId, itemId, filename, targetDriveId, targetFolderId) {
  const url = `https://graph.microsoft.com/v1.0/drives/${sourceDriveId}/items/${itemId}/copy`;
  const body = {
    parentReference: { driveId: targetDriveId, id: targetFolderId },
    name: filename
  };
  const res = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (res.status === 202 || res.status === 201 || res.status === 200) {
    return { ok: true, status: res.status };
  }
  const txt = await res.text();
  return { ok: false, status: res.status, body: txt };
}

async function checkTargetFolderAccess(accessToken) {
  // Prefer resolving TARGET_URL if provided; otherwise fall back to explicit drive/folder IDs
  try {
    let driveId = TARGET_DRIVE_ID;
    let folderId = TARGET_FOLDER_ID;
    // If TARGET_URL is provided prefer resolving it (it may be more reliable than static IDs)
    if (TARGET_URL_ENV) {
      console.log(`${LOG_PREFIX} TARGET_URL present: ${TARGET_URL_ENV}`);
      const resolved = await resolveTargetFromUrl(accessToken, TARGET_URL_ENV);
      console.log(`${LOG_PREFIX} resolved from TARGET_URL: ${resolved ? JSON.stringify(resolved) : 'null'}`);
      if (resolved) {
        driveId = resolved.driveId;
        folderId = resolved.folderId;
      } else {
        console.log(`${LOG_PREFIX} TARGET_URL present but could not be resolved; falling back to TARGET_DRIVE_ID/TARGET_FOLDER_ID`);
      }
    }
    if (!driveId || !folderId) {
      console.log(`${LOG_PREFIX} TARGET_DRIVE_ID/TARGET_FOLDER_ID or TARGET_URL not configured or could not be resolved`);
      return;
    }
    console.log(`${LOG_PREFIX} checking target -> drive=${driveId} folder=${folderId}`);
    const url = `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(folderId)}/children?$top=10&$select=name,id`;
    const r = await fetch(url, { method: 'GET', headers: { Authorization: `Bearer ${accessToken}` } });
    if (!r.ok) {
      const txt = await r.text();
      console.log(`${LOG_PREFIX} cannot access target folder: ${r.status} ${txt}`);
      return;
    }
    const j = await r.json();
    const count = (j.value || []).length;
    console.log(`${LOG_PREFIX} target folder accessible: drive=${driveId} folder=${folderId} contains ${count} items (showing up to 10)`);
    (j.value || []).forEach(i => console.log(`${LOG_PREFIX} - ${i.name}`));
  } catch (e) {
    console.log(`${LOG_PREFIX} target access check error: ${e && e.message ? e.message : String(e)}`);
  }
}

async function resolveTargetFromUrl(accessToken, targetUrl) {
  try {
    const u = new URL(targetUrl);
    const hostname = u.hostname; // e.g., yavdain.sharepoint.com
    // prefer 'id' query param which contains the server-relative path
    let serverRelative = u.searchParams.get('id');
    if (serverRelative) serverRelative = decodeURIComponent(serverRelative);
    else {
      // fallback: extract '/sites/{siteName}' from pathname
      const m = u.pathname.match(/\/sites\/([^\/]+)/i);
      if (m && m[1]) {
        const siteName = m[1];
        serverRelative = `/sites/${siteName}`;
      }
    }
    if (!serverRelative) {
      console.log(`${LOG_PREFIX} could not determine server-relative path from TARGET_URL`);
      return null;
    }
    const parts = serverRelative.split('/').filter(Boolean);
    // expecting ['sites','{siteName}', ...libraryPathParts]
    if (parts.length < 2 || parts[0].toLowerCase() !== 'sites') {
      console.log(`${LOG_PREFIX} unsupported TARGET_URL path format: ${serverRelative}`);
      return null;
    }
    const siteName = parts[1];
    let libPathParts = parts.slice(2); // e.g., ['Shared Documents','recordings']
    // If the server-relative path includes the document library name 'Shared Documents',
    // the drive root maps to that library so drop the leading 'Shared Documents' segment.
    if (libPathParts.length && libPathParts[0].toLowerCase() === 'shared documents') {
      libPathParts = libPathParts.slice(1);
    }
    const libPath = libPathParts.join('/');

    // get site id
    const siteUrl = `https://graph.microsoft.com/v1.0/sites/${hostname}:/sites/${encodeURIComponent(siteName)}:`;
    const siteRes = await fetch(siteUrl, { method: 'GET', headers: { Authorization: `Bearer ${accessToken}` } });
    if (!siteRes.ok) {
      const txt = await siteRes.text();
      console.log(`${LOG_PREFIX} error resolving site: ${siteRes.status} ${txt}`);
      return null;
    }
    const siteJson = await siteRes.json();
    const siteId = siteJson.id;

    // Resolve folder within site's default drive (document library)
    // If libPath is empty, use root of default drive
    const encodedPath = libPath ? encodeURIComponent(libPath).replace(/%2F/g, '/') : '';
    const driveItemUrl = encodedPath
      ? `https://graph.microsoft.com/v1.0/sites/${encodeURIComponent(siteId)}/drive/root:/${encodedPath}`
      : `https://graph.microsoft.com/v1.0/sites/${encodeURIComponent(siteId)}/drive/root`;
    const diRes = await fetch(driveItemUrl, { method: 'GET', headers: { Authorization: `Bearer ${accessToken}` } });
    if (!diRes.ok) {
      const txt = await diRes.text();
      console.log(`${LOG_PREFIX} error resolving drive item: ${diRes.status} ${txt}`);
      return null;
    }
    const diJson = await diRes.json();
    const driveId = diJson.parentReference && diJson.parentReference.driveId ? diJson.parentReference.driveId : diJson.driveId || null;
    const folderId = diJson.id;
    if (!driveId || !folderId) {
      console.log(`${LOG_PREFIX} resolved driveId/folderId missing: driveId=${driveId} folderId=${folderId}`);
      return null;
    }
    console.log(`${LOG_PREFIX} resolved TARGET_URL -> drive=${driveId} folder=${folderId}`);
    return { driveId, folderId };
  } catch (e) {
    console.log(`${LOG_PREFIX} resolveTargetFromUrl error: ${e && e.message ? e.message : String(e)}`);
    return null;
  }
}

function matchesUser(resource, userSubstr) {
  if (!userSubstr) return true;
  const lower = userSubstr.toLowerCase();
  try {
    // check common fields
    if (resource.createdBy && resource.createdBy.user) {
      const u = resource.createdBy.user;
      if ((u.displayName && u.displayName.toLowerCase().includes(lower)) || (u.email && u.email.toLowerCase().includes(lower)) || (u.userPrincipalName && u.userPrincipalName.toLowerCase().includes(lower))) return true;
    }
    if (resource.lastModifiedBy && resource.lastModifiedBy.user) {
      const u = resource.lastModifiedBy.user;
      if ((u.displayName && u.displayName.toLowerCase().includes(lower)) || (u.email && u.email.toLowerCase().includes(lower)) || (u.userPrincipalName && u.userPrincipalName.toLowerCase().includes(lower))) return true;
    }
    // fallback: search the serialized resource for the substring
    const s = JSON.stringify(resource).toLowerCase();
    return s.includes(lower);
  } catch (e) {
    return false;
  }
}

(async () => {
  const user = process.argv[2] || process.env.TARGET_USER || 'asit.mohanty';
  const limit = parseInt(process.argv[3] || process.env.SCAN_LIMIT || '10', 10) || 10;
  console.log(`${LOG_PREFIX} user filter='${user}' limit=${limit}`);
  try {
    const token = await getAccessToken();
    console.log(`${LOG_PREFIX} acquired token`);
    // Resolve the target (prefer TARGET_URL if present) so we have driveId/folderId for copy operations
    let resolvedTarget = null;
    if (TARGET_URL_ENV) resolvedTarget = await resolveTargetFromUrl(token, TARGET_URL_ENV);
    // Also run the diagnostic check (logs whether target accessible)
    await checkTargetFolderAccess(token);
    // Expect full user principal (e.g. user@domain). For substring filters, pass full UPN or modify script.
    if (!user.includes('@')) throw new Error('Please provide a full user principal name (UPN), e.g. user@domain');
    const items = await listRecordingsForUser(token, user, 'Recordings', limit);
    console.log(`${LOG_PREFIX} found ${items.length} mp4 items in /recordings for ${user}`);
    let count = 0;
    for (const item of items) {
      if (count >= limit) break;
      try {
        const name = item.name || 'unknown.mp4';
        // skip if already in target
        const targetDriveId = resolvedTarget && resolvedTarget.driveId ? resolvedTarget.driveId : TARGET_DRIVE_ID;
        const targetFolderId = resolvedTarget && resolvedTarget.folderId ? resolvedTarget.folderId : TARGET_FOLDER_ID;
        if (item.parentReference && item.parentReference.driveId === targetDriveId && item.parentReference.id === targetFolderId) { console.log(`${LOG_PREFIX} skipping (already in target): ${name}`); continue; }
        // Check target folder contents to find any existing item with same name
        let matchingTargetItem = null;
        if (targetDriveId && targetFolderId) {
          try {
            const listUrl = `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(targetDriveId)}/items/${encodeURIComponent(targetFolderId)}/children?$select=name,id`;
            const lr = await fetch(listUrl, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
            if (lr.ok) {
              const lj = await lr.json();
              matchingTargetItem = (lj.value || []).find(i => i.name === name) || null;
            } else {
              const txt = await lr.text();
              console.log(`${LOG_PREFIX} error listing target folder: ${lr.status} ${txt}`);
            }
          } catch (e) {
            console.log(`${LOG_PREFIX} error listing target folder: ${e && e.message ? e.message : String(e)}`);
          }
        }

        // If a target item exists, delete it first to replace
        if (matchingTargetItem) {
          try {
            const delUrl = `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(targetDriveId)}/items/${encodeURIComponent(matchingTargetItem.id)}`;
            const dr = await fetch(delUrl, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            if (dr.status === 204) {
              console.log(`${LOG_PREFIX} removed existing target item '${name}' (id=${matchingTargetItem.id}) to replace`);
            } else {
              const txt = await dr.text();
              console.log(`${LOG_PREFIX} failed to delete existing target item: ${dr.status} ${txt}`);
              // If deletion failed, skip this item to avoid duplicates
              continue;
            }
          } catch (e) {
            console.log(`${LOG_PREFIX} error deleting target item: ${e && e.message ? e.message : String(e)}`);
            continue;
          }
        }

        const res = await copyToTarget(token, item.parentReference.driveId, item.id, name, targetDriveId, targetFolderId);
        if (res.ok) { console.log(`${LOG_PREFIX} copied: ${name}`); count++; } else { console.log(`${LOG_PREFIX} failed to copy ${name}: ${res.status} ${res.body}`); }
      } catch (e) {
        console.log(`${LOG_PREFIX} item error: ${e && e.message ? e.message : String(e)}`);
      }
    }
    console.log(`${LOG_PREFIX} done. attempted=${count}`);
  } catch (e) {
    console.error(`${LOG_PREFIX} error: ${e && e.message ? e.message : String(e)}`);
    process.exit(1);
  }
})();
