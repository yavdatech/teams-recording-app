// Manual full scan: enumerate all users and SharePoint sites to find /Recordings folders and copy .mp4 files to target SharePoint folder.
// Usage: node manual_full_scan.js

const path = require('path');
const fetch = require('node-fetch');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '..', '.env') });

const tenant = process.env.AZURE_TENANT_ID || process.env.TENANT_ID;
const clientId = process.env.AZURE_CLIENT_ID || process.env.CLIENT_ID;
const clientSecret = process.env.AZURE_CLIENT_SECRET || process.env.CLIENT_SECRET;
const TARGET_URL = process.env.TARGET_URL;
const LOG_PREFIX = '[manual-scan]';

if (!tenant || !clientId || !clientSecret) {
  console.error(`${LOG_PREFIX} Missing AZURE_TENANT_ID/AZURE_CLIENT_ID/AZURE_CLIENT_SECRET in env`);
  process.exit(1);
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
  if (!res.ok) throw new Error(`${LOG_PREFIX} token request failed: ${JSON.stringify(json)}`);
  return json.access_token;
}

async function fetchAll(url, accessToken) {
  const items = [];
  let next = url;
  while (next) {
    const r = await fetch(next, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!r.ok) {
      const txt = await r.text();
      throw new Error(`${LOG_PREFIX} fetchAll error ${r.status} ${txt}`);
    }
    const j = await r.json();
    if (j.value && j.value.length) items.push(...j.value);
    next = j['@odata.nextLink'] || null;
  }
  return items;
}

async function listUsers(accessToken) {
  // enumerate users (top=999 per page)
  const url = `https://graph.microsoft.com/v1.0/users?$select=userPrincipalName,id&$top=999`;
  return await fetchAll(url, accessToken);
}

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

async function listRecordingsForUser(accessToken, userUpn, folderPath = 'Recordings') {
  const results = [];

  async function listChildrenByUrl(url) {
    const out = [];
    let next = url;
    while (next) {
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

  async function traverseItems(items) {
    for (const item of items) {
      if (item.folder) {
        const childUrl = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(userUpn)}/drive/items/${item.id}/children`;
        const children = await listChildrenByUrl(childUrl);
        await traverseItems(children);
      } else if (item.name && item.name.toLowerCase().endsWith('.mp4')) {
        results.push(item);
      }
    }
  }

  // try user's drive root:/Recordings
  try {
    const encoded = encodeURIComponent(folderPath).replace(/%2F/g, '/');
    const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(userUpn)}/drive/root:/${encoded}:/children`;
    const children = await listChildrenByUrl(url);
    await traverseItems(children);
    return results;
  } catch (e) {
    // if not found, try user's other drives
    if (e && e.message && e.message.includes('404')) {
      const drivesUrl = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(userUpn)}/drives`;
      const drivesRes = await fetch(drivesUrl, { method: 'GET', headers: { Authorization: `Bearer ${accessToken}` } });
      if (!drivesRes.ok) return results;
      const drivesJson = await drivesRes.json();
      const drives = drivesJson.value || [];
      for (const d of drives) {
        try {
          const driveChildrenUrl = `https://graph.microsoft.com/v1.0/drives/${d.id}/root:/${encoded}:/children`;
          const childrenInDrive = await listChildrenByUrl(driveChildrenUrl);
          if (childrenInDrive && childrenInDrive.length) {
            await traverseItems(childrenInDrive);
          }
        } catch (err) {
          continue;
        }
      }
    }
    return results;
  }
}

async function listSitesWithRecordings(accessToken) {
  // Use Graph search to find sites that might contain 'Recordings' folder
  try {
    const url = `https://graph.microsoft.com/v1.0/sites?search=Recordings&$top=999`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!r.ok) return [];
    const j = await r.json();
    return j.value || [];
  } catch (e) {
    return [];
  }
}

async function listTeamsGroups(accessToken) {
  // list Office 365 groups that are Teams (resourceProvisioningOptions contains 'Team')
  try {
    const url = `https://graph.microsoft.com/v1.0/groups?$filter=resourceProvisioningOptions/Any(x:x eq 'Team')&$select=id,displayName,mail&$top=999`;
    return await fetchAll(url, accessToken);
  } catch (e) {
    return [];
  }
}

