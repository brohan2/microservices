#!/bin/bash

# Comprehensive Test Runner for MicroServices Backend
# This script runs all tests for both services with proper setup and reporting

set -e  # Exit on any error

echo "🚀 Starting Comprehensive Test Suite for MicroServices Backend"
echo "=============================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ to run tests."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

print_success "Node.js version: $(node -v)"

# Function to run tests for a service
run_service_tests() {
    local service_name=$1
    local service_path=$2
    
    print_status "Testing $service_name service..."
    echo "----------------------------------------"
    
    cd "$service_path"
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        print_error "package.json not found in $service_path"
        return 1
    fi
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies for $service_name..."
        npm install
    fi
    
    # Run tests with coverage (allow failures, still convert JSON to CSV)
    print_status "Running tests for $service_name..."
    set +e
    npm run test:coverage
    TEST_STATUS=$?
    set -e

    # Convert JSON results to CSV if present (always attempt)
    if [ -f "jest-results.json" ]; then
        print_status "Converting JSON results to CSV for $service_name..."
        node ../scripts/jest-json-to-csv.mjs jest-results.json test-results.csv || true
        mkdir -p ../test-results
        cp test-results.csv ../test-results/${service_name// /_}.csv 2>/dev/null || true
    else
        print_warning "jest-results.json not found for $service_name; CSV not generated"
    fi

    # Report status
    if [ $TEST_STATUS -eq 0 ]; then
        print_success "$service_name tests passed!"
    else
        print_error "$service_name tests failed!"
        return 1
    fi
    
    echo ""
    cd - > /dev/null
}

# Function to generate combined coverage report
generate_combined_report() {
    print_status "Generating combined coverage report..."
    
    # Create coverage directory in root
    mkdir -p coverage
    
    # Copy coverage reports from both services
    if [ -d "user-management/coverage" ]; then
        cp -r user-management/coverage/* coverage/ 2>/dev/null || true
    fi
    
    if [ -d "notifications/coverage" ]; then
        cp -r notifications/coverage/* coverage/ 2>/dev/null || true
    fi
    
    print_success "Combined coverage report generated in ./coverage/"
}

# Main execution
main() {
    local start_time=$(date +%s)
    local failed_services=()
    
    print_status "Starting test execution at $(date)"
    echo ""
    
    # Test User Management Service
    if ! run_service_tests "User Management" "user-management"; then
        failed_services+=("User Management")
    fi
    
    # Test Notification Service
    if ! run_service_tests "Notification" "notifications"; then
        failed_services+=("Notification")
    fi
    
    # Generate combined report
    generate_combined_report
    
    # Calculate execution time
    local end_time=$(date +%s)
    local execution_time=$((end_time - start_time))
    
    echo "=============================================================="
    print_status "Test execution completed in ${execution_time} seconds"
    echo ""
    
    # Report results
    if [ ${#failed_services[@]} -eq 0 ]; then
        print_success "All tests passed! 🎉"
        echo ""
        print_status "Test Summary:"
        echo "✅ User Management Service: PASSED"
        echo "✅ Notification Service: PASSED"
        echo ""
        print_status "Coverage reports available in:"
        echo "📊 User Management: ./user-management/coverage/"
        echo "📊 Notifications: ./notifications/coverage/"
        echo "📊 Combined: ./coverage/"
        exit 0
    else
        print_error "Some tests failed! ❌"
        echo ""
        print_status "Failed services:"
        for service in "${failed_services[@]}"; do
            echo "❌ $service"
        done
        echo ""
        print_status "Check individual service coverage reports for details:"
        echo "📊 User Management: ./user-management/coverage/"
        echo "📊 Notifications: ./notifications/coverage/"
        exit 1
    fi
}

# Handle script arguments
case "${1:-}" in
    "user-management"|"user")
        print_status "Running tests for User Management service only..."
        run_service_tests "User Management" "user-management"
        ;;
    "notifications"|"notification")
        print_status "Running tests for Notification service only..."
        run_service_tests "Notification" "notifications"
        ;;
    "watch")
        print_status "Running tests in watch mode..."
        cd user-management && npm run test:watch &
        cd ../notifications && npm run test:watch &
        wait
        ;;
    "ci")
        print_status "Running tests in CI mode..."
        cd user-management && npm run test:ci
        cd ../notifications && npm run test:ci
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [option]"
        echo ""
        echo "Options:"
        echo "  (no option)    Run all tests with coverage"
        echo "  user-management, user    Run User Management tests only"
        echo "  notifications, notification    Run Notification tests only"
        echo "  watch          Run tests in watch mode"
        echo "  ci             Run tests in CI mode"
        echo "  help, -h, --help    Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0                    # Run all tests"
        echo "  $0 user-management    # Run User Management tests only"
        echo "  $0 watch             # Run tests in watch mode"
        echo "  $0 ci                # Run tests in CI mode"
        ;;
    "")
        main
        ;;
    *)
        print_error "Unknown option: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac
