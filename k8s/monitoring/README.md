# Monitoring Stack Resources

## Overview

This directory contains all Kubernetes manifests for the monitoring and observability stack.

## Components

| Component           | Purpose                      | Image                                 | Version |
| ------------------- | ---------------------------- | ------------------------------------- | ------- |
| Prometheus          | Metrics collection & storage | prom/prometheus                       | v2.54.1 |
| Grafana             | Visualization & dashboards   | grafana/grafana                       | 11.3.1  |
| Loki                | Log aggregation              | grafana/loki                          | 3.2.1   |
| Promtail            | Log shipping (DaemonSet)     | grafana/promtail                      | 3.2.1   |
| PostgreSQL Exporter | Database metrics             | prometheuscommunity/postgres-exporter | v0.15.0 |
| MongoDB Exporter    | Database metrics             | percona/mongodb_exporter              | 0.40.0  |
| Redis Exporter      | Cache metrics                | oliver006/redis_exporter              | v1.62.0 |
| Node Exporter       | Node metrics (DaemonSet)     | prom/node-exporter                    | v1.8.2  |

## Resource Requirements

### Total Cluster Resources

**Minimum:**

- CPU: 6 cores
- Memory: 12 GB RAM
- Storage: 80 GB

**Recommended:**

- CPU: 8+ cores
- Memory: 16 GB RAM
- Storage: 100+ GB

### Per-Component Resources

#### Prometheus

```yaml
requests:
  cpu: 500m
  memory: 1Gi
limits:
  cpu: 2
  memory: 2Gi
storage: 20Gi PVC
```

#### Grafana

```yaml
requests:
  cpu: 200m
  memory: 256Mi
limits:
  cpu: 1
  memory: 1Gi
storage: 10Gi PVC
```

#### Loki

```yaml
requests:
  cpu: 500m
  memory: 1Gi
limits:
  cpu: 2
  memory: 2Gi
storage: 20Gi PVC
```

#### Promtail (per node)

```yaml
requests:
  cpu: 100m
  memory: 128Mi
limits:
  cpu: 500m
  memory: 512Mi
```

#### Exporters (each)

```yaml
requests:
  cpu: 50m
  memory: 64Mi
limits:
  cpu: 200m
  memory: 256Mi
```

## Storage

### Persistent Volume Claims

| PVC            | Size | Purpose                     |
| -------------- | ---- | --------------------------- |
| prometheus-pvc | 20Gi | Prometheus time-series data |
| grafana-pvc    | 10Gi | Grafana dashboards & config |
| loki-pvc       | 20Gi | Loki log storage            |

**Total Storage Required:** 50Gi

### Retention Policies

- **Prometheus**: 30 days (configurable)
- **Loki**: 31 days (744 hours, configurable)
- **Grafana**: Persistent (dashboards and settings)

## Network Requirements

### Ports

| Service             | Port | Protocol | Purpose                |
| ------------------- | ---- | -------- | ---------------------- |
| Prometheus          | 9090 | HTTP     | Web UI & API           |
| Grafana             | 3000 | HTTP     | Web UI                 |
| Loki                | 3100 | HTTP     | Ingestion & Queries    |
| Loki                | 9096 | gRPC     | Internal communication |
| Promtail            | 3101 | HTTP     | Metrics endpoint       |
| PostgreSQL Exporter | 9187 | HTTP     | Metrics endpoint       |
| MongoDB Exporter    | 9216 | HTTP     | Metrics endpoint       |
| Redis Exporter      | 9121 | HTTP     | Metrics endpoint       |
| Node Exporter       | 9100 | HTTP     | Metrics endpoint       |

### Ingress Hostnames

- `prometheus.local` → Prometheus (9090)
- `grafana.local` → Grafana (3000)

Add to `/etc/hosts`:

```
127.0.0.1 prometheus.local
127.0.0.1 grafana.local
```

## Deployment Order

1. **Namespace**

   ```bash
   kubectl apply -f namespace.yml
   ```

