# 52 — Complete REST API Endpoint Specifications

## 1. API Overview

- **Base URL**: `/api/v1`
- **Authentication**: Bearer JWT
- **Organization Context**: `X-Organization-ID` header
- **Response Envelope**: `{ success, data, meta?, links?, requestId }`
- **Error Envelope**: `{ success: false, error: { code, message, details? }, requestId }`

## 2. Authentication Endpoints

### 2.1 Register

```
POST /auth/register
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "organizationName": "Acme Corp",
  "countryCode": "DE",
  "currencyCode": "EUR"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "organizationId": "org_123"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 2.2 Login

```
POST /auth/login
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "mfaToken": "123456"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "usr_123", "email": "user@example.com" },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 2.3 Refresh Token

```
POST /auth/refresh
```

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 2.4 Logout

```
POST /auth/logout
```

**Response 200:**
```json
{
  "success": true,
  "data": null
}
```

### 2.5 Forgot Password

```
POST /auth/forgot-password
```

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": null
}
```

### 2.6 Reset Password

```
POST /auth/reset-password
```

**Request:**
```json
{
  "token": "reset_token_here",
  "password": "NewSecurePass123!"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": null
}
```

## 3. Organization Endpoints

### 3.1 List Organizations

```
GET /organizations
```

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "org_123",
      "name": "Acme Corp",
      "slug": "acme",
      "countryCode": "DE",
      "currencyCode": "EUR",
      "plan": { "name": "Pro" }
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}
```

### 3.2 Get Organization

```
GET /organizations/{id}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "org_123",
    "name": "Acme Corp",
    "slug": "acme",
    "legalName": "Acme Corporation GmbH",
    "taxId": "DE123456789",
    "countryCode": "DE",
    "currencyCode": "EUR",
    "locale": "en",
    "timezone": "Europe/Berlin",
    "settings": { "featureFlags": {} },
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### 3.3 Create Organization

```
POST /organizations
```

**Request:**
```json
{
  "name": "Acme Corp",
  "legalName": "Acme Corporation GmbH",
  "countryCode": "DE",
  "currencyCode": "EUR",
  "timezone": "Europe/Berlin"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "org_123",
    "name": "Acme Corp",
    "slug": "acme",
    "countryCode": "DE",
    "currencyCode": "EUR"
  }
}
```

### 3.4 Update Organization

```
PUT /organizations/{id}
```

**Request:**
```json
{
  "name": "Acme Corp Updated",
  "timezone": "Europe/Berlin"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "org_123",
    "name": "Acme Corp Updated",
    "timezone": "Europe/Berlin"
  }
}
```

### 3.5 Switch Organization

```
POST /organizations/{id}/switch
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "organization": { "id": "org_123", "name": "Acme Corp" }
  }
}
```

## 4. User Endpoints

### 4.1 List Users

```
GET /users
```

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "usr_123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": { "name": "owner" },
      "isActive": true
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}
```

### 4.2 Get Current User

```
GET /users/me
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "usr_123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "mfaEnabled": true,
    "organizations": [
      { "id": "org_123", "name": "Acme Corp", "role": "owner" }
    ]
  }
}
```

### 4.3 Invite User

```
POST /users/invite
```

**Request:**
```json
{
  "email": "newuser@example.com",
  "firstName": "Jane",
  "lastName": "Doe",
  "roleId": "role_accountant"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "usr_456",
    "email": "newuser@example.com",
    "invitationToken": "invite_token_here"
  }
}
```

## 5. Jurisdiction Endpoints

### 5.1 List Jurisdictions

