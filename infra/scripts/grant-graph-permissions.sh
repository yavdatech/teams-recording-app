#!/usr/bin/env bash
set -euo pipefail

if ! command -v az >/dev/null 2>&1; then
  echo "az CLI is required. Install from https://aka.ms/azure-cli" >&2
  exit 1
fi

if [ $# -lt 1 ]; then
  echo "Usage: $0 <appId>" >&2
  echo "Where <appId> is the Application (client) ID of the app registration" >&2
  exit 1
fi

APP_ID="$1"
GRAPH_APP_ID="00000003-0000-0000-c000-000000000000"

# Desired application permission values (appRoles) to add (adjust as needed)
PERMISSIONS=(
  "OnlineMeetings.Read.All"
  "CallRecords.Read.All"
  "Calls.Initiate.All"
  "Calls.JoinGroupCall.All"
  "Calls.AccessMedia.All"
  "User.Read.All"
)

echo "Finding Microsoft Graph service principal..."
GRAPH_SP_OBJECT_ID=$(az ad sp show --id "$GRAPH_APP_ID" --query objectId -o tsv)
if [ -z "$GRAPH_SP_OBJECT_ID" ]; then
  echo "Failed to find Microsoft Graph service principal" >&2
  exit 2
fi

for perm in "${PERMISSIONS[@]}"; do
  echo "Processing permission: $perm"
  PERM_ID=$(az rest --method GET --uri "https://graph.microsoft.com/v1.0/servicePrincipals/$GRAPH_SP_OBJECT_ID" --query "appRoles[?value=='${perm}'].id | [0]" -o tsv)

  if [ -z "$PERM_ID" ]; then
    echo "Permission $perm not found as an application permission on Microsoft Graph. Skipping." >&2
    continue
  fi

  echo "Adding application permission $perm (id: $PERM_ID) to app $APP_ID"
  az ad app permission add --id "$APP_ID" --api "$GRAPH_APP_ID" --api-permissions "$PERM_ID=Role"
done

echo "Requesting admin consent for the application permissions (requires tenant admin)."
az ad app permission admin-consent --id "$APP_ID"

echo "Done. Verify permissions in the Azure Portal or with 'az ad app permission list --id <appId>'"
