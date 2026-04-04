# Collect public /api/admin_run invoke details and save artifacts
$artifactDir = Join-Path $PSScriptRoot "..\artifacts"
if (-not (Test-Path $artifactDir)) { New-Item -ItemType Directory -Path $artifactDir | Out-Null }

$rg='analytics-yavda-rg'; $app='team-recordings-copier'; $func='admin_run';
Write-Host "Getting function metadata..."
$metaJson = az functionapp function show --resource-group $rg --name $app --function-name $func --output json
if ($LASTEXITCODE -ne 0) { Write-Host "az function show failed:"; Write-Host $metaJson; exit $LASTEXITCODE }
$meta = $metaJson | ConvertFrom-Json
Write-Host "invokeUrlTemplate:" $meta.invokeUrlTemplate

$keysJson = az functionapp function keys list --resource-group $rg --name $app --function-name $func --output json
if ($LASTEXITCODE -ne 0) { Write-Host "az function keys list failed:"; Write-Host $keysJson; exit $LASTEXITCODE }
$keys = $keysJson | ConvertFrom-Json
$key = $null
if ($keys.default) { $key=$keys.default } elseif ($keys.keys -and $keys.keys.Count -gt 0) { $key=$keys.keys[0].value } else { foreach ($p in $keys.PSObject.Properties) { if ($p.Name -ne 'functionName') { $key=$p.Value; break } } }
if (-not $key) { Write-Host "No key found"; exit 1 }

if ($meta.invokeUrlTemplate -match '{.*}') { $callUrl = ($meta.invokeUrlTemplate -replace '{.*}',$key) } else { $callUrl = $meta.invokeUrlTemplate + '?code=' + $key }
Write-Host "Calling: $callUrl"

# Try to use external curl.exe for raw verbose output; fall back to Invoke-WebRequest
try {
  $outPath = Join-Path $artifactDir 'public_invoke_curl.txt'
  $args = '-v -X POST "' + $callUrl + '" -H "Content-Type: application/json" -d "{}"'
  Write-Host "Attempting to run curl.exe with args: $args"
  $outPath = Join-Path $artifactDir 'public_invoke_curl.txt'
  $cmdLine = "curl.exe $args 2>&1 | Tee-Object -FilePath `"$outPath`""
  Write-Host "Running: $cmdLine"
  Invoke-Expression $cmdLine
} catch {
  Write-Host "curl.exe failed or not available; using Invoke-WebRequest and saving structured output"
  try {
    $r = Invoke-WebRequest -Uri $callUrl -Method Post -Body '{}' -ContentType 'application/json' -UseBasicParsing -TimeoutSec 60 -ErrorAction Stop
    $out = "StatusCode: $($r.StatusCode)`nHeaders:`n"
    $r.Headers.GetEnumerator() | ForEach-Object { $out += "$(($_.Name)): $($_.Value)`n" }
    $out += "`nBody:`n$r.Content"
    $out | Out-File -FilePath (Join-Path $artifactDir 'public_invoke_invokeresponse.txt') -Encoding utf8
    Write-Host $out
  } catch {
    Write-Host "Invoke error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
      try {
        $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $body = $sr.ReadToEnd()
        $body | Out-File -FilePath (Join-Path $artifactDir 'public_invoke_errorbody.txt') -Encoding utf8
        Write-Host "Response body saved to public_invoke_errorbody.txt"
      } catch { Write-Host "Failed to read response body" }
    }
  }
}

Write-Host "Done. Artifacts in: $artifactDir"