```
GET /jurisdictions
```

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "jur_123",
      "countryCode": "DE",
      "regionCode": null,
      "name": "Germany",
      "vatName": "Umsatzsteuer (USt)",
      "authorityName": "Bundeszentralamt für Steuern",
      "currencyCode": "EUR",
      "locale": "de",
      "timezone": "Europe/Berlin",
      "vatRates": [
        { "code": "STD", "name": "Standard", "rate": 19, "type": "standard" },
        { "code": "RED", "name": "Reduced", "rate": 7, "type": "reduced" }
      ],
      "filingFrequency": "monthly",
      "isActive": true
    }
  ]
}
```

### 5.2 Create Jurisdiction

```
POST /jurisdictions
```

**Request:**
```json
{
  "countryCode": "DE",
  "regionCode": null,
  "name": "Germany",
  "vatName": "Umsatzsteuer (USt)",
  "authorityName": "Bundeszentralamt für Steuern",
  "currencyCode": "EUR",
  "locale": "de",
  "timezone": "Europe/Berlin",
  "vatRates": [
    { "code": "STD", "name": "Standard", "rate": 19, "type": "standard", "isActive": true }
  ],
  "filingFrequency": "monthly",
  "deadlineRules": [{ "month": 1, "day": 10 }]
}
```

**Response 201:**
```json
{
  "success": true,
  "data": { "id": "jur_123", "countryCode": "DE", "name": "Germany" }
}
```

## 6. VAT Registration Endpoints

### 6.1 List VAT Registrations

```
GET /vat-registrations
```

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "vreg_123",
      "jurisdictionId": "jur_123",
      "jurisdiction": { "name": "Germany", "countryCode": "DE" },
      "registrationNumber": "DE123456789",
      "registrationType": "standard",
      "scheme": null,
      "effectiveDate": "2024-01-01",
      "endDate": null,
      "isActive": true,
      "isVerified": true,
      "verifiedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 6.2 Create VAT Registration

```
POST /vat-registrations
```

**Request:**
```json
{
  "jurisdictionId": "jur_123",
  "registrationNumber": "DE123456789",
  "registrationType": "standard",
  "effectiveDate": "2024-01-01"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "vreg_123",
    "registrationNumber": "DE123456789",
    "isActive": true
  }
}
```

### 6.3 Verify VAT Registration

```
POST /vat-registrations/{id}/verify
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "vreg_123",
    "isVerified": true,
    "verifiedAt": "2024-01-01T00:00:00Z"
  }
}
```

## 7. VAT Return Endpoints

### 7.1 List VAT Returns

```
GET /vat-returns?page=1&limit=20&status=submitted&periodStart=2024-01-01&periodEnd=2024-03-31
```

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "ret_123",
      "vatRegistrationId": "vreg_123",
      "periodStart": "2024-01-01",
      "periodEnd": "2024-03-31",
      "dueDate": "2024-04-30",
      "status": "submitted",
      "submissionId": "sub_456",
      "submittedAt": "2024-04-15T10:00:00Z",
      "version": 2,
      "totalSales": 3570,
      "totalPurchases": 595,
      "totalVatDue": 570,
      "totalVatReclaim": 95,
      "netVatDue": 475,
      "currencyCode": "EUR",
      "items": [
        {
          "id": "item_123",
          "type": "sales",
          "boxCode": "STD",
          "netAmount": 3000,
          "vatRate": 19,
          "vatAmount": 570,
          "grossAmount": 3570
        }
      ],
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-04-15T10:00:00Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}
```

### 7.2 Get VAT Return

```
GET /vat-returns/{id}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "ret_123",
    "vatRegistrationId": "vreg_123",
    "periodStart": "2024-01-01",
    "periodEnd": "2024-03-31",
    "dueDate": "2024-04-30",
    "status": "draft",
    "version": 1,
    "items": [],
    "history": [],
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### 7.3 Create VAT Return

```
POST /vat-returns
```

**Request:**
```json
{
  "vatRegistrationId": "vreg_123",
  "periodStart": "2024-01-01",
  "periodEnd": "2024-03-31",
  "dueDate": "2024-04-30",
  "items": [
    {
      "type": "sales",
      "boxCode": "STD",
      "description": "Consulting services",
      "netAmount": 3000,
      "vatRate": 19,
      "vatAmount": 570,
      "grossAmount": 3570
    }
  ]
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "ret_123",
    "vatRegistrationId": "vreg_123",
    "periodStart": "2024-01-01",
    "periodEnd": "2024-03-31",
    "dueDate": "2024-04-30",
    "status": "draft",
    "version": 1,
    "items": [{ "id": "item_123", "type": "sales", "netAmount": 3000, "vatAmount": 570, "grossAmount": 3570 }]
  }
}
```

### 7.4 Update VAT Return

```
PUT /vat-returns/{id}
```

**Request:**
```json
{
  "items": [
    {
      "id": "item_123",
      "type": "sales",
      "boxCode": "STD",
      "netAmount": 4000,
      "vatRate": 19,
      "vatAmount": 760,
      "grossAmount": 4760
    }
  ]
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "ret_123",
    "version": 2,
    "items": [{ "id": "item_123", "netAmount": 4000, "vatAmount": 760, "grossAmount": 4760 }]
  }
}
```

### 7.5 Submit VAT Return

```
POST /vat-returns/{id}/submit
```

**Request:**
```json
{
  "confirmAccuracy": true,
  "confirmSubmission": true,
  "notes": "Final submission for Q1 2024"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "ret_123",
    "status": "submitted",
    "submissionId": "sub_456",
    "submittedAt": "2024-04-15T10:00:00Z",
    "version": 3
  }
}
```

### 7.6 Get VAT Return History

```
GET /vat-returns/{id}/history
```

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "hist_123",
      "action": "created",
      "userId": "usr_123",
      "notes": "VAT return created",
      "createdAt": "2024-01-01T00:00:00Z"
    },
    {
      "id": "hist_124",
      "action": "submitted",
      "userId": "usr_123",
      "notes": "Submitted to HMRC",
      "createdAt": "2024-04-15T10:00:00Z"
    }
  ]
}
```

## 8. Transaction Endpoints

### 8.1 List Transactions

```
GET /transactions?page=1&limit=20&type=sale&dateFrom=2024-01-01&dateTo=2024-03-31
```

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "txn_123",
      "type": "sale",
      "direction": "incoming",
      "transactionDate": "2024-01-15",
      "description": "Consulting services",
      "counterpartyName": "Acme Corp",
      "currencyCode": "EUR",
      "netAmount": 1000,
      "vatRate": 19,
      "vatAmount": 190,
      "grossAmount": 1190,
      "isReconciled": false,
      "createdAt": "2024-01-15T00:00:00Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}
