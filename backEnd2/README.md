# BackEnd2 API

Minimal Express + Prisma backend implementing public, auth, citizen, billing, application, grievance, and admin APIs.

## Setup

1. Configure `.env` in `backEnd2`:

```
DATABASE_URL=postgresql://user:password@localhost:5432/suvidha
JWT_SECRET=dev-citizen-secret
ADMIN_JWT_SECRET=dev-admin-secret
DEFAULT_OTP=123456
PG_SSL_REJECT_UNAUTHORIZED=false
NODE_TLS_REJECT_UNAUTHORIZED=0
```

2. Generate Prisma client and migrate:

```sh
cd backEnd2
npm run prisma:generate
npx prisma migrate dev --name init
```

3. Create an admin user:

```sh
node scripts/create-admin.js admin@example.com password "Admin User"
```

4. Start the API:

```sh
npm run dev
```

## Quick Smoke Test

```sh
npm run smoke
```

---

## API Documentation

Base URL: `http://localhost:4000`

### Authentication Headers

#### Citizen Endpoints

```
Authorization: Bearer <citizen_token>
```

#### Admin Endpoints

```
Authorization: Bearer <admin_token>
```

---

## 📂 Public APIs

Public endpoints that don't require authentication.

### Get Departments

```http
GET /api/public/departments
```

**Response:**

```json
["ELECTRICITY", "WATER", "GAS", "SANITATION", "SOLAR"]
```

---

### Get Services

```http
GET /api/public/services?department=ELECTRICITY
```

**Query Parameters:**

- `department` (optional): Filter services by department

**Response:**

```json
["NEW_CONNECTION", "BILL_PAYMENT", "METER_READING"]
```

---

### Get Schemes

```http
GET /api/public/schemes?department=SOLAR
```

**Query Parameters:**

- `department` (optional): Filter schemes by department

**Response:**

```json
[
  {
    "id": "scheme-uuid",
    "name": "PM Surya Ghar",
    "department": "SOLAR",
    "description": "Rooftop solar subsidy scheme",
    "eligibilityCriteria": "Residential buildings",
    "benefits": "Up to 40% subsidy",
    "isActive": true
  }
]
```

---

### Get Scheme Details

```http
GET /api/public/schemes/:schemeId
```

**Response:**

```json
{
  "id": "scheme-uuid",
  "name": "PM Surya Ghar",
  "department": "SOLAR",
  "description": "Rooftop solar subsidy scheme"
}
```

---

### Get Tariffs

```http
GET /api/public/tariffs
```

**Response:**

```json
[
  {
    "department": "ELECTRICITY",
    "slabName": "Domestic 0-100 units",
    "rate": "₹5.50/unit"
  }
]
```

---

### Get Policies

```http
GET /api/public/policies
```

**Response:**

```json
[
  {
    "title": "Electricity Policy 2024",
    "summary": "New tariff structure"
  }
]
```

---

### Get Advisories

```http
GET /api/public/advisories
```

**Response:**

```json
[
  {
    "id": "advisory-uuid",
    "title": "Power Cut Schedule",
    "message": "Scheduled maintenance on Sunday",
    "severity": "INFO",
    "department": "ELECTRICITY",
    "isActive": true,
    "publishedAt": "2026-01-20T00:00:00.000Z"
  }
]
```

---

### Track Application Status (Public)

```http
GET /api/public/status/application/:applicationId
```

**Response:**

```json
{
  "id": "app-uuid",
  "status": "UNDER_PROCESS",
  "submittedAt": "2026-01-15T10:00:00.000Z",
  "updatedAt": "2026-01-20T15:30:00.000Z"
}
```

---

### Track Grievance Status (Public)

```http
GET /api/public/status/grievance/:grievanceId
```

**Response:**

```json
{
  "id": "grv-uuid",
  "status": "UNDER_PROCESS",
  "createdAt": "2026-01-15T10:00:00.000Z",
  "updatedAt": "2026-01-20T15:30:00.000Z"
}
```

---

## 🔐 Authentication APIs

### Request OTP (Citizen)

```http
POST /api/auth/request-otp
```

