# Unified API Quick Reference

## Authentication

```bash
# All requests require this header:
X-API-Key: sk_electricity_your_64_character_hex_key_here
```

## Base URL

```
Production: https://your-domain.com/api/unified
Development: http://localhost:4000/api/unified
```

---

## Quick Start (5 Minutes)

### 1. Get Your API Key

Contact admin → Receive key like `sk_electricity_abc123...` → Store in env variable

### 2. Test Connection

```bash
curl -X GET http://localhost:4000/api/unified/health \
  -H "X-API-Key: YOUR_API_KEY"
```

### 3. Create Your First Bill

```bash
curl -X POST http://localhost:4000/api/unified/bills \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "mobileNumber": "9876543210",
    "consumerId": "ELEC123456",
    "address": "123 Main Street",
    "amount": 1250.50,
    "dueDate": "2026-03-15"
  }'
```

---

## Common Endpoints Cheat Sheet

| Endpoint                       | Method | Purpose                 | Max Items |
| ------------------------------ | ------ | ----------------------- | --------- |
| `/health`                      | GET    | Check API status        | -         |
| `/bills`                       | POST   | Create single bill      | -         |
| `/bills/bulk`                  | POST   | Create multiple bills   | 100       |
| `/bills`                       | GET    | List/filter bills       | 100/page  |
| `/bills/:consumerId`           | GET    | Get bills for consumer  | -         |
| `/bills/:billId`               | PATCH  | Update bill             | -         |
| `/bills/:billId`               | DELETE | Delete unpaid bill      | -         |
| `/bills/:billId/send-reminder` | POST   | Send payment reminder   | -         |
| `/payments/:consumerId`        | GET    | Get payment history     | -         |
| `/citizens`                    | POST   | Register/update citizen | -         |
| `/citizens/:mobileNumber`      | GET    | Get citizen details     | -         |
| `/service-accounts`            | POST   | Create service account  | -         |
| `/statistics`                  | GET    | Department statistics   | -         |
| `/statistics/overdue`          | GET    | Overdue bills           | -         |
| `/audit-logs`                  | GET    | API usage logs          | 100/page  |

---

## Essential Code Snippets

### Node.js Setup

```javascript
const axios = require("axios");

const apiClient = axios.create({
  baseURL: process.env.SUVIDHA_API_URL || "http://localhost:4000/api/unified",
  headers: {
    "X-API-Key": process.env.SUVIDHA_API_KEY,
    "Content-Type": "application/json",
  },
});

module.exports = apiClient;
```

### Create Single Bill

```javascript
const createBill = async (billData) => {
  const response = await apiClient.post("/bills", {
    mobileNumber: billData.phone,
    consumerId: billData.consumerId,
    address: billData.address,
    amount: billData.amount,
    dueDate: billData.dueDate,
    metadata: {
      // optional
      previousReading: billData.prevReading,
      currentReading: billData.currReading,
      unitsConsumed: billData.units,
      billPeriod: "January 2026",
    },
  });
  return response.data;
};
```

### Bulk Create Bills (Monthly Run)

```javascript
const createMonthlyBills = async (allBills) => {
  const batchSize = 100;
  let totalCreated = 0;
  let totalFailed = 0;

  for (let i = 0; i < allBills.length; i += batchSize) {
    const batch = allBills.slice(i, i + batchSize);

    const response = await apiClient.post("/bills/bulk", { bills: batch });

    totalCreated += response.data.data.created;
    totalFailed += response.data.data.failed;

    console.log(`Progress: ${i + batch.length}/${allBills.length}`);
  }

  console.log(`Completed: ${totalCreated} created, ${totalFailed} failed`);
};
```

### Get Unpaid Bills

```javascript
const getUnpaidBills = async (page = 1, limit = 50) => {
  const response = await apiClient.get("/bills", {
    params: {
      page,
      limit,
      isPaid: false,
    },
  });
  return response.data.data;
};
```

### Get Statistics

```javascript
const getDashboardStats = async () => {
  const response = await apiClient.get("/statistics");
  const { bills, revenue, connections } = response.data.data;

  return {
    billsPaid: bills.paid,
    billsUnpaid: bills.unpaid,
    collectionRate: ((bills.paid / bills.total) * 100).toFixed(1),
    revenueCollected: revenue.collected,
    revenuePending: revenue.pending,
    activeConnections: connections.active,
  };
};
```

### Send Overdue Reminders

```javascript
const sendOverdueReminders = async (minDaysOverdue = 7) => {
  const response = await apiClient.get("/statistics/overdue");
  const overdueBills = response.data.data.bills;

  for (const bill of overdueBills) {
    if (bill.daysOverdue >= minDaysOverdue) {
      await apiClient.post(`/bills/${bill.id}/send-reminder`);
      console.log(`Reminder sent: ${bill.serviceAccount.consumerId}`);
    }
  }
};
```

### Get Bills for Consumer

```javascript
const getConsumerBills = async (consumerId) => {
  const response = await apiClient.get(`/bills/${consumerId}`);
  return response.data.data;
};
```

### Register New Citizen

```javascript
const registerCitizen = async (citizenData) => {
  const response = await apiClient.post("/citizens", {
    mobileNumber: citizenData.phone,
    fullName: citizenData.name,
    email: citizenData.email,
  });
  return response.data.data;
};
```

### Create Service Account

```javascript
const createConnection = async (phone, consumerId, address) => {
  const response = await apiClient.post("/service-accounts", {
    mobileNumber: phone,
    consumerId,
    address,
  });
  return response.data.data;
};
```

