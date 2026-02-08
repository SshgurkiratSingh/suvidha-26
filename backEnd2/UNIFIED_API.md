# Suvidha Unified API Documentation

## Overview

The Suvidha Unified API enables external utility service providers (Electricity, Water, Gas, Sanitation, Municipal) to integrate with the Suvidha platform for bill generation, citizen management, and payment tracking.

**Key Features:**

- 🔒 Secure API key authentication with department-based access control
- 📊 Bulk bill creation (up to 100 bills per request)
- 🔍 Advanced filtering and pagination for large datasets
- 📈 Real-time statistics and analytics
- 🔔 Payment reminder system
- 📋 Comprehensive audit logging for compliance

**Available Endpoints:** 13 endpoints covering bill management, payments, citizens, service accounts, statistics, reminders, and audit logs.

## Base URL

```
Production: https://your-domain.com/api/unified
Development: http://localhost:4000/api/unified
```

## Authentication

All API requests require an API key passed in the request header.

### Header Format

```
X-API-Key: sk_electricity_abcdef1234567890...
```

### Obtaining an API Key

1. Contact the Suvidha platform administrator
2. Provide your:
   - Department (ELECTRICITY, WATER, GAS, SANITATION, MUNICIPAL)
   - Service name (e.g., "State Power Corporation")
3. Receive your unique API key (keep it secret!)

### Security Best Practices

- **Never** commit API keys to version control
- Store keys in environment variables
- Rotate keys periodically
- Revoke compromised keys immediately
- Use HTTPS in production

## Rate Limiting

