resource "kubernetes_namespace" "endterm" {
  metadata {
    name = var.namespace
    labels = {
      "app.kubernetes.io/name"       = "endterm-sre-platform"
      "app.kubernetes.io/managed-by" = "terraform"
      environment                    = var.environment
    }
  }
}

module "network" {
  source    = "./modules/network"
  namespace = kubernetes_namespace.endterm.metadata[0].name
}

module "kubernetes" {
  source               = "./modules/kubernetes"
  namespace            = kubernetes_namespace.endterm.metadata[0].name
  order_min_replicas   = var.order_min_replicas
  payment_min_replicas = var.payment_min_replicas
}

module "database" {
  source                 = "./modules/database"
  namespace              = kubernetes_namespace.endterm.metadata[0].name
  postgres_replica_count = var.postgres_replica_count
}

module "monitoring" {
  source    = "./modules/monitoring"
  namespace = kubernetes_namespace.endterm.metadata[0].name
}

