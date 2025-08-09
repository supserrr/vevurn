#!/bin/bash

# Vevurn Health Check Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_header() {
    echo -e "${BLUE}[HEALTH CHECK]${NC} $1"
}

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:8000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
DATABASE_URL="${DATABASE_URL}"
REDIS_URL="${REDIS_URL:-redis://localhost:6379}"

# Health check results
OVERALL_HEALTH=true
HEALTH_ISSUES=()

print_header "🏥 Starting comprehensive health check for Vevurn..."

# Function to add health issue
add_health_issue() {
    OVERALL_HEALTH=false
    HEALTH_ISSUES+=("$1")
}

# Check backend service health
check_backend_health() {
    print_status "Checking backend service health..."
    
    # Check if backend is responding
    if curl -f -s --max-time 10 "$BACKEND_URL/health" > /dev/null; then
        print_status "✅ Backend service is responding"
        
        # Get detailed health info if available
        HEALTH_INFO=$(curl -s --max-time 5 "$BACKEND_URL/health" 2>/dev/null || echo "{}")
        echo "   Health details: $HEALTH_INFO"
        
        # Check response time
        RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' --max-time 10 "$BACKEND_URL/health")
        RESPONSE_MS=$(echo "$RESPONSE_TIME * 1000" | bc -l 2>/dev/null || echo "N/A")
        
        if [ "$RESPONSE_MS" != "N/A" ]; then
            echo "   Response time: ${RESPONSE_MS%.*}ms"
            
            # Check if response time is acceptable
            if (( $(echo "$RESPONSE_TIME > 2.0" | bc -l) )); then
                print_warning "   Slow response time detected"
                add_health_issue "Backend response time is slow (${RESPONSE_MS%.*}ms)"
            fi
        fi
        
    else
        print_error "❌ Backend service is not responding"
        add_health_issue "Backend service is not responding at $BACKEND_URL"
    fi
}

# Check frontend service health
check_frontend_health() {
    print_status "Checking frontend service health..."
    
    if curl -f -s --max-time 10 "$FRONTEND_URL" > /dev/null; then
        print_status "✅ Frontend service is responding"
        
        # Check response time
        RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' --max-time 10 "$FRONTEND_URL")
        RESPONSE_MS=$(echo "$RESPONSE_TIME * 1000" | bc -l 2>/dev/null || echo "N/A")
        
        if [ "$RESPONSE_MS" != "N/A" ]; then
            echo "   Response time: ${RESPONSE_MS%.*}ms"
        fi
        
    else
        print_warning "⚠️  Frontend service is not responding"
        add_health_issue "Frontend service is not responding at $FRONTEND_URL"
    fi
}

# Check database connectivity
check_database_health() {
    print_status "Checking database connectivity..."
    
    if [ -z "$DATABASE_URL" ]; then
        print_warning "⚠️  DATABASE_URL not configured"
        add_health_issue "DATABASE_URL environment variable is not set"
        return
    fi
    
    if command -v psql &> /dev/null; then
        if psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
            print_status "✅ Database connection successful"
            
            # Get database info
            DB_INFO=$(psql "$DATABASE_URL" -t -c "SELECT version();" 2>/dev/null | head -1 | xargs)
            echo "   Database: $DB_INFO"
            
            # Check connection count
            CONN_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null | xargs)
            echo "   Active connections: $CONN_COUNT"
            
            # Check database size
            DB_SIZE=$(psql "$DATABASE_URL" -t -c "SELECT pg_size_pretty(pg_database_size(current_database()));" 2>/dev/null | xargs)
            echo "   Database size: $DB_SIZE"
            
        else
            print_error "❌ Database connection failed"
            add_health_issue "Cannot connect to database"
        fi
    else
        print_warning "⚠️  psql not available, cannot check database"
    fi
}

# Check Redis connectivity
check_redis_health() {
    print_status "Checking Redis connectivity..."
    
    if command -v redis-cli &> /dev/null; then
        # Extract Redis connection details
        REDIS_HOST=$(echo "$REDIS_URL" | sed 's/redis:\/\/\([^:]*\).*/\1/')
        REDIS_PORT=$(echo "$REDIS_URL" | sed 's/.*:\([0-9]*\).*/\1/')
        
        if [ "$REDIS_HOST" = "$REDIS_URL" ]; then
            REDIS_HOST="localhost"
            REDIS_PORT="6379"
        fi
        
        if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping &> /dev/null; then
            print_status "✅ Redis connection successful"
            
            # Get Redis info
            REDIS_VERSION=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" INFO server | grep redis_version | cut -d: -f2 | tr -d '\r\n')
            echo "   Redis version: $REDIS_VERSION"
            
            # Get memory usage
            REDIS_MEMORY=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" INFO memory | grep used_memory_human | cut -d: -f2 | tr -d '\r\n')
            echo "   Memory usage: $REDIS_MEMORY"
            
        else
            print_error "❌ Redis connection failed"
            add_health_issue "Cannot connect to Redis at $REDIS_HOST:$REDIS_PORT"
        fi
    else
        print_warning "⚠️  redis-cli not available, cannot check Redis"
    fi
}

# Check disk space
check_disk_space() {
    print_status "Checking disk space..."
    
    # Get disk usage for current directory
    DISK_USAGE=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')
    AVAILABLE_SPACE=$(df -h . | awk 'NR==2 {print $4}')
    
    echo "   Disk usage: ${DISK_USAGE}%"
    echo "   Available space: $AVAILABLE_SPACE"
    
    if [ "$DISK_USAGE" -gt 90 ]; then
        print_error "❌ Disk space critically low"
        add_health_issue "Disk space usage is at ${DISK_USAGE}%"
    elif [ "$DISK_USAGE" -gt 80 ]; then
        print_warning "⚠️  Disk space running low"
        add_health_issue "Disk space usage is at ${DISK_USAGE}%"
    else
        print_status "✅ Disk space is adequate"
    fi
}

