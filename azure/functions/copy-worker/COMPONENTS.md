# Azure Function "copy-worker" — components and recovery guide

Purpose
-------
This document lists the components, configuration, runtime dependencies and recovery steps for the Azure Function app that performs copy operations from source drives (OneDrive/SharePoint) to a central target drive/folder using Microsoft Graph. Create a backup branch and verify this file exists before removing other repository parts.

High-level flow
---------------
- Timer scan (`scan` function) runs on schedule (daily 05:00) and discovers candidate recording files (via Graph search or folder listing). It enqueues JSON messages to the storage queue for each file to be copied.
- Queue-triggered `copy-worker` function (main `index.js`) reads messages from the Storage Queue `recording-copy-queue` and performs the copy using Microsoft Graph `/copy` semantics.
- The worker supports incremental filtering ("since"), in-batch dedupe (`existingNames`), 409/nameAlreadyExists handling (treated as skip), and polling of long-running copy operations (follow Location header returned by Graph).

Required Azure resources
------------------------
- Function App (example name: `team-recordings-copier`) — hosts the `scan` and queue-trigger `copy-worker` functions.
- Storage account — provides `AzureWebJobsStorage` and a Queue named `recording-copy-queue` used by the queue trigger.
- Azure AD App registration (or Managed Identity) with application permissions for Graph (see "Graph permissions" below).
- Target SharePoint/OneDrive (Drive ID + Folder ID) where copies are placed; the Graph app must have access.

Key files (repo) and responsibilities
------------------------------------
- `index.js` — main queue-triggered copy worker. Responsibilities:
  - parse queue message (supports `since`, per-file or per-folder entries)
  - resolve source (share/drive/folder)
  - enumerate children (`listAllChildren`) when needed
  - apply `since` filter using `createdDateTime` / `lastModifiedDateTime`
  - perform copy via Graph `/drives/{id}/items/{id}/copy` and poll the operation URL
  - handle 409/nameAlreadyExists by returning `{ exists: true }` and logging `skip_existing`
  - maintain `existingNames` set for the batch to avoid duplicate attempts

- `function.json` (root copy-worker) — defines queue binding:
  - queueName: `recording-copy-queue`
  - connection: `AzureWebJobsStorage`

- `scan/index.js` and `scan/function.json` — TimerTrigger scanning function.
  - `function.json` defines the schedule (cron). Current default in repo may be weekdays; for daily 05:00 set the schedule to `"0 0 5 * * *"` (every day at 05:00 UTC/localize as needed).
  - `scan` uses `myTimer.scheduleStatus.last` when available as the `since` anchor for incremental scans.

- `enqueue/index.js` — helper that enqueues messages (if present).
- `run-local-batch-devcopy.js`, `run-local-batch.js` — local-run helpers for dev testing and smoke runs (accept count, suffix, optional `since`).
- `check-target.js` and `check_target_result.txt` — utilities used during development to snapshot the target contents (not required for runtime).
- `package.json` / `package-lock.json` — Node dependencies for the function (install with `npm ci` inside `azure/functions/copy-worker`).
- `local.settings.json.sample` — sample config for local development (DO NOT commit secrets into source control; use Azure Function App settings or Key Vault in production).
- `host.json` — Function host configuration (keep as-is for runtime defaults).

Environment variables / App Settings (must exist on Function App)
---------------------------------------------------------------
- AZURE_TENANT_ID — AAD tenant
- AZURE_CLIENT_ID — client id for app registration (unless using managed identity)
- AZURE_CLIENT_SECRET — client secret (unless using managed identity)
- AZURE_USE_MANAGED_IDENTITY — `true`/`false` (if `true`, code should acquire token via MSI)
- TARGET_DRIVE_ID — Graph drive id of destination hub
- TARGET_FOLDER_ID — Drive item id for the destination folder
- AzureWebJobsStorage — Storage account connection string used by Functions and the Queue
- ALLOW_RECORDINGS — optional feature flag used by the worker
- SINCE_ISO / LAST_RUN_ISO / LAST_RUN — optional; used for incremental filtering when not supplied in queue message
- APPINSIGHTS_CONNECTION_STRING — optional for telemetry

Microsoft Graph permissions (minimum, app-level)
------------------------------------------------
Grant these as Application permissions for the app registration (consent required from an admin):
- Files.ReadWrite.All — read/write access to files across SharePoint/OneDrive (used for copy)
- Sites.Read.All or Sites.ReadWrite.All — list/search sites and write to site content if needed

