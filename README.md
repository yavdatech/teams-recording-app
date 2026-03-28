# Teams Recording App

This repository implements a backend service that integrates with Microsoft Teams call events and the Microsoft Graph change-notifications pipeline to ingest meeting artifacts (recordings, transcripts, and metadata) and run downstream compliance/ingestion workflows.

Key features
- Receive Graph change-notifications for call/meeting artifacts
- Fetch recordings/transcripts from Microsoft Graph and store in Azure Blob Storage
- Optional Service Bus-backed ingestion queues and compliance notification workflows
- A small bot integration used to join meetings (configurable)

Project layout (high-level)
- `src/auth/` — credential and token helpers
- `src/bot/` — bot-related logic and call-control
- `src/graph/` — Graph client and helpers
- `src/ingestion/` — artifact fetch + ingestion worker
- `src/storage/` — Azure Blob helpers
- `src/webhook/` — HTTP handlers for Graph notifications
- `appPackage/` — Teams manifest template and package helper

Prerequisites
- Node.js >= 20.11.0 (see `package.json` engines)
- npm (or yarn)
- An Azure subscription and an Azure AD App Registration with credentials (client secret or certificate) or a Managed Identity
- An Azure Storage account (connection string) to host blobs
- A public HTTPS endpoint for Microsoft Graph notifications (ngrok for local testing)

Quickstart — local development
1. Clone the repo (already done) and install dependencies:

```bash
npm install
```

2. Create a `.env` file at the project root with the minimum required values (example below).

3. Run in development mode (auto-reload):

```bash
npm run dev
```

4. To build and run the production bundle locally:

```bash
npm run build
npm run start
```

Recommended local testing workflow
- Use `ngrok` (or any HTTPS tunnel) to expose your local server so Microsoft Graph can deliver notifications:

```bash
ngrok http 3000
# set GRAPH_NOTIFICATION_URL to https://<your-ngrok-id>.ngrok.io/webhook/notifications
```

Environment variables (minimum example)
Create `.env` and populate required values. The full set of variables is defined in `src/config/env.ts` and validated at startup.

```env
# App
NODE_ENV=development
PORT=3000

# Azure identity
AZURE_TENANT_ID=<your-tenant-id>
AZURE_CLIENT_ID=<app-client-id>
# Provide either a client secret or certificate, or enable managed identity
AZURE_CLIENT_SECRET=<client-secret>
# AZURE_CLIENT_CERTIFICATE_PATH=/path/to/cert.p12
# AZURE_CLIENT_CERTIFICATE_PASSWORD=secret
AZURE_USE_MANAGED_IDENTITY=false

# Microsoft Graph
GRAPH_NOTIFICATION_URL=https://your-public-url.example.com/webhook/notifications
GRAPH_LIFECYCLE_NOTIFICATION_URL=https://your-public-url.example.com/webhook/notification-lifecycle
GRAPH_NOTIFICATION_CLIENT_STATE=<random-16+chars>

# Storage
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=...;

# Queue (optional)
QUEUE_MODE=memory
# If using service bus:
# AZURE_SERVICE_BUS_CONNECTION_STRING=Endpoint=sb://...;

# Bot (optional)
BOT_ENABLED=true
BOT_APP_ID=<bot-app-id>
BOT_CALLBACK_URL=https://your-public-url.example.com/bot/callback

```

Notes about authentication
- The app supports three authentication approaches for Graph API calls:
  - Managed Identity (`AZURE_USE_MANAGED_IDENTITY=true`) — recommended when running in Azure
  - Client certificate (`AZURE_CLIENT_CERTIFICATE_PATH`) — store a p12/pem and provide the path
  - Client secret (`AZURE_CLIENT_SECRET`) — simplest for local testing

