#!/bin/bash

# Vevurn Performance Testing Script
set -e

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

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:8000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
CONCURRENT_USERS="${CONCURRENT_USERS:-10}"
TEST_DURATION="${TEST_DURATION:-30s}"
REPORTS_DIR="./performance-reports"

print_status "🚀 Starting performance tests for Vevurn..."

# Create reports directory
mkdir -p "$REPORTS_DIR"

# Check if required tools are available
check_tools() {
    print_status "Checking required performance testing tools..."
    
    local tools_status=""
    
    if command -v k6 &> /dev/null; then
        tools_status+="✅ k6 (load testing)\n"
        K6_AVAILABLE=true
    else
        tools_status+="❌ k6 (load testing) - Install: https://k6.io/docs/getting-started/installation/\n"
        K6_AVAILABLE=false
    fi
    
    if command -v lighthouse &> /dev/null; then
        tools_status+="✅ Lighthouse (web performance)\n"
        LIGHTHOUSE_AVAILABLE=true
    else
        tools_status+="❌ Lighthouse - Install: npm install -g lighthouse\n"
        LIGHTHOUSE_AVAILABLE=false
    fi
    
    if command -v artillery &> /dev/null; then
        tools_status+="✅ Artillery (alternative load testing)\n"
        ARTILLERY_AVAILABLE=true
    else
        tools_status+="❌ Artillery - Install: npm install -g artillery\n"
        ARTILLERY_AVAILABLE=false
    fi
    
    echo -e "$tools_status"
    
    if [ "$K6_AVAILABLE" = false ] && [ "$ARTILLERY_AVAILABLE" = false ]; then
        print_error "No load testing tools available. Install k6 or Artillery to continue."
        exit 1
    fi
}