2. **Prometheus**

   ```bash
   kubectl apply -f prometheus-configmap.yml
   kubectl apply -f prometheus.yml
   ```

3. **Grafana**

   ```bash
   kubectl apply -f grafana-configmap.yml
   kubectl apply -f grafana.yml
   ```

4. **Loki**

   ```bash
   kubectl apply -f loki-configmap.yml
   kubectl apply -f loki.yml
   ```

5. **Promtail**

   ```bash
   kubectl apply -f promtail-configmap.yml
   kubectl apply -f promtail.yml
   ```

6. **Exporters**

   ```bash
   kubectl apply -f exporters.yml
   ```

7. **Ingress**
   ```bash
   kubectl apply -f ingress.yml
   ```

Or use the automated script from project root:

```bash
./deploy.sh
```

## Configuration Files

### prometheus-configmap.yml

- Scrape configurations for all targets
- Alert rules for critical events
- Service discovery configs

### grafana-configmap.yml

- Datasource configurations (Prometheus, Loki)
- Pre-configured dashboards
- Dashboard provisioning

### loki-configmap.yml

- Storage configuration
- Retention policies
- Query limits

### promtail-configmap.yml

- Log collection rules
- Label extraction
- Pipeline stages for JSON parsing

### exporters.yml

- Database connection configurations
- Exporter deployments
- DaemonSet for node metrics

## Access URLs

After deployment:

- **Application**: http://analytics.local/api/v1/health
- **Prometheus**: http://prometheus.local
- **Grafana**: http://grafana.local
  - Username: `admin`
  - Password: `admin` (change immediately!)
- **Metrics Endpoint**: http://analytics.local/api/v1/metrics

## Verification

```bash
# Check all monitoring pods
kubectl get pods -n monitoring

# Check services
kubectl get svc -n monitoring

# Check PVCs
kubectl get pvc -n monitoring

# Check ingress
kubectl get ingress -n monitoring

# View logs
kubectl logs -n monitoring -l app=prometheus --tail=50
kubectl logs -n monitoring -l app=grafana --tail=50
kubectl logs -n monitoring -l app=loki --tail=50
kubectl logs -n monitoring -l app=promtail --tail=50
```

## Secrets

### Grafana Secrets

```yaml
# In grafana.yml
name: grafana-secrets
data:
  admin-user: YWRtaW4= # admin
  admin-password: YWRtaW4= # admin
```

**⚠️ Change default password in production!**

### Exporter Secrets

#### PostgreSQL Exporter

```yaml
# In exporters.yml
name: postgres-exporter-secret
data:
  DATA_SOURCE_NAME: <base64-encoded-connection-string>
```

Default connection: `postgresql://postgres:postgres@postgres-service.default.svc.cluster.local:5432/analytics_db?sslmode=disable`

#### MongoDB Exporter

```yaml
# In exporters.yml
name: mongodb-exporter-secret
data:
  MONGODB_URI: <base64-encoded-connection-string>
```

Default connection: `mongodb://root:password@mongo-service.default.svc.cluster.local:27017/?authSource=admin`

## RBAC

### Prometheus ServiceAccount

- **ClusterRole**: Read access to nodes, services, endpoints, pods
- **Purpose**: Service discovery and metrics scraping

### Promtail ServiceAccount

- **ClusterRole**: Read access to pods
- **Purpose**: Log collection from all pods

## Troubleshooting

### Common Issues

#### Prometheus Not Scraping Targets

```bash
# Check Prometheus logs
kubectl logs -n monitoring -l app=prometheus --tail=100

# Check targets
kubectl port-forward -n monitoring svc/prometheus 9090:9090
# Visit http://localhost:9090/targets

# Verify RBAC
kubectl get clusterrole prometheus
kubectl get clusterrolebinding prometheus
```

#### Grafana Can't Connect to Datasources

