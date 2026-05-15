variable "environment" {
  description = "Deployment environment name."
  type        = string
  default     = "endterm"
}

variable "namespace" {
  description = "Kubernetes namespace for the platform."
  type        = string
  default     = "endterm"
}

variable "kubeconfig_path" {
  description = "Path to kubeconfig used by the Kubernetes provider."
  type        = string
  default     = "~/.kube/config"
}

variable "order_min_replicas" {
  description = "Minimum order-service replicas."
  type        = number
  default     = 3
}

variable "payment_min_replicas" {
  description = "Minimum payment-service replicas."
  type        = number
  default     = 3
}

variable "postgres_replica_count" {
  description = "Number of PostgreSQL read replicas."
  type        = number
  default     = 2
}

