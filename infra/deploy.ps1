<#
.SYNOPSIS
  Deploy FoolStack to Azure App Service via Bicep + zip deployment.
.PARAMETER ResourceGroup
  Name of the Azure resource group to create/use.
.PARAMETER Location
  Azure region (e.g., eastus, westus2).
.PARAMETER GameCode
  Game code players enter to join.
.PARAMETER AdminCode
  Admin code for game control.
.PARAMETER AppName
  Base name for Azure resources (default: foolstack).
#>
param(
    [Parameter(Mandatory)][string]$ResourceGroup,
    [string]$Location = "eastus",
    [string]$GameCode = "foolstack",
    [string]$AdminCode = "admin123",
    [string]$AppName = "foolstack"
)

$ErrorActionPreference = "Stop"

Write-Host "=== FoolStack Azure Deployment ===" -ForegroundColor Cyan

# 1. Create resource group
Write-Host "`n[1/4] Creating resource group '$ResourceGroup' in '$Location'..."
az group create --name $ResourceGroup --location $Location --output none

# 2. Deploy Bicep template
Write-Host "[2/4] Deploying Bicep template..."
$deployOutput = az deployment group create `
    --resource-group $ResourceGroup `
    --template-file "$PSScriptRoot\main.bicep" `
    --parameters appName=$AppName location=$Location gameCode=$GameCode adminCode=$AdminCode `
    --query "properties.outputs" `
    --output json | ConvertFrom-Json

$webAppName = $deployOutput.webAppName.value
$webAppUrl = $deployOutput.webAppUrl.value

Write-Host "  Web App: $webAppName"
Write-Host "  URL: $webAppUrl"

# 3. Package app for zip deployment
Write-Host "[3/4] Packaging application..."
$serverDir = Join-Path $PSScriptRoot ".." "server"
$publicDir = Join-Path $PSScriptRoot ".." "public"
$zipPath = Join-Path $PSScriptRoot "deploy.zip"

# Create a temporary staging directory
$stagingDir = Join-Path $env:TEMP "foolstack-staging-$(Get-Random)"
New-Item -ItemType Directory -Path $stagingDir -Force | Out-Null

# Copy server files (excluding node_modules — Oryx will run npm install)
Get-ChildItem -Path $serverDir | Where-Object { $_.Name -ne 'node_modules' -and $_.Name -ne '.env' } | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination $stagingDir -Recurse -Force
}

# Copy public directory
Copy-Item -Path $publicDir -Destination "$stagingDir\public" -Recurse -Force

# Create zip
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path "$stagingDir\*" -DestinationPath $zipPath -Force

# Cleanup staging
Remove-Item $stagingDir -Recurse -Force

# 4. Deploy zip
Write-Host "[4/4] Deploying application via zip..."
az webapp deployment source config-zip `
    --resource-group $ResourceGroup `
    --name $webAppName `
    --src $zipPath `
    --output none

# Cleanup zip
Remove-Item $zipPath -Force

Write-Host "`n=== Deployment Complete ===" -ForegroundColor Green
Write-Host "Game URL: $webAppUrl" -ForegroundColor Yellow
Write-Host "Game Code: $GameCode"
Write-Host "Admin Code: $AdminCode"
Write-Host "`nTo teardown: .\teardown.ps1 -ResourceGroup '$ResourceGroup'"
