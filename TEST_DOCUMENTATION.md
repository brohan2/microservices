# Comprehensive Test Suite Documentation

## Overview

This document provides complete instructions for running the comprehensive test suite for the MicroServices backend. The test suite includes unit tests, integration tests, and edge case testing for both the User Management and Notification services.

## Test Coverage

### User Management Service Tests
- **Controllers**: Login, Invited Signup, Invite, Show Invites
- **Authentication**: JWT, OTP Validation, TOTP Validation
- **Middleware**: Payload Validation, Authorization
- **Database Adapter**: All CRUD operations
- **Utilities**: OTP Generation, TOTP Functions
- **Integration**: Full API endpoint testing

### Notification Service Tests
- **Mail Service**: Email sending functionality
- **RabbitMQ Consumer**: Message processing
- **Error Handling**: Network failures, authentication errors

## Prerequisites

### System Requirements
- **Node.js**: Version 18 or higher
- **npm**: Latest version
- **Operating System**: macOS, Linux, or Windows with WSL

### Dependencies
All test dependencies are automatically installed when running the test suite.

## Quick Start

### 1. Run All Tests
```bash
# Navigate to the project root
cd /path/to/MicroServices

# Run the comprehensive test suite
./run-tests.sh
```

### 2. Run Tests for Specific Service
```bash
# User Management Service only
./run-tests.sh user-management

# Notification Service only
./run-tests.sh notifications
```

### 3. Run Tests in Watch Mode
```bash
# Automatically re-run tests when files change
./run-tests.sh watch
```

## Detailed Instructions

### Method 1: Using the Test Runner Script (Recommended)

The `run-tests.sh` script provides a comprehensive testing experience with:
- Automatic dependency installation
- Colored output for better readability
- Combined coverage reports
- Error handling and reporting
- Support for different test modes

#### Available Options:
```bash
./run-tests.sh                    # Run all tests with coverage
./run-tests.sh user-management    # Run User Management tests only
./run-tests.sh notifications      # Run Notification tests only
./run-tests.sh watch             # Run tests in watch mode
./run-tests.sh ci                # Run tests in CI mode
./run-tests.sh help              # Show help information
```

### Method 2: Manual Testing

#### User Management Service
```bash
cd user-management

# Install dependencies
npm install

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run tests in CI mode
npm run test:ci
```

#### Notification Service
```bash
cd notifications

# Install dependencies
npm install

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run tests in CI mode
npm run test:ci
```

## Test Structure

### User Management Service Tests
```
user-management/src/__tests__/
├── setup.js                          # Global test setup
├── controllers/
│   ├── login.test.js                 # Login controller tests
│   ├── invitedSignup.test.js        # Signup controller tests
│   ├── invite.test.js                # Invite controller tests
│   └── showinvites.test.js           # Show invites tests
├── authentication/
│   ├── jwt.test.js                   # JWT authentication tests
│   ├── validateOtp.test.js          # OTP validation tests
│   └── validateTotp.test.js          # TOTP validation tests
├── middleware/
│   ├── inviteValidatePayload.test.js # Payload validation tests
│   └── inviteValidateAuthorization.test.js # Authorization tests
├── utilitis/
│   ├── otp.test.js                   # OTP utility tests
│   └── totp.test.js                  # TOTP utility tests
├── db_adapter.test.js                # Database adapter tests
└── integration/
    └── app.test.js                   # Integration tests
```

### Notification Service Tests
```
notifications/src/__tests__/
├── setup.js                          # Global test setup
├── mail/
│   └── notification_mail.test.js     # Email service tests
└── rabbitmq/
    └── consumer.test.js              # Message consumer tests
```

## Test Categories

### 1. Unit Tests
- **Purpose**: Test individual functions and methods in isolation
- **Coverage**: All controllers, utilities, middleware, and database operations
- **Mocking**: External dependencies are mocked for isolated testing

### 2. Integration Tests
- **Purpose**: Test API endpoints and service interactions
- **Coverage**: All HTTP endpoints with various request/response scenarios
- **Real Dependencies**: Uses actual Express app with mocked external services

### 3. Edge Case Tests
- **Purpose**: Test boundary conditions and error scenarios
- **Coverage**: Invalid inputs, network failures, authentication errors
- **Scenarios**: Empty requests, malformed data, timeout conditions

## Test Scenarios Covered

### Authentication & Authorization
- ✅ Valid JWT token generation and validation
- ✅ Invalid token handling
- ✅ Missing authorization headers
- ✅ Role-based access control
- ✅ OTP generation and validation
- ✅ TOTP setup and verification
- ✅ Password validation and hashing

