# Logic Apps → Azure Function prototype

This doc describes a recommended, tested pattern to discover meeting recordings across users' OneDrive/SharePoint and copy them into a central SharePoint hub using Logic Apps + Azure Storage Queue + Azure Function workers.

Overview
- Logic App (or scheduled runner): enumerate sites and users via Microsoft Graph, find candidate files, and enqueue a JSON message to `recording-copy-queue` for each file.
- Azure Storage Queue: durable buffer to decouple enumeration from copy work and smooth throttling.
- Azure Function (queue trigger): picks up messages and invokes Microsoft Graph `driveItem/copy` to copy into the central SharePoint drive/folder.

Required AAD permissions (app-only)
- `Files.Read.All` or `Files.ReadWrite.All`
- `Sites.Read.All` and/or `Sites.ReadWrite.All`
- Admin consent required for tenant-wide access to users' OneDrive and sites.

Queue message schema (example)
```
{
  "tenant": "<tenant-id>",
  "sourceDriveId": "<drive-id>",
  "itemId": "<drive-item-id>",
  "newName": "meeting-recording-2026-03-31.mp4",
  "targetDriveId": "<central-drive-id>",
  "targetFolderId": "<central-folder-id>"
}
```

Logic App guidance
- Use Graph `GET /users` to enumerate target users (filter to your 30 users if possible).
- For each user call `GET /users/{id}/drive/root/search(q='{filename-substring}')` or enumerate folders of interest.
- For each result, send an Azure Storage Queue message (use `Azure Storage` connector) with the schema above.
- Use batching and rate-limiting: process N users per run to avoid throttling.

Azure Function (copy worker)
- Location: `azure/functions/copy-worker`
- Trigger: queue `recording-copy-queue` (connection string from `AzureWebJobsStorage`).
- Auth: The function uses the AAD client credentials flow to acquire a Graph access token. Provide `AAD_TENANT_ID`, `AAD_CLIENT_ID`, and `AAD_CLIENT_SECRET` as app settings or use a managed identity + key vault pattern.
- Action: calls `POST /drives/{sourceDriveId}/items/{itemId}/copy` with `parentReference` pointing to the target drive/folder.

Notes & robustness
- The Graph copy API is asynchronous and returns 202; you can poll the `Location` header to get status if you want to track completion.
- For very large files, consider download+upload (chunking) or use Premium/Durable Functions to avoid execution time limits.
- Keep an incremental cursor (lastModifiedDateTime) to avoid reprocessing large historical sets.
- Add deduplication by computing and storing hashes or checking `driveItem` metadata in target.

Deployment steps (quick)
1. Register an AAD app with `https://graph.microsoft.com/.default` scope and grant admin consent.
2. Create an Azure Storage account + queue named `recording-copy-queue`.
3. Deploy the Azure Function app (Node) from `azure/functions/copy-worker` and set app settings: `AAD_TENANT_ID`, `AAD_CLIENT_ID`, `AAD_CLIENT_SECRET`, `TARGET_DRIVE_ID`, `TARGET_FOLDER_ID`, and `AzureWebJobsStorage` connection string.
4. Build a small Logic App to enumerate files and enqueue messages.

Example Logic App actions (high level)
- Recurrence trigger (schedule)
- HTTP (Graph) -> GET /users -> For each -> HTTP (Graph) -> search drive -> For each hit -> Azure Storage Queue - Add message

If you want, I can scaffold the Logic App template (ARM/Logic App JSON) and a small GitHub Actions job to deploy the Function app. Reply `scaffold function` to proceed.