# Check memory usage
check_memory_usage() {
    print_status "Checking memory usage..."
    
    if command -v free &> /dev/null; then
        MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
        AVAILABLE_MEMORY=$(free -h | awk 'NR==2{print $7}')
        
        echo "   Memory usage: ${MEMORY_USAGE}%"
        echo "   Available memory: $AVAILABLE_MEMORY"
        
        if [ "$MEMORY_USAGE" -gt 90 ]; then
            print_error "❌ Memory usage critically high"
            add_health_issue "Memory usage is at ${MEMORY_USAGE}%"
        elif [ "$MEMORY_USAGE" -gt 80 ]; then
            print_warning "⚠️  Memory usage is high"
        else
            print_status "✅ Memory usage is normal"
        fi
    else
        print_warning "⚠️  Cannot check memory usage on this system"
    fi
}

# Check process status
check_processes() {
    print_status "Checking Node.js processes..."
    
    NODE_PROCESSES=$(pgrep -f node | wc -l)
    echo "   Active Node.js processes: $NODE_PROCESSES"
    
    # List Node.js processes with memory usage
    if [ "$NODE_PROCESSES" -gt 0 ]; then
        echo "   Process details:"
        ps aux | grep "[n]ode" | awk '{printf "   PID: %-8s Memory: %-8s CPU: %-6s Command: %s\n", $2, $6"KB", $3"%", substr($0, index($0,$11))}'
    fi
}

# Check log files for errors
check_logs() {
    print_status "Checking recent log files for errors..."
    
    LOG_DIRS=("./logs" "./backend/logs" "./frontend/logs")
    ERROR_COUNT=0
    
    for log_dir in "${LOG_DIRS[@]}"; do
        if [ -d "$log_dir" ]; then
            # Look for error logs in the last 24 hours
            RECENT_ERRORS=$(find "$log_dir" -name "*.log" -mtime -1 -exec grep -i "error\|exception\|fatal" {} + 2>/dev/null | wc -l)
            ERROR_COUNT=$((ERROR_COUNT + RECENT_ERRORS))
        fi
    done
    
    if [ "$ERROR_COUNT" -gt 0 ]; then
        print_warning "⚠️  Found $ERROR_COUNT recent error entries in logs"
        add_health_issue "$ERROR_COUNT recent errors found in log files"
    else
        print_status "✅ No recent errors found in logs"
    fi
}

# Check environment configuration
check_environment() {
    print_status "Checking environment configuration..."
    
    REQUIRED_ENV_VARS=("NODE_ENV")
    MISSING_ENV_VARS=()
    
    for env_var in "${REQUIRED_ENV_VARS[@]}"; do
        if [ -z "${!env_var}" ]; then
            MISSING_ENV_VARS+=("$env_var")
        fi
    done
    
    if [ ${#MISSING_ENV_VARS[@]} -gt 0 ]; then
        print_warning "⚠️  Missing environment variables: ${MISSING_ENV_VARS[*]}"
        add_health_issue "Missing environment variables: ${MISSING_ENV_VARS[*]}"
    else
        print_status "✅ Required environment variables are set"
    fi
    
    echo "   NODE_ENV: ${NODE_ENV:-'not set'}"
    echo "   Environment: $([ "$NODE_ENV" = "production" ] && echo "Production 🚀" || echo "Development 🛠️")"
}

# Generate health report
generate_health_report() {
    print_header "📋 Health Check Summary"
    
    if [ "$OVERALL_HEALTH" = true ]; then
        print_status "🎉 Overall system health: GOOD ✅"
    else
        print_error "⚠️  Overall system health: NEEDS ATTENTION ❌"
        echo ""
        print_error "Issues found:"
        for issue in "${HEALTH_ISSUES[@]}"; do
            echo "   • $issue"
        done
    fi
    
    echo ""
    print_status "Health check completed at $(date)"
    
    # Write report to file
    mkdir -p ./health-reports
    REPORT_FILE="./health-reports/health-check-$(date +%Y%m%d-%H%M%S).json"
    
    {
        echo "{"
        echo "  \"timestamp\": \"$(date -Iseconds)\","
        echo "  \"overall_health\": $([[ $OVERALL_HEALTH = true ]] && echo "true" || echo "false"),"
        echo "  \"backend_url\": \"$BACKEND_URL\","
        echo "  \"frontend_url\": \"$FRONTEND_URL\","
        echo "  \"issues\": ["
        for i in "${!HEALTH_ISSUES[@]}"; do
            echo -n "    \"${HEALTH_ISSUES[i]}\""
            [[ $((i+1)) -lt ${#HEALTH_ISSUES[@]} ]] && echo "," || echo ""
        done
        echo "  ]"
        echo "}"
    } > "$REPORT_FILE"
    
    print_status "Detailed report saved to: $REPORT_FILE"
}

# Main execution
main() {
    check_backend_health
    check_frontend_health
    check_database_health
    check_redis_health
    check_disk_space
    check_memory_usage
    check_processes
    check_logs
    check_environment
    generate_health_report
    
    # Exit with error code if health issues found
    if [ "$OVERALL_HEALTH" = false ]; then
        exit 1
    fi
}

# Run main function
main "$@"
