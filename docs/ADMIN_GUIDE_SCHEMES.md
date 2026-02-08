# Admin Guide: Configuring Scheme Eligibility & Applications

## Table of Contents

1. [Creating a New Scheme](#creating-a-new-scheme)
2. [Adding Eligibility Criteria](#adding-eligibility-criteria)
3. [Configuring Required Documents](#configuring-required-documents)
4. [Managing Applications](#managing-applications)
5. [Best Practices](#best-practices)

---

## Creating a New Scheme

### Step 1: Navigate to Admin Schemes

1. Login to admin panel
2. Go to "Manage Schemes"
3. Click "Create New Scheme"

### Step 2: Fill Basic Details

```json
{
  "title": "Solar Rooftop Subsidy 2026",
  "department": "ELECTRICITY",
  "description": "Government subsidy for installing solar panels on residential rooftops...",
  "benefits": "- 40% subsidy on installation cost\n- Free maintenance for 2 years\n- Net metering facility",
  "eligibility": "Homeowners with rooftop space and electricity connection",
  "howToApply": "1. Check eligibility\n2. Fill application form\n3. Upload documents\n4. Submit for review",
  "importantDates": {
    "startDate": "2026-02-01",
    "endDate": "2026-12-31",
    "lastDate": "2026-12-15"
  },
  "contactInfo": {
    "phone": "1800-XXX-XXXX",
    "email": "solar@electricity.gov.in",
    "website": "https://solar.gov.in"
  }
}
```

### API Call

```bash
POST /api/admin/schemes
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "title": "Solar Rooftop Subsidy 2026",
  "department": "ELECTRICITY",
  "description": "...",
  "benefits": "...",
  "eligibility": "...",
  "howToApply": "...",
  "importantDates": {...},
  "contactInfo": {...}
}
```

---

## Adding Eligibility Criteria

### Question Types

#### 1. YES_NO

Best for: Binary decisions

```json
{
  "questionText": "Do you own the property?",
  "questionType": "YES_NO",
  "helpText": "You must be the legal owner of the property to apply",
  "weightage": 30,
  "order": 1,
  "isRequired": true,
  "validationRules": {
    "expectedAnswer": "YES"
  }
}
```

#### 2. SINGLE_CHOICE

Best for: Selecting one option from multiple choices

```json
{
  "questionText": "What is your annual income?",
  "questionType": "SINGLE_CHOICE",
  "options": [
    "Less than ₹2 Lakhs",
    "₹2-5 Lakhs",
    "₹5-10 Lakhs",
    "Above ₹10 Lakhs"
  ],
  "helpText": "Select your total household income",
  "weightage": 25,
  "order": 2,
  "isRequired": true,
  "validationRules": {
    "validOptions": ["Less than ₹2 Lakhs", "₹2-5 Lakhs", "₹5-10 Lakhs"]
  }
}
```

#### 3. MULTIPLE_CHOICE

Best for: Selecting multiple options

```json
{
  "questionText": "Which documents do you currently have?",
  "questionType": "MULTIPLE_CHOICE",
  "options": ["Aadhaar Card", "PAN Card", "Ration Card", "Voter ID"],
  "helpText": "Select all that apply",
  "weightage": 10,
  "order": 3,
  "isRequired": false
}
```

#### 4. NUMBER

Best for: Numeric values

```json
{
  "questionText": "What is your age?",
  "questionType": "NUMBER",
  "helpText": "Enter your age in years",
  "weightage": 20,
  "order": 4,
  "isRequired": true,
  "validationRules": {
    "min": 18,
    "max": 65
  }
}
```

#### 5. RANGE

Best for: Values within a range

```json
{
  "questionText": "What is your monthly income?",
  "questionType": "RANGE",
  "helpText": "Enter amount in rupees",
  "weightage": 25,
  "order": 5,
  "isRequired": true,
  "validationRules": {
    "min": 0,
    "max": 50000
  }
}
```

#### 6. DATE

Best for: Date selections

```json
{
  "questionText": "When did you purchase the property?",
  "questionType": "DATE",
  "helpText": "Select the date of property purchase",
  "weightage": 15,
  "order": 6,
  "isRequired": true
}
```

#### 7. TEXT

Best for: Short text answers

```json
{
  "questionText": "What is your occupation?",
  "questionType": "TEXT",
  "helpText": "Enter your current occupation",
  "weightage": 10,
  "order": 7,
  "isRequired": false
}
```

### API Call to Add Criterion

```bash
POST /api/admin/schemes/:schemeId/eligibility-criteria
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "questionText": "Do you own the property?",
  "questionType": "YES_NO",
  "helpText": "You must be the legal owner",
  "weightage": 30,
  "order": 1,
  "isRequired": true,
  "validationRules": {
    "expectedAnswer": "YES"
  }
}
```

### Complete Example: Solar Scheme Criteria

```javascript
const criteria = [
  {
    questionText:
      "Do you own the property where solar panels will be installed?",
    questionType: "YES_NO",
    weightage: 30,
    order: 1,
    isRequired: true,
    helpText: "Only property owners are eligible",
    validationRules: { expectedAnswer: "YES" },
  },
  {
    questionText: "What is your annual household income?",
    questionType: "SINGLE_CHOICE",
    options: ["Less than ₹2L", "₹2-5L", "₹5-10L", "Above ₹10L"],
    weightage: 25,
    order: 2,
    isRequired: true,
    helpText: "Select your total household income bracket",
    validationRules: { validOptions: ["Less than ₹2L", "₹2-5L", "₹5-10L"] },
  },
  {
    questionText: "Do you have an active electricity connection?",
    questionType: "YES_NO",
    weightage: 20,
    order: 3,
    isRequired: true,
    validationRules: { expectedAnswer: "YES" },
  },
  {
    questionText: "What is the rooftop area available (in sq ft)?",
    questionType: "NUMBER",
    weightage: 15,
    order: 4,
    isRequired: true,
    helpText: "Minimum 200 sq ft required",
    validationRules: { min: 200 },
  },
  {
    questionText: "For how many years have you owned this property?",
    questionType: "NUMBER",
    weightage: 10,
    order: 5,
    isRequired: true,
    helpText: "Minimum 1 year ownership required",
    validationRules: { min: 1 },
  },
];

// Total weightage = 100
// Passing score ≥ 80 = Eligible
// Score 50-79 = Partially Eligible (may apply)
// Score < 50 = Not Eligible
```

---

## Configuring Required Documents

### Document Configuration

```json
{
  "documentName": "Property Ownership Proof",
  "description": "Legal document proving property ownership (Registry/Sale Deed)",
  "isMandatory": true,
  "acceptedFormats": ["pdf", "jpg", "png"],
  "maxSizeKB": 2048,
  "order": 1
}
```

### Common Document Types

```javascript
const documents = [
  {
    documentName: "Aadhaar Card",
    description: "Government issued identity proof",
    isMandatory: true,
    acceptedFormats: ["pdf", "jpg", "png"],
    maxSizeKB: 1024,
    order: 1,
  },
  {
    documentName: "Property Ownership Proof",
    description: "Registry, Sale Deed, or Property Tax Receipt",
    isMandatory: true,
    acceptedFormats: ["pdf"],
    maxSizeKB: 2048,
    order: 2,
  },
  {
    documentName: "Income Certificate",
    description: "Income certificate from competent authority",
    isMandatory: true,
    acceptedFormats: ["pdf"],
    maxSizeKB: 2048,
    order: 3,
  },
  {
    documentName: "Electricity Bill",
    description: "Latest electricity bill (within 3 months)",
    isMandatory: true,
    acceptedFormats: ["pdf", "jpg"],
    maxSizeKB: 1024,
    order: 4,
  },
  {
    documentName: "Passport Photo",
    description: "Recent passport size photograph",
    isMandatory: true,
    acceptedFormats: ["jpg", "png"],
    maxSizeKB: 500,
    order: 5,
  },
  {
    documentName: "Bank Passbook",
    description: "First page of bank passbook showing account details",
    isMandatory: true,
    acceptedFormats: ["pdf", "jpg"],
    maxSizeKB: 1024,
    order: 6,
  },
  {
    documentName: "Property Photos",
    description: "Photos of rooftop from different angles (optional)",
    isMandatory: false,
    acceptedFormats: ["jpg", "png"],
    maxSizeKB: 2048,
    order: 7,
  },
];
```

### API Call to Add Document

```bash
POST /api/admin/schemes/:schemeId/required-documents
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "documentName": "Aadhaar Card",
  "description": "Government issued identity proof",
  "isMandatory": true,
  "acceptedFormats": ["pdf", "jpg", "png"],
  "maxSizeKB": 1024,
  "order": 1
}
```

---

## Managing Applications

### View All Applications

```bash
GET /api/admin/scheme-applications?status=SUBMITTED&schemeId=<id>
Authorization: Bearer <admin_token>
```

### Get Application Details

```bash
GET /api/admin/scheme-applications/:applicationId
Authorization: Bearer <admin_token>
```

### Review Application

#### Approve Application

```bash
PATCH /api/admin/scheme-applications/:applicationId
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "APPROVED",
  "remarks": "All documents verified. Application approved."
}
```

#### Reject Application

```bash
PATCH /api/admin/scheme-applications/:applicationId
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "REJECTED",
  "rejectionReason": "Income exceeds eligibility limit",
  "remarks": "Annual income is ₹12 Lakhs, which exceeds the maximum limit of ₹10 Lakhs"
}
```

#### Request More Documents

```bash
PATCH /api/admin/scheme-applications/:applicationId
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "DOCUMENTS_REQUIRED",
  "remarks": "Please upload clearer copy of property ownership proof. Current document is not readable."
}
```

### Application Status Flow

```
DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED/REJECTED
                                 ↓
                          DOCUMENTS_REQUIRED → SUBMITTED
```

---

## Best Practices

### Eligibility Scoring

1. **Total Weights = 100**: Makes percentage calculation intuitive

   ```
   Example:
   - Critical question 1: 30 points
   - Critical question 2: 25 points
   - Important question: 20 points
   - Supporting questions: 15 + 10 = 25 points
   Total = 100 points
   ```

2. **Scoring Thresholds**:
   - **80-100%**: Automatically Eligible
   - **50-79%**: Partially Eligible (Manual review)
   - **0-49%**: Not Eligible

3. **Question Ordering**:
   - Put most critical questions first
   - Group related questions together
   - End with optional/supplementary questions

### Writing Good Questions

#### ✅ Good Question

```
"Do you own the property where the solar panels will be installed?"
```

- Clear and specific
- Directly related to eligibility
- Easy to answer

#### ❌ Bad Question

```
"Are you eligible for this scheme?"
```

- Vague
- Circular logic
- No guidance

#### ✅ Good Help Text

```
"You must be the legal owner of the property. Rented or leased properties are not eligible."
```

- Explains why question matters
- Clarifies edge cases

### Document Requirements

1. **Be Specific**:
   - ❌ "ID Proof"
   - ✅ "Aadhaar Card or Passport"

2. **Set Reasonable Sizes**:
   - Photos: 500KB - 1MB
   - Documents: 1-2MB
   - Forms: 2-3MB

3. **Allow Multiple Formats**:
   - PDF for official documents
   - JPG/PNG for photos and scans

4. **Mark Mandatory Clearly**:
   - Users see red asterisk (\*)
   - Submission blocked if missing

### Validation Rules

#### For Numbers

```json
{
  "validationRules": {
    "min": 18,
    "max": 65
  }
}
```

#### For Single Choice

```json
{
  "validationRules": {
    "validOptions": ["Option 1", "Option 2"]
  }
}
```

#### For Yes/No

```json
{
  "validationRules": {
    "expectedAnswer": "YES"
  }
}
```

---

## Testing Your Configuration

### Test Checklist

- [ ] Create test scheme with all fields
- [ ] Add 5-7 eligibility criteria with different types
- [ ] Configure 4-6 required documents
- [ ] Create test citizen account
- [ ] Complete eligibility survey
- [ ] Verify score calculation
- [ ] Start application
- [ ] Upload all documents
- [ ] Submit application
- [ ] Review as admin
- [ ] Approve/reject with remarks
- [ ] Verify citizen sees status update

### Sample Test Cases

**Test Case 1: Fully Eligible**

- Answer all questions correctly
- Expected: Score ≥80%, Status = ELIGIBLE
- Should allow proceeding to application

**Test Case 2: Partially Eligible**

- Answer 60% questions correctly
- Expected: Score 50-79%, Status = PARTIALLY_ELIGIBLE
- Should show warning but allow application

**Test Case 3: Not Eligible**

- Answer <50% questions correctly
- Expected: Score <50%, Status = NOT_ELIGIBLE
- Should NOT allow proceeding to application

**Test Case 4: Missing Documents**

- Complete form but skip mandatory document
- Expected: Submission blocked with error message

**Test Case 5: Wrong Document Format**

- Try uploading .docx file
- Expected: Upload rejected with format error

---

## Troubleshooting

### Issue: Eligibility score always 0

**Solution**: Check that:

- Validation rules match question type
- `validationRules.expectedAnswer` is set for YES/NO
- `validationRules.validOptions` contains actual option values
- Weightage is set for each question

### Issue: Document upload fails

**Solution**: Verify:

- File size is under limit
- File format is in `acceptedFormats` array
- Application was saved before uploading

### Issue: Form autofill not working

**Solution**: Ensure:

- Citizen has filled profile (`/schemes/profile/me`)
- Field names match between profile and form
- Profile endpoint is returning data

---

## Quick Reference

### API Endpoints Summary

```
# Schemes
POST   /api/admin/schemes
PATCH  /api/admin/schemes/:schemeId
DELETE /api/admin/schemes/:schemeId

# Eligibility Criteria
GET    /api/admin/schemes/:schemeId/eligibility-criteria
POST   /api/admin/schemes/:schemeId/eligibility-criteria
PATCH  /api/admin/eligibility-criteria/:criterionId
DELETE /api/admin/eligibility-criteria/:criterionId

# Required Documents
GET    /api/admin/schemes/:schemeId/required-documents
POST   /api/admin/schemes/:schemeId/required-documents
PATCH  /api/admin/required-documents/:documentId
DELETE /api/admin/required-documents/:documentId

# Applications
GET    /api/admin/scheme-applications
GET    /api/admin/scheme-applications/:applicationId
PATCH  /api/admin/scheme-applications/:applicationId
```

### Question Types

| Type            | Use Case           | Example                         |
| --------------- | ------------------ | ------------------------------- |
| YES_NO          | Binary decisions   | "Do you own property?"          |
| SINGLE_CHOICE   | One from many      | "Select income bracket"         |
| MULTIPLE_CHOICE | Multiple from many | "Select all documents you have" |
| NUMBER          | Numeric value      | "Enter your age"                |
| RANGE           | Value in range     | "Enter monthly income"          |
| DATE            | Date selection     | "Date of birth"                 |
| TEXT            | Short text         | "Occupation"                    |
