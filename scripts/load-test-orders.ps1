
param(
  [string]$BaseUrl = "http://localhost",
  [int]$Requests = 100
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

1..$Requests | ForEach-Object {
  Invoke-WebRequest `
    -UseBasicParsing `
    -Uri "$BaseUrl/api/orders" `
    -Method POST `
    -Body '{"userId":"load-test","items":[{"productId":"sku-platform","quantity":1}]}' `
    -ContentType "application/json" `
    -TimeoutSec 10 | Out-Null
}

Write-Host "Submitted $Requests order requests."