resource "kubernetes_limit_range" "platform_defaults" {
  metadata {
    name      = "platform-default-limits"
    namespace = var.namespace
  }

  spec {
    limit {
      type = "Container"

      default = {
        cpu    = "500m"
        memory = "512Mi"
      }

      default_request = {
        cpu    = "100m"
        memory = "128Mi"
      }
    }
  }
}

resource "kubernetes_config_map" "scaling_policy" {
  metadata {
    name      = "scaling-policy"
    namespace = var.namespace
  }

  data = {
    order_min_replicas   = tostring(var.order_min_replicas)
    payment_min_replicas = tostring(var.payment_min_replicas)
    hpa_required         = "true"
    rolling_updates      = "true"
    liveness_probes      = "true"
    readiness_probes     = "true"
  }
}

