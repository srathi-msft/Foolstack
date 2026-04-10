<#
.SYNOPSIS
  Tear down FoolStack Azure resources by deleting the resource group.
.PARAMETER ResourceGroup
  Name of the Azure resource group to delete.
#>
param(
    [Parameter(Mandatory)][string]$ResourceGroup
)

$ErrorActionPreference = "Stop"

Write-Host "=== FoolStack Azure Teardown ===" -ForegroundColor Cyan
Write-Host "Deleting resource group '$ResourceGroup'..."

az group delete --name $ResourceGroup --yes --no-wait

Write-Host "`nResource group '$ResourceGroup' deletion initiated." -ForegroundColor Green
Write-Host "Resources will be fully removed within a few minutes."
Write-Host "No further costs will accrue."
