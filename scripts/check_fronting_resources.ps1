$rg='analytics-yavda-rg'; $app='team-recordings-copier';
$art=Join-Path $PSScriptRoot '..\artifacts'
if (-not (Test-Path $art)) { New-Item -ItemType Directory -Path $art | Out-Null }

Write-Host "Gathering webapp info..."
try {
  az webapp show --name $app --resource-group $rg --output json | Out-File (Join-Path $art 'webapp_show.json') -Encoding utf8
  Write-Host "Saved webapp_show.json"
} catch { Write-Host "az webapp show failed: $_" }

Write-Host "Gathering appsettings..."
try {
  az webapp config appsettings list --name $app --resource-group $rg --output json | Out-File (Join-Path $art 'appsettings.json') -Encoding utf8
  Write-Host "Saved appsettings.json"
} catch { Write-Host "az webapp config appsettings list failed: $_" }

Write-Host "Listing resource-group resources..."
try {
  az resource list --resource-group $rg --output json | Out-File (Join-Path $art 'rg_resources.json') -Encoding utf8
  Write-Host "Saved rg_resources.json"
} catch { Write-Host "az resource list failed: $_" }

Write-Host "Attempting to list Front Door and Application Gateway resources (may require extension/permissions)..."
try {
  az network front-door list --output json | Out-File (Join-Path $art 'frontdoors.json') -Encoding utf8
  Write-Host "Saved frontdoors.json"
} catch { Write-Host "az network front-door list failed or not available: $_" }

try {
  az network application-gateway list --output json | Out-File (Join-Path $art 'appgateways.json') -Encoding utf8
  Write-Host "Saved appgateways.json"
} catch { Write-Host "az network application-gateway list failed or not available: $_" }

Write-Host "Done. Artifacts: $art"
