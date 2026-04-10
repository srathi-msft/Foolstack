@description('Name of the resource group (used as prefix for resources)')
param appName string

@description('Azure region for deployment')
param location string = resourceGroup().location

@description('Game code players use to join')
@secure()
param gameCode string

@description('Admin code for game control')
@secure()
param adminCode string

var appServicePlanName = '${appName}-plan'
var webAppName = '${appName}-app'

resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: appServicePlanName
  location: location
  kind: 'linux'
  sku: {
    name: 'B1'
    tier: 'Basic'
  }
  properties: {
    reserved: true
  }
}

resource webApp 'Microsoft.Web/sites@2023-12-01' = {
  name: webAppName
  location: location
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|20-lts'
      webSocketsEnabled: true
      alwaysOn: true
      appCommandLine: 'node index.js'
      appSettings: [
        { name: 'GAME_CODE', value: gameCode }
        { name: 'ADMIN_CODE', value: adminCode }
        { name: 'PORT', value: '8080' }
        { name: 'WEBSITE_NODE_DEFAULT_VERSION', value: '~20' }
        { name: 'SCM_DO_BUILD_DURING_DEPLOYMENT', value: 'true' }
      ]
    }
  }
}

output webAppUrl string = 'https://${webApp.properties.defaultHostName}'
output webAppName string = webApp.name