Graph change-notifications and encryption
- If you enable `GRAPH_INCLUDE_RESOURCE_DATA`, the app requires an encryption certificate and associated private key (see `GRAPH_ENCRYPTION_CERTIFICATE_PATH`, `GRAPH_ENCRYPTION_PRIVATE_KEY_PATH`, and `GRAPH_ENCRYPTION_CERTIFICATE_ID` in `src/config/env.ts`).

Teams app package
- The Teams app manifest template is in `appPackage/manifest.template.json`. Use the provided script to render a package (this script uses bash):

```bash
npm run render:teams-package
```

On Windows you may need WSL, Git Bash, or to adapt the script if you do not have bash.

Docker
- Build a container with the included `Dockerfile`:

```bash
docker build -t teams-recording-app .
docker run --env-file .env -p 3000:3000 teams-recording-app
```

Deployment notes
- You can deploy the container to any container host (Azure Container Apps, Azure Web App for Containers, AKS, etc.).
- If using Azure, prefer Managed Identity and configure app settings to match the same environment variables shown above.
- Ensure your deployed app has a public HTTPS endpoint that Microsoft Graph can reach, and update `GRAPH_NOTIFICATION_URL` and lifecycle URLs accordingly.

Security and secrets
- Never commit secrets to source control. Use Azure Key Vault, App Settings, or your cloud provider's secret manager in production.

Where to look in the codebase
- Configuration and validation: `src/config/env.ts`
- Graph token and requests: `src/auth/`, `src/graph/graph-client.ts`
- Webhooks: `src/webhook/` and `src/webhook/routes.ts`
- Artifact ingestion: `src/ingestion/`

Next steps I can do for you
- Add a `.env.sample` file with the minimal variables
- Create GitHub Actions workflow to build and publish a container
- Add a short `docs/` page showing how to register the Azure AD App with the exact Microsoft Graph permissions needed

If you'd like, I can commit a `.env.sample` now and push it. Which next step should I take?
# Teams Meeting Recorder Platform

Production-oriented Node.js + TypeScript backend for two related capabilities:

1. A Microsoft Graph event-driven ingestion service for Teams transcripts and recordings.
2. A Teams calling-bot control plane plus app package that can join supported meetings, receive call lifecycle callbacks, and leave when removed or instructed.
3. A compliance intelligence layer that tracks expected meeting artifacts, flags missing recordings/transcripts, and emits reminder/violation/resolution events without polling.

## What This Project Does

### Ingestion service

- Creates and renews Microsoft Graph subscriptions for transcript and recording resources.
- Receives webhook notifications and validates/decrypts rich payloads.
- Fetches transcript and recording metadata and content.
- Stores artifacts in Azure Blob Storage.
- Emits structured downstream events.

### Calling bot control plane

- Accepts a Teams `joinWebUrl` and creates a Graph call leg for the bot.
- Tracks active calls in Blob-backed state.
- Receives Graph call callback events at `/webhooks/teams/calls`.
- Lets operators or higher-level services force the bot to leave.
- Ships a Teams app package template and package-render script.

### Compliance intelligence layer

- Registers meetings that are expected to produce a recording and/or transcript.
- Schedules delayed evaluation jobs instead of scanning storage or polling Graph.
- Marks meetings compliant as artifacts arrive through the normal ingestion path.
- Opens violations when deadlines pass with missing artifacts.
- Emits reminder and resolution events, and can optionally forward them to a webhook.

## Important Platform Note

This codebase gives you a custom Teams calling bot and a recording/transcript ingestion backend.

It does **not** magically enable a supported “auto-join every call in the organization” compliance-recording product flow. Microsoft’s compliance-recording path is a separate model with tenant policies and partner/certification requirements. A custom calling bot like this one can be preinstalled tenant-wide and can join meetings when your control plane tells it to, but true organization-wide automatic compliance recording is a different platform path.

Current Microsoft references:

- Teams calling/meeting bot:
  https://learn.microsoft.com/en-us/microsoftteams/platform/sbs-calling-and-meeting
- Register calling bot:
  https://learn.microsoft.com/en-us/microsoftteams/platform/bots/calls-and-meetings/registering-calling-bot