- 1000 requests per hour per API key
- Burst limit: 50 requests per minute

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description"
}
```

## API Endpoints

### 1. Health Check

Check API connectivity and authentication.

**Endpoint:** `GET /health`

**Headers:**

```
X-API-Key: your_api_key
```

**Response:**

```json
{
  "success": true,
  "message": "API connection successful",
  "authenticated": true,
  "department": "ELECTRICITY",
  "serviceName": "State Power Corporation",
  "timestamp": "2026-02-08T10:30:00.000Z"
}
```

---

### 2. Create Bill

Generate a new bill for a citizen.

**Endpoint:** `POST /bills`

**Headers:**

```
X-API-Key: your_api_key
Content-Type: application/json
```

**Request Body:**

```json
{
  "mobileNumber": "9876543210",
  "consumerId": "ELEC123456",
  "address": "123 Main Street, City",
  "amount": 1250.5,
  "dueDate": "2026-03-15",
  "billingPeriod": "Feb 2026",
  "metadata": {
    "units_consumed": 450,
    "meter_reading": 12345
  }
}
```

**Field Descriptions:**

- `mobileNumber` (required): Citizen's registered mobile number
- `consumerId` (required): Unique consumer/connection ID
- `address` (required): Service address
- `amount` (required): Bill amount in currency units
- `dueDate` (required): Payment due date (ISO 8601 format)
- `billingPeriod` (optional): Billing cycle identifier
- `metadata` (optional): Custom data specific to your service

**Response:**

```json
{
  "success": true,
  "data": {
    "billId": "uuid-bill-id",
    "citizenId": "uuid-citizen-id",
    "serviceAccountId": "uuid-account-id",
    "amount": 1250.5,
    "dueDate": "2026-03-15T00:00:00.000Z"
  }
}
```

---

### 3. Create Bills in Bulk

Create multiple bills in a single request (up to 100 bills).

**Endpoint:** `POST /bills/bulk`

**Headers:**

```
X-API-Key: your_api_key
Content-Type: application/json
```

**Request Body:**

```json
{
  "bills": [
    {
      "mobileNumber": "9876543210",
      "consumerId": "ELEC123456",
      "address": "123 Main Street",
      "amount": 1250.5,
      "dueDate": "2026-03-15"
    },
    {
      "mobileNumber": "9876543211",
      "consumerId": "ELEC123457",
      "address": "456 Oak Avenue",
      "amount": 980.0,
      "dueDate": "2026-03-15"
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "created": 2,
    "failed": 0,
    "results": [
      {
        "index": 0,
        "billId": "uuid-1",
        "consumerId": "ELEC123456"
      },
      {
        "index": 1,
        "billId": "uuid-2",
        "consumerId": "ELEC123457"
      }
    ],
    "errors": []
  }
}
```

---

### 4. List Bills with Filters

Retrieve bills with pagination and filtering.

**Endpoint:** `GET /bills`

**Headers:**

```
X-API-Key: your_api_key
```

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)
- `isPaid` (optional): Filter by payment status (true/false)
- `fromDate` (optional): Filter bills created after this date (ISO 8601)
- `toDate` (optional): Filter bills created before this date (ISO 8601)
- `consumerId` (optional): Filter by specific consumer ID

**Example Request:**

```
GET /bills?page=1&limit=20&isPaid=false&fromDate=2026-02-01
```

**Response:**

```json
{
  "success": true,
  "data": {
    "bills": [
      {
        "id": "uuid",
        "amount": 1250.5,
        "dueDate": "2026-03-15T00:00:00.000Z",
        "isPaid": false,
        "createdAt": "2026-02-01T00:00:00.000Z",
        "serviceAccount": {
          "consumerId": "ELEC123456",
          "address": "123 Main Street",
          "citizen": {
            "fullName": "John Doe",
            "mobileNumber": "9876543210"
          }
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

---

### 5. Get Bills by Consumer ID

Retrieve all bills for a specific consumer.

**Endpoint:** `GET /bills/:consumerId`

**Headers:**

```
X-API-Key: your_api_key
```

**Response:**

```json
{
  "success": true,
  "data": {
    "consumerId": "ELEC123456",
    "citizen": {
      "id": "uuid",
      "fullName": "John Doe",
      "mobileNumber": "9876543210"
    },
    "bills": [
      {
        "id": "uuid",
        "amount": 1250.5,
        "dueDate": "2026-03-15T00:00:00.000Z",
        "isPaid": false,
        "createdAt": "2026-02-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

### 6. Update Bill

Modify an existing bill (amount, due date, or payment status).

**Endpoint:** `PATCH /bills/:billId`

**Headers:**

```
X-API-Key: your_api_key
Content-Type: application/json
```

**Request Body:**

```json
{
  "amount": 1300.0,
  "dueDate": "2026-03-20",
  "isPaid": true
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid-bill-id",
    "amount": 1300.0,
    "dueDate": "2026-03-20T00:00:00.000Z",
    "isPaid": true
  }
}
```

---

### 7. Delete Bill

Delete an unpaid bill (paid bills cannot be deleted).

**Endpoint:** `DELETE /bills/:billId`

**Headers:**

```
X-API-Key: your_api_key
```

**Response:**

```json
{
  "success": true,
  "message": "Bill deleted successfully"
}
```

---

### 8. Get Payment History

Retrieve payment transactions for a consumer.

**Endpoint:** `GET /payments/:consumerId`

**Headers:**

```
X-API-Key: your_api_key
```

**Response:**

```json
{
  "success": true,
  "data": {
    "consumerId": "ELEC123456",
    "payments": [
      {
        "id": "uuid",
        "amount": 1250.5,
        "status": "SUCCESS",
        "receiptNo": "REC-123456",
        "createdAt": "2026-02-10T10:30:00.000Z",
        "billAmount": 1250.5,
        "billDueDate": "2026-03-15T00:00:00.000Z"
      }
    ]
  }
}
```

---

### 9. Register/Update Citizen

Create or update citizen information.

**Endpoint:** `POST /citizens`

**Headers:**

```
X-API-Key: your_api_key
Content-Type: application/json
```

**Request Body:**

```json
{
  "mobileNumber": "9876543210",
  "fullName": "John Doe",
  "email": "john@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "fullName": "John Doe",
    "mobileNumber": "9876543210",
    "email": "john@example.com",
    "createdAt": "2026-01-15T00:00:00.000Z"
  }
}
```

---

### 10. Get Citizen Information

Retrieve citizen details and associated service accounts.

**Endpoint:** `GET /citizens/:mobileNumber`

**Headers:**

```
X-API-Key: your_api_key
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "fullName": "John Doe",
    "mobileNumber": "9876543210",
    "email": "john@example.com",
    "serviceAccounts": [
      {
        "id": "uuid",
        "department": "ELECTRICITY",
        "consumerId": "ELEC123456",
        "address": "123 Main Street",
        "active": true
      }
    ]
  }
}
```

---

### 11. Create Service Account

Register a new connection/account for a citizen.

**Endpoint:** `POST /service-accounts`

**Headers:**

```
X-API-Key: your_api_key
Content-Type: application/json
```

**Request Body:**

```json
{
  "mobileNumber": "9876543210",
  "consumerId": "ELEC789012",
  "address": "456 New Street, City"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "citizenId": "uuid",
    "department": "ELECTRICITY",
    "consumerId": "ELEC789012",
    "address": "456 New Street, City",
    "active": true,
    "createdAt": "2026-02-08T00:00:00.000Z"
  }
}
```

---

### 12. Get Statistics

Retrieve department-wide statistics including bill counts, revenue, and active connections.

**Endpoint:** `GET /statistics`

**Headers:**

```
X-API-Key: your_api_key
```

**Response:**

```json
{
  "success": true,
  "data": {
    "bills": {
      "total": 15420,
      "paid": 12850,
      "unpaid": 2570
    },
    "revenue": {
      "total": 45678900,
      "collected": 38945600,
      "pending": 6733300
    },
    "connections": {
      "active": 14200,
      "total": 15000
    }
  }
}
```

---

### 13. Get Overdue Bills

Retrieve list of overdue unpaid bills for collection management.

**Endpoint:** `GET /statistics/overdue`

**Headers:**

```
X-API-Key: your_api_key
```

**Response:**

```json
{
  "success": true,
  "data": {
    "count": 856,
    "totalAmount": 2456780,
    "bills": [
      {
        "id": "uuid",
        "amount": 1250.5,
        "dueDate": "2024-01-10T00:00:00Z",
        "isPaid": false,
        "serviceAccount": {
          "consumerId": "ELEC123456",
          "address": "123 Main Street",
          "citizen": {
            "fullName": "John Doe",
            "mobileNumber": "9876543210"
          }
        },
        "daysOverdue": 15
      }
    ]
  }
}
```

---

### 14. Send Payment Reminder

Trigger a payment reminder notification to a consumer for a specific bill.

**Endpoint:** `POST /bills/:billId/send-reminder`

**Headers:**

```
X-API-Key: your_api_key
```

**Response:**

```json
{
  "success": true,
  "message": "Payment reminder sent successfully",
  "data": {
    "billId": "uuid",
    "consumerId": "ELEC123456",
    "sentAt": "2024-01-25T14:30:00Z",
    "method": "SMS"
  }
}
```

---

### 15. Get Audit Logs

Retrieve API usage audit logs for security and compliance tracking.

**Endpoint:** `GET /audit-logs`

**Headers:**

```
X-API-Key: your_api_key
```

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)
- `fromDate` (optional): Filter logs from this date (ISO 8601)
- `toDate` (optional): Filter logs until this date (ISO 8601)

**Response:**

```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "timestamp": "2024-01-25T14:30:00Z",
        "endpoint": "POST /bills",
        "consumerId": "ELEC123456",
        "action": "create_bill",
        "status": "success"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "totalRecords": 1250,
      "totalPages": 25
    }
  }
}
```

---

### 16. Health Check

Check API availability and service status.

**Endpoint:** `GET /health`

**Response:**

```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-01-25T14:30:00Z",
  "version": "1.0.0"
}
```

---

## Error Codes

| Code | Description                                        |
| ---- | -------------------------------------------------- |
| 200  | Success                                            |
| 201  | Created                                            |
| 400  | Bad Request (missing/invalid parameters)           |
| 401  | Unauthorized (missing/invalid API key)             |
| 403  | Forbidden (API key revoked or department mismatch) |
| 404  | Not Found                                          |
| 500  | Internal Server Error                              |

## Code Examples

### cURL

```bash
curl -X POST https://your-domain.com/api/unified/bills \
  -H "X-API-Key: sk_electricity_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "mobileNumber": "9876543210",
    "consumerId": "ELEC123456",
    "address": "123 Main Street",
    "amount": 1250.50,
    "dueDate": "2026-03-15"
  }'
