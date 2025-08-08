#!/bin/bash

# Vevurn Production Deployment Script
set -e

echo "🚀 Starting production deployment for Vevurn..."

# Configuration
CLUSTER_NAME="vevurn-prod"
NAMESPACE="vevurn"
DOCKER_REGISTRY="${DOCKER_REGISTRY:-your-registry.com}"
IMAGE_TAG="${GITHUB_SHA:-latest}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed"
        exit 1
    fi
    
    if ! command -v helm &> /dev/null; then
        print_error "helm is not installed"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        print_error "docker is not installed"
        exit 1
    fi
    
    print_status "Prerequisites check passed ✅"
}

# Build and push Docker images
build_and_push_images() {
    print_status "Building and pushing Docker images..."
    
    # Build backend image
    print_status "Building backend image..."
    docker build -t "${DOCKER_REGISTRY}/vevurn-backend:${IMAGE_TAG}" -f backend/Dockerfile .
    docker push "${DOCKER_REGISTRY}/vevurn-backend:${IMAGE_TAG}"
    
    # Build frontend image
    print_status "Building frontend image..."
    docker build -t "${DOCKER_REGISTRY}/vevurn-frontend:${IMAGE_TAG}" -f frontend/Dockerfile .
    docker push "${DOCKER_REGISTRY}/vevurn-frontend:${IMAGE_TAG}"
    
    print_status "Images built and pushed successfully ✅"
}

# Update Kubernetes manifests
update_k8s_manifests() {
    print_status "Updating Kubernetes manifests..."
    
    # Update image tags in deployment manifests
    sed -i.bak "s|image: vevurn/backend:.*|image: ${DOCKER_REGISTRY}/vevurn-backend:${IMAGE_TAG}|g" infrastructure/kubernetes/application.yaml
    sed -i.bak "s|image: vevurn/frontend:.*|image: ${DOCKER_REGISTRY}/vevurn-frontend:${IMAGE_TAG}|g" infrastructure/kubernetes/application.yaml
    
    print_status "Kubernetes manifests updated ✅"
}

# Apply Kubernetes manifests
deploy_to_k8s() {
    print_status "Deploying to Kubernetes..."
    
    # Create namespace if it doesn't exist
    kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -
    
    # Apply secrets (only if they don't exist)
    kubectl apply -f infrastructure/kubernetes/secrets.yaml -n ${NAMESPACE}
    
    # Apply application manifests
    kubectl apply -f infrastructure/kubernetes/application.yaml -n ${NAMESPACE}
    
    print_status "Application deployed to Kubernetes ✅"
}

# Wait for deployment to be ready
wait_for_deployment() {
    print_status "Waiting for deployments to be ready..."
    
    kubectl rollout status deployment/vevurn-backend -n ${NAMESPACE} --timeout=300s
    kubectl rollout status deployment/vevurn-frontend -n ${NAMESPACE} --timeout=300s
    
    print_status "Deployments are ready ✅"
}

# Run smoke tests
run_smoke_tests() {
    print_status "Running smoke tests..."
    
    # Get the LoadBalancer IP or use port-forward for testing
    BACKEND_URL=$(kubectl get service vevurn-backend-service -n ${NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    
    if [ -z "$BACKEND_URL" ]; then
        print_warning "LoadBalancer IP not found, using port-forward for testing"
        kubectl port-forward service/vevurn-backend-service 8080:80 -n ${NAMESPACE} &
        PORT_FORWARD_PID=$!
        sleep 5
        BACKEND_URL="localhost:8080"
    fi
    
    # Test backend health endpoint
    if curl -f "http://${BACKEND_URL}/health" > /dev/null 2>&1; then
        print_status "Backend health check passed ✅"
    else
        print_error "Backend health check failed ❌"
        if [ ! -z "$PORT_FORWARD_PID" ]; then
            kill $PORT_FORWARD_PID
        fi
        exit 1
    fi
    
    # Clean up port-forward if used
    if [ ! -z "$PORT_FORWARD_PID" ]; then
        kill $PORT_FORWARD_PID
    fi
    
    print_status "Smoke tests completed ✅"
}

# Cleanup old resources
cleanup_old_resources() {
    print_status "Cleaning up old resources..."
    
    # Remove old ReplicaSets
    kubectl delete replicaset -l app=vevurn-backend -n ${NAMESPACE} --field-selector status.replicas=0
    kubectl delete replicaset -l app=vevurn-frontend -n ${NAMESPACE} --field-selector status.replicas=0
    
    print_status "Cleanup completed ✅"
}

# Send deployment notification
send_notification() {
    print_status "Sending deployment notification..."
    
    if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚀 Vevurn production deployment completed successfully! Version: ${IMAGE_TAG}\"}" \
            "$SLACK_WEBHOOK_URL"
    fi
    
    print_status "Deployment notification sent ✅"
}

# Main deployment function
main() {
    print_status "Starting Vevurn production deployment..."
    
    check_prerequisites
    build_and_push_images
    update_k8s_manifests
    deploy_to_k8s
    wait_for_deployment
    run_smoke_tests
    cleanup_old_resources
    send_notification
    
    print_status "🎉 Production deployment completed successfully!"
    print_status "Application is now running at: https://vevurn.com"
    print_status "API is available at: https://api.vevurn.com"
}

# Handle script interruption
trap 'print_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"