- Graph create call:
  https://learn.microsoft.com/en-us/graph/api/application-post-calls?view=graph-rest-1.0
- Teams app package:
  https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/build-and-test/apps-package
- Teams compliance recording overview:
  https://learn.microsoft.com/en-us/microsoftteams/teams-recording-compliance

## Folder Structure

```text
.
├── .env.example
├── Dockerfile
├── README.md
├── appPackage
│   ├── README.md
│   ├── color.png
│   ├── manifest.template.json
│   └── outline.png
├── docs
│   └── http-examples.http
├── package.json
├── scripts
│   └── render-teams-app-package.sh
├── tsconfig.json
└── src
    ├── app.ts
    ├── index.ts
    ├── auth
    ├── bot
    │   ├── bot-call-store.ts
    │   ├── callback-service.ts
    │   ├── call-control-service.ts
    │   ├── join-url-parser.ts
    │   ├── routes.ts
    │   └── types.ts
    ├── compliance
    │   ├── event-helpers.ts
    │   ├── notifier.ts
    │   ├── routes.ts
    │   ├── service.ts
    │   ├── store.ts
    │   ├── types.ts
    │   └── worker-runner.ts
    ├── config
    ├── events
    ├── graph
    ├── ingestion
    ├── queue
    ├── shared
    ├── storage
    └── webhook
```

## Runtime Architecture

### HTTP surface

- `GET /healthz`
- `GET /api/subscriptions`
- `POST /api/subscriptions/sync`
- `POST /api/subscriptions/:subscriptionId/reauthorize`
- `GET /api/bot/calls`
- `GET /api/bot/calls/:callId`
- `POST /api/bot/join`
- `POST /api/bot/calls/:callId/leave`
- `GET /api/compliance/meetings`
- `GET /api/compliance/meetings/:caseId`
- `GET /api/compliance/summary`
- `POST /api/compliance/meetings/register`
- `POST /webhooks/graph`
- `POST /webhooks/graph/lifecycle`
- `POST /webhooks/teams/calls`

### Durable state

- Blob container for stored artifacts
- Blob container for operational state
- Blob container for dead-letter archives

### Queueing

- In-memory queue for local dev
- Azure Service Bus for production

## How Bot Join/Leave Works

1. A trusted caller sends `POST /api/bot/join` with a Teams `joinWebUrl`.
2. The service parses the thread ID, message ID, tenant ID, and organizer ID from the meeting URL.
3. It calls `POST /communications/calls` with `serviceHostedMediaConfig`.
4. Graph sends call lifecycle notifications back to `BOT_CALLBACK_URL`.
5. The service persists call state updates in Blob-backed state.
6. Users can remove the bot from the meeting roster in Teams, or an operator can call `POST /api/bot/calls/:callId/leave`.

If the bot is removed from the meeting by a user, Graph callback events should transition the tracked call state to `terminated`.

## How Compliance Enforcement Works

1. A trusted caller registers a meeting expectation with `POST /api/compliance/meetings/register`.
2. The service stores a compliance case keyed by `tenantId + parentResourceType + parentResourceId`.
3. A delayed job is enqueued for `endedAt + gracePeriodMinutes`.
4. The normal ingestion pipeline calls into compliance tracking whenever a transcript or recording is stored.
5. If the delayed check fires and artifacts are missing, the case moves to `open_violation` and emits a violation event.
6. Additional delayed reminder jobs are scheduled until the meeting becomes compliant or `COMPLIANCE_MAX_REMINDERS` is reached.
7. When the missing artifact arrives, the case becomes `compliant` and emits a resolution event.

This stays event-driven: there is no tenant-wide polling loop.

## Setup Steps

### 1. Create Microsoft Entra app registration

Create one Entra app for the backend/bot identity, or split it into separate app registrations if you prefer stricter separation.

### 2. Grant Microsoft Graph application permissions

