resource "kubernetes_network_policy" "platform_ingress_policy" {
  metadata {
    name      = "platform-ingress-policy"
    namespace = var.namespace
  }

  spec {
    pod_selector {}
    policy_types = ["Ingress"]

    ingress {
      from {
        namespace_selector {
          match_labels = {
            "kubernetes.io/metadata.name" = var.namespace
          }
        }
      }
    }

    ingress {
      from {
        ip_block {
          cidr = "0.0.0.0/0"
        }
      }

      ports {
        protocol = "TCP"
        port     = "80"
      }

      ports {
        protocol = "TCP"
        port     = "443"
      }
    }
  }
}
