# MicroServices Architecture - Complete API Documentation

**Version:** 1.0  
**Date:** December 2024  
**Author:** Development Team  

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Services](#services)
4. [User Management Service](#user-management-service)
5. [Notification Service](#notification-service)
6. [Database Schema](#database-schema)
7. [Authentication & Authorization](#authentication--authorization)
8. [Message Queue Integration](#message-queue-integration)
9. [API Endpoints Reference](#api-endpoints-reference)
10. [Error Handling](#error-handling)
11. [Setup & Deployment](#setup--deployment)
12. [Security Considerations](#security-considerations)
13. [Monitoring & Logging](#monitoring--logging)

---

## 1. Project Overview

### 1.1 Introduction

This microservices architecture consists of two main services designed to handle user management and notification processing in a scalable, distributed environment.

**Core Services:**
- **User Management Service**: Handles user authentication, registration, invitations, and role-based access control
- **Notification Service**: Processes email notifications via RabbitMQ message queue

### 1.2 Key Features

- ✅ JWT-based authentication
- ✅ Multi-factor authentication (OTP & TOTP)
- ✅ Role-based invitation system
- ✅ Asynchronous email notifications
- ✅ Redis-based OTP management
- ✅ MongoDB for data persistence
- ✅ Swagger UI documentation
- ✅ OpenAPI specification

### 1.3 Technology Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js >= 18 |
| Framework | Express.js |
| Database | MongoDB with Mongoose |
| Cache | Redis |
| Message Queue | RabbitMQ |
| Authentication | JWT + bcrypt |
| Validation | Zod |
| 2FA | Speakeasy (TOTP) |
| Email | Nodemailer |
| Documentation | Swagger UI + OpenAPI |

---

## 2. Architecture

### 2.1 System Architecture

```
┌─────────────────────┐    ┌─────────────────────┐
│   User Management   │    │   Notification      │
│   Service           │    │   Service           │
│   (Port: 8000)      │    │   (Port: 8001)      │
└─────────┬───────────┘    └─────────┬───────────┘
          │                          │
          │                          │
          ▼                          ▼
┌─────────────────────────────────────────────────┐
│              RabbitMQ Queue                     │
│         (notification_queue)                    │
└─────────────────────────────────────────────────┘
          │                          │
          ▼                          ▼
┌─────────────────┐    ┌─────────────────────────┐
│     MongoDB      │    │        Redis           │
│   (User Data)    │    │    (OTP Storage)       │
└─────────────────┘    └─────────────────────────┘
```

### 2.2 Service Dependencies

- **Node.js**: >= 18
- **MongoDB**: User data storage
- **Redis**: OTP and session management
- **RabbitMQ**: Inter-service communication
- **SMTP**: Email delivery (Gmail)

---

## 3. Services

### 3.1 User Management Service

**Core Functionality:**
- User authentication and authorization
- Invitation-based user registration
- Multi-factor authentication (OTP/TOTP)
- Role-based access control
- JWT token management

**Directory Structure:**
```
user-management/
├── src/
│   ├── authentication/
│   │   ├── jwt.js              # JWT token generation & validation
│   │   ├── validateOtp.js      # OTP validation middleware
│   │   └── validateTotp.js    # TOTP validation middleware
│   ├── controller/
│   │   ├── invite.js           # Invitation creation logic
│   │   ├── invitedSignup.js    # Invited user signup flow
│   │   ├── login.js            # Authentication logic
│   │   └── showinvites.js      # Invitation listing
│   ├── db/
│   │   └── db-connection.js    # MongoDB connection
│   ├── db_adapter.js           # Database operations abstraction
│   ├── index.js                # Main application entry point
│   ├── middleware/
│   │   ├── inviteValidateAuthorization.js  # Role-based auth
│   │   └── inviteValidatePayload.js        # Request validation
│   ├── rabbitmq/
│   │   ├── producer.js         # Message publishing
│   │   └── setup.js           # RabbitMQ connection
│   ├── router/
│   │   ├── inviteRouter.js     # Invitation routes
│   │   └── userRouter.js       # User authentication routes
│   ├── schema/
│   │   └── userSchema.js       # MongoDB user schema
│   └── utilitis/
│       ├── mail.js             # Email utilities
│       ├── otp.js              # OTP generation
│       ├── redis.js            # Redis connection
│       └── totp.js             # TOTP utilities
├── package.json
└── package-lock.json
```

### 3.2 Notification Service

**Core Functionality:**
- Consumes messages from RabbitMQ queue
- Sends email notifications
- Handles email delivery failures with retry logic

**Directory Structure:**
```
notifications/
├── src/
│   ├── index.js                # Main application entry point
│   ├── mail/
│   │   └── notification_mail.js  # Email sending logic
│   └── rabbitmq/
│       ├── consumer.js         # Message consumption
│       └── setup.js           # RabbitMQ connection
├── package.json
└── package-lock.json
```

---

## 4. User Management Service

### 4.1 Authentication Flow

1. **Login Initiation**: User submits credentials via `POST /api/user/login`
2. **Credential Validation**: System validates against MongoDB
3. **Verification Method**: Based on user's `twofactor` setting:
   - **OTP**: Generate OTP, store in Redis, send email
   - **TOTP**: Return validation type for TOTP input
   - **None**: Return JWT token directly
4. **Verification Completion**: User completes verification via appropriate endpoint
5. **Token Generation**: System returns JWT token for authenticated sessions

### 4.2 Invitation Flow

1. **Invitation Creation**: Authenticated user creates invitation via `POST /api/invite`
2. **Permission Validation**: System validates user's permission to invite for specified role
3. **User Record Creation**: Creates pending user record in MongoDB
4. **Message Publishing**: Publishes invitation message to RabbitMQ queue
5. **Email Processing**: Notification service processes message and sends email
6. **Signup Completion**: Invited user completes signup via `PATCH /api/user/invitedsignup`

---

## 5. Notification Service

### 5.1 Email Processing Flow

1. **Message Consumption**: Consumes messages from `notification_queue`
2. **Data Extraction**: Extracts recipient email and content from message
3. **Email Delivery**: Sends email via SMTP (Gmail configured)
4. **Message Acknowledgment**: Acknowledges message on successful delivery
5. **Retry Logic**: Retries message on delivery failure

### 5.2 Configuration

- **SMTP Host**: smtp.gmail.com
- **Port**: 465 (SSL)
- **Authentication**: Gmail App Password
- **Queue**: notification_queue (durable)

---

## 6. Database Schema

### 6.1 User Schema (MongoDB)

```javascript
{
  username: String (required, unique, lowercase, indexed),
  email: String (required, unique, indexed),
  role: String (required, enum: [super_admin, site_admin, operator, client_admin, client_user]),
  password: String (hashed with bcrypt),
  invited_by: ObjectId (reference to User),
  isVerified: Boolean (default: false),
  invite_status: String (enum: [pending, accepted, expired], default: pending),
  profile: {
    photoUrl: String (default: null),
    phoneNumber: String (default: null)
  },
  invitedAt: Date (default: Date.now),
  inviteAcceptedAt: Date (default: null),
  lastLogin: Date (default: null),
  invite_id: String (required),
  invite_expiry: Date (required, default: 24h from creation),
  twofactor: String (enum: [otp, totp, none], default: none),
  totpSecret: String (default: null),
  totpEnabled: Boolean (default: false),
  timestamps: true (createdAt, updatedAt)
}
```

---

## 7. Authentication & Authorization

### 7.1 JWT Token Structure

```javascript
{
  email: string,
  username: string,
  exp: number (1 hour expiry)
}
```

### 7.2 Role Hierarchy & Permissions

```
super_admin
├── Can invite: site_admin, operator, client_admin
├── Cannot invite: super_admin, client_user

site_admin
├── Can invite: operator, client_admin
├── Cannot invite: super_admin, site_admin, client_user

operator
├── Can invite: client_admin
├── Cannot invite: super_admin, site_admin, operator, client_user

client_admin
├── Can invite: client_user
├── Cannot invite: super_admin, site_admin, operator, client_admin

client_user
├── Cannot invite anyone
```

### 7.3 Multi-Factor Authentication

#### OTP (One-Time Password)
- Generated 6-digit code
- Stored in Redis with 10-minute expiry
- Sent via email

#### TOTP (Time-based One-Time Password)
- Google Authenticator compatible
- QR code generated for setup
- 30-second window validation

---

## 8. Message Queue Integration

### 8.1 RabbitMQ Configuration

- **Queue Name**: notification_queue
- **Durability**: Persistent messages
- **Message Format**: JSON

### 8.2 Message Structure

```javascript
{
  to: string (recipient email),
  content: string (email body)
}
```

### 8.3 Processing Flow

1. User Management Service publishes invitation message
2. Notification Service consumes message
3. Email sent via SMTP
4. Message acknowledged on success
5. Message retried on failure

---

## 9. API Endpoints Reference

### 9.1 User Management Service (Port: 8000)

#### Health Check
- **GET** `/`
  - **Description**: Service health check
  - **Response**: `"User Management Service is running"`

#### Authentication Routes (`/api/user`)

##### Login Initiation
- **POST** `/api/user/login`
  - **Description**: Start login process, determines verification method
  - **Request Body**:
    ```json
    {
      "email": "user@example.com",
      "password": "password123"
    }
    ```
  - **Responses**:
    - `200`: Returns verification type (otp/totp) or JWT token
    - `400`: Invalid credentials or formatting

##### OTP Login Completion
- **POST** `/api/user/validateotplogin`
  - **Description**: Complete login with OTP verification
  - **Request Body**:
    ```json
    {
      "email": "user@example.com",
      "otp_received": "123456"
    }
    ```
  - **Response**: `200` with JWT token

##### TOTP Login Completion
- **POST** `/api/user/validatetotplogin`
  - **Description**: Complete login with TOTP verification
  - **Request Body**:
    ```json
    {
      "email": "user@example.com",
      "token": "123456"
    }
    ```
  - **Response**: `200` with JWT token

#### Signup Routes (`/api/user`)

##### Invited User Signup
- **PATCH** `/api/user/invitedsignup`
  - **Description**: Start signup process for invited users
  - **Request Body**:
    ```json
    {
      "username": "johndoe",
      "email": "john@example.com",
      "password": "password123",
      "confirmpassword": "password123",
      "invite_id": "abc123def456",
      "verification_preference": "otp"
    }
    ```
  - **Responses**:
    - `200`: OTP sent or QR code for TOTP
    - `400`: Validation failure
    - `404`: User not invited

##### OTP Signup Completion
- **PATCH** `/api/user/validateotpsignup`
  - **Description**: Complete signup with OTP verification
  - **Request Body**:
    ```json
    {
      "email": "john@example.com",
      "otp_received": "123456"
    }
    ```
  - **Response**: `200` with JWT token

##### TOTP Signup Completion
- **PATCH** `/api/user/validatetotpsignup`
  - **Description**: Complete signup with TOTP verification
  - **Request Body**:
    ```json
    {
      "email": "john@example.com",
      "token": "123456"
    }
    ```
  - **Response**: `200` with success message

#### Invitation Routes (`/api`)

##### Create Invitation
- **POST** `/api/invite`
  - **Description**: Invite a new user (requires authentication)
  - **Headers**: `Authorization: Bearer <jwt_token>`
  - **Request Body**:
    ```json
    {
      "inviteEmail": "newuser@example.com",
      "inviteRole": "client_admin"
    }
    ```
  - **Responses**:
    - `200`: Invitation created and email queued
    - `400`: User already exists
    - `401`: Unauthorized or insufficient permissions
    - `500`: Queue error

##### List Invitations
- **GET** `/api/inviteelist?irole=client_admin`
  - **Description**: List invitations created by current user
  - **Headers**: `Authorization: Bearer <jwt_token>`
  - **Query Parameters**:
    - `irole`: Role to filter by (required)
  - **Response**: `200` with invitation list

#### Documentation
- **GET** `/docs`
  - **Description**: Swagger UI documentation
- **GET** `/openapi.yaml`
  - **Description**: OpenAPI specification

### 9.2 Notification Service (Port: 8001)

#### Health Check
- **GET** `/`
  - **Description**: Service health check
  - **Response**: Service status

#### Internal Operations
- **RabbitMQ Consumer**: Automatically processes email messages
- **Email Delivery**: Handles SMTP sending with retry logic

---

## 10. Error Handling

### 10.1 HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request (validation errors, invalid credentials) |
| 401 | Unauthorized (invalid token, insufficient permissions) |
| 404 | Not Found (user not invited, user not found) |
| 422 | Unprocessable Entity (validation errors) |
| 500 | Internal Server Error |

### 10.2 Error Response Format

```json
{
  "error": "Error message",
  "errors": ["Detailed validation errors"]
}
```

### 10.3 Common Error Scenarios

1. **Invalid JWT Token**: `401 Unauthorized`
2. **Expired OTP**: `400 Bad Request`
3. **Invalid Role Assignment**: `401 Unauthorized`
4. **User Already Exists**: `400 Bad Request`
5. **Queue Connection Failed**: `500 Internal Server Error`

---

## 11. Setup & Deployment

### 11.1 Prerequisites

- Node.js >= 18
- MongoDB
- Redis
- RabbitMQ
- SMTP credentials (Gmail configured)

### 11.2 Environment Variables

#### User Management Service (.env)
```bash
PORT=8000
MONGODB_URI=mongodb://localhost:27017/user_management
JWT_TOKEN=your_jwt_secret_key
RABBITMQ_URL=amqp://localhost
```

#### Notification Service (.env)
```bash
PORT=8001
RABBITMQ_URL=amqp://localhost
```

### 11.3 Installation Steps

#### 1. Install Dependencies
```bash
# User Management Service
cd user-management
npm install

# Notification Service
cd ../notifications
npm install
```

#### 2. Start Services
```bash
# Terminal 1: Notification Service
cd notifications
node src/index.js

# Terminal 2: User Management Service
cd user-management
node src/index.js
```

#### 3. Access Services
- **User Management API**: http://localhost:8000
- **Swagger Documentation**: http://localhost:8000/docs
- **Notification Service**: http://localhost:8001

### 11.4 Development Commands

```bash
# Run with auto-reload
npx nodemon src/index.js

# Run in quiet mode
npx nodemon src/index.js --quiet
```

### 11.5 Production Considerations

1. **Security**: Change default JWT secret
2. **SMTP**: Use production email service
3. **Database**: Configure MongoDB authentication
4. **Monitoring**: Add logging and health checks
5. **Scaling**: Consider load balancing and horizontal scaling

---

## 12. Security Considerations

### 12.1 Current Security Measures

- JWT token authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation with Zod
- OTP/TOTP multi-factor authentication

### 12.2 Security Recommendations

1. **Environment Variables**: Never commit secrets to version control
2. **HTTPS**: Use SSL/TLS in production
3. **Rate Limiting**: Implement API rate limiting
4. **CORS**: Configure Cross-Origin Resource Sharing
5. **Input Sanitization**: Additional input sanitization
6. **Audit Logging**: Log security events
7. **Token Rotation**: Implement token refresh mechanism

---

## 13. Monitoring & Logging

### 13.1 Current Logging

- Console-based logging
- Error tracking in controllers
- RabbitMQ connection status

### 13.2 Recommended Monitoring

1. **Application Metrics**: Response times, error rates
2. **Database Metrics**: Connection pools, query performance
3. **Queue Metrics**: Message processing rates, failures
4. **Health Checks**: Service availability endpoints
5. **Alerting**: Critical error notifications

---

## Conclusion

This documentation provides a comprehensive overview of the microservices architecture, including all routes, functionalities, and implementation details. For the most up-to-date API specification, refer to the OpenAPI documentation at `/docs` endpoint.

The system provides a robust foundation for user management with secure authentication, role-based access control, and asynchronous notification processing. The modular architecture allows for easy scaling and maintenance of individual services.

### Quick Reference

- **API Documentation**: http://localhost:8000/docs
- **OpenAPI Spec**: http://localhost:8000/openapi.yaml
- **User Management**: http://localhost:8000
- **Notification Service**: http://localhost:8001

For technical support or questions regarding implementation, please refer to the source code documentation and inline comments within the codebase.

---

**Document Information:**
- **Version**: 1.0
- **Last Updated**: December 2024
- **Format**: PDF-Ready Markdown
- **Total Endpoints**: 9
- **Services**: 2
- **Authentication Methods**: 3 (JWT, OTP, TOTP)