For the ingestion side:

- `OnlineMeetingTranscript.Read.All`
- `OnlineMeetingRecording.Read.All`
- `OnlineMeetings.Read.All`

For the calling-bot side, start with the Microsoft calling-bot guidance for your chosen media model. This implementation uses `serviceHostedMediaConfig` for the Graph call leg and is intended as a control-plane bot. If you move to app-hosted media, follow Microsoft’s current calling-bot permission guidance and add the media permissions they require.

### 3. Admin consent

Grant admin consent for the Graph permissions.

### 4. Configure Teams application access policy for meeting access

Example:

```powershell
Connect-MicrosoftTeams
New-CsApplicationAccessPolicy -Identity TeamsArtifactsPolicy -AppIds "<AZURE_CLIENT_ID>"
Grant-CsApplicationAccessPolicy -Identity "<ORGANIZER_OBJECT_ID>" -PolicyName TeamsArtifactsPolicy
```

### 5. Generate Graph rich-notification certificate pair

```bash
mkdir -p certs
openssl req -x509 -newkey rsa:2048 \
  -keyout certs/graph-notification-private.pem \
  -out certs/graph-notification-public.pem \
  -days 365 -nodes \
  -subj "/CN=teams-artifacts-webhook"
```

### 6. Provision Azure storage and queueing

- Azure Blob Storage for artifacts, state, and dead-letter archives
- Azure Service Bus for production queueing
- A dedicated compliance queue if `QUEUE_MODE=servicebus`

### 7. Expose public HTTPS endpoints

Required public endpoints:

- `GRAPH_NOTIFICATION_URL`
- `GRAPH_LIFECYCLE_NOTIFICATION_URL`
- `BOT_CALLBACK_URL`

### 8. Fill in `.env`

Copy `.env.example` to `.env` and provide real values.

### 9. Install and run

```bash
npm install
npm run dev
```

### 10. Render the Teams app package

```bash
npm run render:teams-package
```

This writes:

- `build/teams-app-package/manifest.json`
- `build/meeting-recorder-teams-app.zip`

### 11. Upload the Teams app package

Upload the generated zip to your org catalog or via the Teams developer tooling/admin flow.

### 12. Preinstall the app if desired

Use Teams app setup policies to install/pin the app for users. That helps with distribution but does not itself make the bot join all meetings automatically.

## Option 1: Enforce Recording Behavior

This is the closest practical way to maximize recording and transcription coverage at the tenant level.

### Goal

Make Teams meetings default toward recording/transcription-friendly behavior by using admin policy and meeting templates.

### Step by step

1. Review your target scope.
   Decide whether you want to apply the policy org-wide first or pilot it with a specific user group.
2. Configure Teams meeting policy.
   In Teams admin center, go to `Meetings > Meeting policies`.
   Create a dedicated policy or update an existing one.
3. Enable recording-related settings in the policy.
   At minimum, review and configure:
   - cloud recording
   - transcription
   - captions/transcript-related controls
   - anonymous/guest meeting behavior if relevant to your tenant
4. Assign the policy to the target organizers.
   Use per-user policy assignment or policy packages/groups as appropriate.
5. Configure meeting templates.
   In Teams admin center, go to `Meetings > Meeting templates` and `Meetings > Meeting template policies`.
   Use templates to set or lock meeting defaults such as:
   - `Record meetings automatically`
   - who can record
   - lobby/presenter defaults
   - meeting chat and participation settings
6. If you have Teams Premium, use custom meeting templates for stronger enforcement.
   This is where you can lock more meeting options instead of only suggesting defaults.
7. Preinstall your app if needed.
   Use `Teams apps > Setup policies` if you want the Meeting Recorder app visible to organizers.
8. Validate with test organizers.
   Schedule sample meetings and confirm:
   - recording can start as expected
   - transcripts are produced
   - artifacts land where expected
   - your ingestion service receives notifications