```bash
# Check Grafana logs
kubectl logs -n monitoring -l app=grafana --tail=100

# Test connectivity
kubectl exec -n monitoring -it $(kubectl get pod -n monitoring -l app=grafana -o jsonpath='{.items[0].metadata.name}') -- wget -O- http://prometheus:9090/-/healthy

# Check datasource config
kubectl get configmap -n monitoring grafana-datasources -o yaml
```

#### No Logs in Loki

```bash
# Check Promtail logs
kubectl logs -n monitoring -l app=promtail --tail=100

# Check Loki logs
kubectl logs -n monitoring -l app=loki --tail=100

# Verify log paths
kubectl exec -n monitoring -it $(kubectl get pod -n monitoring -l app=promtail -o jsonpath='{.items[0].metadata.name}') -- ls -la /var/log/pods
```

#### Exporters Not Working

```bash
# Check exporter logs
kubectl logs -n monitoring -l app=postgres-exporter
kubectl logs -n monitoring -l app=mongodb-exporter
kubectl logs -n monitoring -l app=redis-exporter

# Test exporter metrics
kubectl port-forward -n monitoring svc/postgres-exporter 9187:9187
curl http://localhost:9187/metrics
```

## Maintenance

### Regular Tasks

**Daily:**

- Check Prometheus targets: http://prometheus.local/targets
- Review active alerts: http://prometheus.local/alerts
- Monitor storage usage

**Weekly:**

- Review dashboards for anomalies
- Check log collection completeness
- Verify backup retention

**Monthly:**

- Update monitoring stack images
- Review and optimize retention policies
- Backup Grafana dashboards

### Scaling

```bash
# Increase Prometheus retention
kubectl edit deployment -n monitoring prometheus-deployment
# Adjust: --storage.tsdb.retention.time=45d

# Increase Loki retention
kubectl edit configmap -n monitoring loki-config
# Adjust: retention_period: 1080h

# Add more storage
kubectl edit pvc -n monitoring prometheus-pvc
# Adjust: storage: 30Gi
```

### Cleanup

```bash
# Delete monitoring stack
kubectl delete namespace monitoring

# Remove PVCs (data will be lost!)
kubectl delete pvc -n monitoring --all

# Remove ingress entries from /etc/hosts
sudo sed -i '/prometheus.local/d' /etc/hosts
sudo sed -i '/grafana.local/d' /etc/hosts
```

## Security Considerations

### Production Recommendations

1. **Change Default Passwords**
   - Update Grafana admin password
   - Use Kubernetes secrets for sensitive data

2. **Enable Authentication**
   - Add basic auth to Prometheus
   - Configure OAuth for Grafana

3. **Network Policies**
   - Already configured for pod-to-pod communication
   - Review and adjust as needed

4. **TLS/SSL**
   - Enable HTTPS for ingress
   - Use cert-manager for certificate management

5. **RBAC**
   - Already configured with minimal permissions
   - Audit regularly

6. **Secret Management**
   - Consider using Sealed Secrets or Vault
   - Rotate credentials regularly

## Performance Tuning

### Prometheus

```yaml
# Reduce scrape frequency
global:
  scrape_interval: 30s # Default: 15s

# Reduce retention
args:
  - '--storage.tsdb.retention.time=15d' # Default: 30d
  - '--storage.tsdb.retention.size=10GB' # Default: 15GB
```

### Loki

```yaml
# Reduce retention
limits_config:
  retention_period: 360h # Default: 744h (31 days)

# Increase batch size for better performance
# (in Promtail config)
clients:
  - batchwait: 5s # Default: 1s
    batchsize: 2097152 # Default: 1048576
```

### Grafana

- Reduce dashboard auto-refresh rates
- Enable query result caching
- Limit time range in queries

## Support

For issues or questions:

1. Check logs: `kubectl logs -n monitoring <pod-name>`
2. Review documentation in parent directory
3. Check official documentation:
   - [Prometheus](https://prometheus.io/docs/)
   - [Grafana](https://grafana.com/docs/grafana/latest/)
   - [Loki](https://grafana.com/docs/loki/latest/)

---

**Last Updated**: 2025-10-31
**Version**: 1.0.0