### User Management
- ✅ User registration with valid data
- ✅ User registration with invalid data
- ✅ User login with correct credentials
- ✅ User login with incorrect credentials
- ✅ Invitation creation and management
- ✅ User verification workflows
- ✅ Profile updates and management

### API Endpoints
- ✅ Health check endpoints
- ✅ Authentication endpoints
- ✅ User management endpoints
- ✅ Invitation endpoints
- ✅ Error handling for all endpoints
- ✅ Request validation
- ✅ Response formatting

### Database Operations
- ✅ User creation and updates
- ✅ User queries and searches
- ✅ Invitation management
- ✅ TOTP secret management
- ✅ Error handling for database operations

### Email & Notifications
- ✅ Email sending functionality
- ✅ Message queue processing
- ✅ Error handling for email failures
- ✅ Retry mechanisms
- ✅ Different email formats and content

### Error Scenarios
- ✅ Network failures
- ✅ Database connection errors
- ✅ Authentication failures
- ✅ Invalid input data
- ✅ Missing required fields
- ✅ Malformed requests

## Coverage Reports

### Coverage Metrics
- **Statements**: Percentage of code statements executed
- **Branches**: Percentage of conditional branches tested
- **Functions**: Percentage of functions called
- **Lines**: Percentage of lines executed

### Viewing Coverage Reports
1. **HTML Reports**: Open `coverage/lcov-report/index.html` in your browser
2. **Terminal Output**: Coverage summary displayed after test execution
3. **LCOV Format**: Available for CI/CD integration

### Coverage Targets
- **Minimum**: 80% overall coverage
- **Controllers**: 90%+ coverage
- **Authentication**: 95%+ coverage
- **Utilities**: 90%+ coverage

## Continuous Integration

### GitHub Actions Example
```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: ./run-tests.sh ci
```

### Local CI Testing
```bash
# Run tests in CI mode (no watch, with coverage)
./run-tests.sh ci
```

## Troubleshooting

### Common Issues

#### 1. Node.js Version Issues
```bash
# Check Node.js version
node -v

# Install Node.js 18+ if needed
# Using nvm (recommended)
nvm install 18
nvm use 18
```

#### 2. Permission Issues
```bash
# Make test runner executable
chmod +x run-tests.sh

# Run with proper permissions
./run-tests.sh
```

#### 3. Dependency Issues
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 4. Test Failures
```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test file
npm test -- controllers/login.test.js

# Run tests with debugging
npm test -- --detectOpenHandles
```

### Debug Mode
```bash
# Run tests with debugging information
DEBUG=* npm test

# Run specific test with debugging
DEBUG=* npm test -- --testNamePattern="should authenticate successfully"
```

## Performance Testing

### Test Execution Time
- **Unit Tests**: < 30 seconds
- **Integration Tests**: < 60 seconds
- **Full Suite**: < 2 minutes
- **Watch Mode**: Continuous execution

### Memory Usage
- **Unit Tests**: ~50MB per service
- **Integration Tests**: ~100MB per service
- **Full Suite**: ~200MB total

## Best Practices

### Writing Tests
1. **Descriptive Names**: Use clear, descriptive test names
2. **Single Responsibility**: Each test should test one thing
3. **Arrange-Act-Assert**: Structure tests clearly
4. **Mock External Dependencies**: Isolate units under test
5. **Test Edge Cases**: Include boundary conditions

### Running Tests
1. **Run Before Commits**: Always run tests before committing
2. **Watch Mode for Development**: Use watch mode during development
3. **Coverage Monitoring**: Maintain high coverage percentages
4. **CI Integration**: Run tests in CI/CD pipelines

## Support

### Getting Help
- **Test Failures**: Check the test output for specific error messages
- **Coverage Issues**: Review uncovered code in coverage reports
- **Performance Issues**: Monitor test execution times
- **Debugging**: Use Jest debugging features

### Additional Resources
- **Jest Documentation**: https://jestjs.io/docs/getting-started
- **Supertest Documentation**: https://github.com/visionmedia/supertest
- **Node.js Testing**: https://nodejs.org/en/docs/guides/testing/

---

## Summary

This comprehensive test suite provides:
- **100+ Test Cases** covering all functionality
- **Edge Case Testing** for robust error handling
- **Integration Testing** for API endpoints
- **Coverage Reporting** for quality assurance
- **Easy Execution** with automated scripts
- **CI/CD Ready** for continuous integration

Run `./run-tests.sh help` for quick reference on available options.
