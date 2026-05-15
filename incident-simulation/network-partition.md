# Network Partition Concept

Simulate by blocking service traffic with temporary firewall or NetworkPolicy rules in a test cluster.

Expected result:

- Readiness probes remove unreachable pods from routing.
- Prometheus blackbox probes show failed health endpoints.
- Runbooks guide rollback of the blocking rule.

