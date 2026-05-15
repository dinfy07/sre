Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$pod = kubectl -n endterm get pod -l app=payment-service -o jsonpath='{.items[0].metadata.name}'
if (-not $pod) {
  throw "No payment-service pod found."
}

Write-Host "Deleting payment-service pod $pod to prove self-healing..."
kubectl -n endterm delete pod $pod
kubectl -n endterm rollout status deployment/payment-service --timeout=180s
kubectl -n endterm get pods -l app=payment-service