```

### 8.2 Create Transaction

```
POST /transactions
```

**Request:**
```json
{
  "type": "sale",
  "direction": "incoming",
  "transactionDate": "2024-01-15",
  "description": "Consulting services",
  "counterpartyName": "Acme Corp",
  "jurisdictionId": "jur_123",
  "currencyCode": "EUR",
  "netAmount": 1000,
  "vatRate": 19,
  "vatAmount": 190,
  "grossAmount": 1190
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "txn_123",
    "type": "sale",
    "transactionDate": "2024-01-15",
    "netAmount": 1000,
    "vatAmount": 190,
    "grossAmount": 1190
  }
}
```

### 8.3 Import Transactions

```
POST /transactions/import
Content-Type: multipart/form-data
```

**Request:**
```
file: <binary>
mapping: {"Date": "transactionDate", "Description": "description", "Amount": "grossAmount"}
```

**Response 202:**
```json
{
  "success": true,
  "data": {
    "importJobId": "job_123",
    "status": "processing",
    "totalRows": 100
  }
}
```

## 9. Integration Endpoints

### 9.1 List Integrations

```
GET /integrations
```

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "int_123",
      "provider": "hmrc",
      "type": "vat_authority",
      "status": "active",
      "lastSyncAt": "2024-01-15T00:00:00Z"
    }
  ]
}
```

### 9.2 Connect Integration (OAuth2)

```
POST /integrations/{provider}/connect
```

**Request:**
```json
{
  "code": "authorization_code",
  "state": "encrypted_state"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "int_123",
    "provider": "hmrc",
    "status": "active"
  }
}
```

### 9.3 Sync Integration

```
POST /integrations/{id}/sync
```

**Response 202:**
```json
{
  "success": true,
  "data": {
    "jobId": "sync_123",
    "status": "queued"
  }
}
```

## 10. Notification Endpoints

### 10.1 List Notifications

```
GET /notifications?unreadOnly=true
```

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "notif_123",
      "type": "vat_return_due",
      "title": "VAT Return Due Soon",
      "message": "Your VAT return is due on 2024-04-30",
      "readAt": null,
      "priority": "high",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 10.2 Mark as Read

```
POST /notifications/{id}/read
```

**Response 200:**
```json
{
  "success": true,
  "data": null
}
```

## 11. Report Endpoints

### 11.1 Generate Report

```
POST /reports/generate
```

**Request:**
```json
{
  "type": "vat_summary",
  "format": "pdf",
  "parameters": {
    "periodStart": "2024-01-01",
    "periodEnd": "2024-03-31",
    "jurisdictionId": "jur_123"
  }
}
```

**Response 202:**
```json
{
  "success": true,
  "data": {
    "reportId": "rep_123",
    "status": "processing",
    "downloadUrl": null
  }
}
```

### 11.2 Get Report

```
GET /reports/{id}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "rep_123",
    "type": "vat_summary",
    "format": "pdf",
    "status": "completed",
    "downloadUrl": "https://s3.amazonaws.com/vat-reports/rep_123.pdf",
    "expiresAt": "2024-01-08T00:00:00Z"
  }
}
```

## 12. Health Endpoints

### 12.1 Health Check

```
GET /health
```

**Response 200:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "1.0.0"
}
```

### 12.2 Readiness Check

```
GET /health/ready
```

**Response 200:**
```json
{
  "status": "ready",
  "checks": {
    "database": { "status": "up", "responseTime": 5 },
    "redis": { "status": "up", "responseTime": 2 },
    "queue": { "status": "up", "queues": { "default": { "waiting": 0, "active": 1 } } }
  }
}
```

### 12.3 Liveness Check

```
GET /health/live
```

**Response 200:**
```json
{
  "status": "alive"
}
```

## 13. Common Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number (default: 1) |
| `limit` | integer | Items per page (default: 20, max: 100) |
| `sort` | string | Sort field (prefix `-` for desc) |
| `cursor` | string | Cursor for pagination |
| `fields` | string | Comma-separated fields to include |

## 14. Common Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      { "field": "email", "message": "Email is required" },
      { "field": "password", "message": "Password must be at least 8 characters" }
    ]
  },
  "requestId": "req_123"
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  },
  "requestId": "req_123"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions",
    "details": { "required": ["vat_returns.submit"] }
  },
  "requestId": "req_123"
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "VAT return not found",
    "details": { "returnId": "ret_123" }
  },
  "requestId": "req_123"
}
```

### 409 Conflict

```json
{
  "success": false,
  "error": {
    "code": "VERSION_MISMATCH",
    "message": "VAT return was modified by another user",
    "details": { "expectedVersion": 1, "actualVersion": 2 }
  },
  "requestId": "req_123"
}
```

### 429 Too Many Requests

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded",
    "details": { "retryAfter": 30 }
  },
  "requestId": "req_123"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  },
  "requestId": "req_123"
}
```
