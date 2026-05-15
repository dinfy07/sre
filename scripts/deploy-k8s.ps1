Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "Applying Kubernetes manifests recursively..."
kubectl apply -R -f kubernetes

Write-Host "Waiting for application deployments..."
$deployments = @(
  "frontend",
  "api-gateway",
  "auth-service",
  "product-service",
  "order-service",
  "payment-service",
  "notification-service",
  "profile-service",
  "prometheus",
  "grafana"
)

foreach ($deployment in $deployments) {
  kubectl -n endterm rollout status deployment/$deployment --timeout=180s
}

Write-Host "Kubernetes resources:"
kubectl -n endterm get pods,svc,hpa