```

### Node.js (Axios)

#### Single Bill Creation

```javascript
const axios = require("axios");

const createBill = async () => {
  try {
    const response = await axios.post(
      "https://your-domain.com/api/unified/bills",
      {
        mobileNumber: "9876543210",
        consumerId: "ELEC123456",
        address: "123 Main Street",
        amount: 1250.5,
        dueDate: "2026-03-15",
      },
      {
        headers: {
          "X-API-Key": process.env.SUVIDHA_API_KEY,
          "Content-Type": "application/json",
        },
      },
    );
    console.log("Bill created:", response.data);
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
};
```

#### Bulk Bill Creation (Monthly Billing Run)

```javascript
const createBulkBills = async (billsData) => {
  try {
    const response = await axios.post(
      "https://your-domain.com/api/unified/bills/bulk",
      { bills: billsData }, // Max 100 bills per request
      {
        headers: {
          "X-API-Key": process.env.SUVIDHA_API_KEY,
          "Content-Type": "application/json",
        },
      },
    );
    console.log(`Created ${response.data.data.created} bills`);
    console.log(`Failed: ${response.data.data.failed}`);
    if (response.data.data.errors.length > 0) {
      console.log("Errors:", response.data.data.errors);
    }
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
};

// Example: Create 50 bills at once
const monthlyBills = Array.from({ length: 50 }, (_, i) => ({
  mobileNumber: "9876543210",
  consumerId: `ELEC${123456 + i}`,
  address: `${i + 1} Main Street`,
  amount: 1000 + Math.random() * 500,
  dueDate: "2026-03-15",
  billPeriod: "February 2026",
}));

createBulkBills(monthlyBills);
```

#### Filter Bills with Pagination

```javascript
const getUnpaidBills = async () => {
  try {
    const response = await axios.get(
      "https://your-domain.com/api/unified/bills",
      {
        params: {
          page: 1,
          limit: 50,
          isPaid: false,
          fromDate: "2026-01-01",
        },
        headers: {
          "X-API-Key": process.env.SUVIDHA_API_KEY,
        },
      },
    );
    console.log(`Found ${response.data.data.pagination.total} unpaid bills`);
    console.log("Bills:", response.data.data.bills);
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
};
```

#### Get Statistics

```javascript
const getDepartmentStats = async () => {
  try {
    const response = await axios.get(
      "https://your-domain.com/api/unified/statistics",
      {
        headers: {
          "X-API-Key": process.env.SUVIDHA_API_KEY,
        },
      },
    );
    const { bills, revenue, connections } = response.data.data;
    console.log(
      `Total Bills: ${bills.total} (${bills.paid} paid, ${bills.unpaid} unpaid)`,
    );
    console.log(
      `Revenue: ₹${revenue.total} (Collected: ₹${revenue.collected})`,
    );
    console.log(
      `Active Connections: ${connections.active}/${connections.total}`,
    );
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
};
```

### Python (Requests)

#### Single Bill Creation

```python
import requests
import os

url = "https://your-domain.com/api/unified/bills"
headers = {
    "X-API-Key": os.environ.get("SUVIDHA_API_KEY"),
    "Content-Type": "application/json"
}
payload = {
    "mobileNumber": "9876543210",
    "consumerId": "ELEC123456",
    "address": "123 Main Street",
    "amount": 1250.50,
    "dueDate": "2026-03-15"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())
```

#### Bulk Bill Creation

```python
import requests
import os

url = "https://your-domain.com/api/unified/bills/bulk"
headers = {
    "X-API-Key": os.environ.get("SUVIDHA_API_KEY"),
    "Content-Type": "application/json"
}

# Create 100 bills at once (maximum per request)
bills = [
    {
        "mobileNumber": "9876543210",
        "consumerId": f"ELEC{123456 + i}",
        "address": f"{i + 1} Main Street",
        "amount": 1000 + (i * 10),
        "dueDate": "2026-03-15",
        "billPeriod": "February 2026"
    }
    for i in range(100)
]

response = requests.post(url, json={"bills": bills}, headers=headers)
result = response.json()
print(f"Created: {result['data']['created']}, Failed: {result['data']['failed']}")
```

#### Get Overdue Bills

```python
import requests
import os

url = "https://your-domain.com/api/unified/statistics/overdue"
headers = {"X-API-Key": os.environ.get("SUVIDHA_API_KEY")}

response = requests.get(url, headers=headers)
data = response.json()['data']

print(f"Overdue Bills: {data['count']}")
print(f"Total Amount: ₹{data['totalAmount']}")
for bill in data['bills'][:5]:  # Print first 5
    print(f"  {bill['serviceAccount']['consumerId']}: ₹{bill['amount']} ({bill['daysOverdue']} days)")
```

### PHP

```php
<?php
$url = 'https://your-domain.com/api/unified/bills';
$data = [
    'mobileNumber' => '9876543210',
    'consumerId' => 'ELEC123456',
    'address' => '123 Main Street',
    'amount' => 1250.50,
    'dueDate' => '2026-03-15'
];

$options = [
    'http' => [
        'header' => [
            "Content-Type: application/json",
            "X-API-Key: " . getenv('SUVIDHA_API_KEY')
        ],
        'method' => 'POST',
        'content' => json_encode($data)
    ]
];

$context = stream_context_create($options);
$result = file_get_contents($url, false, $context);
echo $result;
?>
```

## Integration Workflow

### Typical Integration Steps:

1. **Register with Suvidha**
   - Obtain API key from administrator
   - Configure your system with the API key

2. **Sync Existing Customers**

   ```
   For each customer:
     POST /citizens (create/update citizen)
     POST /service-accounts (create connection)
   ```

3. **Generate Bills**

   ```
   Monthly/Billing Cycle:
     POST /bills (create bill for each customer)
   ```

4. **Monitor Payments**

   ```
   Periodic checks:
     GET /payments/:consumerId (check payment status)
   ```

5. **Handle Updates**

   ```
   As needed:
     PATCH /bills/:billId (update bill details)
   ```

## Webhooks (Coming Soon)

Future versions will support webhooks for real-time notifications:

- Payment received
- Bill overdue
- Service account created

## Testing

### Test Environment

Use the development base URL for testing:

```
http://localhost:4000/api/unified
```

### Sample Test Data

```bash
# Health Check
curl -X GET http://localhost:4000/api/unified/health \
  -H "X-API-Key: your_test_key"

# Create Test Bill
curl -X POST http://localhost:4000/api/unified/bills \
  -H "X-API-Key: your_test_key" \
  -H "Content-Type: application/json" \
  -d '{
    "mobileNumber": "9999999999",
    "consumerId": "TEST001",
    "address": "Test Address",
    "amount": 100.00,
    "dueDate": "2026-03-01"
  }'
```

## Changelog

### Version 1.1.0 (January 2026)

**New Features:**

- ✅ Bulk bill creation (POST /bills/bulk) - Create up to 100 bills per request
- ✅ Advanced bill filtering (GET /bills) - Filter by payment status, date range, consumer
- ✅ Bill deletion (DELETE /bills/:billId) - Delete unpaid bills
- ✅ Statistics dashboard (GET /statistics) - Department-wide analytics
- ✅ Overdue tracking (GET /statistics/overdue) - Collection management
- ✅ Payment reminders (POST /bills/:billId/send-reminder) - SMS notifications
- ✅ Audit logging (GET /audit-logs) - Compliance and security tracking

**Improvements:**

- Enhanced pagination support (max 100 items per page)
- Better error handling with detailed error messages
- Performance optimizations for large datasets

### Version 1.0.0 (December 2025)

- Initial release
- Bill management endpoints (create, read, update)
- Citizen management endpoints
- Service account management
- API key authentication
- Department-based access control

---

## Common Use Cases

### 1. Monthly Billing Run

For electricity/water departments generating thousands of bills monthly:

```javascript
// 1. Fetch all active connections from your database
const connections = await getActiveConnections(); // Your internal DB

// 2. Prepare bills in batches of 100
const batchSize = 100;
for (let i = 0; i < connections.length; i += batchSize) {
  const batch = connections.slice(i, i + batchSize).map((conn) => ({
    mobileNumber: conn.phone,
    consumerId: conn.consumerId,
    address: conn.address,
    amount: calculateBill(conn.usage), // Your calculation logic
    dueDate: "2026-03-15",
    billPeriod: "February 2026",
    previousReading: conn.lastReading,
    currentReading: conn.currentReading,
    unitsConsumed: conn.currentReading - conn.lastReading,
  }));

  // 3. Create bills in bulk
  await axios.post(
    "/api/unified/bills/bulk",
    { bills: batch },
    {
      headers: { "X-API-Key": process.env.API_KEY },
    },
  );

  console.log(`Created ${i + batch.length}/${connections.length} bills`);
}
```

### 2. Collection Management

Track and send reminders for overdue bills:

```javascript
// 1. Get all overdue bills
const overdue = await axios.get("/api/unified/statistics/overdue", {
  headers: { "X-API-Key": process.env.API_KEY },
});

// 2. Send reminders for bills overdue by 7+ days
for (const bill of overdue.data.data.bills) {
  if (bill.daysOverdue >= 7) {
    await axios.post(
      `/api/unified/bills/${bill.id}/send-reminder`,
      {},
      {
        headers: { "X-API-Key": process.env.API_KEY },
      },
    );
    console.log(`Reminder sent to ${bill.serviceAccount.consumerId}`);
  }
}
```

### 3. Dashboard Statistics

Display department-wide metrics:

```javascript
// Fetch statistics for admin dashboard
const stats = await axios.get("/api/unified/statistics", {
  headers: { "X-API-Key": process.env.API_KEY },
});

const { bills, revenue, connections } = stats.data.data;

console.log(`
=== Department Dashboard ===
Total Bills: ${bills.total}
  - Paid: ${bills.paid} (${((bills.paid / bills.total) * 100).toFixed(1)}%)
  - Unpaid: ${bills.unpaid}

Revenue:
  - Total: ₹${revenue.total.toLocaleString()}
  - Collected: ₹${revenue.collected.toLocaleString()}
  - Pending: ₹${revenue.pending.toLocaleString()}

Connections:
  - Active: ${connections.active}/${connections.total}
`);
```

### 4. Audit Compliance

Export API usage logs for compliance reporting:

```javascript
// Fetch last 30 days of audit logs
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const logs = await axios.get("/api/unified/audit-logs", {
  params: {
    fromDate: thirtyDaysAgo.toISOString(),
    limit: 100,
  },
  headers: { "X-API-Key": process.env.API_KEY },
});

// Generate CSV report
const csv = logs.data.data.logs
  .map(
    (log) =>
      `${log.timestamp},${log.endpoint},${log.consumerId},${log.action},${log.status}`,
  )
  .join("\n");

fs.writeFileSync(
  "audit-report.csv",
  "Timestamp,Endpoint,Consumer,Action,Status\n" + csv,
);
```

---

## Terms of Service

- API usage is subject to the Suvidha Platform Terms of Service
- Rate limits apply to all integrations
- Misuse may result in API key revocation

### Data Privacy

- All citizen data is protected under applicable data protection laws
- External services must comply with data handling regulations
- Data retention policies apply to all integrated services
