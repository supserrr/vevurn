#!/bin/bash

# Vevurn Security Scan Script
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

print_status "🔒 Starting comprehensive security scan for Vevurn..."

# Check if required tools are installed
check_tools() {
    print_status "Checking required security tools..."
    
    local tools=("npm" "docker" "git")
    local missing_tools=()
    
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            missing_tools+=("$tool")
        fi
    done
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        print_error "Missing required tools: ${missing_tools[*]}"
        exit 1
    fi
    
    print_status "All required tools are available ✅"
}

# Run npm audit for Node.js dependencies
run_npm_audit() {
    print_status "Running npm audit for dependency vulnerabilities..."
    
    # Audit all workspaces
    pnpm audit --audit-level high --prod || {
        print_warning "Found high-severity vulnerabilities in dependencies"
        print_status "Attempting to fix vulnerabilities..."
        pnpm audit --fix
    }
    
    print_status "NPM audit completed ✅"
}

# Scan Docker images for vulnerabilities
scan_docker_images() {
    print_status "Scanning Docker images for vulnerabilities..."
    
    # Build images first
    docker-compose build
    
    # Get list of project images
    local images=$(docker images --format "table {{.Repository}}:{{.Tag}}" | grep "vevurn" | grep -v "<none>")
    
    if [ -z "$images" ]; then
        print_warning "No Vevurn Docker images found to scan"
        return
    fi
    
    # Use Docker Scout if available, otherwise use docker scan
    if command -v docker-scout &> /dev/null; then
        print_status "Using Docker Scout for vulnerability scanning..."
        echo "$images" | while read image; do
            print_status "Scanning image: $image"
            docker scout cves "$image" || print_warning "Issues found in $image"
        done
    elif docker scan --version &> /dev/null; then
        print_status "Using Docker scan for vulnerability scanning..."
        echo "$images" | while read image; do
            print_status "Scanning image: $image"
            docker scan "$image" || print_warning "Issues found in $image"
        done
    else
        print_warning "Docker vulnerability scanning tools not available"
        print_status "Consider installing Docker Scout or enabling Docker scan"
    fi
    
    print_status "Docker image scanning completed ✅"
}

# Check for secrets in code
check_secrets() {
    print_status "Checking for potential secrets in code..."
    
    # Common secret patterns
    local secret_patterns=(
        "password\s*=\s*['\"][^'\"]+['\"]"
        "api[_-]?key\s*[=:]\s*['\"][^'\"]+['\"]"
        "secret[_-]?key\s*[=:]\s*['\"][^'\"]+['\"]"
        "token\s*[=:]\s*['\"][^'\"]+['\"]"
        "database[_-]?url\s*[=:]\s*['\"]postgresql://[^'\"]+['\"]"
        "jwt[_-]?secret\s*[=:]\s*['\"][^'\"]+['\"]"
    )
    
    local found_secrets=false
    
    for pattern in "${secret_patterns[@]}"; do
        if git grep -iE "$pattern" -- '*.js' '*.ts' '*.jsx' '*.tsx' '*.json' 2>/dev/null; then
            found_secrets=true
        fi
    done
    
    if [ "$found_secrets" = true ]; then
        print_error "⚠️  Potential secrets found in code! Review the matches above."
        print_status "Consider using environment variables or secret management services"
    else
        print_status "No obvious secrets found in code ✅"
    fi
}

# Check file permissions
check_permissions() {
    print_status "Checking file permissions..."
    
    # Check for files with overly permissive permissions
    local suspicious_files=$(find . -type f \( -perm -o+w -o -perm -g+w \) ! -path "./node_modules/*" ! -path "./.git/*" ! -path "./dist/*" ! -path "./build/*")
    
    if [ -n "$suspicious_files" ]; then
        print_warning "Files with write permissions for group/others found:"
        echo "$suspicious_files"
    else
        print_status "File permissions look good ✅"
    fi
}

# Check environment files
check_env_files() {
    print_status "Checking environment files..."
    
    local env_files=(".env" ".env.local" ".env.production" ".env.development" "backend/.env" "frontend/.env.local")
    
    for env_file in "${env_files[@]}"; do
        if [ -f "$env_file" ]; then
            print_warning "Environment file found: $env_file"
            print_status "Ensure it's properly ignored in version control"
            
            # Check if it's in .gitignore
            if ! grep -q "$(basename "$env_file")" .gitignore 2>/dev/null; then
                print_error "⚠️  $env_file is not in .gitignore!"
            fi
        fi
    done
}

# Run OWASP dependency check if available
run_owasp_check() {
    print_status "Checking for OWASP dependency-check..."
    
    if command -v dependency-check &> /dev/null; then
        print_status "Running OWASP dependency check..."
        dependency-check --project "Vevurn" --scan . --format HTML --format JSON --out ./security-reports/
        print_status "OWASP dependency check completed ✅"
    else
        print_warning "OWASP dependency-check not installed"
        print_status "Consider installing it for comprehensive vulnerability scanning"
    fi
}

# Generate security report
generate_report() {
    print_status "Generating security scan report..."
    
    mkdir -p security-reports
    
    {
        echo "# Vevurn Security Scan Report"
        echo "Generated on: $(date)"
        echo ""
        echo "## Scan Summary"
        echo "- ✅ Dependency audit completed"
        echo "- ✅ Docker image scanning completed"
        echo "- ✅ Secret scanning completed"
        echo "- ✅ File permission check completed"
        echo "- ✅ Environment file check completed"
        echo ""
        echo "## Recommendations"
        echo "1. Regularly update dependencies to patch vulnerabilities"
        echo "2. Use environment variables for sensitive configuration"
        echo "3. Implement proper secret management in production"
        echo "4. Keep Docker base images updated"
        echo "5. Review and rotate API keys and tokens regularly"
        echo ""
        echo "## Next Steps"
        echo "- Review any warnings or errors found above"
        echo "- Implement fixes for identified issues"
        echo "- Schedule regular security scans"
    } > security-reports/security-report-$(date +%Y%m%d).md
    
    print_status "Security report generated: security-reports/security-report-$(date +%Y%m%d).md"
}

# Main execution
main() {
    check_tools
    run_npm_audit
    scan_docker_images
    check_secrets
    check_permissions
    check_env_files
    run_owasp_check
    generate_report
    
    print_status "🎉 Security scan completed!"
    print_status "Review the report and address any identified issues."
}

# Run main function
main "$@"
