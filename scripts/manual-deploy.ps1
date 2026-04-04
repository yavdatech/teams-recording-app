<#
.SYNOPSIS
One-time manual deploy script for the Logic App and Function in this repository.

USAGE EXAMPLES
# Dry-run that only prints commands:
pwsh ./scripts/manual-deploy.ps1 -ResourceGroup "my-rg" -SubscriptionId "00000000-0000-0000-0000-000000000000" -Location "eastus" -CreateInfra -DryRun

# Real run (creates infra, deploys Logic App and Function):
pwsh ./scripts/manual-deploy.ps1 -ResourceGroup "my-rg" -SubscriptionId "00000000-0000-0000-0000-000000000000" -Location "eastus" -CreateInfra

Notes:
- Requires the Azure CLI (`az`) and PowerShell 7+ (or Windows PowerShell).
- If you set the `AZURE_CREDENTIALS` environment variable to a GitHub-style service principal JSON, the script will use it for non-interactive login. Otherwise the script will run `az login` interactively.
- If you pass `-CreateInfra` the script will deploy `azure/infra/azuredeploy.json` (which creates the function app/service plan, storage, etc.).
- This script packages `azure/functions/copy-worker` and deploys it using `az functionapp deployment source config-zip` to the Function App name.
#>

param(
  [switch]$CreateInfra,
  [string]$ResourceGroup = $null,
  [string]$SubscriptionId = $null,
  [string]$Location = "eastus",
  [string]$FunctionAppName = "team-recordings-copier",
  [string]$LogicAppName = "team-recordings-flow",
  [string]$InfraTemplatePath = "azure/infra/azuredeploy.json",
  [string]$LogicAppTemplatePath = "azure/logic-apps/logicapp-enqueue-template.json",
  [string]$FunctionFolder = "azure/functions/copy-worker",
  [string]$StorageAccountName = "",
  [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# If parameters are omitted, try to read from environment variables (.env loaded into process)
if (-not $SubscriptionId -or $SubscriptionId -eq "") {
  if ($env:SUBSCRIPTION) {
    $SubscriptionId = $env:SUBSCRIPTION
    Write-Host "Using SUBSCRIPTION from environment: $SubscriptionId"
  } else {
    throw "SubscriptionId parameter missing and SUBSCRIPTION not set in environment or .env"
  }
}

if (-not $ResourceGroup -or $ResourceGroup -eq "") {
  if ($env:RESOURCE_GROUP) {
    $ResourceGroup = $env:RESOURCE_GROUP
    Write-Host "Using RESOURCE_GROUP from environment: $ResourceGroup"
  } else {
    throw "ResourceGroup parameter missing and RESOURCE_GROUP not set in environment or .env"
  }
}

# Determine script and repo root so relative template paths resolve correctly
$scriptRoot = Split-Path -Path $MyInvocation.MyCommand.Definition -Parent
$repoRoot = Split-Path -Path $scriptRoot -Parent

function Resolve-TemplatePath {
  param([string]$path)
  if ([string]::IsNullOrEmpty($path)) { return $path }
  if ([System.IO.Path]::IsPathRooted($path)) { return $path }
  $candidate = Join-Path $repoRoot $path
  if (Test-Path $candidate) { return (Resolve-Path $candidate).Path }
  $candidate2 = Join-Path $scriptRoot $path
  if (Test-Path $candidate2) { return (Resolve-Path $candidate2).Path }
  return $path
}

function ExecCmd {
  param(
    [string]$Program,
    [Parameter(ValueFromRemainingArguments=$true)][string[]]$Args
  )
  $display = "$Program $($Args -join ' ')"
  if ($DryRun) {
    Write-Host "[DRY-RUN] $display"
    return
  }
  Write-Host ">>> $display"
  & $Program @Args
  if ($LASTEXITCODE -ne 0) { throw "$Program failed with exit code $LASTEXITCODE" }
}

function Get-DynamicVmQuota {
  param([string]$Location)
  try {
    Write-Host "Querying VM usage for location: $Location"
    $json = & az vm list-usage -l $Location -o json 2>$null
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrEmpty($json)) { return @{found=$false} }
    $entries = $json | ConvertFrom-Json
    # Try to find a usage entry that mentions "Dynamic"
    $dyn = $entries | Where-Object {
      ($_.name.value -and ($_.name.value -match '(?i)dynamic')) -or
      ($_.name.localizedValue -and ($_.name.localizedValue -match '(?i)dynamic'))
    }
    if (-not $dyn) {
      # Fallback: pick an entry that looks like a VM quota
      $dyn = $entries | Where-Object { $_.name.value -and ($_.name.value -match '(?i)vm|vms|virtual') } | Select-Object -First 1
    }
    if ($dyn) { return @{found=$true; limit=[int]$dyn.limit; usage=[int]$dyn.currentValue} }
    return @{found=$false}
  } catch {
    return @{found=$false}
  }
}

function Get-StorageAccountContext {
  param(
    [string]$ResourceGroup,
    [string]$PreferredStorageAccountName = "",
    [string]$FunctionAppName = "",
    [switch]$AllowPlaceholder
  )

  $storageAccountName = $PreferredStorageAccountName
  if ([string]::IsNullOrEmpty($storageAccountName)) {
    Write-Host "Discovering storage account in resource group: $ResourceGroup"
    $storageJson = & az storage account list -g $ResourceGroup -o json 2>$null
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrEmpty($storageJson)) {
      throw "Unable to discover a storage account in resource group '$ResourceGroup'"
    }
    $storageAccounts = $storageJson | ConvertFrom-Json
    $normalizedFunctionName = ($FunctionAppName -replace '[^a-zA-Z0-9]', '').ToLower()
    $matchedStorage = $null
    if (-not [string]::IsNullOrEmpty($normalizedFunctionName)) {
      $matchedStorage = $storageAccounts | Where-Object { $_.name -and ($_.name.ToLower() -like "*$normalizedFunctionName*") } | Select-Object -First 1
      if ($matchedStorage) {
        Write-Host "Matched storage account by function app name: $($matchedStorage.name)"
      }
    }
    if (-not $matchedStorage) {
      $matchedStorage = $storageAccounts | Select-Object -First 1
    }
    if (-not $matchedStorage -or [string]::IsNullOrEmpty($matchedStorage.name)) {
      throw "No storage account found in resource group '$ResourceGroup'"
    }
    $storageAccountName = $matchedStorage.name
  }

  Write-Host "Using storage account for Logic App connection: $storageAccountName"
  if ($AllowPlaceholder) {
    Write-Host "Dry-run mode detected; using placeholder storage key for Logic App connection."
    return @{ name = $storageAccountName; key = "DRYRUN_PLACEHOLDER_KEY" }
  }

  $keysJson = & az storage account keys list -g $ResourceGroup -n $storageAccountName -o json 2>$null
  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrEmpty($keysJson)) {
    throw "Unable to retrieve storage account keys for '$storageAccountName' in '$ResourceGroup'"
  }
  $keys = $keysJson | ConvertFrom-Json
  $primaryKey = $keys | Select-Object -First 1
  if (-not $primaryKey -or [string]::IsNullOrEmpty($primaryKey.value)) {
    throw "No storage account keys returned for '$storageAccountName'"
  }

  return @{ name = $storageAccountName; key = $primaryKey.value }
}