---

## Python Quick Start

```python
import requests
import os

class SuvidhaAPI:
    def __init__(self):
        self.base_url = os.getenv('SUVIDHA_API_URL', 'http://localhost:4000/api/unified')
        self.api_key = os.getenv('SUVIDHA_API_KEY')
        self.headers = {
            'X-API-Key': self.api_key,
            'Content-Type': 'application/json'
        }

    def create_bill(self, mobile, consumer_id, address, amount, due_date, **metadata):
        data = {
            'mobileNumber': mobile,
            'consumerId': consumer_id,
            'address': address,
            'amount': amount,
            'dueDate': due_date,
            'metadata': metadata
        }
        response = requests.post(f'{self.base_url}/bills', json=data, headers=self.headers)
        return response.json()

    def create_bulk_bills(self, bills):
        response = requests.post(
            f'{self.base_url}/bills/bulk',
            json={'bills': bills},
            headers=self.headers
        )
        return response.json()

    def get_statistics(self):
        response = requests.get(f'{self.base_url}/statistics', headers=self.headers)
        return response.json()['data']

    def get_overdue_bills(self):
        response = requests.get(f'{self.base_url}/statistics/overdue', headers=self.headers)
        return response.json()['data']

    def send_reminder(self, bill_id):
        response = requests.post(
            f'{self.base_url}/bills/{bill_id}/send-reminder',
            headers=self.headers
        )
        return response.json()

# Usage
api = SuvidhaAPI()

# Create single bill
result = api.create_bill(
    mobile='9876543210',
    consumer_id='ELEC123456',
    address='123 Main Street',
    amount=1250.50,
    due_date='2026-03-15',
    billPeriod='January 2026',
    unitsConsumed=250
)

# Get statistics
stats = api.get_statistics()
print(f"Collection Rate: {stats['bills']['paid'] / stats['bills']['total'] * 100:.1f}%")

# Send reminders for overdue bills
overdue = api.get_overdue_bills()
for bill in overdue['bills']:
    if bill['daysOverdue'] >= 7:
        api.send_reminder(bill['id'])
```

---

## Common Query Patterns

### Filter Bills by Date Range

```javascript
GET /bills?fromDate=2026-01-01&toDate=2026-01-31
```

### Get Unpaid Bills with Pagination

```javascript
GET /bills?isPaid=false&page=1&limit=50
```

### Get Bills for Specific Consumer

```javascript
GET /bills?consumerId=ELEC123456
```

### Get Audit Logs for Last 30 Days

```javascript
GET /audit-logs?fromDate=2025-12-25&limit=100
```

---

## Error Handling

### Standard Error Response

```json
{
  "success": false,
  "message": "Error description here"
}
```

### Common Error Codes

| Code | Meaning      | Action                              |
| ---- | ------------ | ----------------------------------- |
| 400  | Bad Request  | Check request parameters            |
| 401  | Unauthorized | Check API key                       |
| 403  | Forbidden    | API key revoked or wrong department |
| 404  | Not Found    | Resource doesn't exist              |
| 429  | Rate Limited | Wait and retry                      |
| 500  | Server Error | Contact support                     |

### Error Handling Example

```javascript
try {
  const bill = await apiClient.post("/bills", billData);
} catch (error) {
  if (error.response) {
    // Server responded with error
    console.error(
      `Error ${error.response.status}:`,
      error.response.data.message,
    );

    if (error.response.status === 401) {
      console.error("Invalid API key");
    } else if (error.response.status === 400) {
      console.error("Invalid bill data:", billData);
    }
  } else {
    // Network error
    console.error("Network error:", error.message);
  }
}
```

---

## Performance Tips

1. **Use Bulk Operations:** Create 100 bills at once instead of 100 single requests
2. **Implement Pagination:** Don't fetch all bills at once, use `page` and `limit`
3. **Cache Statistics:** Statistics don't change every second, cache for 5-10 minutes
4. **Batch Reminders:** Send reminders in batches during off-peak hours
5. **Use Filters:** Filter on server-side instead of fetching everything

---

## Security Best Practices

1. **Never commit API keys** to version control
2. **Store keys in environment variables**
3. **Rotate keys every 90 days**
4. **Use HTTPS in production** (never HTTP)
5. **Log API failures** for security monitoring
6. **Implement retry logic** with exponential backoff
7. **Validate data** before sending to API

---

## Testing Your Integration

### 1. Test Health Check

```bash
curl -X GET http://localhost:4000/api/unified/health \
  -H "X-API-Key: YOUR_KEY"
```

**Expected:** `{"success": true, "status": "healthy"}`

### 2. Test Bill Creation

```bash
curl -X POST http://localhost:4000/api/unified/bills \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber":"9999999999","consumerId":"TEST001","address":"Test","amount":100,"dueDate":"2026-03-01"}'
```

**Expected:** `{"success": true, "data": {...}}`

### 3. Test Statistics

```bash
curl -X GET http://localhost:4000/api/unified/statistics \
  -H "X-API-Key: YOUR_KEY"
```

**Expected:** `{"success": true, "data": {"bills": {...}, "revenue": {...}}}`

---

## Need Help?

- 📖 **Full Documentation:** See `UNIFIED_API.md`
- 📋 **Feature Details:** See `API_ENHANCEMENTS.md`
- 🐛 **Issues:** Contact api-support@suvidha.gov.in
- 💬 **Questions:** Create GitHub issue (if applicable)

---

**Last Updated:** January 2026  
**API Version:** 1.1.0