9. Roll out gradually.
   Start with a pilot group, then broaden assignment once artifact coverage and organizer behavior look healthy.

### Automation for Option 1

Current official automation path is primarily **Microsoft Teams PowerShell**.

What you can automate now with PowerShell:
- create/update meeting policies with `New-CsTeamsMeetingPolicy` and `Set-CsTeamsMeetingPolicy`
- assign them with `Grant-CsTeamsMeetingPolicy`
- manage meeting template visibility policies with `New-CsTeamsMeetingTemplatePermissionPolicy`, `Set-CsTeamsMeetingTemplatePermissionPolicy`, and `Grant-CsTeamsMeetingTemplatePermissionPolicy`

What I found for current Microsoft surfaces:
- PowerShell: yes
- Teams admin center: yes
- Azure CLI: I did **not** find an official Azure CLI surface for Teams meeting policies/templates
- Microsoft Graph API: I did **not** find an official Graph admin API for managing Teams meeting policies/templates in the same way

That last point is an inference from the current Microsoft Learn surfaces I checked. The official admin path I found today is Teams admin center plus Teams PowerShell.

Useful references:
- `Set-CsTeamsMeetingPolicy`:
  https://learn.microsoft.com/en-us/powershell/module/microsoftteams/set-csteamsmeetingpolicy?view=teams-ps
- `Grant-CsTeamsMeetingPolicy`:
  https://learn.microsoft.com/en-us/powershell/module/microsoftteams/grant-csteamsmeetingpolicy?view=teams-ps
- Meeting templates admin guide:
  https://learn.microsoft.com/en-us/microsoftteams/manage-meeting-templates
- Custom meeting templates overview:
  https://learn.microsoft.com/en-us/microsoftteams/custom-meeting-templates-overview
- Predefined meeting template reference:
  https://learn.microsoft.com/en-us/microsoftteams/predefined-meeting-template-reference

### Example PowerShell flow

```powershell
Connect-MicrosoftTeams

New-CsTeamsMeetingPolicy -Identity "RecordingRequiredPolicy"

Set-CsTeamsMeetingPolicy `
  -Identity "RecordingRequiredPolicy" `
  -AllowCloudRecording $true `
  -AllowTranscription $true

Grant-CsTeamsMeetingPolicy `
  -Identity "RecordingRequiredPolicy" `
  -PolicyName "RecordingRequiredPolicy"
