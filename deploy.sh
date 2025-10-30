#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Analytics Service Deployment Script${NC}"
echo -e "${GREEN}========================================${NC}\n"

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo -e "${YELLOW}Checking prerequisites...${NC}"
if ! command_exists kubectl; then
    echo -e "${RED}Error: kubectl is not installed${NC}"
    exit 1
fi

if ! command_exists kind; then
    echo -e "${RED}Error: kind is not installed${NC}"
    exit 1
fi

if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}Error: Kubernetes cluster is not running${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites check passed${NC}\n"

echo -e "${YELLOW}Step 1: Deploying Infrastructure Components...${NC}"
kubectl apply -f k8s/infra/persistent-volume.yml
kubectl apply -f k8s/infra/secrets.yml
kubectl apply -f k8s/infra/network-policies.yml
kubectl apply -f k8s/infra/resource-quotas.yml
kubectl apply -f k8s/infra/pod-disruption-budgets.yml
echo -e "${GREEN}✓ Infrastructure deployed${NC}\n"

echo -e "${YELLOW}Step 2: Deploying Database Layer...${NC}"
kubectl apply -f k8s/databases/configmaps.yml
kubectl apply -f k8s/databases/postgres.yml
kubectl apply -f k8s/databases/mongo.yml
kubectl apply -f k8s/databases/redis.yml
echo -e "${GREEN}✓ Databases deployed${NC}\n"

echo -e "${YELLOW}Waiting for databases to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=postgres --timeout=300s || true
kubectl wait --for=condition=ready pod -l app=mongo --timeout=300s || true
kubectl wait --for=condition=ready pod -l app=redis --timeout=300s || true
echo -e "${GREEN}✓ Databases are ready${NC}\n"

echo -e "${YELLOW}Step 3: Deploying Backup CronJobs...${NC}"
kubectl apply -f k8s/databases/backup-cronjobs.yml
echo -e "${GREEN}✓ Backup jobs deployed${NC}\n"

if [ -f "k8s/databases/service-monitors.yml" ]; then
    echo -e "${YELLOW}Deploying Service Monitors...${NC}"
    kubectl apply -f k8s/databases/service-monitors.yml
    echo -e "${GREEN}✓ Service monitors deployed${NC}\n"
fi

echo -e "${YELLOW}Step 4: Deploying Application Layer...${NC}"
kubectl apply -f k8s/apps/serviceaccount.yml
kubectl apply -f k8s/apps/configmap.yml
kubectl apply -f k8s/apps/secrets.yml
kubectl apply -f k8s/apps/resource-quota.yml
kubectl apply -f k8s/apps/network-policy.yml
kubectl apply -f k8s/apps/deployment.yml
echo -e "${GREEN}✓ Application deployed${NC}\n"

echo -e "${YELLOW}Waiting for application to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=analytics-service --timeout=300s || true
echo -e "${GREEN}✓ Application is ready${NC}\n"

echo -e "${YELLOW}Step 5: Deploying HPA and PDB...${NC}"
kubectl apply -f k8s/apps/pod-disruption-budget.yml
kubectl apply -f k8s/apps/hpa.yml
echo -e "${GREEN}✓ HPA and PDB deployed${NC}\n"

echo -e "${YELLOW}Step 6: Deploying Ingress...${NC}"
kubectl apply -f k8s/apps/ingress.yml
echo -e "${GREEN}✓ Ingress deployed${NC}\n"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Deploying Monitoring Stack${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${YELLOW}Step 7: Creating Monitoring Namespace...${NC}"
kubectl apply -f k8s/monitoring/namespace.yml
echo -e "${GREEN}✓ Monitoring namespace created${NC}\n"

echo -e "${YELLOW}Step 8: Deploying Prometheus...${NC}"
kubectl apply -f k8s/monitoring/prometheus-configmap.yml
kubectl apply -f k8s/monitoring/prometheus.yml
echo -e "${GREEN}✓ Prometheus deployed${NC}\n"

echo -e "${YELLOW}Waiting for Prometheus to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=prometheus -n monitoring --timeout=300s || true
echo -e "${GREEN}✓ Prometheus is ready${NC}\n"

echo -e "${YELLOW}Step 9: Deploying Grafana...${NC}"
kubectl apply -f k8s/monitoring/grafana-configmap.yml
kubectl apply -f k8s/monitoring/grafana.yml
echo -e "${GREEN}✓ Grafana deployed${NC}\n"

echo -e "${YELLOW}Waiting for Grafana to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=grafana -n monitoring --timeout=300s || true
echo -e "${GREEN}✓ Grafana is ready${NC}\n"

echo -e "${YELLOW}Step 10: Deploying Loki...${NC}"
kubectl apply -f k8s/monitoring/loki-configmap.yml
kubectl apply -f k8s/monitoring/loki.yml
echo -e "${GREEN}✓ Loki deployed${NC}\n"

echo -e "${YELLOW}Waiting for Loki to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=loki -n monitoring --timeout=300s || true
echo -e "${GREEN}✓ Loki is ready${NC}\n"

echo -e "${YELLOW}Step 11: Deploying Promtail...${NC}"
kubectl apply -f k8s/monitoring/promtail-configmap.yml
kubectl apply -f k8s/monitoring/promtail.yml
echo -e "${GREEN}✓ Promtail deployed${NC}\n"

echo -e "${YELLOW}Step 12: Deploying Metric Exporters...${NC}"
kubectl apply -f k8s/monitoring/exporters.yml
echo -e "${GREEN}✓ Exporters deployed${NC}\n"

echo -e "${YELLOW}Waiting for exporters to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=postgres-exporter -n monitoring --timeout=180s || true
kubectl wait --for=condition=ready pod -l app=mongodb-exporter -n monitoring --timeout=180s || true
kubectl wait --for=condition=ready pod -l app=redis-exporter -n monitoring --timeout=180s || true
echo -e "${GREEN}✓ Exporters are ready${NC}\n"

echo -e "${YELLOW}Step 13: Deploying Monitoring Ingress...${NC}"
kubectl apply -f k8s/monitoring/ingress.yml
echo -e "${GREEN}✓ Monitoring ingress deployed${NC}\n"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Summary${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "${YELLOW}Application Pods:${NC}"
kubectl get pods -o wide

echo -e "\n${YELLOW}Application Services:${NC}"
kubectl get svc

echo -e "\n${YELLOW}Monitoring Pods:${NC}"
kubectl get pods -n monitoring -o wide

echo -e "\n${YELLOW}Monitoring Services:${NC}"
kubectl get svc -n monitoring

echo -e "\n${YELLOW}Ingress:${NC}"
kubectl get ingress
kubectl get ingress -n monitoring

echo -e "\n${YELLOW}HPA:${NC}"
kubectl get hpa

echo -e "\n${YELLOW}PVC:${NC}"
kubectl get pvc
kubectl get pvc -n monitoring

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "${YELLOW}Access URLs:${NC}"
echo -e "${GREEN}Application:    http://analytics.local/api/v1/health${NC}"
echo -e "${GREEN}Prometheus:     http://prometheus.local${NC}"
echo -e "${GREEN}Grafana:        http://grafana.local${NC}"
echo -e "                ${YELLOW}Username: admin${NC}"
echo -e "                ${YELLOW}Password: admin${NC}\n"

echo -e "${YELLOW}Important: Add these entries to /etc/hosts:${NC}"
echo -e "${BLUE}127.0.0.1 analytics.local${NC}"
echo -e "${BLUE}127.0.0.1 prometheus.local${NC}"
echo -e "${BLUE}127.0.0.1 grafana.local${NC}\n"

echo -e "${YELLOW}Useful commands:${NC}"
echo -e "  ${BLUE}kubectl get pods${NC}                              - View application pods"
echo -e "  ${BLUE}kubectl get pods -n monitoring${NC}                - View monitoring pods"
echo -e "  ${BLUE}kubectl logs -l app=analytics-service -f${NC}      - View application logs"
echo -e "  ${BLUE}kubectl logs -l app=promtail -n monitoring -f${NC} - View Promtail logs"
echo -e "  ${BLUE}kubectl get hpa${NC}                               - View autoscaling"
echo -e "  ${BLUE}kubectl top pods${NC}                              - View resource usage"
echo -e ""