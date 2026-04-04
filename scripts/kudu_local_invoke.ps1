$rg='analytics-yavda-rg'; $app='team-recordings-copier'; $func='admin_run';
$art=Join-Path $PSScriptRoot '..\artifacts'
if (-not (Test-Path $art)) { New-Item -ItemType Directory -Path $art | Out-Null }

Write-Host "Fetching publishing profile..."
$ppJson = az webapp deployment list-publishing-profiles --name $app --resource-group $rg --output json
if ($LASTEXITCODE -ne 0) { Write-Host "Failed to get publishing profiles: $ppJson"; exit 1 }
$pp = $ppJson | ConvertFrom-Json
$item = $pp | Select-Object -First 1
$user = $item.userName; $pwd = $item.userPWD
$pair = $user + ':' + $pwd
$b64=[Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes($pair))
$headers = @{ Authorization = "Basic $b64"; 'Content-Type'='application/json' }

Write-Host "Fetching function key..."
$keysJson = az functionapp function keys list --resource-group $rg --name $app --function-name $func --output json
if ($LASTEXITCODE -ne 0) { Write-Host "Failed to get function keys: $keysJson"; exit 1 }
$keys = $keysJson | ConvertFrom-Json
$key = $null
if ($keys.default) { $key=$keys.default } elseif ($keys.keys -and $keys.keys.Count -gt 0) { $key=$keys.keys[0].value } else { foreach ($p in $keys.PSObject.Properties) { if ($p.Name -ne 'functionName') { $key=$p.Value; break } } }
if (-not $key) { Write-Host "No function key found"; exit 1 }

$kuduUrl = "https://$app.scm.azurewebsites.net/api/command"
$logPath = 'D:\home\LogFiles\kudu_local_invoke.txt'

# Command to run inside Kudu to POST to localhost:80
## Simpler inner command: run Invoke-WebRequest and redirect stdout+stderr into the log file (avoid complex escaping)
$inner = "Invoke-WebRequest -Uri 'http://127.0.0.1:80/api/admin_run?code=$key' -Method POST -Body '{}' -ContentType 'application/json' -UseBasicParsing -TimeoutSec 90 -Verbose 2>&1 > $logPath"
$cmd = 'cmd /c powershell -NoProfile -Command "' + $inner + '"'

$body = @{ command = $cmd } | ConvertTo-Json -Depth 6
Write-Host "Posting command to Kudu to invoke local function and write output to $logPath"
try {
  $r = Invoke-RestMethod -Uri $kuduUrl -Headers $headers -Method Post -Body $body -TimeoutSec 120 -ErrorAction Stop
  Write-Host "Kudu command response:"; $r | ConvertTo-Json -Depth 4 | Write-Host
} catch {
  Write-Host "Kudu command POST failed: $_"
  exit 1
}

# Poll for the log file via Kudu VFS
$vfsUrl = "https://$app.scm.azurewebsites.net/api/vfs/LogFiles/kudu_local_invoke.txt"
$outLocal = Join-Path $art 'kudu_local_invoke_output.txt'
$max = 15
for ($i=0; $i -lt $max; $i++) {
  try {
    $wc = Invoke-RestMethod -Uri $vfsUrl -Headers @{ Authorization = "Basic $b64" } -Method Get -TimeoutSec 30
    if ($wc) {
      $wc | Out-File -FilePath $outLocal -Encoding utf8
      Write-Host "Saved Kudu local-invoke output to: $outLocal"
      break
    }
  } catch {
    Write-Host ("Attempt {0}/{1}: log not yet available or fetch failed: {2}" -f ($i+1), $max, $_)
  }
  Write-Host ("Attempt {0}/{1}: log not yet available or fetch failed" -f ($i+1), $max)
  Start-Sleep -Seconds 3
}

Write-Host "Done. Artifacts: $art"
