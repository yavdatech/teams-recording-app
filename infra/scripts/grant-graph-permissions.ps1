param(
  [Parameter(Mandatory=$true)]
  [string]$AppId
)

if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
  Write-Error "az CLI is required. Install from https://aka.ms/azure-cli"
  exit 1
}

$GraphAppId = '00000003-0000-0000-c000-000000000000'

$Permissions = @(
  'OnlineMeetings.Read.All',
  'CallRecords.Read.All',
  'Calls.Initiate.All',
  'Calls.JoinGroupCall.All',
  'Calls.AccessMedia.All',
  'User.Read.All'
)

Write-Host "Finding Microsoft Graph service principal..."
$graphSpObjectId = az ad sp show --id $GraphAppId --query objectId -o tsv
if (-not $graphSpObjectId) {
  Write-Error "Failed to find Microsoft Graph service principal"
  exit 2
}

foreach ($perm in $Permissions) {
  Write-Host "Processing permission: $perm"
  $resp = az rest --method GET --uri "https://graph.microsoft.com/v1.0/servicePrincipals/$graphSpObjectId"
  $sp = $resp | ConvertFrom-Json
  $match = $sp.appRoles | Where-Object { $_.value -eq $perm } | Select-Object -First 1
  if (-not $match) {
    Write-Warning "Permission $perm not found as an application permission on Microsoft Graph. Skipping."
    continue
  }

  $permId = $match.id
  Write-Host "Adding application permission $perm (id: $permId) to app $AppId"
  az ad app permission add --id $AppId --api $GraphAppId --api-permissions "$permId=Role"
}

Write-Host "Requesting admin consent for the application permissions (requires tenant admin)."
az ad app permission admin-consent --id $AppId

Write-Host "Done. Verify permissions in the Azure Portal or with 'az ad app permission list --id <appId>'"
