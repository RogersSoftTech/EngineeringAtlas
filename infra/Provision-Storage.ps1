param(
  [string]$ResourceGroup='rg-engineering-atlas',
  [string]$AppName='engineering-atlas',
  [string]$StorageAccount='statlaslearne76c5290',
  [string]$Location='eastus2'
)
$ErrorActionPreference='Stop'
$PSNativeCommandUseErrorActionPreference=$true
$subscription=az account show --query id --output tsv --only-show-errors
az storage account create --name $StorageAccount --resource-group $ResourceGroup --location $Location --sku Standard_LRS --kind StorageV2 --https-only true --min-tls-version TLS1_2 --allow-blob-public-access false --tags application=EngineeringAtlas --only-show-errors --output none
$accessToken=az account get-access-token --resource https://management.azure.com/ --query accessToken --output tsv --only-show-errors
$headers=@{Authorization="Bearer $accessToken"}
$storageUrl="https://management.azure.com/subscriptions/$subscription/resourceGroups/$ResourceGroup/providers/Microsoft.Storage/storageAccounts/$StorageAccount"
$appUrl="https://management.azure.com/subscriptions/$subscription/resourceGroups/$ResourceGroup/providers/Microsoft.Web/staticSites/$AppName"
Invoke-RestMethod -Method Put -Uri "$storageUrl/blobServices/default/containers/learning-data?api-version=2023-05-01" -Headers $headers -ContentType 'application/json' -Body '{"properties":{"publicAccess":"None"}}' | Out-Null
Invoke-RestMethod -Method Put -Uri "$storageUrl/blobServices/default?api-version=2023-05-01" -Headers $headers -ContentType 'application/json' -Body '{"properties":{"deleteRetentionPolicy":{"enabled":true,"days":7}}}' | Out-Null
$connection=az storage account show-connection-string --name $StorageAccount --resource-group $ResourceGroup --query connectionString --output tsv --only-show-errors
$existing=az staticwebapp appsettings list --name $AppName --resource-group $ResourceGroup --output json --only-show-errors | ConvertFrom-Json
$properties=@{}
if($existing.properties){foreach($property in $existing.properties.PSObject.Properties){$properties[$property.Name]=$property.Value}}
$properties['ATLAS_STORAGE_CONNECTION_STRING']=$connection
$properties['ATLAS_STORAGE_CONTAINER']='learning-data'
$body=@{properties=$properties} | ConvertTo-Json -Depth 10 -Compress
Invoke-RestMethod -Method Put -Uri "$appUrl/config/appsettings?api-version=2023-12-01" -Headers $headers -ContentType 'application/json' -Body $body | Out-Null
Remove-Variable connection,accessToken,headers,properties,body,existing
Write-Output "Configured private Azure storage account $StorageAccount and the managed API settings."
