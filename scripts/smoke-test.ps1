Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

param(
  [string]$BaseUrl = "http://localhost:3000"
)

$targets = @(
  "$BaseUrl/health",
  "$BaseUrl/api/auth/health",
  "$BaseUrl/api/products/health",
  "$BaseUrl/api/orders/health",
  "$BaseUrl/api/payments/health",
  "$BaseUrl/api/notifications/health",
  "$BaseUrl/api/profile/health"
)

foreach ($target in $targets) {
  Write-Host "GET $target"
  $response = Invoke-WebRequest -UseBasicParsing -Uri $target -TimeoutSec 10
  if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 300) {
    throw "Unexpected status code $($response.StatusCode) for $target"
  }
}

Write-Host "Creating demo order through frontend -> gateway -> order-service..."
$orderResponse = Invoke-WebRequest `
  -UseBasicParsing `
  -Uri "$BaseUrl/api/orders" `
  -Method POST `
  -Body '{"userId":"smoke-test","items":[{"productId":"sku-platform","quantity":1}]}' `
  -ContentType "application/json" `
  -TimeoutSec 10

Write-Host $orderResponse.Content
Write-Host "Smoke test passed."

