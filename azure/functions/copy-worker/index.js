const fetch = require('node-fetch');

module.exports = async function (context, myQueueItem) {
  context.log('Processing queue item', myQueueItem);

  const tenant = process.env.AAD_TENANT_ID || myQueueItem.tenant;
  const clientId = process.env.AAD_CLIENT_ID || myQueueItem.clientId;
  const clientSecret = process.env.AAD_CLIENT_SECRET || myQueueItem.clientSecret;
  const targetDriveId = process.env.TARGET_DRIVE_ID || myQueueItem.targetDriveId;
  const targetFolderId = process.env.TARGET_FOLDER_ID || myQueueItem.targetFolderId;

  if (!tenant || !clientId || !clientSecret) {
    context.log.error('Missing AAD credentials (AAD_TENANT_ID,AAD_CLIENT_ID,AAD_CLIENT_SECRET)');
    return;
  }

  if (!myQueueItem || !myQueueItem.sourceDriveId || !myQueueItem.itemId) {
    context.log.error('Queue message missing required fields: sourceDriveId, itemId');
    return;
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
      context.log.error('Failed to obtain access token', tokenJson);
      return;
    }

    const { sourceDriveId, itemId, newName } = myQueueItem;
    const copyBody = { parentReference: {} };
    if (targetDriveId) copyBody.parentReference.driveId = targetDriveId;
    if (targetFolderId) copyBody.parentReference.id = targetFolderId;
    if (newName) copyBody.name = newName;

    const copyUrl = `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(sourceDriveId)}/items/${encodeURIComponent(itemId)}/copy`;
    const resp = await fetch(copyUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(copyBody)
    });

    if (resp.status === 202) {
      context.log('Copy initiated for', itemId, 'from drive', sourceDriveId);
    } else {
      const text = await resp.text();
      context.log.error('Copy request failed', resp.status, text);
    }

  } catch (err) {
    context.log.error('Error processing queue item', err);
  }
};