function Get-GraphAuthContext {
  param(
    [string]$AzureCredentialsJsonPath = (Join-Path $repoRoot "azure-credentials.json")
  )

  # Prefer AZURE_* environment variables from .env; allow GRAPH-specific overrides
  $tenantId = $env:GRAPH_AAD_TENANT_ID
  if (-not $tenantId) { $tenantId = $env:AZURE_TENANT_ID }
  $clientId = $env:GRAPH_AAD_CLIENT_ID
  if (-not $clientId) { $clientId = $env:AZURE_CLIENT_ID }
  $clientSecret = $env:GRAPH_AAD_CLIENT_SECRET
  if (-not $clientSecret) { $clientSecret = $env:AZURE_CLIENT_SECRET }

  if (-not $tenantId -or -not $clientId -or -not $clientSecret) {
    $credentialJson = $null
    if ($env:AZURE_CREDENTIALS) {
      try {
        $credentialJson = $env:AZURE_CREDENTIALS | ConvertFrom-Json
      } catch {
        throw "AZURE_CREDENTIALS is set but not valid JSON"
      }
    } elseif (Test-Path $AzureCredentialsJsonPath) {
      $credentialJson = Get-Content -Path $AzureCredentialsJsonPath -Raw | ConvertFrom-Json
    }

    if ($credentialJson) {
      if (-not $tenantId) { $tenantId = $credentialJson.tenantId }
      if (-not $clientId) { $clientId = $credentialJson.clientId }
      if (-not $clientSecret) { $clientSecret = $credentialJson.clientSecret }
    }
  }

  if (-not $tenantId -or -not $clientId -or -not $clientSecret) {
    throw "Graph auth values are missing. Set GRAPH_AAD_TENANT_ID/GRAPH_AAD_CLIENT_ID/GRAPH_AAD_CLIENT_SECRET or AZURE_TENANT_ID/AZURE_CLIENT_ID/AZURE_CLIENT_SECRET (or provide AZURE_CREDENTIALS / azure-credentials.json)."
  }

  return @{ tenantId = $tenantId; clientId = $clientId; clientSecret = $clientSecret }
}

