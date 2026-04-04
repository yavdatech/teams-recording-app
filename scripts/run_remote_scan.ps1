Param(
  [string]$app = 'team-recordings-copier',
  [string]$rg  = 'analytics-yavda-rg'
)

# Get publishing profile (requires az cli logged in)
$pp = az webapp deployment list-publishing-profiles --name $app --resource-group $rg --output json | ConvertFrom-Json
if (-not $pp) { Write-Error 'Failed to get publishing profiles'; exit 1 }
$item = $pp | Where-Object { $_.publishMethod -match 'Zip' -or $_.publishMethod -match 'MSDeploy' } | Select-Object -First 1
if (-not $item) { $item = $pp | Select-Object -First 1 }
$user = $item.userName; $pwd = $item.userPWD

$pair = $user + ':' + $pwd
$b64 = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes($pair))
$headers = @{ Authorization = "Basic $b64"; 'Content-Type' = 'application/json' }

$kuduUrl = "https://$app.scm.azurewebsites.net/api/command"
$cmd = 'cmd /c start "" /b node "D:\\home\\site\\wwwroot\\manual_full_scan.js" >> "D:\\home\\LogFiles\\manual_full_scan.log" 2>&1'
$body = @{ command = $cmd } | ConvertTo-Json

Write-Host "Posting command to Kudu: $cmd"
try {
  $r = Invoke-RestMethod -Uri $kuduUrl -Headers $headers -Method Post -Body $body -TimeoutSec 180
  Write-Host 'Kudu response:'
  $r | ConvertTo-Json -Depth 6 | Write-Host
} catch {
  Write-Error "Kudu command error: $_"
  exit 1
}

Start-Sleep -Seconds 3
$logUrl = "https://$app.scm.azurewebsites.net/api/vfs/LogFiles/manual_full_scan.log"
Write-Host "Fetching log (tail)..."
try {
  $log = Invoke-RestMethod -Uri $logUrl -Headers $headers -Method Get -TimeoutSec 60
  $lines = $log -split "`n"
  if ($lines.Length -gt 200) { $tail = $lines[-200..-1] -join "`n" } else { $tail = $lines -join "`n" }
  Write-Host $tail
} catch {
  Write-Warning 'Unable to fetch log or log not yet populated.'
}