async function listRecordingsInDrive(accessToken, driveId, folderPath = 'Recordings') {
  const results = [];

  async function listChildrenByUrl(url) {
    const out = [];
    let next = url;
    while (next) {
      const r = await fetch(next, { method: 'GET', headers: { Authorization: `Bearer ${accessToken}` } });
      if (!r.ok) {
        const txt = await r.text();
        throw new Error(`${LOG_PREFIX} error listing drive children: ${r.status} ${txt}`);
      }
      const j = await r.json();
      if (j.value && j.value.length) out.push(...j.value);
      next = j['@odata.nextLink'] || null;
    }
    return out;
  }

  async function traverseItems(items) {
    for (const item of items) {
      if (item.folder) {
        const childUrl = `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(driveId)}/items/${item.id}/children`;
        const children = await listChildrenByUrl(childUrl);
        await traverseItems(children);
      } else if (item.name && item.name.toLowerCase().endsWith('.mp4')) {
        results.push(item);
      }
    }
  }

  try {
    const encoded = encodeURIComponent(folderPath).replace(/%2F/g, '/');
    const url = `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(driveId)}/root:/${encoded}:/children`;
    const children = await listChildrenByUrl(url);
    await traverseItems(children);
    return results;
  } catch (e) {
    // try scanning root children for a folder named Recordings
    try {
      const rootUrl = `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(driveId)}/root/children`;
      const rootChildren = await listChildrenByUrl(rootUrl);
      for (const c of rootChildren) {
        if (c.folder && c.name && c.name.toLowerCase() === folderPath.toLowerCase()) {
          const children2 = await listChildrenByUrl(`https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(driveId)}/items/${c.id}/children`);
          await traverseItems(children2);
          return results;
        }
      }
    } catch (err) {
      // ignore
    }
    return results;
  }
}

async function copyAndReplace(accessToken, sourceDriveId, itemId, name, targetDriveId, targetFolderId) {
  // delete existing with same name
  try {
    const listUrl = `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(targetDriveId)}/items/${encodeURIComponent(targetFolderId)}/children?$select=name,id`;
    const lr = await fetch(listUrl, { method: 'GET', headers: { Authorization: `Bearer ${accessToken}` } });
    if (lr.ok) {
      const lj = await lr.json();
      const existing = (lj.value || []).find(i => i.name === name) || null;
      if (existing) {
        const delUrl = `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(targetDriveId)}/items/${encodeURIComponent(existing.id)}`;
        const dr = await fetch(delUrl, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } });
        if (dr.status !== 204) {
          const t = await dr.text();
          return { ok: false, status: dr.status, body: t };
        }
      }
    }
  } catch (e) {
    // ignore and attempt copy
  }
  // copy
  const url = `https://graph.microsoft.com/v1.0/drives/${sourceDriveId}/items/${itemId}/copy`;
  const body = { parentReference: { driveId: targetDriveId, id: targetFolderId }, name };
  const r = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (r.status === 202 || r.status === 201 || r.status === 200) return { ok: true };
  const txt = await r.text();
  return { ok: false, status: r.status, body: txt };
}