try {
  # Login to Azure (service principal JSON via AZURE_CREDENTIALS or interactive)
  if ($env:AZURE_CREDENTIALS) {
    Write-Host "Using AZURE_CREDENTIALS environment variable (service principal JSON)"
    try {
      $creds = $env:AZURE_CREDENTIALS | ConvertFrom-Json
    } catch {
      throw "AZURE_CREDENTIALS is set but not valid JSON"
    }
    $clientId = $creds.clientId; if (-not $clientId -and $creds.client_id) { $clientId = $creds.client_id }
    $clientSecret = $creds.clientSecret; if (-not $clientSecret -and $creds.client_secret) { $clientSecret = $creds.client_secret }
    $tenantId = $creds.tenantId; if (-not $tenantId -and $creds.tenant_id) { $tenantId = $creds.tenant_id }
    if (-not $clientId -or -not $clientSecret -or -not $tenantId) { throw "AZURE_CREDENTIALS JSON missing clientId/clientSecret/tenantId" }
    ExecCmd "az" @("login","--service-principal","-u",$clientId,"-p",$clientSecret,"--tenant",$tenantId)
    ExecCmd "az" @("account","set","--subscription",$SubscriptionId)
  } else {
    Write-Host "No AZURE_CREDENTIALS env var — checking existing az login"
    try {
      $acctJson = & az account show -o json 2>$null
    } catch {
      $acctJson = $null
    }
    if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrEmpty($acctJson)) {
      Write-Host "Azure CLI already logged in; using existing account"
    } else {
      Write-Host "Not logged in — performing interactive 'az login' (ensure you pick the correct subscription)"
      ExecCmd "az" @("login")
    }
    ExecCmd "az" @("account","set","--subscription",$SubscriptionId)
  }

  # If creating infra, check Dynamic VMs quota and fallback to South India if needed
  if ($CreateInfra) {
    Write-Host "Checking Dynamic VMs quota in location: $Location"
    $quota = Get-DynamicVmQuota -Location $Location
    if ($quota.found) {
      $available = $quota.limit - $quota.usage
      Write-Host "Dynamic VMs in $($Location): limit=$($quota.limit) usage=$($quota.usage) available=$available"
      if ($available -lt 1) {
        if ($Location -ne "southindia") {
          Write-Host "Insufficient Dynamic VMs quota in $Location; switching deployment location to 'southindia'."
          $Location = "southindia"
        } else {
          Write-Host "Insufficient Dynamic VMs quota in $Location (already set to southindia). Proceeding but deployment may fail."
        }
      }
    } else {
      Write-Host "Could not determine Dynamic VMs quota for $Location; proceeding with requested location."
    }
  }

  # Ensure resource group exists (create only if missing; do not attempt to change location if it already exists)
  try {
    $rgJson = & az group show --name $ResourceGroup -o json 2>$null
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrEmpty($rgJson)) {
      ExecCmd "az" @("group","create","--name",$ResourceGroup,"--location",$Location)
    } else {
      $rg = $rgJson | ConvertFrom-Json
      Write-Host "Resource group '$ResourceGroup' already exists in location: $($rg.location)"
    }
  } catch {
    ExecCmd "az" @("group","create","--name",$ResourceGroup,"--location",$Location)
  }

  # Optionally deploy infra (function app, plan, storage, etc.)
  if ($CreateInfra) {
    Write-Host "Deploying infra template: $InfraTemplatePath"
    # Ensure storage account name exists (must be globally unique: 3-24 lowercase alphanumeric)
    if (-not $StorageAccountName -or $StorageAccountName -eq "") {
      function Generate-StorageName($base) {
        $s = ($base -replace '[^a-zA-Z0-9]','').ToLower()
        if ($s.Length -lt 3) { $s = $s + (Get-Random -Minimum 100 -Maximum 999).ToString() }
        if ($s.Length -gt 20) { $s = $s.Substring(0,20) }
        $s = $s + (Get-Random -Minimum 100 -Maximum 999).ToString()
        if ($s.Length -gt 24) { $s = $s.Substring(0,24) }
        return $s
      }
      $StorageAccountName = Generate-StorageName $FunctionAppName
      Write-Host "Generated storage account name: $StorageAccountName"
    }

    # Resolve infra template path (allow relative path from repo root)
    $InfraTemplatePath = Resolve-TemplatePath $InfraTemplatePath
    ExecCmd "az" @("deployment","group","create","--resource-group",$ResourceGroup,"--template-file",$InfraTemplatePath,"--parameters","functionSkuName=Y1","functionSkuTier=Dynamic","functionAppName=$FunctionAppName","storageAccountName=$StorageAccountName","location=$Location")
  }

  $storageContext = Get-StorageAccountContext -ResourceGroup $ResourceGroup -PreferredStorageAccountName $StorageAccountName -FunctionAppName $FunctionAppName -AllowPlaceholder:$DryRun

  # Get Graph auth context (tenant/client/secret) from env, AZURE_CREDENTIALS, or azure-credentials.json
  $graphAuthContext = Get-GraphAuthContext

  # Deploy Logic App ARM template
  Write-Host "Deploying Logic App template: $LogicAppTemplatePath"
  $LogicAppTemplatePath = Resolve-TemplatePath $LogicAppTemplatePath
  $logicAppParametersPath = Join-Path $scriptRoot "logicapp-deploy-parameters.json"
  $logicAppParameters = @{
    '$schema' = "https://schema.management.azure.com/schemas/2015-01-01/deploymentParameters.json#"
    contentVersion = "1.0.0.0"
    parameters = @{
      logicAppName = @{ value = $LogicAppName }
      graph_1_tenant = @{ value = $graphAuthContext.tenantId }
      graph_1_clientid = @{ value = $graphAuthContext.clientId }
      graph_1_secret = @{ value = $graphAuthContext.clientSecret }
      azurequeues_1_Connection_Name = @{ value = "azurequeues_connection" }
      azurequeues_1_Connection_DisplayName = @{ value = "azurequeues_connection" }
      azurequeues_1_storageaccount = @{ value = $storageContext.name }
      azurequeues_1_sharedkey = @{ value = $storageContext.key }
    }
  }
  if (Test-Path $logicAppParametersPath) { Remove-Item $logicAppParametersPath -Force }
  $logicAppParameters | ConvertTo-Json -Depth 10 | Set-Content -Path $logicAppParametersPath -Encoding utf8
  try {
    ExecCmd "az" @("deployment","group","create","--resource-group",$ResourceGroup,"--template-file",$LogicAppTemplatePath,"--parameters","@$logicAppParametersPath")
  } finally {
    if (Test-Path $logicAppParametersPath) { Remove-Item $logicAppParametersPath -Force }
  }

  # Package and deploy Function
  # $scriptRoot already set above
  $functionPath = Join-Path $repoRoot $FunctionFolder
  if (-not (Test-Path $functionPath)) { throw "Function folder not found: $functionPath" }

  Push-Location $functionPath
  if ($DryRun) {
    Write-Host "[DRY-RUN] npm ci (in $functionPath)"
  } else {
    Write-Host "Installing function dependencies..."
    & npm ci
    if ($LASTEXITCODE -ne 0) { throw "npm ci failed" }
  }

  $package = Join-Path $scriptRoot "copy-worker-package.zip"
  if (Test-Path $package) { Remove-Item $package -Force }
  if ($DryRun) {
    Write-Host "[DRY-RUN] Compress-Archive * -> $package"
  } else {
    Write-Host "Creating package: $package"
    $excludeNames = @(
      'artifacts',
      'logs_extracted',
      'obj',
      'copy-worker-deploy.zip',
      'deploy-package.zip',
      'local.settings.json',
      'local.settings.json.sample',
      'tmp_appsettings.json',
      'settings_array.json',
      'keyout.json',
      'listing.txt'
    )
    $packageItems = Get-ChildItem -Force | Where-Object {
      $_.Name -notin $excludeNames -and $_.Extension -ne '.zip'
    }
    Compress-Archive -Path $packageItems.FullName -DestinationPath $package -Force

    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [System.IO.Compression.ZipFile]::OpenRead($package)
    try {
      $entries = $zip.Entries.FullName
      $requiredEntries = @(
        'host.json',
        'package.json',
        'admin_run/function.json',
        'admin_run/index.js',
        'manual_run/function.json',
        'manual_run/index.js',
        'scan/function.json',
        'scan/index.js',
        'probe/function.json',
        'probe/index.js',
        'manual_full_scan.js',
        'oneoff_copy_user.js'
      )
      foreach ($required in $requiredEntries) {
        if ($entries -notcontains $required) {
          throw "Deployment package is missing required entry: $required"
        }
      }
      Write-Host "Package sanity check passed for admin_run, manual_run, scan, and probe."
    } finally {
      $zip.Dispose()
    }
  }
  Pop-Location

  Write-Host "Deploying package to Function App: $FunctionAppName"
  ExecCmd "az" @("functionapp","deployment","source","config-zip","--resource-group",$ResourceGroup,"--name",$FunctionAppName,"--src",$package)

  Write-Host "Deployment complete."
} catch {
  Write-Error "Deployment failed: $_"
  exit 1
}
