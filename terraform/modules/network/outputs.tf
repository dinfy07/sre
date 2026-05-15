output "network_policy" {
  value = kubernetes_network_policy.platform_ingress_policy.metadata[0].name
}