Notes:
- App-only permissions (application permissions) are recommended for headless scheduled runs across users.
- On tenant or SharePoint, additional site-level policies may need to be adjusted so the app can write into the target site.

Graph copy behavior and edge cases
---------------------------------
- The Graph `/copy` call is a long-running operation: a successful request commonly returns HTTP 202 with a `Location` header identifying the operation status endpoint.
- The worker must poll the `Location` URL until the operation completes (201 or final status) or until a timeout/retry budget is exhausted.
- If the copy fails with HTTP 409 and body containing `nameAlreadyExists`, the repo's current behavior treats that as a non-fatal skip (`exists: true`). This is important to keep to avoid repeated failures for items already copied.

Deduplication and incremental behavior
-------------------------------------
- At start of a batch the function loads a listing/quick index of target items (if available) and populates `existingNames`.
- In-batch `existingNames` prevents duplicate copy attempts for items renamed by suffix during testing.
- `since` filtering (queue message `since` property or `myTimer.scheduleStatus.last`) is applied to `createdDateTime`/`lastModifiedDateTime` so only new items are enqueued/copied.

Testing and local development
-----------------------------
- Use `local.settings.json.sample` to create a `local.settings.json` for local runs (DO NOT commit secrets).
- Example dev command (from repo):
```powershell
cd azure/functions/copy-worker
node run-local-batch-devcopy.js 15 "-dev-$(Get-Date -Format yyyyMMddHHmmss)" "2026-04-01T05:00:00Z"
```
- Run `npm ci` in `azure/functions/copy-worker` before local runs.

Deployment notes
----------------
- Packaging: `npm ci` then zip the function folder and deploy via Zip Deploy or the provided GitHub Action `/.github/workflows/deploy-azure-function.yml`.
- App settings must be configured in the Function App (Portal, az cli, or ARM template). Ensure `AzureWebJobsStorage` is set to the storage account connection string used by the function.

Recovery recipes (if files are accidentally deleted)
--------------------------------------------------
1. Create a backup branch before any mass deletion:
```bash
git checkout -b cleanup/backup-functions-only-$(date +%Y%m%d)
git add azure/functions/copy-worker && git commit -m "backup: copy-worker directory"
```
2. Archive the function folder to an artifact (Windows PowerShell example):
```powershell
Compress-Archive -Path azure/functions/copy-worker -DestinationPath azure/functions/copy-worker-backup.zip -Force
```
3. If a file is removed and you want to restore from the latest commit on `main`:
```bash
git checkout main -- azure/functions/copy-worker
```
or restore a single deleted file:
```bash
git checkout -- azure/functions/copy-worker/index.js
```
4. If you lost committed history and need to reconstruct minimal runtime files, recreate these minimal artifacts:
  - `function.json` (queue trigger binding pointing to `recording-copy-queue`)
  - `index.js` minimal skeleton that:
    - acquires an access token (MSAL/node-fetch or @azure/identity if using MSI)
    - performs a Graph copy POST
    - polls the Location URL
  - `package.json` with required dependencies and `npm ci` to restore `node_modules`

Minimal `index.js` skeleton (pseudocode)
```js
// Acquire token (MSAL or MSI) -> fetch
module.exports = async function (context, myQueueItem) {
  // parse message, resolve source drive/item id
  // call POST /drives/{id}/items/{id}/copy with body { parentReference: { driveId: TARGET_DRIVE_ID, id: TARGET_FOLDER_ID }, name: newName }
  // if response.status === 202, poll Location until completion
  // if 409 && nameAlreadyExists -> log and skip
}
```

Checklist before pruning the repo
--------------------------------
1. Create backup branch and archive `azure/functions/copy-worker` (see recovery recipe).
2. Confirm you have the Function App settings available (AZURE_* values, AzureWebJobsStorage, TARGET_DRIVE_ID/FOLDER_ID).
3. Run a local smoke test (`run-local-batch-devcopy.js`) and confirm the worker starts and accepts a batch.
4. Confirm GitHub Action or other deploy pipeline (if you still plan to use it) is updated to only handle the function package.
5. Only then remove non-function directories; keep `azure/functions/copy-worker` and its `package.json`, `function.json`, `host.json`, and `local.settings.json.sample`.

Where to look for more context
-----------------------------
- Graph long-running operations: https://learn.microsoft.com/graph/long-running-operations
- Graph Files API & copy: https://learn.microsoft.com/graph/api/driveitem-copy

If you want, I can now:
- create the backup branch and archive the `copy-worker` folder, or
- proceed with the repo pruning steps (after your approval).

----
Document created: `azure/functions/copy-worker/COMPONENTS.md`
