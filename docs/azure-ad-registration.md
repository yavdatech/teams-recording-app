# Azure AD App Registration — Teams Recording App

This document shows the recommended steps to register an Azure AD (Entra) application and grant the Microsoft Graph permissions required by this project.

Summary
- This service is a backend (daemon) that uses Microsoft Graph application permissions (client credentials) to:
  - Create and manage Graph subscriptions for online meeting recordings/transcripts
  - Fetch recordings/transcripts and call-related artifacts
  - Optionally join meetings as a bot via the Cloud Communications APIs

High-level steps
1. Register an app in Azure AD
2. Configure authentication (client secret or certificate, or use Managed Identity in Azure)
3. Add **Microsoft Graph** API permissions (Application permissions) and grant admin consent
4. (Optional) Add a Teams bot registration and update the Teams app manifest

Register the application (Portal)
1. Go to the Azure Portal → Microsoft Entra ID → App registrations → New registration
2. Name: `teams-recording-app` (or your preferred name)
3. Supported account types: choose based on your tenant (usually Single tenant)
4. Redirect URI: not required for a daemon/service; leave blank
5. Click Register

Add client credentials
- Certificates & secrets → New client secret (or upload a certificate)
- Copy the client secret value now (only shown once) and store it in a secure place (Key Vault recommended)

Microsoft Graph permissions (Application permissions — admin consent required)
Grant these permissions under Microsoft Graph → Application permissions, then click "Grant admin consent" for your tenant.

- **OnlineMeetings.Read.All** — Read online meeting information (metadata for meetings)
- **CallRecords.Read.All** — Read call and meeting callRecords (metadata used for ingestion)
- **Calls.Initiate.All** — Create outbound calls (used by the bot to join meetings)
- **Calls.JoinGroupCall.All** (or **Calls.Join.All**) — Allow joining group calls if your bot joins existing meeting calls
- **Calls.AccessMedia.All** — Access media streams/recordings when applicable
- **User.Read.All** — (Optional) Read user profiles for mapping/lookup

Notes on the permissions above:
- These are **Application** permissions (app-only). They require an administrator to grant consent for the tenant.
- Only request the permissions your deployment actually needs. For example, if you do not use the bot, you can skip the `Calls.*` permissions.

Grant admin consent (Portal)
1. In the App Registration, open "API permissions"
2. Click "Grant admin consent for <Your Tenant>"
3. Confirm the permission grant

Using Managed Identity in Azure (recommended in production)
- For production deployments running in Azure (App Service, Container Apps, VMSS, etc.) prefer a Managed Identity instead of client secrets.
- Assign a managed identity to your compute resource, then configure the application to use `AZURE_USE_MANAGED_IDENTITY=true` and set `AZURE_MANAGED_IDENTITY_CLIENT_ID` if using a user-assigned identity.

Teams bot registration (if using the bot)
- If using the bot feature, create a Teams bot resource (Azure Bot or Teams Developer Portal) and ensure the `BOT_APP_ID` matches the Azure AD app's Application (client) ID.
- Ensure the bot's messaging/voice capabilities are configured in Teams and that the Teams app manifest (in `appPackage/manifest.template.json`) includes the correct `botId`.

Automating registration (Azure CLI)
- Register app:

```bash
az ad app create --display-name "teams-recording-app" --query appId -o tsv
```

- NOTE: scripting permission assignments is advanced (requires Graph calls or Microsoft Graph PowerShell). For most teams, use the Portal to add API permissions and grant admin consent.

After registration
- Put the following values into your `.env` (or secret store): `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, and either `AZURE_CLIENT_SECRET` (local/testing) or configure `AZURE_USE_MANAGED_IDENTITY=true` in Azure.
- Ensure `GRAPH_NOTIFICATION_URL` and `GRAPH_LIFECYCLE_NOTIFICATION_URL` are set to publicly routable HTTPS endpoints that Microsoft Graph can reach.

References
- Microsoft Identity platform docs: https://learn.microsoft.com/entra/identity-platform/
- Microsoft Graph permissions reference: https://learn.microsoft.com/graph/permissions-reference
- Change notifications and resource data: https://learn.microsoft.com/graph/webhooks

If you'd like, I can:
- Generate an IaC snippet (Bicep/Terraform) to create the app registration and grant the listed permissions (requires tenant admin consent to finish), or
- Add a short checklist for what to do in the Azure Portal and include screenshots (if helpful).