**Request Body:**

```json
{
  "mobileNumber": "9876543210"
}
```

**Response:**

```json
{
  "message": "OTP sent",
  "otp": "123456"
}
```

---

### Verify OTP (Citizen)

```http
POST /api/auth/verify-otp
```

**Request Body:**

```json
{
  "mobileNumber": "9876543210",
  "otp": "123456"
}
```

**Response:**

```json
{
  "token": "jwt-token-string",
  "expiresAt": "2026-01-21T10:00:00.000Z",
  "citizen": {
    "id": "citizen-uuid",
    "fullName": "Citizen Name",
    "mobileNumber": "9876543210",
    "email": "citizen@example.com"
  }
}
```

**Notes:**

- Auto-creates citizen if mobile number doesn't exist
- Default OTP is `123456` (configurable via `DEFAULT_OTP` env var)
- Token valid for 24 hours

---

### Logout (Citizen)

```http
POST /api/auth/logout
Authorization: Bearer <citizen_token>
```

**Response:**

```json
{
  "message": "Logged out"
}
```

---

### Admin Login

```http
POST /api/admin/auth/login
```

**Request Body:**

```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Response:**

```json
{
  "token": "jwt-token-string",
  "expiresAt": "2026-01-20T18:00:00.000Z",
  "admin": {
    "id": "admin-uuid",
    "email": "admin@example.com",
    "fullName": "Admin User",
    "role": "ADMIN"
  }
}
```

**Notes:**

- Token valid for 8 hours

---

### Admin Logout

```http
POST /api/admin/auth/logout
Authorization: Bearer <admin_token>
```

**Response:**

```json
{
  "message": "Logged out"
}
```

---

## 👤 Citizen APIs

Require citizen authentication (`Authorization: Bearer <citizen_token>`)

### Get Profile

```http
GET /api/citizen/profile
```

**Response:**

```json
{
  "id": "citizen-uuid",
  "fullName": "John Doe",
  "mobileNumber": "9876543210",
  "email": "john@example.com",
  "createdAt": "2026-01-15T10:00:00.000Z"
}
```

---

### Update Profile

```http
PUT /api/citizen/profile
```

**Request Body:**

```json
{
  "fullName": "John Doe Updated",
  "email": "newemail@example.com",
  "mobileNumber": "9876543211"
}
```

**Response:**

```json
{
  "id": "citizen-uuid",
  "fullName": "John Doe Updated",
  "mobileNumber": "9876543211",
  "email": "newemail@example.com"
}
```

---

### Get Service Accounts

```http
GET /api/citizen/service-accounts
```

**Response:**

```json
[
  {
    "id": "account-uuid",
    "accountNumber": "ELEC123456",
    "department": "ELECTRICITY",
    "address": "123 Main St",
    "isActive": true
  }
]
```

---

### Link Service Account

```http
POST /api/citizen/service-accounts/link
```

**Request Body:**

```json
{
  "accountNumber": "ELEC123456",
  "department": "ELECTRICITY"
}
```

**Response:**

```json
{
  "id": "account-uuid",
  "accountNumber": "ELEC123456",
  "department": "ELECTRICITY",
  "citizenId": "citizen-uuid",
  "isActive": true
}
```

---

## 💵 Billing APIs

Require citizen authentication.

### Get All Bills

```http
GET /api/billing/bills
```

**Response:**

```json
[
  {
    "id": "bill-uuid",
    "amount": 1250.5,
    "dueDate": "2026-01-31T00:00:00.000Z",
    "isPaid": false,
    "billingPeriodStart": "2025-12-01T00:00:00.000Z",
    "billingPeriodEnd": "2025-12-31T23:59:59.999Z",
    "serviceAccount": {
      "id": "account-uuid",
      "accountNumber": "ELEC123456",
      "department": "ELECTRICITY"
    }
  }
]
```

---

### Get Bill Details

```http
GET /api/billing/bills/:billId
```

**Response:**

```json
{
  "id": "bill-uuid",
  "amount": 1250.5,
  "dueDate": "2026-01-31T00:00:00.000Z",
  "isPaid": false,
  "unitsConsumed": 150,
  "serviceAccount": {
    "accountNumber": "ELEC123456",
    "department": "ELECTRICITY"
  }
}
```

---

### Initiate Payment

```http
POST /api/billing/payments/initiate
```

**Request Body:**

```json
{
  "billId": "bill-uuid",
  "amount": 1250.5
}
```

**Response:**

```json
{
  "id": "payment-uuid",
  "billId": "bill-uuid",
  "amount": 1250.5,
  "status": "INITIATED",
  "createdAt": "2026-01-20T10:00:00.000Z"
}
```

---

### Confirm Payment

```http
POST /api/billing/payments/confirm
```

**Request Body:**

```json
{
  "paymentId": "payment-uuid",
  "status": "SUCCESS",
  "receiptNo": "RCPT123456"
}
```

**Response:**

```json
{
  "id": "payment-uuid",
  "status": "SUCCESS",
  "receiptNo": "RCPT123456",
  "paidAt": "2026-01-20T10:05:00.000Z"
}
```

**Notes:**

- Updates bill's `isPaid` status to `true` on success
- Valid statuses: `SUCCESS`, `FAILED`

---

### Get Payment History

```http
GET /api/billing/payments/history
```

**Response:**

```json
[
  {
    "id": "payment-uuid",
    "amount": 1250.5,
    "status": "SUCCESS",
    "receiptNo": "RCPT123456",
    "paidAt": "2026-01-20T10:05:00.000Z",
    "bill": {
      "id": "bill-uuid",
      "serviceAccount": {
        "accountNumber": "ELEC123456",
        "department": "ELECTRICITY"
      }
    }
  }
]
```

---

### Get Payment Receipt

```http
GET /api/billing/payments/:paymentId/receipt
```

**Response:**

```json
{
  "id": "payment-uuid",
  "receiptNo": "RCPT123456",
  "amount": 1250.5,
  "paidAt": "2026-01-20T10:05:00.000Z",
  "bill": {
    "amount": 1250.5,
    "serviceAccount": {
      "accountNumber": "ELEC123456",
      "department": "ELECTRICITY"
    }
  }
}
```

---

## 📝 Application APIs

Require citizen authentication.

### Submit Application

```http
POST /api/applications
```

**Request Body:**

```json
{
  "department": "ELECTRICITY",
  "serviceType": "NEW_CONNECTION",
  "schemeId": "scheme-uuid"
}
```

**Response:**

```json
{
  "id": "app-uuid",
  "citizenId": "citizen-uuid",
  "department": "ELECTRICITY",
  "serviceType": "NEW_CONNECTION",
  "status": "SUBMITTED",
  "submittedAt": "2026-01-20T10:00:00.000Z"
}
```

**Notes:**

- `schemeId` is optional
- Status automatically set to `SUBMITTED`

---

### Upload Application Document

```http
POST /api/applications/:applicationId/documents
Content-Type: multipart/form-data
```

**Form Data:**

- `file`: (File upload) OR
- `fileUrl`: (String URL)

**Response:**

```json
{
  "id": "doc-uuid",
  "applicationId": "app-uuid",
  "fileUrl": "uploaded://document.pdf",
  "uploadedAt": "2026-01-20T10:05:00.000Z"
}
```

---

### Get My Applications

```http
GET /api/applications
```

**Response:**

```json
[
  {
    "id": "app-uuid",
    "department": "ELECTRICITY",
    "serviceType": "NEW_CONNECTION",
    "status": "UNDER_PROCESS",
    "submittedAt": "2026-01-20T10:00:00.000Z",
    "updatedAt": "2026-01-20T15:00:00.000Z",
    "documents": [
      {
        "id": "doc-uuid",
        "fileUrl": "uploaded://document.pdf"
      }
    ],
    "scheme": {
      "id": "scheme-uuid",
      "name": "PM Surya Ghar"
    }
  }
]
```

---

### Get Application Details

```http
GET /api/applications/:applicationId
```

**Response:**

```json
{
  "id": "app-uuid",
  "department": "ELECTRICITY",
  "serviceType": "NEW_CONNECTION",
  "status": "UNDER_PROCESS",
  "submittedAt": "2026-01-20T10:00:00.000Z",
  "documents": [...],
  "scheme": {...}
}
```

---

## 📢 Grievance APIs

Require citizen authentication.

### Submit Grievance

```http
POST /api/grievances
```

**Request Body:**

```json
{
  "department": "ELECTRICITY",
  "description": "Power outage for 3 hours daily"
}
```

**Response:**

```json
{
  "id": "grv-uuid",
  "citizenId": "citizen-uuid",
  "department": "ELECTRICITY",
  "description": "Power outage for 3 hours daily",
  "status": "SUBMITTED",
  "createdAt": "2026-01-20T10:00:00.000Z"
}
```

---

### Upload Grievance Document

```http
POST /api/grievances/:grievanceId/documents
Content-Type: multipart/form-data
```

**Form Data:**

- `file`: (File upload) OR
- `fileUrl`: (String URL)

**Response:**

```json
{
  "id": "doc-uuid",
  "grievanceId": "grv-uuid",
  "fileUrl": "uploaded://evidence.jpg",
  "uploadedAt": "2026-01-20T10:05:00.000Z"
}
```

---

### Get My Grievances

```http
GET /api/grievances
```

**Response:**

```json
[
  {
    "id": "grv-uuid",
    "department": "ELECTRICITY",
    "description": "Power outage for 3 hours daily",
    "status": "UNDER_PROCESS",
    "createdAt": "2026-01-20T10:00:00.000Z",
    "updatedAt": "2026-01-20T15:00:00.000Z",
    "documents": [...]
  }
]
```

---

### Get Grievance Details

```http
GET /api/grievances/:grievanceId
```

**Response:**

```json
{
  "id": "grv-uuid",
  "department": "ELECTRICITY",
  "description": "Power outage for 3 hours daily",
  "status": "UNDER_PROCESS",
  "createdAt": "2026-01-20T10:00:00.000Z",
  "documents": [...]
}
```

---

## 🔧 Admin APIs

Require admin authentication (`Authorization: Bearer <admin_token>`)

### Dashboard Summary

```http
GET /api/admin/dashboard/summary
```

**Response:**

```json
{
  "citizens": 150,
  "payments": 45,
  "applications": 23,
  "grievances": 12
}
```

**Notes:** Counts are for today only (since midnight)

---

### Kiosk Usage Stats

```http
GET /api/admin/dashboard/kiosk-usage
```

**Response:**

```json
{
  "sessions": 89
}
```

**Notes:** Session count for today

---

### Get All Applications (Admin)

```http
GET /api/admin/applications
```

**Response:**

```json
[
  {
    "id": "app-uuid",
    "department": "ELECTRICITY",
    "serviceType": "NEW_CONNECTION",
    "status": "SUBMITTED",
    "submittedAt": "2026-01-20T10:00:00.000Z",
    "citizen": {
      "id": "citizen-uuid",
      "fullName": "John Doe",
      "mobileNumber": "9876543210"
    },
    "documents": [...],
    "scheme": {...}
  }
]
```

---

### Get Application Details (Admin)

```http
GET /api/admin/applications/:applicationId
```

**Response:**

```json
{
  "id": "app-uuid",
  "department": "ELECTRICITY",
  "serviceType": "NEW_CONNECTION",
  "status": "UNDER_PROCESS",
  "citizen": {...},
  "documents": [...],
  "scheme": {...}
}
```

---

### Update Application Status

```http
PATCH /api/admin/applications/:applicationId/status
```

**Request Body:**

```json
{
  "status": "UNDER_PROCESS"
}
```

**Valid Status Values:**

- `UNDER_PROCESS`
- `DEMAND_NOTE_ISSUED`
- `APPROVED`
- `REJECTED`
- `DELIVERED`

**Response:**

```json
{
  "id": "app-uuid",
  "status": "UNDER_PROCESS",
  "updatedAt": "2026-01-20T16:00:00.000Z"
}
```

**Notes:** Creates audit log entry

---

### Get All Grievances (Admin)

```http
GET /api/admin/grievances
```

**Response:**

```json
[
  {
    "id": "grv-uuid",
    "department": "ELECTRICITY",
    "description": "Power outage issue",
    "status": "SUBMITTED",
    "createdAt": "2026-01-20T10:00:00.000Z",
    "citizen": {
      "id": "citizen-uuid",
      "fullName": "John Doe",
      "mobileNumber": "9876543210"
    },
    "documents": [...]
  }
]
```

---

### Update Grievance Status

```http
PATCH /api/admin/grievances/:grievanceId/status
```

**Request Body:**

```json
{
  "status": "UNDER_PROCESS"
}
```

**Valid Status Values:**

- `UNDER_PROCESS`
- `APPROVED`
- `REJECTED`
- `DELIVERED`
- `COMPLETED`

**Response:**

```json
{
  "id": "grv-uuid",
  "status": "UNDER_PROCESS",
  "updatedAt": "2026-01-20T16:00:00.000Z"
}
```

---

### Get All Payments (Admin)

```http
GET /api/admin/payments
```

**Response:**

```json
[
  {
    "id": "payment-uuid",
    "amount": 1250.5,
    "status": "SUCCESS",
    "receiptNo": "RCPT123456",
    "paidAt": "2026-01-20T10:05:00.000Z",
    "citizen": {
      "fullName": "John Doe",
      "mobileNumber": "9876543210"
    },
    "bill": {
      "serviceAccount": {
        "accountNumber": "ELEC123456",
        "department": "ELECTRICITY"
      }
    }
  }
]
```

---

### Get Payment Details (Admin)

```http
GET /api/admin/payments/:paymentId
```

**Response:**

```json
{
  "id": "payment-uuid",
  "amount": 1250.50,
  "status": "SUCCESS",
  "citizen": {...},
  "bill": {...}
}
```

---

### Create Scheme

```http
POST /api/admin/schemes
```

**Request Body:**

```json
{
  "name": "PM Surya Ghar",
  "department": "SOLAR",
  "description": "Rooftop solar subsidy",
  "eligibilityCriteria": "Residential buildings",
  "benefits": "Up to 40% subsidy",
  "isActive": true
}
```

**Response:**

```json
{
  "id": "scheme-uuid",
  "name": "PM Surya Ghar",
  "department": "SOLAR",
  "isActive": true
}
```

---

### Update Scheme

```http
PATCH /api/admin/schemes/:schemeId
```

**Request Body:**

```json
{
  "description": "Updated description",
  "isActive": false
}
```

**Response:**

```json
{
  "id": "scheme-uuid",
  "description": "Updated description",
  "isActive": false
}
```

---

### Delete Scheme

```http
DELETE /api/admin/schemes/:schemeId
```

**Response:**

```json
{
  "message": "Scheme deleted"
}
```

---

### Create Advisory

```http
POST /api/admin/advisories
```

**Request Body:**

```json
{
  "title": "Power Cut Schedule",
  "message": "Scheduled maintenance on Sunday",
  "severity": "INFO",
  "department": "ELECTRICITY",
  "isActive": true
}
```

**Valid Severity Values:**

- `INFO`
- `WARNING`
- `CRITICAL`

**Response:**

```json
{
  "id": "advisory-uuid",
  "title": "Power Cut Schedule",
  "severity": "INFO",
  "isActive": true,
  "publishedAt": "2026-01-20T16:00:00.000Z"
}
```

---

### Update Advisory

```http
PATCH /api/admin/advisories/:advisoryId
```

**Request Body:**

```json
{
  "message": "Updated message",
  "isActive": false
}
```

**Response:**

```json
{
  "id": "advisory-uuid",
  "message": "Updated message",
  "isActive": false
}
```

---

### Delete Advisory

```http
DELETE /api/admin/advisories/:advisoryId
```

**Response:**

```json
{
  "message": "Advisory deleted"
}
```

---

### Get All Citizens

```http
GET /api/admin/citizens
```

**Response:**

```json
[
  {
    "id": "citizen-uuid",
    "fullName": "John Doe",
    "mobileNumber": "9876543210",
    "email": "john@example.com",
    "createdAt": "2026-01-15T10:00:00.000Z"
  }
]
```

---

### Get Citizen Details

```http
GET /api/admin/citizens/:citizenId
```

**Response:**

```json
{
  "id": "citizen-uuid",
  "fullName": "John Doe",
  "mobileNumber": "9876543210",
  "email": "john@example.com",
  "createdAt": "2026-01-15T10:00:00.000Z"
}
```

---

### Get Active Sessions

```http
GET /api/admin/sessions/active
```

**Response:**

```json
[
  {
    "id": "session-uuid",
    "citizenId": "citizen-uuid",
    "authType": "OTP",
    "createdAt": "2026-01-20T10:00:00.000Z",
    "expiresAt": "2026-01-21T10:00:00.000Z"
  }
]
```

---

### Get Audit Logs

```http
GET /api/admin/audit-logs
```

**Response:**

```json
[
  {
    "id": "log-uuid",
    "actorType": "ADMIN",
    "actorId": "admin-uuid",
    "action": "APPLICATION_STATUS_UPDATED",
    "metadata": {
      "applicationId": "app-uuid",
      "status": "APPROVED"
    },
    "timestamp": "2026-01-20T16:00:00.000Z"
  }
]
```

---

### Get Error Reports

```http
GET /api/admin/error-reports
```

**Response:**

```json
[
  {
    "id": "error-uuid",
    "errorType": "DATABASE_ERROR",
    "message": "Connection timeout",
    "stackTrace": "...",
    "timestamp": "2026-01-20T15:30:00.000Z"
  }
]
```

---

### Create Service Account (Admin)

```http
POST /api/admin/service-accounts
```

**Request Body:**

```json
{
  "citizenId": "citizen-uuid",
  "mobileNumber": "9876543210",
  "accountNumber": "ELEC123456",
  "department": "ELECTRICITY",
  "address": "123 Main St"
}
```

**Notes:**

- Provide either `citizenId` OR `mobileNumber`
- If citizen doesn't exist, creates new citizen with mobile number

**Response:**

```json
{
  "id": "account-uuid",
  "accountNumber": "ELEC123456",
  "department": "ELECTRICITY",
  "address": "123 Main St",
  "citizenId": "citizen-uuid",
  "isActive": true
}
```

---

## Status Enums

### ApplicationStatus

- `SUBMITTED` - Initial state
- `UNDER_PROCESS` - Being reviewed
- `DEMAND_NOTE_ISSUED` - Payment required
- `PAYMENT_PENDING` - Awaiting payment
- `APPROVED` - Approved by admin
- `REJECTED` - Rejected by admin
- `DELIVERED` - Service delivered
- `COMPLETED` - Fully completed

### PaymentStatus

- `INITIATED` - Payment started
- `SUCCESS` - Payment successful
- `FAILED` - Payment failed

### Advisory Severity

- `INFO` - Informational
- `WARNING` - Warning message
- `CRITICAL` - Critical alert

---

## Error Responses

All endpoints follow a consistent error format:

```json
{
  "message": "Error description"
}
```

**Common HTTP Status Codes:**

- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `404` - Not Found
- `500` - Internal Server Error

---

## Notes

- Public endpoints never require authentication
- OTP verification accepts the default `123456` value (configurable)
- Citizen sessions expire after 24 hours
- Admin sessions expire after 8 hours
- All date/time fields are in ISO 8601 format (UTC)
- File uploads support both multipart form data and URL strings
- Audit logs are created automatically for admin actions
- CORS is enabled for all origins in development

---

## Database Schema

Key tables:

- `Citizen` - User accounts
- `Admin` - Admin accounts
- `Session` / `AdminSession` - Auth sessions
- `Application` - Service applications
- `Grievance` - Complaint tickets
- `Bill` - Utility bills
- `Payment` - Payment records
- `ServiceAccount` - Linked utility accounts
- `Scheme` - Government schemes
- `Advisory` - Public announcements
- `Document` - File uploads
- `AuditLog` - Admin activity tracking
- `ErrorReport` - System error logging

For detailed schema, see `prisma/schema.prisma`
