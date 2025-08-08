#!/bin/bash

# Vevurn Staging Deployment Script
set -e

echo "🚀 Starting staging deployment for Vevurn..."

# Configuration
CLUSTER_NAME="vevurn-staging"
NAMESPACE="vevurn-staging"
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
    
    if ! command -v docker &> /dev/null; then
        print_error "docker is not installed"
        exit 1
    fi
    
    print_status "Prerequisites check passed ✅"
}

# Build and push Docker images for staging
build_and_push_images() {
    print_status "Building and pushing Docker images for staging..."
    
    # Build backend image
    print_status "Building backend image..."
    docker build -t "${DOCKER_REGISTRY}/vevurn-backend:staging-${IMAGE_TAG}" -f backend/Dockerfile .
    docker push "${DOCKER_REGISTRY}/vevurn-backend:staging-${IMAGE_TAG}"
    
    # Build frontend image with staging environment
    print_status "Building frontend image..."
    docker build -t "${DOCKER_REGISTRY}/vevurn-frontend:staging-${IMAGE_TAG}" \
        --build-arg NEXT_PUBLIC_API_URL="${STAGING_API_URL:-https://api-staging.vevurn.com}" \
        -f frontend/Dockerfile .
    docker push "${DOCKER_REGISTRY}/vevurn-frontend:staging-${IMAGE_TAG}"
    
    print_status "Images built and pushed successfully ✅"
}

# Deploy to staging environment
deploy_to_staging() {
    print_status "Deploying to staging environment..."
    
    # Create staging namespace if it doesn't exist
    kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -
    
    # Create staging-specific manifests
    create_staging_manifests
    
    # Apply staging secrets
    kubectl apply -f infrastructure/kubernetes/staging-secrets.yaml -n ${NAMESPACE}
    
    # Apply staging application manifests
    kubectl apply -f infrastructure/kubernetes/staging-application.yaml -n ${NAMESPACE}
    
    print_status "Application deployed to staging ✅"
}

# Create staging-specific Kubernetes manifests
create_staging_manifests() {
    print_status "Creating staging-specific manifests..."
    
    # Copy and modify secrets for staging
    cp infrastructure/kubernetes/secrets.yaml infrastructure/kubernetes/staging-secrets.yaml
    sed -i.bak "s/namespace: vevurn/namespace: ${NAMESPACE}/g" infrastructure/kubernetes/staging-secrets.yaml
    sed -i.bak "s/postgresql:\/\/username:password@postgres-service:5432\/vevurn/postgresql:\/\/username:password@postgres-service:5432\/vevurn_staging/g" infrastructure/kubernetes/staging-secrets.yaml
    
    # Copy and modify application manifests for staging
    cp infrastructure/kubernetes/application.yaml infrastructure/kubernetes/staging-application.yaml
    sed -i.bak "s/namespace: vevurn/namespace: ${NAMESPACE}/g" infrastructure/kubernetes/staging-application.yaml
    sed -i.bak "s/image: vevurn\/backend:latest/image: ${DOCKER_REGISTRY}\/vevurn-backend:staging-${IMAGE_TAG}/g" infrastructure/kubernetes/staging-application.yaml
    sed -i.bak "s/image: vevurn\/frontend:latest/image: ${DOCKER_REGISTRY}\/vevurn-frontend:staging-${IMAGE_TAG}/g" infrastructure/kubernetes/staging-application.yaml
    sed -i.bak "s/replicas: 3/replicas: 2/g" infrastructure/kubernetes/staging-application.yaml
    sed -i.bak "s/vevurn.com/staging.vevurn.com/g" infrastructure/kubernetes/staging-application.yaml
    sed -i.bak "s/api.vevurn.com/api-staging.vevurn.com/g" infrastructure/kubernetes/staging-application.yaml
    
    print_status "Staging manifests created ✅"
}

# Wait for staging deployment to be ready
wait_for_deployment() {
    print_status "Waiting for staging deployments to be ready..."
    
    kubectl rollout status deployment/vevurn-backend -n ${NAMESPACE} --timeout=300s
    kubectl rollout status deployment/vevurn-frontend -n ${NAMESPACE} --timeout=300s
    
    print_status "Staging deployments are ready ✅"
}

# Run staging tests
run_staging_tests() {
    print_status "Running staging tests..."
    
    # Get the LoadBalancer IP or use port-forward for testing
    BACKEND_URL=$(kubectl get service vevurn-backend-service -n ${NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    
    if [ -z "$BACKEND_URL" ]; then
        print_warning "LoadBalancer IP not found, using port-forward for testing"
        kubectl port-forward service/vevurn-backend-service 8081:80 -n ${NAMESPACE} &
        PORT_FORWARD_PID=$!
        sleep 5
        BACKEND_URL="localhost:8081"
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
    
    # Run integration tests against staging
    print_status "Running integration tests..."
    npm run test:integration:staging || {
        print_error "Integration tests failed ❌"
        if [ ! -z "$PORT_FORWARD_PID" ]; then
            kill $PORT_FORWARD_PID
        fi
        exit 1
    }
    
    # Clean up port-forward if used
    if [ ! -z "$PORT_FORWARD_PID" ]; then
        kill $PORT_FORWARD_PID
    fi
    
    print_status "Staging tests completed ✅"
}

# Cleanup staging artifacts
cleanup() {
    print_status "Cleaning up staging artifacts..."
    
    # Remove temporary manifest files
    rm -f infrastructure/kubernetes/staging-*.yaml
    rm -f infrastructure/kubernetes/*.bak
    
    print_status "Cleanup completed ✅"
}

# Send staging deployment notification
send_notification() {
    print_status "Sending staging deployment notification..."
    
    if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🧪 Vevurn staging deployment completed successfully! Version: staging-${IMAGE_TAG}\\nStaging URL: https://staging.vevurn.com\"}" \
            "$SLACK_WEBHOOK_URL"
    fi
    
    print_status "Staging deployment notification sent ✅"
}

# Main deployment function
main() {
    print_status "Starting Vevurn staging deployment..."
    
    check_prerequisites
    build_and_push_images
    deploy_to_staging
    wait_for_deployment
    run_staging_tests
    send_notification
    
    print_status "🎉 Staging deployment completed successfully!"
    print_status "Staging application is now running at: https://staging.vevurn.com"
    print_status "Staging API is available at: https://api-staging.vevurn.com"
}

# Handle script interruption and cleanup
trap 'print_error "Staging deployment interrupted"; cleanup; exit 1' INT TERM
trap 'cleanup' EXIT

# Run main function
main "$@"