```

If you want different meeting-template visibility by group, use Teams meeting template permission policies on top of that.

## Option 2: Build Org-Wide Ingestion

This is the scalable backend path and it maps directly to the service in this repository.

### Goal

Ingest recordings and transcripts centrally after Teams produces them, store them in Azure, and drive governance/compliance from the resulting events.

### Step by step

1. Create or choose your Entra app registration.
   This is the identity used by the ingestion backend.
2. Grant Graph application permissions and admin consent.
   At minimum for scheduled online meetings:
   - `OnlineMeetingRecording.Read.All`
   - `OnlineMeetingTranscript.Read.All`
   - `OnlineMeetings.Read.All`
3. Configure Teams application access policy where required for organizer access patterns.
4. Generate the Graph rich-notification certificate pair.
   This repo expects a public certificate and matching private key for webhook decryption.
5. Provision Azure resources.
   - Blob Storage
   - Service Bus for production
   - public HTTPS host for the webhook service
6. Configure `.env`.
   Important values:
   - `GRAPH_NOTIFICATION_URL`
   - `GRAPH_LIFECYCLE_NOTIFICATION_URL`
   - `GRAPH_SUBSCRIPTION_MODE`
   - `GRAPH_INCLUDE_RESOURCE_DATA`
   - storage and queue settings
7. Deploy the service.
   Run the backend and confirm startup succeeds.
8. Sync subscriptions.
   Call `POST /api/subscriptions/sync` or let startup do it automatically.
9. Validate webhook delivery.
   Confirm Graph can reach:
   - `/webhooks/graph`
   - `/webhooks/graph/lifecycle`
10. Validate artifact ingestion.
   Run a test meeting, produce a recording/transcript, and confirm:
   - Blob artifact files are written
   - downstream events are emitted
   - compliance cases resolve if registered
11. Turn on compliance tracking.
   Register expected meetings and use the compliance APIs/events to flag missing recordings or transcripts.

### What Option 2 automates

- Graph subscription lifecycle
- webhook validation and decryption
- content fetch from Graph
- Blob persistence
- downstream events
- compliance detection and reminders

### What Option 2 does not automate

- forcing a user to record
- guaranteeing every meeting is recorded
- replacing Teams admin policy

### Storage/source note

Microsoft currently documents that Teams meeting recordings and transcripts are stored in OneDrive and SharePoint, typically in the organizer’s OneDrive for meeting recordings. Your backend does not need to poll those locations directly for the primary design in this repo because it uses Graph change notifications as the trigger and Graph content retrieval as the fetch path.

Useful references:
- Teams recording/transcript storage:
  https://learn.microsoft.com/en-us/microsoftteams/tmr-meeting-recording-change
- Graph transcript/recording notifications:
  https://learn.microsoft.com/en-us/graph/teams-changenotifications-callrecording-and-calltranscript

## Environment Variables

Use `.env.example` as the source of truth.

### Bot control

- `BOT_ENABLED`
- `BOT_APP_ID`
- `BOT_DISPLAY_NAME`
- `BOT_CALLBACK_URL`
- `BOT_REQUESTED_MODALITIES`
- `BOT_SUPPORTS_VIDEO`
- `BOT_ALLOW_CONVERSATION_WITHOUT_HOST`

### Compliance control

- `COMPLIANCE_ENABLED`
- `COMPLIANCE_DEFAULT_EXPECT_RECORDING`
- `COMPLIANCE_DEFAULT_EXPECT_TRANSCRIPT`
- `COMPLIANCE_DEFAULT_GRACE_PERIOD_MINUTES`
- `COMPLIANCE_REMINDER_INTERVAL_MINUTES`
- `COMPLIANCE_MAX_REMINDERS`
- `COMPLIANCE_WORKER_CONCURRENCY`
- `COMPLIANCE_NOTIFICATION_WEBHOOK_URL`

### Teams package rendering

- `TEAMS_APP_ID`
- `TEAMS_APP_SHORT_NAME`
- `TEAMS_APP_FULL_NAME`
- `TEAMS_APP_SHORT_DESCRIPTION`
- `TEAMS_APP_FULL_DESCRIPTION`
- `TEAMS_APP_DEVELOPER_NAME`
- `TEAMS_APP_WEBSITE_URL`
- `TEAMS_APP_PRIVACY_URL`
- `TEAMS_APP_TERMS_URL`

### Core runtime

- `NODE_ENV`
- `PORT`
- `LOG_LEVEL`

### Microsoft Entra / Graph auth

- `AZURE_TENANT_ID`
- `AZURE_CLIENT_ID`
- `AZURE_CLIENT_SECRET`
- `AZURE_USE_MANAGED_IDENTITY`
- `AZURE_MANAGED_IDENTITY_CLIENT_ID`
- `AZURE_CLIENT_CERTIFICATE_PATH`
- `AZURE_CLIENT_CERTIFICATE_PASSWORD`
- `GRAPH_BASE_URL`
- `GRAPH_SCOPE`

### Graph webhook + subscription settings

- `GRAPH_NOTIFICATION_URL`
- `GRAPH_LIFECYCLE_NOTIFICATION_URL`
- `GRAPH_NOTIFICATION_CLIENT_STATE`
- `GRAPH_SUBSCRIPTION_MODE`
- `GRAPH_ORGANIZER_USER_IDS`
- `GRAPH_INCLUDE_RESOURCE_DATA`
- `GRAPH_SUBSCRIPTION_TTL_MINUTES`
- `GRAPH_SUBSCRIPTION_RENEWAL_WINDOW_MINUTES`
- `GRAPH_SUBSCRIPTION_SYNC_INTERVAL_MS`
- `GRAPH_ENCRYPTION_CERTIFICATE_PATH`
- `GRAPH_ENCRYPTION_PRIVATE_KEY_PATH`
- `GRAPH_ENCRYPTION_PRIVATE_KEY_PASSPHRASE`
- `GRAPH_ENCRYPTION_CERTIFICATE_ID`

### Storage / queue / worker

- `AZURE_STORAGE_CONNECTION_STRING`
- `AZURE_BLOB_CONTAINER_ARTIFACTS`
- `AZURE_BLOB_CONTAINER_STATE`
- `AZURE_BLOB_CONTAINER_DEADLETTER`
- `QUEUE_MODE`
- `AZURE_SERVICE_BUS_CONNECTION_STRING`
- `AZURE_SERVICE_BUS_INGESTION_QUEUE`
- `AZURE_SERVICE_BUS_COMPLIANCE_QUEUE`
- `AZURE_SERVICE_BUS_EVENT_QUEUE`
- `QUEUE_MAX_DELIVERIES`
- `INGESTION_MAX_FETCH_ATTEMPTS`
- `INGESTION_INITIAL_RETRY_DELAY_MS`
- `INGESTION_LOCK_TTL_SECONDS`
- `INGESTION_WORKER_CONCURRENCY`

## Example API Calls

### Health

```bash
curl http://localhost:3000/healthz
```

### Force Graph subscription sync

```bash
curl -X POST http://localhost:3000/api/subscriptions/sync
```

### Ask the bot to join a Teams meeting

```bash
curl -X POST http://localhost:3000/api/bot/join \
  -H "Content-Type: application/json" \
  -d '{
    "joinWebUrl": "https://teams.microsoft.com/l/meetup-join/19%3ameeting_example%40thread.v2/0?context=%7B%22Tid%22%3A%2200000000-0000-0000-0000-000000000000%22%2C%22Oid%22%3A%2211111111-1111-1111-1111-111111111111%22%7D"
  }'
