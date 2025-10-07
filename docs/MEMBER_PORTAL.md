# Member Portal Documentation

## Overview

The Member Portal is the primary interface for OPDWallet members to manage their healthcare benefits, appointments, claims, and lab diagnostics.

**Portal URL**: `/member` (http://51.20.125.246/member)
**Access Level**: MEMBER role
**Platform**: Next.js web application (`/web-member`)

---

## Table of Contents

1. [Dashboard](#dashboard)
2. [Family Management](#family-management)
3. [Appointments](#appointments)
4. [Claims & Reimbursements](#claims--reimbursements)
5. [Lab Diagnostics](#lab-diagnostics)
6. [Wallet](#wallet)
7. [Navigation Structure](#navigation-structure)
8. [API Endpoints](#api-endpoints)
9. [Frontend Architecture](#frontend-architecture)

---

## Dashboard

The member dashboard serves as the central hub for all member activities.

### Key Components

- **Wallet Balance**: Display current wallet balance and transaction history
- **Benefits Summary**: Overview of available healthcare benefits
- **Quick Actions**: Fast access to common tasks
  - Book Appointment
  - Upload Lab Prescription
  - File Claim
  - Add Family Member
- **Recent Activity**: Latest appointments, claims, and lab orders
- **Upcoming Appointments**: Calendar view of scheduled consultations

---

## Family Management

Members can add and manage dependents under their account.

### Features

- **Add Dependents**: Register family members for coverage
- **View Family Members**: List all dependents with their details
- **Update Information**: Edit dependent profiles
- **Coverage Details**: View benefits applicable to each family member

### User Flow

1. Navigate to Family Management section
2. Click "Add Dependent"
3. Fill in required information:
   - Full Name
   - Relationship
   - Date of Birth
   - Contact Details
4. Submit for verification
5. Dependent added to account

---

## Appointments

The appointment system supports two consultation types with distinct booking workflows.

### Consultation Types

#### 1. IN_CLINIC Appointments

**Workflow**:
```
Select Doctor → Choose Date → Select Time Slot → Confirm Booking
```

**Features**:
- Browse doctors by specialization
- View doctor profiles and availability
- Select preferred clinic location
- Choose available time slots
- Receive booking confirmation
- Add to calendar

#### 2. ONLINE Appointments

**Workflow**:
```
Select Doctor → Choose Date → Select Time Slot → Join Video Call
```

**Features**:
- Virtual consultation support
- Video call integration
- Screen sharing capabilities
- Digital prescription delivery
- Session recordings (if applicable)

### Appointment Management

- **View Bookings**: `/member/bookings`
- **Reschedule**: Modify appointment date/time
- **Cancel**: Cancel upcoming appointments
- **History**: View past consultation records
- **Prescriptions**: Download digital prescriptions

---

## Claims & Reimbursements

Members can file claims for out-of-pocket healthcare expenses and track reimbursement status. ✨ **Enhanced with dependent claim management and cancellation support**.

### Features

- **File New Claim**: Submit reimbursement requests for self or dependents
- **Dependent Claims**: Primary members can file claims on behalf of dependents
- **Upload Documents**: Attach bills, prescriptions, and receipts
- **Track Status**: Monitor claim processing stages with detailed timeline
- **View History**: Access past claim records with advanced filtering
- **Cancel Claims**: Cancel submitted claims before processing
- **Download Reports**: Get claim summary documents
- **TPA Communication**: View notes and updates from TPA reviewers

### Claim Workflow

```
Submit Claim → Upload Documents → TPA Assignment → TPA Review → Approval/Rejection → Reimbursement
```

### Claim Statuses

- **DRAFT**: Claim created but not submitted
- **SUBMITTED**: Submitted, awaiting TPA assignment
- **UNASSIGNED**: Awaiting TPA assignment
- **ASSIGNED**: Assigned to TPA reviewer
- **UNDER_REVIEW**: Being processed by TPA team
- **DOCUMENTS_REQUIRED**: Additional documents requested
- **APPROVED**: Claim approved, payment processing
- **PARTIALLY_APPROVED**: Partial amount approved
- **REJECTED**: Claim denied with reason
- **CANCELLED**: Claim cancelled by member ✨ NEW
- **PAYMENT_PENDING**: Approved, awaiting payment
- **PAYMENT_PROCESSING**: Payment being processed
- **PAYMENT_COMPLETED**: Reimbursement completed

### Dependent Claim Management ✨ NEW

Primary members (relationship: SELF) can:
- File claims on behalf of their dependents
- View claims submitted by them for dependents
- Cancel dependent claims
- Track all family member claims

**Implementation Details**:
- `userId`: The claim owner (person receiving reimbursement)
- `createdBy`: The person who submitted the claim
- Wallet debit/credit uses `userId` (claim owner)
- File access allowed for both submitter and claim owner

### Claim Cancellation ✨ NEW

**Cancellable Status**: DRAFT, SUBMITTED, UNASSIGNED, ASSIGNED, UNDER_REVIEW, DOCUMENTS_REQUIRED, RESUBMISSION_REQUIRED

**Non-Cancellable Status**: APPROVED, PARTIALLY_APPROVED, REJECTED, CANCELLED, PAYMENT_PENDING, PAYMENT_PROCESSING, PAYMENT_COMPLETED

**Cancellation Flow**:
1. Member clicks "Cancel Claim" button
2. Optional cancellation reason provided
3. System validates claim status
4. Wallet refund triggered (if wallet was debited)
5. Status changed to CANCELLED
6. Cancellation logged in status history

**API Endpoint**:
```
PATCH /api/member/claims/:claimId/cancel
Body: { reason?: string }
```

### Enhanced UI Features ✨ NEW

**Claims List Page** (`/member/claims/page.tsx`):
- **Status Badges**: Color-coded status indicators including cancelled (gray)
- **Status Filter**: Includes "Cancelled" option in status dropdown
- **Auto-Refresh**: Page refreshes data when tab becomes visible
- **Sorting**: Sort by date, amount, status, type
- **View Modes**: Table or card view
- **Pagination**: 10 items per page

**Status Colors**:
- Approved: Green
- Rejected: Red
- Cancelled: Gray ✨ NEW
- Processing/Payment: Blue
- Under Review: Amber
- Draft: Gray

---

## Lab Diagnostics

A comprehensive lab test ordering system allowing members to upload prescriptions, select vendors, and track lab orders.

### Overview

The Lab Diagnostics module is a major feature enabling end-to-end lab test management from prescription upload to report download.

### Complete Lab Workflow

```
Member uploads prescription
   ↓
OPS team digitizes prescription → Creates cart with test items
   ↓
Member views cart → Enters pincode → Views available vendors
   ↓
Member selects vendor → Reviews pricing
   ↓
Member chooses collection type (Home Sample Collection / Visit Center)
   ↓
Member selects date and time slot
   ↓
Member places order
   ↓
OPS confirms order → Sample collected → Sample processed
   ↓
OPS uploads test report
   ↓
Member receives notification → Downloads report
```

### Key Features

#### 1. Prescription Upload

**Page**: `/member/lab-tests/upload`
**File**: `/web-member/app/member/lab-tests/upload/page.tsx`

**Functionality**:
- Upload prescription images (JPEG, PNG, PDF)
- Multiple file support
- Preview uploaded files
- Add notes/special instructions
- Submit for digitization

**API Endpoint**:
```
POST /api/member/lab/prescriptions/upload
```

#### 2. View Prescriptions

**Functionality**:
- List all uploaded prescriptions
- View prescription status (PENDING, DIGITIZED, CART_CREATED)
- Download prescription images
- Track processing progress

**API Endpoint**:
```
GET /api/member/lab/prescriptions
```

#### 3. Active Carts

**Functionality**:
- View carts created from digitized prescriptions
- See test items added by OPS team
- Check cart status
- Proceed to vendor selection

**API Endpoint**:
```
GET /api/member/lab/carts/active
```

#### 4. Cart Details & Vendor Selection

**Page**: `/member/lab-tests/cart/[id]`
**File**: `/web-member/app/member/lab-tests/cart/[id]/page.tsx`

**Functionality**:
- View complete cart details
- Review test items and descriptions
- Enter pincode for vendor availability
- Compare available vendors
- View vendor ratings and reviews
- Select preferred vendor

**API Endpoints**:
```
GET /api/member/lab/carts/:cartId
GET /api/member/lab/vendors/available?pincode={pincode}
```

#### 5. Vendor Pricing & Slot Booking

**Page**: `/member/lab-tests/cart/[id]/vendor/[vendorId]`
**File**: `/web-member/app/member/lab-tests/cart/[id]/vendor/[vendorId]/page.tsx`

**Functionality**:
- View vendor-specific pricing for each test
- See total cost breakdown
- Choose collection type:
  - **Home Sample Collection**: Vendor visits member's address
  - **Visit Center**: Member visits lab center
- Select date from available slots
- Select time slot
- Confirm order details

**API Endpoints**:
```
GET /api/member/lab/vendors/:vendorId/pricing
GET /api/member/lab/vendors/:vendorId/slots?pincode={pincode}&date={date}
POST /api/member/lab/orders
```

#### 6. Track Orders

**Page**: `/member/lab-tests/orders`
**File**: `/web-member/app/member/lab-tests/orders/page.tsx`

**Functionality**:
- List all lab orders
- View order status
- Filter by status (PENDING, CONFIRMED, SAMPLE_COLLECTED, COMPLETED)
- Quick access to order details
- Reorder tests

**API Endpoint**:
```
GET /api/member/lab/orders
```

#### 7. Order Details & Reports

**Page**: `/member/lab-tests/orders/[orderId]`
**File**: `/web-member/app/member/lab-tests/orders/[orderId]/page.tsx`

**Functionality**:
- View complete order information
- See vendor details
- Check collection date and time
- Track order status timeline
- Download test reports (when available)
- View individual test results
- Share reports with doctors

**API Endpoint**:
```
GET /api/member/lab/orders/:orderId
```

### Lab Order Statuses

| Status | Description |
|--------|-------------|
| **PENDING** | Order placed, awaiting OPS confirmation |
| **CONFIRMED** | OPS confirmed, sample collection scheduled |
| **SAMPLE_COLLECTED** | Sample collected from member |
| **PROCESSING** | Tests being conducted at lab |
| **COMPLETED** | Results ready, report uploaded |
| **CANCELLED** | Order cancelled by member or OPS |

### Collection Types

#### Home Sample Collection
- Vendor technician visits member's address
- Available for most routine tests
- Additional charges may apply
- Preferred time slots available

#### Visit Center
- Member visits lab center
- Usually lower cost
- Walk-in or scheduled appointments
- Immediate sample collection

---

## Wallet

The wallet system manages member healthcare spending and benefits.

### Features

- **Balance Overview**: Current available balance
- **Transaction History**: All debits and credits
- **Top-up Options**: Add funds to wallet (if applicable)
- **Spending Analytics**: Breakdown by category
- **Benefit Utilization**: Track benefit usage

### Transaction Types

- **APPOINTMENT_PAYMENT**: Consultation fees
- **LAB_ORDER_PAYMENT**: Lab test payments
- **CLAIM_REIMBURSEMENT**: Approved claim credits
- **WALLET_TOPUP**: Manual fund additions
- **REFUND**: Cancelled service refunds

---

## Navigation Structure

### Bottom Navigation Bar

The member portal features a persistent bottom navigation with four main sections:

| Icon | Label | Route | Description |
|------|-------|-------|-------------|
| Home | Home | `/member` | Dashboard and overview |
| Receipt | Claims | `/member/claims` | Claims and reimbursements |
| Calendar | Bookings | `/member/bookings` | Appointment management |
| Wallet | Wallet | `/member/wallet` | Wallet and transactions |

**Note**: Lab Tests functionality is integrated into the main flow and accessible from the dashboard, rather than having a dedicated bottom navigation item.

### Top Navigation

- **Profile**: Access account settings
- **Notifications**: View alerts and updates
- **Help**: Support and FAQs
- **Logout**: Sign out of portal

---

## API Endpoints

### Lab Diagnostics APIs

#### Prescription Management

```http
POST /api/member/lab/prescriptions/upload
Content-Type: multipart/form-data

Request Body:
- prescription: File (image/pdf)
- notes: String (optional)

Response:
{
  "id": "prescription_id",
  "status": "PENDING",
  "uploadedAt": "2025-10-05T10:30:00Z"
}
```

```http
GET /api/member/lab/prescriptions

Response:
{
  "prescriptions": [
    {
      "id": "prescription_id",
      "status": "DIGITIZED",
      "uploadedAt": "2025-10-05T10:30:00Z",
      "fileUrl": "https://...",
      "cartId": "cart_id"
    }
  ]
}
```

#### Cart Management

```http
GET /api/member/lab/carts/active

Response:
{
  "carts": [
    {
      "id": "cart_id",
      "prescriptionId": "prescription_id",
      "items": [
        {
          "testName": "Complete Blood Count",
          "testCode": "CBC",
          "description": "Full blood panel analysis"
        }
      ],
      "status": "ACTIVE",
      "createdAt": "2025-10-05T11:00:00Z"
    }
  ]
}
```

```http
GET /api/member/lab/carts/:cartId

Response:
{
  "id": "cart_id",
  "items": [...],
  "totalTests": 5,
  "status": "ACTIVE"
}
```

#### Vendor Selection

```http
GET /api/member/lab/vendors/available?pincode=110001

Response:
{
  "vendors": [
    {
      "id": "vendor_id",
      "name": "PathLabs",
      "rating": 4.5,
      "reviewCount": 1250,
      "homeCollectionAvailable": true,
      "centerVisitAvailable": true,
      "distance": "2.5 km"
    }
  ]
}
```

```http
GET /api/member/lab/vendors/:vendorId/pricing

Response:
{
  "vendorId": "vendor_id",
  "pricing": [
    {
      "testCode": "CBC",
      "price": 350,
      "discountedPrice": 280,
      "homeCollectionCharge": 50
    }
  ],
  "totalCost": 1400,
  "homeCollectionCharge": 50
}
```

#### Slot Booking

```http
GET /api/member/lab/vendors/:vendorId/slots?pincode=110001&date=2025-10-06

Response:
{
  "date": "2025-10-06",
  "homeCollection": {
    "available": true,
    "slots": [
      {
        "time": "08:00",
        "available": true
      },
      {
        "time": "09:00",
        "available": false
      }
    ]
  },
  "centerVisit": {
    "available": true,
    "centerAddress": "123 Medical Complex, Connaught Place",
    "slots": [...]
  }
}
```

#### Order Management

```http
POST /api/member/lab/orders

Request Body:
{
  "cartId": "cart_id",
  "vendorId": "vendor_id",
  "collectionType": "HOME_COLLECTION",
  "date": "2025-10-06",
  "timeSlot": "08:00",
  "address": {
    "line1": "123 Main Street",
    "city": "New Delhi",
    "pincode": "110001"
  }
}

Response:
{
  "orderId": "order_id",
  "status": "PENDING",
  "totalAmount": 1450,
  "scheduledDate": "2025-10-06T08:00:00Z"
}
```

```http
GET /api/member/lab/orders

Response:
{
  "orders": [
    {
      "id": "order_id",
      "vendorName": "PathLabs",
      "status": "CONFIRMED",
      "scheduledDate": "2025-10-06T08:00:00Z",
      "totalAmount": 1450,
      "testCount": 5
    }
  ]
}
```

```http
GET /api/member/lab/orders/:orderId

Response:
{
  "id": "order_id",
  "status": "COMPLETED",
  "vendor": {
    "name": "PathLabs",
    "contact": "+91-9876543210"
  },
  "collectionType": "HOME_COLLECTION",
  "scheduledDate": "2025-10-06T08:00:00Z",
  "items": [
    {
      "testName": "Complete Blood Count",
      "status": "COMPLETED",
      "reportUrl": "https://..."
    }
  ],
  "totalAmount": 1450,
  "paymentStatus": "PAID"
}
```

### Appointment APIs

```http
GET /api/member/appointments
POST /api/member/appointments
PUT /api/member/appointments/:id
DELETE /api/member/appointments/:id
```

### Claims APIs

```http
GET /api/member/claims
POST /api/member/claims
GET /api/member/claims/:id
```

### Wallet APIs

```http
GET /api/member/wallet/balance
GET /api/member/wallet/transactions
POST /api/member/wallet/topup
```

---

## Frontend Architecture

### Lab Diagnostics Pages

The lab module consists of 7 dedicated pages:

#### 1. Lab Tests Hub
**Path**: `/web-member/app/member/lab-tests/page.tsx`
**Purpose**: Landing page for lab diagnostics
**Features**:
- Quick actions (Upload Prescription, View Orders)
- Active carts display
- Recent orders
- FAQ section

#### 2. Upload Prescription
**Path**: `/web-member/app/member/lab-tests/upload/page.tsx`
**Purpose**: Prescription upload interface
**Components**:
- File upload widget
- Image preview
- Multi-file support
- Notes input

#### 3. Cart View
**Path**: `/web-member/app/member/lab-tests/cart/[id]/page.tsx`
**Purpose**: Display cart items and vendor selection
**Components**:
- Test items list
- Pincode input
- Vendor cards
- Comparison table

#### 4. Vendor Details & Booking
**Path**: `/web-member/app/member/lab-tests/cart/[id]/vendor/[vendorId]/page.tsx`
**Purpose**: Pricing, slot selection, and order placement
**Components**:
- Price breakdown
- Collection type selector
- Date picker
- Time slot grid
- Order summary
- Payment gateway

#### 5. Orders List
**Path**: `/web-member/app/member/lab-tests/orders/page.tsx`
**Purpose**: Display all lab orders
**Components**:
- Order cards
- Status filters
- Search functionality
- Sort options

#### 6. Order Details
**Path**: `/web-member/app/member/lab-tests/orders/[orderId]/page.tsx`
**Purpose**: Detailed order view and report download
**Components**:
- Order timeline
- Test results table
- Report download buttons
- Vendor contact info
- Reschedule/Cancel options

#### 7. Prescriptions (implied from workflow)
**Path**: `/web-member/app/member/lab-tests/prescriptions/page.tsx` (likely)
**Purpose**: Manage uploaded prescriptions
**Components**:
- Prescription history
- Status tracking
- Download options

### Component Structure

```
web-member/
├── app/
│   └── member/
│       ├── page.tsx (Dashboard)
│       ├── bookings/
│       ├── claims/
│       ├── wallet/
│       ├── lab-tests/
│       │   ├── page.tsx (Hub)
│       │   ├── upload/
│       │   │   └── page.tsx
│       │   ├── cart/
│       │   │   └── [id]/
│       │   │       ├── page.tsx
│       │   │       └── vendor/
│       │   │           └── [vendorId]/
│       │   │               └── page.tsx
│       │   └── orders/
│       │       ├── page.tsx
│       │       └── [orderId]/
│       │           └── page.tsx
│       └── family/
├── components/
│   └── member/
│       ├── BottomNav.tsx
│       ├── DashboardCard.tsx
│       ├── LabCartItem.tsx
│       ├── VendorCard.tsx
│       ├── OrderTimeline.tsx
│       └── ...
└── lib/
    └── api/
        └── member/
            ├── lab.ts
            ├── appointments.ts
            ├── claims.ts
            └── wallet.ts
```

---

## User Guides

### How to Upload Lab Prescription

1. Login to Member Portal
2. Navigate to Dashboard
3. Click "Upload Lab Prescription" or go to Lab Tests section
4. Click "Upload" button
5. Select prescription image/PDF
6. Add any special notes (optional)
7. Submit
8. Wait for OPS team to digitize (usually 2-4 hours)
9. Receive notification when cart is ready

### How to Book Lab Tests

1. Go to Lab Tests section
2. View active carts
3. Select cart to proceed
4. Enter your pincode
5. Browse available vendors
6. Compare pricing and reviews
7. Select preferred vendor
8. Choose collection type (Home/Center)
9. Select date and time slot
10. Review order summary
11. Confirm and pay
12. Receive booking confirmation

### How to Download Lab Reports

1. Go to Lab Tests > Orders
2. Find completed order
3. Click on order to view details
4. Locate test results section
5. Click "Download Report" for each test
6. Reports saved to your device
7. Share with doctor if needed

### How to Book an Appointment

#### For IN_CLINIC:
1. Click "Book Appointment" on dashboard
2. Select "In-Clinic" consultation
3. Browse doctors or search by specialty
4. Choose preferred doctor
5. Select available date
6. Choose time slot
7. Confirm booking
8. Receive confirmation notification

#### For ONLINE:
1. Click "Book Appointment" on dashboard
2. Select "Online" consultation
3. Browse available doctors
4. Choose doctor
5. Select date and time
6. Confirm booking
7. Receive video call link via email/SMS
8. Join consultation at scheduled time

### How to File a Claim

1. Navigate to Claims section
2. Click "File New Claim"
3. Select claim type
4. Enter claim amount
5. Upload supporting documents:
   - Bills
   - Prescriptions
   - Medical reports
6. Add description
7. Submit claim
8. Track status in Claims section
9. Receive notification on approval/rejection
10. Reimbursement credited to wallet

---

## Feature Access Matrix

| Feature | MEMBER | DEPENDENT |
|---------|--------|-----------|
| Dashboard | Full Access | Limited View |
| Appointments | Book & Manage | Via Primary Member |
| Lab Tests | Full Access | Via Primary Member |
| Claims | File & Track | Via Primary Member |
| Wallet | Full Access | View Only |
| Family Management | Add/Edit | N/A |

---

## Integration Points

### External Systems

1. **Payment Gateway**: Wallet transactions and order payments
2. **Video Conferencing**: Online appointment calls
3. **SMS/Email Service**: Notifications and confirmations
4. **Lab Vendor APIs**: Slot availability and pricing
5. **Storage Service**: Prescription and report storage

### Internal Systems

1. **OPS Portal**: Prescription digitization, order confirmation
2. **Admin Portal**: User management, system configuration
3. **Doctor Portal**: Appointment management, prescriptions
4. **Vendor Portal**: Order fulfillment, report upload

---

## Notifications & Alerts

### Email Notifications

- Appointment confirmations
- Lab cart ready
- Order confirmations
- Sample collection reminders
- Report available
- Claim status updates

### SMS Notifications

- OTP for login
- Appointment reminders (1 day, 1 hour before)
- Lab collection reminders
- Order status updates

### In-App Notifications

- Real-time updates
- System announcements
- Feature launches
- Benefit expiry alerts

---

## Security & Privacy

### Data Protection

- End-to-end encryption for sensitive data
- Secure file upload for prescriptions and documents
- HIPAA-compliant data storage
- Regular security audits

### Access Control

- Role-based access (MEMBER, DEPENDENT)
- Session management
- OTP-based authentication
- Secure password policies

### Privacy Features

- Data download (export personal data)
- Account deletion requests
- Consent management
- Privacy policy acknowledgment

---

## Performance Optimization

### Frontend

- Lazy loading for routes
- Image optimization
- Code splitting
- Caching strategies

### Backend

- API response caching
- Database query optimization
- CDN for static assets
- Load balancing

---

## Support & Help

### In-App Support

- FAQ section
- Chat support
- Call support
- Email support

### Common Issues

1. **Prescription not digitized**: Contact support after 4 hours
2. **Vendor not available**: Try different pincode or date
3. **Payment failed**: Check wallet balance or retry
4. **Report not available**: Contact lab vendor
5. **Appointment not confirmed**: Check email/SMS or contact support

---

## Future Enhancements

### Planned Features

- Teleconsultation integration with prescription fulfillment
- AI-powered health insights
- Medication reminders
- Health record management
- Integration with fitness trackers
- Chatbot support
- Multi-language support
- Voice-based navigation

---

## Conclusion

The Member Portal provides a comprehensive healthcare management platform with robust features for appointments, lab diagnostics, claims, and wallet management. The Lab Diagnostics module represents a major advancement in self-service healthcare, enabling members to manage their entire lab testing journey from prescription upload to report download.

For technical implementation details, refer to:
- `/docs/DATABASE.md` - Database schema
- `/docs/OPS_PORTAL.md` - OPS team workflows
- `/docs/ADMIN_PORTAL.md` - System administration
- `/docs/API_DOCUMENTATION.md` - Complete API reference

---

**Document Version**: 1.0
**Last Updated**: 2025-10-05
**Maintained By**: OPDWallet Development Team
