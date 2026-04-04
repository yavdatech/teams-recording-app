Param(
  [string]$app = 'team-recordings-copier',
  [string]$rg  = 'analytics-yavda-rg',
  [int]$pollSeconds = 120,
  [int]$pollInterval = 5
)

$art = Join-Path $PSScriptRoot '..\artifacts'
if (-not (Test-Path $art)) { New-Item -ItemType Directory -Path $art | Out-Null }

Write-Host "Run remote scan (hardened) -> app=$app rg=$rg pollSeconds=$pollSeconds pollInterval=$pollInterval"

# publishing profile
$pp = az webapp deployment list-publishing-profiles --name $app --resource-group $rg --output json | ConvertFrom-Json
if (-not $pp) { Write-Error 'Failed to get publishing profiles'; exit 1 }
$item = $pp | Where-Object { $_.publishMethod -match 'Zip' -or $_.publishMethod -match 'MSDeploy' } | Select-Object -First 1
if (-not $item) { $item = $pp | Select-Object -First 1 }
$user = $item.userName; $pwd = $item.userPWD
$pair = $user + ':' + $pwd
$b64 = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes($pair))
$headers = @{ Authorization = "Basic $b64"; 'Content-Type' = 'application/json' }

# command to start background node scan
$kuduUrl = "https://$app.scm.azurewebsites.net/api/command"
$cmd = 'cmd /c start "" /b node "D:\\home\\site\\wwwroot\\manual_full_scan.js" >> "D:\\home\\LogFiles\\manual_full_scan.log" 2>&1'
$body = @{ command = $cmd } | ConvertTo-Json

Write-Host "Posting command to Kudu to start manual_full_scan.js"
try {
  $r = Invoke-RestMethod -Uri $kuduUrl -Headers $headers -Method Post -Body $body -TimeoutSec 180 -ErrorAction Stop
  Write-Host 'Kudu response:'
  $r | ConvertTo-Json -Depth 6 | Write-Host
} catch {
  Write-Error "Kudu command error: $_"
  exit 1
}

$logUrl = "https://$app.scm.azurewebsites.net/api/vfs/LogFiles/manual_full_scan.log"
$outLocal = Join-Path $art 'manual_full_scan_tail.txt'
$maxTries = [math]::Ceiling($pollSeconds / $pollInterval)
$found = $false
for ($i=0; $i -lt $maxTries; $i++) {
  try {
    $log = Invoke-RestMethod -Uri $logUrl -Headers @{ Authorization = "Basic $b64" } -Method Get -TimeoutSec 30
    if ($log -and $log.Length -gt 0) {
      $log | Out-File -FilePath $outLocal -Encoding utf8
      Write-Host "Saved log tail to $outLocal"
      $found = $true
      break
    }
  } catch {
    Write-Host ("Poll {0}/{1}: log not available yet or fetch error" -f ($i+1), $maxTries)
  }
  Start-Sleep -Seconds $pollInterval
}

$result = [ordered]@{
  app = $app
  rg  = $rg
  invokedAt = (Get-Date).ToString('o')
  kuduCalled = $true
  logFound = $found
  logPathLocal = if ($found) { $outLocal } else { $null }
}
$resultJson = $result | ConvertTo-Json -Depth 5
$resultJson | Out-File -FilePath (Join-Path $art 'run_remote_scan_result.json') -Encoding utf8
Write-Host $resultJson

if (-not $found) { Write-Warning 'Log not found within polling window. The scan may be running in background or failed to start.' }
