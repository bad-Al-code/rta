# Kubernetes Setup and Deployment Guide

## Complete Step-by-Step Guide for Analytics Service with Monitoring

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [System Requirements](#system-requirements)
3. [Installation Steps](#installation-steps)
4. [Cluster Setup](#cluster-setup)
5. [Ingress Controller Setup](#ingress-controller-setup)
6. [Application Deployment](#application-deployment)
7. [Monitoring Stack Deployment](#monitoring-stack-deployment)
8. [Verification](#verification)
9. [Post-Deployment Tasks](#post-deployment-tasks)
10. [Monitoring and Observability](#monitoring-and-observability)
11. [Troubleshooting](#troubleshooting)
12. [Maintenance](#maintenance)

---

## Prerequisites

### Required Tools

- Docker
- kubectl (Kubernetes CLI)
- Kind (Kubernetes in Docker)
- Git
- Text editor (for configuration files)
- curl (for testing)

### Knowledge Requirements

- Basic Linux command line
- Understanding of Docker containers
- Basic Kubernetes concepts
- YAML syntax familiarity
- Basic understanding of Prometheus and Grafana

---

## System Requirements

### Hardware

- **CPU**: Minimum 6 cores (8+ cores recommended for monitoring stack)
- **RAM**: Minimum 12GB (16GB+ recommended for monitoring stack)
- **Disk**: Minimum 80GB free space (monitoring requires additional storage)
- **Network**: Stable internet connection

### Operating System

- Linux (Ubuntu 20.04+ / Debian 10+ / CentOS 8+)
- macOS 11.0+
- Windows 10/11 with WSL2

---

## Installation Steps

### Step 1-4: Install Docker, kubectl, and Kind

(Follow the same steps as in the original guide - no changes)

---

## Cluster Setup

### Step 5-7: Create and Verify Cluster

(Follow the same steps as in the original guide - no changes)

---

## Ingress Controller Setup

### Step 8-9: Install NGINX Ingress Controller and Configure /etc/hosts

```bash
# Apply NGINX Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

# Wait for NGINX to be ready
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=90s

# Edit hosts file
sudo nano /etc/hosts

# Add these lines:
127.0.0.1 analytics.local
127.0.0.1 prometheus.local
127.0.0.1 grafana.local

# Save and exit
```

---

## Application Deployment

### Step 10-18: Deploy Application

(Follow the same steps as in the original guide, or use the automated deploy.sh script)

---

## Monitoring Stack Deployment

### Overview

The monitoring stack includes:

- **Prometheus**: Metrics collection and storage
- **Grafana**: Visualization and dashboards
- **Loki**: Log aggregation
- **Promtail**: Log shipping agent
- **Exporters**: PostgreSQL, MongoDB, Redis, Node exporters

### Architecture

```
┌─────────────────────────────────────────────────────┐
│                 Monitoring Stack                     │
│                                                      │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐     │
│  │Prometheus│◄───│ Exporters│    │  Grafana │     │
│  └────┬─────┘    └──────────┘    └────┬─────┘     │
│       │                                 │           │
│       │          ┌──────────┐          │           │
│       └──────────►   Loki   ◄──────────┘           │
│                  └────┬─────┘                       │
│                       │                              │
│                  ┌────▼─────┐                       │
│                  │ Promtail │                       │
│                  └──────────┘                       │
└─────────────────────────────────────────────────────┘
```

### Step 19: Create Monitoring Namespace

```bash
# Navigate to project root
cd ~/git/rta

# Create monitoring namespace
kubectl apply -f k8s/monitoring/namespace.yml

# Verify namespace
kubectl get namespace monitoring
```

### Step 20: Deploy Prometheus

```bash
# Deploy Prometheus ConfigMap (includes alerts and scrape configs)
kubectl apply -f k8s/monitoring/prometheus-configmap.yml

# Deploy Prometheus
kubectl apply -f k8s/monitoring/prometheus.yml

# Watch Prometheus pod starting
kubectl get pods -n monitoring -l app=prometheus -w
# Press Ctrl+C when pod is Running

# Wait for Prometheus to be ready
kubectl wait --for=condition=ready pod -l app=prometheus -n monitoring --timeout=300s

# Verify Prometheus service
kubectl get svc -n monitoring prometheus

# Check Prometheus targets (optional)
kubectl port-forward -n monitoring svc/prometheus 9090:9090
# Open http://localhost:9090/targets in browser
# Press Ctrl+C to stop port-forward
```

### Step 21: Deploy Grafana

```bash
# Deploy Grafana ConfigMaps (datasources and dashboards)
kubectl apply -f k8s/monitoring/grafana-configmap.yml

# Deploy Grafana
kubectl apply -f k8s/monitoring/grafana.yml

# Watch Grafana pod starting
kubectl get pods -n monitoring -l app=grafana -w
# Press Ctrl+C when pod is Running

# Wait for Grafana to be ready
kubectl wait --for=condition=ready pod -l app=grafana -n monitoring --timeout=300s

# Verify Grafana service
kubectl get svc -n monitoring grafana
```

**Default Credentials:**

- Username: `admin`
- Password: `admin`

**Important:** Change the password after first login in production!

### Step 22: Deploy Loki

```bash
# Deploy Loki ConfigMap
kubectl apply -f k8s/monitoring/loki-configmap.yml

# Deploy Loki
kubectl apply -f k8s/monitoring/loki.yml

# Watch Loki pod starting
kubectl get pods -n monitoring -l app=loki -w
# Press Ctrl+C when pod is Running

# Wait for Loki to be ready
kubectl wait --for=condition=ready pod -l app=loki -n monitoring --timeout=300s

# Verify Loki service
kubectl get svc -n monitoring loki
```

### Step 23: Deploy Promtail

```bash
# Deploy Promtail ConfigMap
kubectl apply -f k8s/monitoring/promtail-configmap.yml

# Deploy Promtail (DaemonSet)
kubectl apply -f k8s/monitoring/promtail.yml

# Verify Promtail is running on all nodes
kubectl get pods -n monitoring -l app=promtail -o wide

# Check Promtail logs (optional)
kubectl logs -n monitoring -l app=promtail --tail=50
```

### Step 24: Deploy Metric Exporters

```bash
# Deploy all exporters (PostgreSQL, MongoDB, Redis, Node Exporter)
kubectl apply -f k8s/monitoring/exporters.yml

# Wait for exporters to be ready
kubectl wait --for=condition=ready pod -l app=postgres-exporter -n monitoring --timeout=180s
kubectl wait --for=condition=ready pod -l app=mongodb-exporter -n monitoring --timeout=180s
kubectl wait --for=condition=ready pod -l app=redis-exporter -n monitoring --timeout=180s

# Verify all exporters are running
kubectl get pods -n monitoring | grep exporter

# Expected output:
# postgres-exporter-deployment-xxxxx    1/1     Running   0          2m
# mongodb-exporter-deployment-xxxxx     1/1     Running   0          2m
# redis-exporter-deployment-xxxxx       1/1     Running   0          2m
# node-exporter-xxxxx                   1/1     Running   0          2m
```

### Step 25: Deploy Monitoring Ingress

```bash
# Deploy ingress for Prometheus and Grafana
kubectl apply -f k8s/monitoring/ingress.yml

# Verify ingress
kubectl get ingress -n monitoring

# Expected output:
# NAME                 CLASS   HOSTS               ADDRESS     PORTS   AGE
# prometheus-ingress   nginx   prometheus.local    localhost   80      10s
# grafana-ingress      nginx   grafana.local       localhost   80      10s
```

### Step 26: Automated Deployment (Alternative)

Instead of steps 19-25, you can use the automated script:

```bash
# Navigate to project root
cd ~/git/rta

# Run the deployment script
./deploy.sh

# The script will deploy everything including monitoring
# Wait for completion (takes 10-15 minutes)
```

---

## Verification

### Step 27: Verify Complete Deployment

```bash
# Check all application pods
kubectl get pods -o wide

# Check monitoring pods
kubectl get pods -n monitoring -o wide

# All pods should be in Running status

# Check all services
kubectl get svc
kubectl get svc -n monitoring

# Check ingress
kubectl get ingress
kubectl get ingress -n monitoring

# Check PVCs
kubectl get pvc
kubectl get pvc -n monitoring
```

### Step 28: Test Application and Monitoring Access

```bash
# Test application health
curl http://analytics.local/api/v1/health

# Test Prometheus
curl http://prometheus.local

# Test Grafana
curl http://grafana.local

# Or open in browser:
# http://analytics.local/api/v1/health
# http://prometheus.local
# http://grafana.local
```

### Step 29: Verify Prometheus Targets

```bash
# Port forward to Prometheus
kubectl port-forward -n monitoring svc/prometheus 9090:9090

# Open browser to http://localhost:9090/targets

# You should see targets:
# - prometheus (self)
# - kubernetes-apiservers
# - kubernetes-nodes
# - kubernetes-pods
# - analytics-service
# - postgres
# - mongodb
# - redis
# - node-exporter

# All should be in "UP" state

# Press Ctrl+C to stop port-forward
```

### Step 30: Verify Grafana Dashboards

```bash
# Access Grafana at http://grafana.local
# Login with admin/admin
# Navigate to Dashboards

# You should see:
# - Analytics Service Dashboard
# - Kubernetes Cluster Overview
# - Database Metrics Dashboard

# Verify datasources:
# Settings > Data Sources
# Should see Prometheus and Loki configured
```

---

## Post-Deployment Tasks

### Step 31: Configure Grafana

```bash
# Access Grafana
# URL: http://grafana.local
# Username: admin
# Password: admin

# IMPORTANT: Change default password!
# 1. Click on profile icon (bottom left)
# 2. Select "Profile"
# 3. Click "Change Password"
# 4. Set a strong password
```

### Step 32: Verify Log Collection

```bash
# Access Grafana > Explore
# Select Loki as datasource
# Run query: {namespace="default"}

# You should see logs from:
# - analytics-service pods
# - postgres pods
# - mongo pods
# - redis pods

# Run query: {app="analytics-service"}
# Should see application logs with correlation IDs
```

### Step 33: Test Alerting (Optional)

```bash
# Generate some errors to test alerts
# (This will trigger HighErrorRate alert)

for i in {1..100}; do
  curl -X GET http://analytics.local/api/v1/nonexistent &
done

# Wait 5-10 minutes
# Check Prometheus Alerts: http://prometheus.local/alerts

# You should see HighErrorRate alert firing
```

### Step 34: Configure Alert Notifications (Optional)

To receive alert notifications, you need to set up Alertmanager:

```bash
# Create alertmanager-config.yml in k8s/monitoring/
# (Configuration example in troubleshooting section)

kubectl apply -f k8s/monitoring/alertmanager-config.yml
kubectl apply -f k8s/monitoring/alertmanager.yml

# Configure notification channels (Slack, Email, PagerDuty, etc.)
```

---

## Monitoring and Observability

### Understanding the Monitoring Stack

#### Prometheus

**Purpose:** Metrics collection, storage, and alerting

**Key Metrics Collected:**

- HTTP request rate and duration
- Error rates
- CPU and memory usage
- Database connections
- Cache hit/miss rates
- Kubernetes metrics

**Accessing Prometheus:**

```bash
# Via Ingress
http://prometheus.local

# Via Port Forward
kubectl port-forward -n monitoring svc/prometheus 9090:9090
# Access: http://localhost:9090
```

**Useful Queries:**

```promql
# Request rate
rate(http_requests_total{app="analytics-service"}[5m])

# 95th percentile response time
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Error rate
rate(http_requests_total{status_code=~"5.."}[5m])

# Memory usage
container_memory_usage_bytes{pod=~"analytics-service.*"}

# CPU usage
rate(container_cpu_usage_seconds_total{pod=~"analytics-service.*"}[5m])
```

#### Grafana

**Purpose:** Visualization and dashboarding

**Pre-configured Dashboards:**

1. **Analytics Service Dashboard**
   - Request rate over time
   - Response time (95th percentile)
   - Error rate
   - CPU usage by pod
   - Memory usage by pod

2. **Kubernetes Cluster Overview**
   - Cluster CPU usage
   - Cluster memory usage
   - Pod status counts
   - Node status

3. **Database Metrics Dashboard**
   - PostgreSQL connections
   - PostgreSQL query duration
   - MongoDB operations rate
   - Redis commands/sec
   - Redis memory usage

**Accessing Grafana:**

```bash
# Via Ingress
http://grafana.local

# Default credentials:
# Username: admin
# Password: admin
```

**Creating Custom Dashboards:**

1. Click "+" icon > Dashboard
2. Add Panel
3. Select Prometheus or Loki datasource
4. Write PromQL or LogQL query
5. Configure visualization
6. Save dashboard

#### Loki

**Purpose:** Log aggregation and querying

**What Logs are Collected:**

- Application logs (JSON formatted with Winston)
- Database logs (PostgreSQL, MongoDB, Redis)
- Kubernetes system logs
- Ingress controller logs

**Accessing Loki:**

```bash
# Via Grafana Explore
# Select Loki datasource
# Write LogQL queries
```

**Useful LogQL Queries:**

```logql
# All analytics service logs
{app="analytics-service"}

# Errors only
{app="analytics-service"} |= "error"

# By correlation ID
{app="analytics-service"} | json | correlationId="xxx-yyy-zzz"

# Database logs
{app="postgres"}

# Filter by log level
{app="analytics-service"} | json | level="error"

# Rate of errors
rate({app="analytics-service"} |= "error" [5m])
```

#### Promtail

**Purpose:** Log shipping agent (runs as DaemonSet)

**What it Does:**

- Reads logs from all pods on each node
- Parses JSON logs from Winston
- Adds Kubernetes labels
- Ships logs to Loki

**Verifying Promtail:**

```bash
# Check Promtail pods
kubectl get pods -n monitoring -l app=promtail

# View Promtail logs
kubectl logs -n monitoring -l app=promtail --tail=100

# Check Promtail targets
# In Loki, run: {job="kubernetes-pods"}
```

#### Metric Exporters

**PostgreSQL Exporter:**

- Database connections
- Query performance
- Table sizes
- Transaction rates

**MongoDB Exporter:**

- Operation counts
- Connection pool
- Replica set status
- Collection stats

**Redis Exporter:**

- Memory usage
- Commands/sec
- Hit/miss ratios
- Connected clients

**Node Exporter:**

- CPU metrics
- Memory metrics
- Disk I/O
- Network stats

### Monitoring Best Practices

1. **Set Up Alerts**
   - Configure alerting rules in Prometheus
   - Set up Alertmanager for notifications
   - Define severity levels (critical, warning, info)

2. **Create Dashboards**
   - One dashboard per service
   - Include golden signals (latency, traffic, errors, saturation)
   - Use consistent time ranges

3. **Log Correlation**
   - Use correlation IDs in logs
   - Link traces to logs
   - Include context in error logs

4. **Retention Policies**
   - Prometheus: 30 days (configurable)
   - Loki: 31 days (configurable)
   - Adjust based on storage capacity

5. **Resource Monitoring**
   - Monitor monitoring stack itself
   - Set up alerts for Prometheus/Loki storage
   - Track exporter health

---

## Troubleshooting

### Monitoring Stack Issues

#### Issue 1: Prometheus Not Scraping Targets

```bash
# Check Prometheus logs
kubectl logs -n monitoring -l app=prometheus --tail=100

# Check Prometheus config
kubectl get configmap -n monitoring prometheus-config -o yaml

# Verify service discovery
kubectl port-forward -n monitoring svc/prometheus 9090:9090
# Visit http://localhost:9090/service-discovery

# Common causes:
# - Network policies blocking traffic
# - Incorrect service labels
# - RBAC permissions missing
# - Pod annotations missing
```

#### Issue 2: Grafana Can't Connect to Datasources

```bash
# Check Grafana logs
kubectl logs -n monitoring -l app=grafana --tail=100

# Verify datasource configuration
kubectl get configmap -n monitoring grafana-datasources -o yaml

# Test connectivity from Grafana pod
kubectl exec -n monitoring -it $(kubectl get pod -n monitoring -l app=grafana -o jsonpath='{.items[0].metadata.name}') -- wget -O- http://prometheus:9090/-/healthy

kubectl exec -n monitoring -it $(kubectl get pod -n monitoring -l app=grafana -o jsonpath='{.items[0].metadata.name}') -- wget -O- http://loki:3100/ready

# Common causes:
# - Service names incorrect
# - Network policies blocking traffic
# - Datasource configuration errors
```

#### Issue 3: No Logs in Loki

```bash
# Check Promtail logs
kubectl logs -n monitoring -l app=promtail --tail=100

# Verify Promtail is running on all nodes
kubectl get pods -n monitoring -l app=promtail -o wide

# Check Loki logs
kubectl logs -n monitoring -l app=loki --tail=100

# Test Loki health
kubectl exec -n monitoring -it $(kubectl get pod -n monitoring -l app=loki -o jsonpath='{.items[0].metadata.name}') -- wget -O- http://localhost:3100/ready

# Verify log paths
kubectl exec -n monitoring -it $(kubectl get pod -n monitoring -l app=promtail -o jsonpath='{.items[0].metadata.name}') -- ls -la /var/log/pods

# Common causes:
# - Promtail can't access log paths
# - Loki storage full
# - Network issues between Promtail and Loki
# - Log parsing errors
```

#### Issue 4: Exporters Not Working

```bash
# Check exporter pods
kubectl get pods -n monitoring | grep exporter

# Check PostgreSQL exporter
kubectl logs -n monitoring -l app=postgres-exporter --tail=50

# Common error: connection refused
# Fix: Verify database service name and credentials

kubectl get secret -n monitoring postgres-exporter-secret -o yaml
# Verify DATA_SOURCE_NAME is correct

# Check MongoDB exporter
kubectl logs -n monitoring -l app=mongodb-exporter --tail=50

# Check Redis exporter
kubectl logs -n monitoring -l app=redis-exporter --tail=50

# Test exporter metrics
kubectl port-forward -n monitoring svc/postgres-exporter 9187:9187
curl http://localhost:9187/metrics

# Common causes:
# - Database credentials incorrect
# - Database service unreachable
# - Exporter version incompatible
```

#### Issue 5: High Memory Usage in Monitoring

```bash
# Check resource usage
kubectl top pods -n monitoring

# If Prometheus using too much memory:
# 1. Reduce retention time
# 2. Reduce scrape frequency
# 3. Limit number of time series

# Edit Prometheus deployment
kubectl edit deployment -n monitoring prometheus-deployment

# Adjust args:
# --storage.tsdb.retention.time=15d  # Reduce from 30d
# --storage.tsdb.retention.size=10GB  # Reduce from 15GB

# If Loki using too much memory:
# Edit Loki config
kubectl edit configmap -n monitoring loki-config

# Adjust limits_config:
# retention_period: 360h  # Reduce from 744h
```

### Debug Commands for Monitoring

```bash
# Check all monitoring pods
kubectl get pods -n monitoring -o wide

# Check all monitoring services
kubectl get svc -n monitoring

# Check monitoring PVCs
kubectl get pvc -n monitoring

# View events in monitoring namespace
kubectl get events -n monitoring --sort-by='.lastTimestamp'

# Check Prometheus config
kubectl get configmap -n monitoring prometheus-config -o yaml

# Test Prometheus query
kubectl port-forward -n monitoring svc/prometheus 9090:9090
curl 'http://localhost:9090/api/v1/query?query=up'

# Check Loki logs
kubectl logs -n monitoring -l app=loki -f

# Check Grafana datasources
kubectl exec -n monitoring -it $(kubectl get pod -n monitoring -l app=grafana -o jsonpath='{.items[0].metadata.name}') -- grafana-cli admin data-sources list

# Restart monitoring components
kubectl rollout restart deployment -n monitoring prometheus-deployment
kubectl rollout restart deployment -n monitoring grafana-deployment
kubectl rollout restart deployment -n monitoring loki-deployment
kubectl rollout restart daemonset -n monitoring promtail-daemonset
```

### Setting Up Alertmanager (Optional)

Create `k8s/monitoring/alertmanager.yml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: alertmanager-config
  namespace: monitoring
data:
  alertmanager.yml: |
    global:
      resolve_timeout: 5m
      
    route:
      group_by: ['alertname', 'cluster', 'service']
      group_wait: 10s
      group_interval: 10s
      repeat_interval: 12h
      receiver: 'default'
      
    receivers:
      - name: 'default'
        # Add your notification channels here
        # Examples:
        # slack_configs:
        #   - api_url: 'YOUR_SLACK_WEBHOOK'
        #     channel: '#alerts'
        # email_configs:
        #   - to: 'team@example.com'
        #     from: 'alertmanager@example.com'
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: alertmanager
  namespace: monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: alertmanager
  template:
    metadata:
      labels:
        app: alertmanager
    spec:
      containers:
        - name: alertmanager
          image: prom/alertmanager:v0.27.0
          args:
            - '--config.file=/etc/alertmanager/alertmanager.yml'
            - '--storage.path=/alertmanager'
          ports:
            - containerPort: 9093
          volumeMounts:
            - name: config
              mountPath: /etc/alertmanager
      volumes:
        - name: config
          configMap:
            name: alertmanager-config
---
apiVersion: v1
kind: Service
metadata:
  name: alertmanager
  namespace: monitoring
spec:
  selector:
    app: alertmanager
  ports:
    - port: 9093
      targetPort: 9093
```

---

## Maintenance

### Regular Maintenance Tasks

#### Daily Tasks

```bash
# Check monitoring stack health
kubectl get pods -n monitoring

# Check Prometheus targets
kubectl port-forward -n monitoring svc/prometheus 9090:9090
# Visit http://localhost:9090/targets

# Review active alerts
# Visit http://prometheus.local/alerts

# Check log collection
# Grafana > Explore > Loki > {namespace="default"}
```

#### Weekly Tasks

```bash
# Review Grafana dashboards
# Check for anomalies in metrics

# Review alert history
# Grafana > Alerting > Alert Rules

# Check storage usage
kubectl get pvc -n monitoring
kubectl exec -n monitoring $(kubectl get pod -n monitoring -l app=prometheus -o jsonpath='{.items[0].metadata.name}') -- df -h /prometheus

# Clean up old logs if needed
kubectl exec -n monitoring $(kubectl get pod -n monitoring -l app=loki -o jsonpath='{.items[0].metadata.name}') -- du -sh /loki/*

# Review resource usage
kubectl top pods -n monitoring
```

#### Monthly Tasks

```bash
# Review and update alert rules
kubectl edit configmap -n monitoring prometheus-config

# Update monitoring stack versions
kubectl set image deployment/prometheus-deployment prometheus=prom/prometheus:v2.xx.x -n monitoring
kubectl set image deployment/grafana-deployment grafana=grafana/grafana:x.x.x -n monitoring
kubectl set image deployment/loki-deployment loki=grafana/loki:x.x.x -n monitoring

# Backup Grafana dashboards
kubectl exec -n monitoring $(kubectl get pod -n monitoring -l app=grafana -o jsonpath='{.items[0].metadata.name}') -- tar -czf /tmp/grafana-backup.tar.gz /var/lib/grafana
kubectl cp monitoring/$(kubectl get pod -n monitoring -l app=grafana -o jsonpath='{.items[0].metadata.name}'):/tmp/grafana-backup.tar.gz ./grafana-backup-$(date +%Y%m%d).tar.gz

# Review and optimize retention policies
# Edit Prometheus and Loki configs if needed
```

### Scaling Monitoring

```bash
# Scale Prometheus (if needed for HA)
kubectl scale deployment prometheus-deployment -n monitoring --replicas=2

# Note: For true HA Prometheus, use Thanos or Cortex

# Loki scaling
# For production, consider Loki in microservices mode
# https://grafana.com/docs/loki/latest/operations/deployment-modes/
```

### Backup and Restore

#### Backup Prometheus Data

```bash
# Create snapshot
kubectl exec -n monitoring $(kubectl get pod -n monitoring -l app=prometheus -o jsonpath='{.items[0].metadata.name}') -- curl -X POST http://localhost:9090/api/v1/admin/tsdb/snapshot

# Copy snapshot
kubectl cp monitoring/$(kubectl get pod -n monitoring -l app=prometheus -o jsonpath='{.items[0].metadata.name}'):/prometheus/snapshots ./prometheus-backup-$(date +%Y%m%d)
```

#### Backup Grafana

```bash
# Backup dashboards and datasources
kubectl exec -n monitoring $(kubectl get pod -n monitoring -l app=grafana -o jsonpath='{.items[0].metadata.name}') -- tar -czf /tmp/grafana-backup.tar.gz /var/lib/grafana

kubectl cp monitoring/$(kubectl get pod -n monitoring -l app=grafana -o jsonpath='{.items[0].metadata.name}'):/tmp/grafana-backup.tar.gz ./grafana-backup-$(date +%Y%m%d).tar.gz
```

#### Backup Loki

```bash
# Backup Loki configuration and data
kubectl exec -n monitoring $(kubectl get pod -n monitoring -l app=loki -o jsonpath='{.items[0].metadata.name}') -- tar -czf /tmp/loki-backup.tar.gz /loki

kubectl cp monitoring/$(kubectl get pod -n monitoring -l app=loki -o jsonpath='{.items[0].metadata.name}'):/tmp/loki-backup.tar.gz ./loki-backup-$(date +%Y%m%d).tar.gz
```

### Complete Cleanup

```bash
# Delete monitoring stack
kubectl delete namespace monitoring

# Delete monitoring ingress
kubectl delete ingress -n monitoring --all

# Delete monitoring PVCs (data will be lost!)
kubectl delete pvc -n monitoring --all

# Remove from /etc/hosts
sudo sed -i '/prometheus.local/d' /etc/hosts
sudo sed -i '/grafana.local/d' /etc/hosts
```

---

## Quick Reference

### Essential Commands

#### Application Commands

```bash
# Cluster info
kubectl cluster-info
kubectl get nodes

# View application resources
kubectl get all
kubectl get pods -o wide
kubectl get svc
kubectl get ingress

# Logs
kubectl logs <pod-name>
kubectl logs -l app=analytics-service -f
```

#### Monitoring Commands

```bash
# View monitoring resources
kubectl get all -n monitoring
kubectl get pods -n monitoring -o wide
kubectl get svc -n monitoring

# Check monitoring logs
kubectl logs -n monitoring -l app=prometheus --tail=50
kubectl logs -n monitoring -l app=grafana --tail=50
kubectl logs -n monitoring -l app=loki --tail=50
kubectl logs -n monitoring -l app=promtail --tail=50

# Port forward to monitoring services
kubectl port-forward -n monitoring svc/prometheus 9090:9090
kubectl port-forward -n monitoring svc/grafana 3000:3000
kubectl port-forward -n monitoring svc/loki 3100:3100
```

### Access URLs

- **Application**: http://analytics.local/api/v1/health
- **Prometheus**: http://prometheus.local
- **Grafana**: http://grafana.local (admin/admin)
- **Metrics Endpoint**: http://analytics.local/api/v1/metrics

### Important File Locations

```
Project Structure:
~/git/rta/
├── k8s/
│   ├── apps/              # Application manifests
│   ├── databases/         # Database manifests
│   ├── infra/             # Infrastructure manifests
│   └── monitoring/        # Monitoring stack manifests (NEW)
│       ├── namespace.yml
│       ├── prometheus-configmap.yml
│       ├── prometheus.yml
│       ├── grafana-configmap.yml
│       ├── grafana.yml
│       ├── loki-configmap.yml
│       ├── loki.yml
│       ├── promtail-configmap.yml
│       ├── promtail.yml
│       ├── exporters.yml
│       └── ingress.yml
├── kind-cluster-config.yml
├── deploy.sh (UPDATED)
└── KUBERNETES_SETUP_GUIDE.md (THIS FILE)
```

---

## Additional Resources

### Documentation Links

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/grafana/latest/)
- [Loki Documentation](https://grafana.com/docs/loki/latest/)
- [PromQL Basics](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [LogQL Documentation](https://grafana.com/docs/loki/latest/query/)
- [Kubernetes Official Docs](https://kubernetes.io/docs/)
- [Kind Documentation](https://kind.sigs.k8s.io/)

### Useful Tools

- **k9s**: Terminal UI for Kubernetes
- **kubectx/kubens**: Switch contexts and namespaces
- **stern**: Multi-pod log tailing
- **helm**: Package manager for Kubernetes
- **promtool**: Prometheus tool for config validation

### Next Steps

- [x] Set up monitoring (Prometheus/Grafana) ✓
- [x] Configure logging (Loki/Promtail) ✓
- [ ] Implement CI/CD pipeline with GitHub Actions
- [ ] Set up SSL/TLS certificates with cert-manager
- [ ] Configure external secret management (Sealed Secrets/Vault)
- [ ] Implement GitOps (ArgoCD/Flux)
- [ ] Create disaster recovery plan
- [ ] Set up distributed tracing (Jaeger/Tempo)

---

## Monitoring Dashboards Guide

### Pre-configured Dashboards

The monitoring stack comes with three pre-configured Grafana dashboards:

#### 1. Analytics Service Dashboard

**Panels:**

- Request Rate: Shows requests per second by method and route
- Response Time (95th percentile): Tracks latency trends
- Error Rate: Monitors 5xx errors
- CPU Usage: Per-pod CPU consumption
- Memory Usage: Per-pod memory consumption

**How to Use:**

1. Open Grafana: http://grafana.local
2. Navigate to Dashboards > Analytics Service Dashboard
3. Adjust time range (top right)
4. Use variables to filter by pod, route, or method

**Key Metrics to Watch:**

- Response time > 3 seconds: Investigate slow queries or external dependencies
- Error rate > 5%: Check application logs for error patterns
- Memory usage > 80%: Consider increasing resource limits or investigating memory leaks
- CPU usage > 70%: Check for expensive operations or consider horizontal scaling

#### 2. Kubernetes Cluster Overview

**Panels:**

- Cluster CPU Usage: Total cluster CPU consumption
- Cluster Memory Usage: Total cluster memory consumption
- Pod Status: Count of running, pending, failed pods
- Node Status: Health of cluster nodes

**How to Use:**

1. Monitor overall cluster health
2. Identify resource bottlenecks
3. Plan capacity upgrades

**Key Metrics to Watch:**

- CPU/Memory > 80%: Cluster capacity issues
- Pods in CrashLoopBackOff: Application or configuration issues
- Nodes NotReady: Infrastructure problems

#### 3. Database Metrics Dashboard

**Panels:**

- PostgreSQL Connections: Active database connections
- PostgreSQL Query Duration: Average query execution time
- MongoDB Operations: Operations per second by type
- Redis Commands/sec: Redis throughput
- Redis Memory Usage: Cache memory consumption

**How to Use:**

1. Monitor database performance
2. Identify slow queries
3. Track cache efficiency

**Key Metrics to Watch:**

- PostgreSQL connections > 80: Connection pool exhaustion
- Query duration increasing: Query optimization needed
- Redis memory > 90%: Adjust eviction policy or increase memory
- Low Redis hit rate: Review caching strategy

---

## Alert Rules Reference

### Application Alerts

#### HighErrorRate

- **Condition**: Error rate > 5% for 5 minutes
- **Severity**: Critical
- **Action**:
  1. Check application logs: `{app="analytics-service"} |= "error"`
  2. Review recent deployments
  3. Check external dependencies (databases, APIs)
  4. Rollback if necessary

#### HighResponseTime

- **Condition**: 95th percentile > 3 seconds for 5 minutes
- **Severity**: Warning
- **Action**:
  1. Check database query performance
  2. Review slow requests in logs
  3. Check resource constraints (CPU/Memory)
  4. Consider scaling up

#### ServiceDown

- **Condition**: Service unreachable for 2 minutes
- **Severity**: Critical
- **Action**:
  1. Check pod status: `kubectl get pods -l app=analytics-service`
  2. View pod events: `kubectl describe pod <pod-name>`
  3. Check logs: `kubectl logs <pod-name> --previous`
  4. Verify ingress and services
  5. Check health endpoint: `curl http://analytics.local/api/v1/health`

#### HighMemoryUsage

- **Condition**: Memory > 85% of limit for 5 minutes
- **Severity**: Warning
- **Action**:
  1. Check for memory leaks in application
  2. Review memory-intensive operations
  3. Consider increasing memory limits
  4. Investigate with heap dumps if needed

#### HighCPUUsage

- **Condition**: CPU > 80% for 5 minutes
- **Severity**: Warning
- **Action**:
  1. Check for CPU-intensive operations
  2. Review request patterns
  3. Consider horizontal scaling (HPA will auto-scale)
  4. Optimize hot code paths

### Database Alerts

#### PostgreSQLDown

- **Condition**: PostgreSQL unreachable for 1 minute
- **Severity**: Critical
- **Action**:
  1. Check pod status: `kubectl get pods -l app=postgres`
  2. View logs: `kubectl logs -l app=postgres --tail=100`
  3. Test connection: `kubectl exec -it <postgres-pod> -- psql -U postgres -c "SELECT 1"`
  4. Check PVC status: `kubectl get pvc postgres-pvc`

#### MongoDBDown

- **Condition**: MongoDB unreachable for 1 minute
- **Severity**: Critical
- **Action**:
  1. Check pod status: `kubectl get pods -l app=mongo`
  2. View logs: `kubectl logs -l app=mongo --tail=100`
  3. Test connection: `kubectl exec -it <mongo-pod> -- mongosh --eval "db.adminCommand('ping')"`

#### RedisDown

- **Condition**: Redis unreachable for 1 minute
- **Severity**: Critical
- **Action**:
  1. Check pod status: `kubectl get pods -l app=redis`
  2. View logs: `kubectl logs -l app=redis --tail=100`
  3. Test connection: `kubectl exec -it <redis-pod> -- redis-cli ping`

#### HighDatabaseConnections

- **Condition**: Connections > 80 for 5 minutes
- **Severity**: Warning
- **Action**:
  1. Check application connection pooling
  2. Look for connection leaks
  3. Consider increasing max_connections
  4. Review long-running queries

### Kubernetes Alerts

#### PodRestartingTooOften

- **Condition**: Pod restart rate > 0.05/min for 5 minutes
- **Severity**: Warning
- **Action**:
  1. Check pod logs: `kubectl logs <pod-name> --previous`
  2. View pod events: `kubectl describe pod <pod-name>`
  3. Check resource constraints
  4. Review liveness/readiness probes

#### NodeNotReady

- **Condition**: Node not ready for 5 minutes
- **Severity**: Critical
- **Action**:
  1. Check node status: `kubectl get nodes`
  2. Describe node: `kubectl describe node <node-name>`
  3. Check node logs in Kind: `docker logs <node-container>`
  4. Restart node if needed

#### PersistentVolumeFillingUp

- **Condition**: PVC > 85% full for 5 minutes
- **Severity**: Warning
- **Action**:
  1. Check PVC usage: `kubectl get pvc`
  2. Check what's consuming space
  3. Clean up old data if possible
  4. Increase PVC size if needed

---

## Log Queries Reference

### Common LogQL Queries

#### View All Application Logs

```logql
{app="analytics-service"}
```

#### Filter by Log Level

```logql
{app="analytics-service"} | json | level="error"
{app="analytics-service"} | json | level="warn"
{app="analytics-service"} | json | level="info"
```

#### Search by Correlation ID

```logql
{app="analytics-service"} | json | correlationId="abc-123-def-456"
```

#### Find Errors in Last Hour

```logql
{app="analytics-service"} | json | level="error" | line_format "{{.timestamp}} {{.message}}"
```

#### Count Errors Over Time

```logql
sum(count_over_time({app="analytics-service"} |= "error" [5m])) by (pod)
```

#### Search in Error Messages

```logql
{app="analytics-service"} |= "database connection"
{app="analytics-service"} |~ "(?i)timeout|error|fail"
```

#### Database Logs

```logql
# PostgreSQL logs
{app="postgres"} |~ "ERROR|FATAL"

# MongoDB logs
{app="mongo"} | json | severity="E"

# Redis logs
{app="redis"} |~ "warning|error"
```

#### Filter by Namespace

```logql
{namespace="default"}
{namespace="monitoring"}
{namespace=~"default|monitoring"}
```

#### Rate of Log Lines

```logql
rate({app="analytics-service"}[5m])
```

#### Logs from Specific Pod

```logql
{pod="analytics-service-deployment-abc123-xyz"}
```

#### Combined Filters

```logql
{app="analytics-service", namespace="default"}
  | json
  | level="error"
  | line_format "{{.correlationId}} - {{.message}}"
```

---

## Performance Optimization

### Optimizing Prometheus

#### Reduce Scrape Frequency

```yaml
# In prometheus-configmap.yml
global:
  scrape_interval: 30s # Increase from 15s
  scrape_timeout: 15s # Increase from 10s
```

#### Reduce Retention

```yaml
# In prometheus.yml deployment args
- '--storage.tsdb.retention.time=15d' # Reduce from 30d
- '--storage.tsdb.retention.size=10GB' # Reduce from 15GB
```

#### Limit Time Series

```yaml
# In prometheus-configmap.yml limits
limits_config:
  max_time_series: 1000000
```

### Optimizing Loki

#### Adjust Retention

```yaml
# In loki-configmap.yml
limits_config:
  retention_period: 360h # 15 days instead of 31
```

#### Increase Batch Size

```yaml
# In promtail-configmap.yml
clients:
  - url: http://loki:3100/loki/api/v1/push
    batchwait: 5s # Increase from 1s
    batchsize: 2097152 # Increase from 1048576
```

#### Enable Compression

```yaml
# In loki-configmap.yml
frontend:
  compress_responses: true
```

### Optimizing Grafana

#### Limit Query Range

In Grafana dashboard settings:

- Set max data points
- Enable query result caching
- Set reasonable time ranges

#### Reduce Refresh Rate

- Change auto-refresh from 5s to 30s or 1m
- Only enable on dashboards actively monitored

---

## Security Best Practices

### Change Default Passwords

```bash
# Grafana
# 1. Login to Grafana: http://grafana.local
# 2. Click profile icon > Profile
# 3. Change password

# Update secret
kubectl create secret generic grafana-secrets \
  --from-literal=admin-user=admin \
  --from-literal=admin-password=<new-strong-password> \
  -n monitoring \
  --dry-run=client -o yaml | kubectl apply -f -

# Restart Grafana
kubectl rollout restart deployment grafana-deployment -n monitoring
```

### Secure Metric Endpoints

Add authentication to Prometheus:

```yaml
# In prometheus.yml deployment
- name: prometheus
  args:
    - '--web.config.file=/etc/prometheus/web-config.yml'
  volumeMounts:
    - name: web-config
      mountPath: /etc/prometheus/web-config.yml
      subPath: web-config.yml
```

```yaml
# Create web-config.yml
basic_auth_users:
  admin: $2y$10$... # bcrypt hash of password
```

### Network Policies

Already configured in `k8s/infra/network-policies.yml`:

- Allows monitoring namespace to scrape metrics
- Restricts unauthorized access

### RBAC

Already configured:

- Prometheus ServiceAccount with ClusterRole
- Promtail ServiceAccount with ClusterRole
- Limited permissions (read-only for most resources)

---

## Troubleshooting Workflows

### Application is Slow

**Diagnosis Steps:**

1. **Check Prometheus Metrics**

```bash
# Open Prometheus: http://prometheus.local
# Run query:
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

2. **Check Grafana Dashboard**

- Open Analytics Service Dashboard
- Look at Response Time panel
- Identify which routes are slow

3. **Check Application Logs**

```bash
# In Grafana Explore
{app="analytics-service"} | json | line_format "{{.timestamp}} {{.message}}"
```

4. **Check Database Performance**

```bash
# PostgreSQL slow queries
{app="postgres"} |~ "duration:.*(ms|s)"

# Check connections
kubectl exec -it $(kubectl get pod -l app=postgres -o jsonpath='{.items[0].metadata.name}') -- psql -U postgres -d analytics_db -c "SELECT count(*) FROM pg_stat_activity;"
```

5. **Check Resource Usage**

```bash
kubectl top pods
kubectl top pods -l app=analytics-service
```

**Resolution:**

- Optimize slow database queries
- Increase resource limits if CPU/Memory constrained
- Scale horizontally (HPA will auto-scale)
- Add database indexes
- Implement caching

---

### High Error Rate

**Diagnosis Steps:**

1. **Check Alert in Prometheus**

```bash
# http://prometheus.local/alerts
# Find HighErrorRate alert
```

2. **View Error Logs**

```bash
# In Grafana Loki
{app="analytics-service"} | json | level="error"
```

3. **Count Errors by Type**

```bash
sum by (message) (count_over_time({app="analytics-service"} | json | level="error" [1h]))
```

4. **Check Recent Deployments**

```bash
kubectl rollout history deployment analytics-service-deployment
```

5. **Check External Dependencies**

```bash
# Database health
curl http://analytics.local/api/v1/health | jq '.dependencies'

# Check database pods
kubectl get pods -l 'tier in (database,cache)'
```

**Resolution:**

- Fix application bug
- Rollback deployment if caused by recent change
- Check database connectivity
- Verify environment configuration
- Check rate limiting

---

### Pod Keeps Restarting

**Diagnosis Steps:**

1. **Check Pod Status**

```bash
kubectl get pods -l app=analytics-service
kubectl describe pod <pod-name>
```

2. **Check Previous Logs**

```bash
kubectl logs <pod-name> --previous
```

3. **Check Liveness/Readiness Probes**

```bash
kubectl get deployment analytics-service-deployment -o yaml | grep -A 10 "livenessProbe\|readinessProbe"
```

4. **Check Resource Limits**

```bash
kubectl describe pod <pod-name> | grep -A 5 "Limits"
```

5. **Check Events**

```bash
kubectl get events --sort-by='.lastTimestamp' | grep <pod-name>
```

**Resolution:**

- If OOMKilled: Increase memory limits
- If failing health checks: Fix health endpoint or adjust probe timing
- If CrashLoopBackOff: Fix application startup error
- Check environment variables and secrets

---

### Monitoring Stack Issues

**Scenario: Can't Access Grafana**

```bash
# 1. Check pod status
kubectl get pods -n monitoring -l app=grafana

# 2. Check logs
kubectl logs -n monitoring -l app=grafana --tail=50

# 3. Check service
kubectl get svc -n monitoring grafana

# 4. Check ingress
kubectl get ingress -n monitoring grafana-ingress

# 5. Test direct access
kubectl port-forward -n monitoring svc/grafana 3000:3000
# Try http://localhost:3000

# 6. Check /etc/hosts
cat /etc/hosts | grep grafana.local
```

**Scenario: No Metrics in Prometheus**

```bash
# 1. Check Prometheus targets
kubectl port-forward -n monitoring svc/prometheus 9090:9090
# Visit http://localhost:9090/targets

# 2. Check specific target
# If analytics-service is down:
kubectl get pods -l app=analytics-service

# Check metrics endpoint
kubectl port-forward svc/analytics-service 4000:80
curl http://localhost:4000/api/v1/metrics

# 3. Check Prometheus logs
kubectl logs -n monitoring -l app=prometheus --tail=100

# 4. Verify service discovery
kubectl get pods -l app=analytics-service --show-labels
# Ensure prometheus.io/scrape=true annotation exists
```

**Scenario: No Logs in Loki**

```bash
# 1. Check Promtail pods
kubectl get pods -n monitoring -l app=promtail

# 2. Check Promtail logs
kubectl logs -n monitoring -l app=promtail --tail=100

# 3. Check Loki
kubectl logs -n monitoring -l app=loki --tail=100

# 4. Test Loki API
kubectl port-forward -n monitoring svc/loki 3100:3100
curl http://localhost:3100/ready

# 5. Check if logs exist
curl -G -s "http://localhost:3100/loki/api/v1/query" \
  --data-urlencode 'query={namespace="default"}' | jq

# 6. Verify log paths
kubectl exec -n monitoring -it $(kubectl get pod -n monitoring -l app=promtail -o jsonpath='{.items[0].metadata.name}') -- ls -la /var/log/pods/default_analytics-service*/
```

---

## Advanced Topics

### Custom Metrics in Application

Your application already exposes metrics at `/api/v1/metrics`. To add custom metrics:

```typescript
// In src/services/metrics.service.ts

import { Counter, Histogram, Gauge } from 'prom-client';

// Add custom counter
public readonly customOperationCounter: Counter<string>;

constructor() {
  // ... existing code ...

  this.customOperationCounter = new Counter({
    name: 'custom_operation_total',
    help: 'Total number of custom operations',
    labelNames: ['operation_type', 'status'],
  });

  this.register.registerMetric(this.customOperationCounter);
}

// Use in your code
metricsService.customOperationCounter.inc({
  operation_type: 'user_creation',
  status: 'success'
});
```

### Structured Logging Best Practices

Your Winston logger already outputs JSON. Best practices:

```typescript
// Always include correlation ID
logger.info('User created', {
  userId: user.id,
  email: user.email,
  correlationId: req.correlationId,
});

// Include context for errors
logger.error('Database connection failed', {
  error: err.message,
  stack: err.stack,
  database: 'postgres',
  operation: 'connect',
  correlationId: req.correlationId,
});

// Log performance metrics
logger.info('Query executed', {
  query: 'getUserById',
  duration: endTime - startTime,
  userId: id,
  correlationId: req.correlationId,
});
```

### Distributed Tracing (Future Enhancement)

To add distributed tracing with Jaeger:

```bash
# Deploy Jaeger
kubectl apply -f k8s/monitoring/jaeger.yml

# Install OpenTelemetry in application
pnpm add @opentelemetry/sdk-node @opentelemetry/api

# Configure in application
# Add tracing middleware
# Export traces to Jaeger
```

---

## Production Checklist

Before going to production, ensure:

### Security

- [ ] Changed all default passwords
- [ ] Enabled TLS/SSL for ingress
- [ ] Configured authentication for Prometheus
- [ ] Set up proper RBAC
- [ ] Secured database credentials
- [ ] Enabled network policies
- [ ] Reviewed security contexts

### Monitoring

- [ ] All targets showing "UP" in Prometheus
- [ ] Grafana dashboards loading data
- [ ] Logs flowing to Loki
- [ ] Alerts configured and tested
- [ ] Notification channels set up (Slack/Email)
- [ ] On-call rotation defined

### Reliability

- [ ] HPA configured and tested
- [ ] PodDisruptionBudgets in place
- [ ] Resource limits set appropriately
- [ ] Backup jobs scheduled and tested
- [ ] Disaster recovery plan documented
- [ ] Health checks properly configured

### Performance

- [ ] Load testing completed
- [ ] Resource usage optimized
- [ ] Database indexes added
- [ ] Caching strategy implemented
- [ ] Rate limiting configured

### Documentation

- [ ] Architecture documented
- [ ] Runbooks created for common issues
- [ ] On-call procedures documented
- [ ] Deployment process documented
- [ ] Rollback procedure tested

---

## Support and Resources

### Getting Help

1. **Check Documentation**
   - This guide
   - Official Kubernetes docs
   - Prometheus documentation
   - Grafana documentation

2. **Review Logs**
   - Application logs in Loki
   - System logs in Kubernetes
   - Monitoring stack logs

3. **Community Resources**
   - Kubernetes Slack
   - Prometheus mailing list
   - Grafana community forums

### Useful Links

- [Prometheus Best Practices](https://prometheus.io/docs/practices/)
- [Grafana Best Practices](https://grafana.com/docs/grafana/latest/best-practices/)
- [LogQL Tutorial](https://grafana.com/docs/loki/latest/logql/)
- [PromQL Cheat Sheet](https://promlabs.com/promql-cheat-sheet/)
- [Kubernetes Production Best Practices](https://learnk8s.io/production-best-practices)

---

## Conclusion

You now have a production-ready monitoring and logging stack running alongside your analytics service in Kubernetes. This stack provides:

- [x] **Metrics Collection**: Prometheus scraping application and infrastructure metrics
- [x] **Visualization**: Grafana dashboards for real-time monitoring
- [x] **Log Aggregation**: Loki collecting and indexing all logs
- [x] **Alerting**: Prometheus alert rules for proactive monitoring
- [x] **Database Monitoring**: Dedicated exporters for PostgreSQL, MongoDB, Redis
- [x] **Node Monitoring**: Node Exporter for infrastructure metrics
- [x] **Correlation**: Logs, metrics, and traces in one place

### What's Next?

1. Customize dashboards for your specific use cases
2. Fine-tune alert thresholds based on your SLOs
3. Set up notification channels (Slack, PagerDuty, etc.)
4. Implement distributed tracing for detailed request flows
5. Add business metrics tracking
6. Create custom Grafana panels for business KPIs
7. Set up long-term metric storage (Thanos/Cortex)

---

**Document Version**: 2.0
**Last Updated**: 2025-10-31
**Maintained By**: badal

**Changelog:**

- v2.0: Added complete monitoring stack (Prometheus, Grafana, Loki, Promtail)
- v1.0: Initial application deployment guide