```

### List tracked calls

```bash
curl http://localhost:3000/api/bot/calls
```

### Force the bot to leave

```bash
curl -X POST http://localhost:3000/api/bot/calls/<call-id>/leave
```

### Graph callback endpoint for calls

```bash
curl -X POST http://localhost:3000/webhooks/teams/calls \
  -H "Content-Type: application/json" \
  -d '{
    "value": [
      {
        "resource": "/communications/calls/22222222-2222-2222-2222-222222222222",
        "resourceData": {
          "state": "terminated"
        }
      }
    ]
  }'
```

### Register a meeting for compliance tracking

```bash
curl -X POST http://localhost:3000/api/compliance/meetings/register \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "00000000-0000-0000-0000-000000000000",
    "parentResourceType": "onlineMeeting",
    "parentResourceId": "MsoMeetingId",
    "title": "Quarterly Review",
    "organizerUserId": "11111111-1111-1111-1111-111111111111",
    "organizerUpn": "organizer@contoso.com",
    "startedAt": "2026-03-28T15:00:00.000Z",
    "endedAt": "2026-03-28T16:00:00.000Z",
    "expectedArtifacts": {
      "recordingRequired": true,
      "transcriptRequired": true
    },
    "gracePeriodMinutes": 30
  }'
```

### View compliance summary

```bash
curl http://localhost:3000/api/compliance/summary
```

## Notes on User Removal

Users can remove the bot from the meeting roster in Teams. This backend also exposes an operator leave endpoint. In both cases, the service tracks the resulting call-state transition through Graph callback events and persisted call state.

## Verification Note

The codebase was generated and reviewed in this workspace, but automated `npm install` and `tsc` validation could not be executed here because the environment does not currently expose a working Node.js runtime.