# Create k6 test script
create_k6_script() {
    cat > "$REPORTS_DIR/load-test.js" << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export let options = {
  stages: [
    { duration: '10s', target: 5 },  // Ramp-up
    { duration: '30s', target: 10 }, // Stay at 10 users
    { duration: '10s', target: 0 },  // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    errors: ['rate<0.05'],             // Error rate must be below 5%
  },
};

const BASE_URL = __ENV.BACKEND_URL || 'http://localhost:8000';

export default function() {
  // Test health endpoint
  let healthResponse = http.get(`${BASE_URL}/health`);
  check(healthResponse, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 200ms': (r) => r.timings.duration < 200,
  }) || errorRate.add(1);

  // Test API endpoints
  let apiResponse = http.get(`${BASE_URL}/api/v1/products`);
  check(apiResponse, {
    'products API status is 200': (r) => r.status === 200,
    'products API response time < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  // Test authentication endpoint
  let authPayload = JSON.stringify({
    email: 'test@example.com',
    password: 'testpassword123'
  });
  
  let authResponse = http.post(`${BASE_URL}/api/v1/auth/login`, authPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  
  check(authResponse, {
    'auth API response time < 1000ms': (r) => r.timings.duration < 1000,
  }) || errorRate.add(1);

  sleep(1);
}
EOF
}

# Run k6 load tests
run_k6_tests() {
    if [ "$K6_AVAILABLE" = true ]; then
        print_status "Running k6 load tests..."
        
        create_k6_script
        
        # Run the test
        k6 run \
            --env BACKEND_URL="$BACKEND_URL" \
            --out json="$REPORTS_DIR/k6-results.json" \
            "$REPORTS_DIR/load-test.js" | tee "$REPORTS_DIR/k6-output.txt"
        
        print_status "k6 load tests completed ✅"
    else
        print_warning "k6 not available, skipping load tests"
    fi
}

# Run Artillery tests
run_artillery_tests() {
    if [ "$ARTILLERY_AVAILABLE" = true ]; then
        print_status "Running Artillery load tests..."
        
        # Create Artillery test config
        cat > "$REPORTS_DIR/artillery-config.yml" << EOF
config:
  target: '$BACKEND_URL'
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Warm up"
    - duration: 120
      arrivalRate: 10
      name: "Load test"
  defaults:
    headers:
      Content-Type: 'application/json'
scenarios:
  - name: "API Load Test"
    flow:
      - get:
          url: "/health"
      - get:
          url: "/api/v1/products"
      - think: 1
      - post:
          url: "/api/v1/auth/login"
          json:
            email: "test@example.com"
            password: "testpassword123"
EOF
        
        artillery run "$REPORTS_DIR/artillery-config.yml" --output "$REPORTS_DIR/artillery-results.json"
        artillery report "$REPORTS_DIR/artillery-results.json" --output "$REPORTS_DIR/artillery-report.html"
        
        print_status "Artillery load tests completed ✅"
    else
        print_warning "Artillery not available, skipping alternative load tests"
    fi
}

# Run Lighthouse performance tests
run_lighthouse_tests() {
    if [ "$LIGHTHOUSE_AVAILABLE" = true ]; then
        print_status "Running Lighthouse performance tests..."
        
        # Test frontend performance
        lighthouse "$FRONTEND_URL" \
            --output html \
            --output json \
            --output-path "$REPORTS_DIR/lighthouse-frontend" \
            --chrome-flags="--headless --no-sandbox" \
            --quiet
        
        # Extract performance score
        if [ -f "$REPORTS_DIR/lighthouse-frontend.report.json" ]; then
            PERFORMANCE_SCORE=$(cat "$REPORTS_DIR/lighthouse-frontend.report.json" | grep -o '"performance":[^,]*' | grep -o '[0-9.]*')
            print_status "Frontend Performance Score: ${PERFORMANCE_SCORE}/1.0"
        fi
        
        print_status "Lighthouse performance tests completed ✅"
    else
        print_warning "Lighthouse not available, skipping web performance tests"
    fi
}

# Database performance test
test_database_performance() {
    print_status "Testing database performance..."
    
    # Simple database connection test
    if command -v psql &> /dev/null && [ -n "$DATABASE_URL" ]; then
        print_status "Running database connection test..."
        
        # Test connection time
        DB_START_TIME=$(date +%s%3N)
        psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null
        DB_END_TIME=$(date +%s%3N)
        DB_RESPONSE_TIME=$((DB_END_TIME - DB_START_TIME))
        
        print_status "Database connection time: ${DB_RESPONSE_TIME}ms"
        
        if [ "$DB_RESPONSE_TIME" -lt 100 ]; then
            print_status "Database performance: Excellent ✅"
        elif [ "$DB_RESPONSE_TIME" -lt 500 ]; then
            print_status "Database performance: Good ✅"
        else
            print_warning "Database performance: Needs attention ⚠️"
        fi
    else
        print_warning "Cannot test database performance - psql not available or DATABASE_URL not set"
    fi
}

# Check service availability
check_services() {
    print_status "Checking service availability..."
    
    # Check backend
    if curl -f -s "$BACKEND_URL/health" > /dev/null; then
        print_status "Backend service: Available ✅"
    else
        print_error "Backend service: Not available ❌"
        print_error "Make sure the backend is running at $BACKEND_URL"
        exit 1
    fi
    
    # Check frontend
    if curl -f -s "$FRONTEND_URL" > /dev/null; then
        print_status "Frontend service: Available ✅"
    else
        print_warning "Frontend service: Not available at $FRONTEND_URL"
    fi
}

# Generate performance report
generate_report() {
    print_status "Generating performance test report..."
    
    TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
    
    {
        echo "# Vevurn Performance Test Report"
        echo "Generated on: $TIMESTAMP"
        echo ""
        echo "## Test Configuration"
        echo "- Backend URL: $BACKEND_URL"
        echo "- Frontend URL: $FRONTEND_URL"
        echo "- Concurrent Users: $CONCURRENT_USERS"
        echo "- Test Duration: $TEST_DURATION"
        echo ""
        echo "## Test Results"
        echo ""
        
        if [ -f "$REPORTS_DIR/k6-output.txt" ]; then
            echo "### k6 Load Test Results"
            echo "\`\`\`"
            tail -20 "$REPORTS_DIR/k6-output.txt"
            echo "\`\`\`"
            echo ""
        fi
        
        if [ -f "$REPORTS_DIR/lighthouse-frontend.report.json" ] && [ -n "$PERFORMANCE_SCORE" ]; then
            echo "### Lighthouse Performance Score"
            echo "Frontend Performance Score: ${PERFORMANCE_SCORE}/1.0"
            echo ""
        fi
        
        echo "## Recommendations"
        echo "1. Monitor response times regularly"
        echo "2. Optimize database queries if response times are high"
        echo "3. Implement caching strategies for frequently accessed data"
        echo "4. Consider CDN for static assets"
        echo "5. Set up monitoring and alerting for performance metrics"
        echo ""
        echo "## Files Generated"
        echo "- Load test results: \`$REPORTS_DIR/\`"
        if [ "$LIGHTHOUSE_AVAILABLE" = true ]; then
            echo "- Lighthouse report: \`$REPORTS_DIR/lighthouse-frontend.report.html\`"
        fi
        
    } > "$REPORTS_DIR/performance-report-$(date +%Y%m%d-%H%M%S).md"
    
    print_status "Performance report generated in $REPORTS_DIR/ ✅"
}

# Main execution
main() {
    print_status "Configuration:"
    print_status "  Backend URL: $BACKEND_URL"
    print_status "  Frontend URL: $FRONTEND_URL"
    print_status "  Concurrent Users: $CONCURRENT_USERS"
    print_status "  Test Duration: $TEST_DURATION"
    echo ""
    
    check_tools
    check_services
    run_k6_tests
    run_artillery_tests
    run_lighthouse_tests
    test_database_performance
    generate_report
    
    print_status "🎉 Performance testing completed!"
    print_status "Check the reports in: $REPORTS_DIR/"
}

# Run main function
main "$@"