(async function main() {
  const accessToken = await getAccessToken();
  console.log(`${LOG_PREFIX} acquired token`);

  // resolve target
  if (!TARGET_URL) {
    console.error(`${LOG_PREFIX} TARGET_URL not set in .env`);
    process.exit(1);
  }
  const resolvedTarget = await resolveTargetFromUrl(accessToken, TARGET_URL);
  if (!resolvedTarget) {
    console.error(`${LOG_PREFIX} failed to resolve TARGET_URL to drive/folder`);
    process.exit(1);
  }
  console.log(`${LOG_PREFIX} target -> drive=${resolvedTarget.driveId} folder=${resolvedTarget.folderId}`);

  // list users
  console.log(`${LOG_PREFIX} listing users...`);
  const users = await listUsers(accessToken);
  console.log(`${LOG_PREFIX} found ${users.length} users; starting scan`);

  let usersProcessed = 0;
  let totalFilesFound = 0;
  let copied = 0, failed = 0, skipped = 0;

  const startTime = Date.now();
  const progressInterval = setInterval(() => {
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.log(`${LOG_PREFIX} progress users=${usersProcessed}/${users.length} filesFound=${totalFilesFound} copied=${copied} failed=${failed} skipped=${skipped} elapsed=${elapsed}s`);
  }, 10000);

  for (const u of users) {
    try {
      const upn = u.userPrincipalName;
      usersProcessed++;
      const items = await listRecordingsForUser(accessToken, upn, 'Recordings');
      if (!items || !items.length) continue;
      totalFilesFound += items.length;
      console.log(`${LOG_PREFIX} user=${upn} found ${items.length} recordings`);
      for (const it of items) {
        try {
          const name = it.name || 'unknown.mp4';
          const res = await copyAndReplace(accessToken, it.parentReference.driveId, it.id, name, resolvedTarget.driveId, resolvedTarget.folderId);
          if (res.ok) { copied++; console.log(`${LOG_PREFIX} copied ${name} from ${upn}`); }
          else { failed++; console.log(`${LOG_PREFIX} failed to copy ${name} from ${upn}: ${JSON.stringify(res)}`); }
        } catch (e) {
          failed++; console.log(`${LOG_PREFIX} item error: ${e && e.message ? e.message : String(e)}`);
        }
      }
    } catch (e) {
      console.log(`${LOG_PREFIX} user error: ${e && e.message ? e.message : String(e)}`);
    }
  }
  // Teams/Group sites scan (Teams-backed SharePoint sites)
  try {
    console.log(`${LOG_PREFIX} listing Teams groups...`);
    const teams = await listTeamsGroups(accessToken);
    console.log(`${LOG_PREFIX} found ${teams.length} teams; starting teams scan`);
    let teamsProcessed = 0;
    for (const g of teams) {
      try {
        teamsProcessed++;
        // get the group's default drive (SharePoint document library)
        const driveRes = await fetch(`https://graph.microsoft.com/v1.0/groups/${g.id}/drive`, { headers: { Authorization: `Bearer ${accessToken}` } });
        if (!driveRes.ok) { console.log(`${LOG_PREFIX} failed to get drive for team=${g.displayName}`); continue; }
        const driveJson = await driveRes.json();
        const driveId = driveJson.id;
        const items = await listRecordingsInDrive(accessToken, driveId, 'Recordings');
        if (!items || !items.length) continue;
        totalFilesFound += items.length;
        console.log(`${LOG_PREFIX} team=${g.displayName} found ${items.length} recordings`);
        for (const it of items) {
          try {
            const name = it.name || 'unknown.mp4';
            const sourceDriveId = (it.parentReference && it.parentReference.driveId) ? it.parentReference.driveId : driveId;
            const res = await copyAndReplace(accessToken, sourceDriveId, it.id, name, resolvedTarget.driveId, resolvedTarget.folderId);
            if (res.ok) { copied++; console.log(`${LOG_PREFIX} copied ${name} from team=${g.displayName}`); }
            else { failed++; console.log(`${LOG_PREFIX} failed to copy ${name} from team=${g.displayName}: ${JSON.stringify(res)}`); }
          } catch (e) {
            failed++; console.log(`${LOG_PREFIX} item error: ${e && e.message ? e.message : String(e)}`);
          }
        }
      } catch (e) {
        console.log(`${LOG_PREFIX} team error: ${e && e.message ? e.message : String(e)}`);
      }
    }
  } catch (e) {
    console.log(`${LOG_PREFIX} teams-scan error: ${e && e.message ? e.message : String(e)}`);
  }

  clearInterval(progressInterval);
  console.log(`${LOG_PREFIX} complete. usersProcessed=${usersProcessed} totalFilesFound=${totalFilesFound} copied=${copied} failed=${failed} skipped=${skipped}`);
})();
