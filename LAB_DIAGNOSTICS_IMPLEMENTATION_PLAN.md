# Lab Diagnostics Implementation Plan

**Project**: OPD Wallet - Lab Diagnostics Module
**Type**: Demo/MVP Implementation
**Complexity**: Medium (Practical, no over-engineering)
**Target**: Working demo with core features

---

## TABLE OF CONTENTS

1. [Overview](#overview)
2. [Feature Summary](#feature-summary)
3. [Database Schema](#database-schema)
4. [Backend API Design](#backend-api-design)
5. [Frontend Flow](#frontend-flow)
6. [Implementation Phases](#implementation-phases)
7. [Detailed Step-by-Step Plan](#detailed-step-by-step-plan)
8. [TODO List (Execution Sequence)](#todo-list-execution-sequence)

---

## OVERVIEW

### What We're Building
A lab diagnostics ordering system where members can:
- Upload prescriptions (image/PDF)
- Get prescriptions digitized by ops team
- Review cart of lab tests
- Select lab partner and time slot
- Place order and track status
- Receive reports

### Core User Journey
```
Member uploads Rx → Ops digitizes → Cart created →
Member reviews → Selects vendor → Books slot →
Order placed → Partner confirms → Sample collected →
Reports delivered
```

---

## FEATURE SUMMARY

### Member Portal Features
1. **Lab Tests Page** - Main landing page with upload/select options
2. **Prescription Upload** - Image/PDF upload with preview
3. **Cart Review** - Review tests added by ops
4. **Partner Selection** - Choose lab based on pincode
5. **Slot Booking** - Select date/time for sample collection
6. **Order Tracking** - Track order status
7. **Report Download** - Download lab reports

### Admin Portal Features
1. **Service Master** - Add lab test types (CBC, Lipid Profile, etc.)
2. **Vendor Management** - Add lab partners with locations
3. **Pincode Mapping** - Map vendors to serviceable pincodes
4. **Pricing** - Set test prices per vendor

### Ops Portal Features
1. **Digitization Queue** - View uploaded prescriptions
2. **Cart Creation** - Add tests from prescription
3. **Order Management** - Confirm partner status
4. **Report Upload** - Upload final reports

---

## DATABASE SCHEMA

### 1. lab_prescriptions
```typescript
{
  _id: ObjectId,
  prescriptionId: string,        // Unique ID: "PRESC-20251003-0001"
  userId: ObjectId,              // User who uploaded
  patientId: string,             // Patient relationship ID
  patientName: string,

  // File info
  fileName: string,
  originalName: string,
  fileType: string,              // image/jpeg, application/pdf
  fileSize: number,
  filePath: string,              // uploads/lab-prescriptions/{userId}/
  uploadedAt: Date,

  // Status tracking
  status: string,                // UPLOADED, DIGITIZING, DIGITIZED, DELAYED
  digitizedBy?: string,          // Ops user who digitized
  digitizedAt?: Date,

  // Cart reference
  cartId?: ObjectId,             // Link to created cart

  notes?: string,                // Member notes

  createdAt: Date,
  updatedAt: Date
}

Indexes:
- { prescriptionId: 1 } unique
- { userId: 1, status: 1 }
- { status: 1, uploadedAt: 1 }
```

### 2. lab_carts
```typescript
{
  _id: ObjectId,
  cartId: string,                // "CART-20251003-0001"
  prescriptionId: ObjectId,      // Reference to prescription
  userId: ObjectId,
  patientId: string,
  patientName: string,

  // Cart items
  items: [{
    serviceId: ObjectId,         // Reference to lab_services
    serviceName: string,
    serviceCode: string,
    category: string,            // PATHOLOGY, RADIOLOGY, etc.
    description?: string,
  }],

  // Status
  status: string,                // CREATED, REVIEWED, ORDERED, CANCELLED
  createdBy: string,             // Ops user who created cart

  // Order reference (after placement)
  orderId?: ObjectId,

  createdAt: Date,
  updatedAt: Date
}

Indexes:
- { cartId: 1 } unique
- { userId: 1, status: 1 }
- { prescriptionId: 1 }
```

### 3. lab_services
```typescript
{
  _id: ObjectId,
  serviceId: string,             // "LABSVC-001"
  code: string,                  // "CBC", "LFT", "KFT"
  name: string,                  // "Complete Blood Count"
  category: string,              // PATHOLOGY, RADIOLOGY, CARDIOLOGY
  description?: string,
  sampleType?: string,           // Blood, Urine, etc.
  preparationInstructions?: string,

  isActive: boolean,
  displayOrder: number,

  createdAt: Date,
  updatedAt: Date
}

Indexes:
- { serviceId: 1 } unique
- { code: 1 } unique
- { category: 1, isActive: 1 }
```

### 4. lab_vendors
```typescript
{
  _id: ObjectId,
  vendorId: string,              // "VENDOR-001"
  name: string,                  // "Dr. Lal PathLabs"
  code: string,                  // "LALPATHLAB"

  contactInfo: {
    phone: string,
    email: string,
    address: string,
  },

  // Service areas
  serviceablePincodes: string[], // ["110001", "110002"]

  // Collection types
  homeCollection: boolean,
  centerVisit: boolean,

  isActive: boolean,

  createdAt: Date,
  updatedAt: Date
}

Indexes:
- { vendorId: 1 } unique
- { code: 1 } unique
- { serviceablePincodes: 1 }
- { isActive: 1 }
```

### 5. lab_vendor_pricing
```typescript
{
  _id: ObjectId,
  vendorId: ObjectId,
  serviceId: ObjectId,

  actualPrice: number,           // MRP
  discountedPrice: number,       // Selling price
  homeCollectionCharges?: number,

  isActive: boolean,

  createdAt: Date,
  updatedAt: Date
}

Indexes:
- { vendorId: 1, serviceId: 1 } unique
- { serviceId: 1, isActive: 1 }
```

### 6. lab_vendor_slots
```typescript
{
  _id: ObjectId,
  slotId: string,
  vendorId: ObjectId,
  pincode: string,

  date: string,                  // YYYY-MM-DD
  timeSlot: string,              // "09:00 AM - 10:00 AM"
  startTime: string,             // "09:00"
  endTime: string,               // "10:00"

  maxBookings: number,
  currentBookings: number,

  isActive: boolean,

  createdAt: Date,
  updatedAt: Date
}

Indexes:
- { vendorId: 1, date: 1, pincode: 1 }
- { date: 1, isActive: 1 }
```

### 7. lab_orders
```typescript
{
  _id: ObjectId,
  orderId: string,               // "LABORD-20251003-0001"
  cartId: ObjectId,
  prescriptionId: ObjectId,
  userId: ObjectId,
  patientId: string,
  patientName: string,

  // Selected items
  items: [{
    serviceId: ObjectId,
    serviceName: string,
    serviceCode: string,
    actualPrice: number,
    discountedPrice: number,
  }],

  // Vendor details
  vendorId: ObjectId,
  vendorName: string,

  // Collection details
  collectionType: string,        // HOME_COLLECTION, CENTER_VISIT
  collectionAddress?: {
    line1: string,
    line2?: string,
    city: string,
    state: string,
    pincode: string,
  },
  collectionDate: string,        // YYYY-MM-DD
  collectionTimeSlot: string,
  slotId: ObjectId,

  // Pricing
  totalActualPrice: number,
  totalDiscountedPrice: number,
  homeCollectionCharges: number,
  finalAmount: number,

  // Payment
  paymentStatus: string,         // PENDING, PAID
  paymentMode?: string,
  paymentDate?: Date,

  // Status tracking
  status: string,                // PLACED, CONFIRMED, SAMPLE_COLLECTED, PROCESSING, COMPLETED, CANCELLED
  placedAt: Date,
  confirmedAt?: Date,
  confirmedBy?: string,          // Ops user
  collectedAt?: Date,
  completedAt?: Date,
  cancelledAt?: Date,
  cancellationReason?: string,

  // Reports
  reports: [{
    fileName: string,
    originalName: string,
    filePath: string,
    uploadedAt: Date,
    uploadedBy: string,
  }],

  createdAt: Date,
  updatedAt: Date
}

Indexes:
- { orderId: 1 } unique
- { userId: 1, status: 1 }
- { cartId: 1 }
- { vendorId: 1, collectionDate: 1 }
- { status: 1, placedAt: 1 }
```

---

## BACKEND API DESIGN

### Member APIs

#### Prescription Management
```
POST   /api/member/lab/prescriptions/upload
  - Upload prescription image/PDF
  - Body: multipart/form-data (file, patientId, notes)
  - Returns: prescriptionId, status

GET    /api/member/lab/prescriptions
  - List user's prescriptions
  - Query: status, page, limit
  - Returns: Array of prescriptions with status

GET    /api/member/lab/prescriptions/:id
  - Get prescription details
  - Returns: Prescription with cart info if available
```

#### Cart & Order Management
```
GET    /api/member/lab/carts/active
  - Get active carts for user
  - Returns: Array of carts ready for review

GET    /api/member/lab/carts/:cartId
  - Get cart details
  - Returns: Cart with all items

DELETE /api/member/lab/carts/:cartId/items/:serviceId
  - Remove item from cart
  - Returns: Updated cart

POST   /api/member/lab/orders/check-availability
  - Check vendor availability by pincode
  - Body: { cartId, pincode }
  - Returns: List of vendors with pricing

GET    /api/member/lab/vendors/:vendorId/slots
  - Get available slots for vendor
  - Query: pincode, date
  - Returns: Available time slots

POST   /api/member/lab/orders/place
  - Place lab order
  - Body: { cartId, vendorId, slotId, collectionType, address, patientId }
  - Returns: orderId, confirmationDetails

GET    /api/member/lab/orders
  - List user's lab orders
  - Query: status, page, limit
  - Returns: Array of orders

GET    /api/member/lab/orders/:orderId
  - Get order details with status
  - Returns: Order with timeline

GET    /api/member/lab/orders/:orderId/reports
  - Download reports
  - Returns: Array of report files
```

### Admin APIs

#### Service Management
```
POST   /api/admin/lab/services
  - Create lab test/service
  - Body: { code, name, category, description, sampleType }
  - Returns: serviceId

GET    /api/admin/lab/services
  - List all services
  - Query: category, search, page
  - Returns: Array of services

PATCH  /api/admin/lab/services/:id
  - Update service
  - Returns: Updated service

DELETE /api/admin/lab/services/:id
  - Deactivate service
```

#### Vendor Management
```
POST   /api/admin/lab/vendors
  - Create vendor
  - Body: { name, code, contactInfo, serviceablePincodes, homeCollection, centerVisit }
  - Returns: vendorId

GET    /api/admin/lab/vendors
  - List vendors
  - Returns: Array of vendors

PATCH  /api/admin/lab/vendors/:id
  - Update vendor details
  - Returns: Updated vendor

POST   /api/admin/lab/vendors/:vendorId/pricing
  - Set pricing for service
  - Body: { serviceId, actualPrice, discountedPrice, homeCollectionCharges }
  - Returns: Pricing entry

GET    /api/admin/lab/vendors/:vendorId/pricing
  - Get all pricing for vendor
  - Returns: Array of service prices

POST   /api/admin/lab/vendors/:vendorId/slots/bulk
  - Create slots in bulk
  - Body: { pincode, dates[], timeSlots[], maxBookings }
  - Returns: Created slots count
```

### Ops APIs

#### Prescription Digitization
```
GET    /api/ops/lab/prescriptions/queue
  - Get prescriptions pending digitization
  - Query: status, page
  - Returns: Array of prescriptions

GET    /api/ops/lab/prescriptions/:id
  - View prescription file
  - Returns: Prescription details with file URL

POST   /api/ops/lab/prescriptions/:id/digitize
  - Create cart from prescription
  - Body: { serviceIds[], patientId }
  - Returns: cartId

PATCH  /api/ops/lab/prescriptions/:id/status
  - Update prescription status (DIGITIZING, DELAYED, etc.)
  - Body: { status, notes }
```

#### Order Management
```
GET    /api/ops/lab/orders
  - List all orders
  - Query: status, vendorId, date, page
  - Returns: Array of orders

PATCH  /api/ops/lab/orders/:orderId/confirm
  - Confirm order with partner
  - Body: { notes }
  - Returns: Updated order

PATCH  /api/ops/lab/orders/:orderId/collect
  - Mark sample as collected
  - Body: { collectedAt, notes }
  - Returns: Updated order

POST   /api/ops/lab/orders/:orderId/reports/upload
  - Upload lab report
  - Body: multipart/form-data (files)
  - Returns: Uploaded reports

PATCH  /api/ops/lab/orders/:orderId/complete
  - Mark order as completed
  - Returns: Updated order
```

---

## FRONTEND FLOW

### Member Portal Pages

#### 1. Lab Tests Landing Page
**Route**: `/member/lab-tests`

**Layout**:
```
┌────────────────────────────────────────┐
│  Lab Diagnostics                       │
│  Get discounted lab tests at home      │
├────────────────────────────────────────┤
│                                        │
│  [Upload Prescription]                 │
│  Upload new prescription               │
│                                        │
│  [Select Existing Prescription]        │
│  Choose from uploaded prescriptions    │
│                                        │
├────────────────────────────────────────┤
│  Active Carts (if any)                 │
│  ┌──────────────────────────────────┐ │
│  │ Available Cart                   │ │
│  │ Request ID: CART-xxx             │ │
│  │ Test Type: Pathology             │ │
│  │ 3 tests added                    │ │
│  │ [Place Order] ──────────────────>│ │
│  └──────────────────────────────────┘ │
├────────────────────────────────────────┤
│  My Orders                             │
│  Track your lab test orders            │
├────────────────────────────────────────┤
│  FAQs                                  │
│  Sample Prescriptions                  │
└────────────────────────────────────────┘
```

#### 2. Prescription Upload Modal
```
┌────────────────────────────────────────┐
│  Upload Prescription                   │
├────────────────────────────────────────┤
│  Patient: [Dropdown: Self/Family]     │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │  Drag & drop or click to upload  │ │
│  │  (Image or PDF, max 10MB)        │ │
│  └──────────────────────────────────┘ │
│                                        │
│  Notes (optional):                     │
│  [Text area]                           │
│                                        │
│  [Cancel]  [Upload]                    │
└────────────────────────────────────────┘

Status after upload:
"Prescription uploaded successfully!
Our team will digitize it within 2-4 hours."
```

#### 3. Cart Review Page
**Route**: `/member/lab-tests/cart/:cartId`

```
┌────────────────────────────────────────┐
│  Review Your Cart                      │
│  Request ID: CART-20251003-0001        │
├────────────────────────────────────────┤
│  Patient: John Doe (Self)              │
│                                        │
│  Tests Selected:                       │
│  ┌──────────────────────────────────┐ │
│  │ Complete Blood Count (CBC)    [x]│ │
│  │ Lipid Profile                 [x]│ │
│  │ Liver Function Test (LFT)     [x]│ │
│  └──────────────────────────────────┘ │
│                                        │
│  [Change Patient]  [Continue]          │
└────────────────────────────────────────┘
```

#### 4. Partner Selection Page
**Route**: `/member/lab-tests/select-partner/:cartId`

```
┌────────────────────────────────────────┐
│  Select Lab Partner                    │
├────────────────────────────────────────┤
│  Enter Pincode: [______] [Search]      │
├────────────────────────────────────────┤
│  Available Partners:                   │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ Dr. Lal PathLabs                 │ │
│  │ ₹1,200  ₹999  (17% off)          │ │
│  │ ☑ Home Collection  ☑ Center     │ │
│  │ [Select] ────────────────────────>│ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ Metropolis Healthcare            │ │
│  │ ₹1,400  ₹1,050  (25% off)        │ │
│  │ ☑ Home Collection  ☑ Center     │ │
│  │ [Select] ────────────────────────>│ │
│  └──────────────────────────────────┘ │
└────────────────────────────────────────┘
```

#### 5. Collection Type & Address
```
┌────────────────────────────────────────┐
│  Collection Details                    │
├────────────────────────────────────────┤
│  Collection Type:                      │
│  ○ Home Collection (+₹50)              │
│  ○ Visit Center (Free)                 │
│                                        │
│  [If Home Collection selected]         │
│  Address:                              │
│  [Use saved address ▼]                 │
│  or                                    │
│  [Add new address]                     │
│                                        │
│  [Back]  [Continue]                    │
└────────────────────────────────────────┘
```

#### 6. Slot Selection
**Route**: `/member/lab-tests/select-slot/:cartId`

```
┌────────────────────────────────────────┐
│  Select Time Slot                      │
├────────────────────────────────────────┤
│  [< Oct 5] [Oct 6] [Oct 7 >]           │
│                                        │
│  Morning Slots:                        │
│  [09:00 AM - 10:00 AM]                 │
│  [10:00 AM - 11:00 AM]                 │
│                                        │
│  Afternoon Slots:                      │
│  [02:00 PM - 03:00 PM]                 │
│  [03:00 PM - 04:00 PM]                 │
│                                        │
│  [Back]  [Continue]                    │
└────────────────────────────────────────┘
```

#### 7. Order Review & Payment
```
┌────────────────────────────────────────┐
│  Review & Confirm                      │
├────────────────────────────────────────┤
│  Patient: John Doe                     │
│  Lab Partner: Dr. Lal PathLabs         │
│  Collection: Home (Oct 6, 9-10 AM)     │
│  Address: 123 Main St...               │
│                                        │
│  Tests (3):                            │
│  CBC                         ₹300      │
│  Lipid Profile              ₹450      │
│  LFT                        ₹249      │
│                                        │
│  Subtotal:                  ₹999      │
│  Home Collection:            ₹50      │
│  ─────────────────────────────────    │
│  Total:                   ₹1,049      │
│                                        │
│  [Cancel]  [Confirm & Pay]             │
└────────────────────────────────────────┘
```

#### 8. Order Tracking Page
**Route**: `/member/lab-tests/orders/:orderId`

```
┌────────────────────────────────────────┐
│  Order #LABORD-20251003-0001           │
├────────────────────────────────────────┤
│  Status: Sample Collected ✓            │
│                                        │
│  Timeline:                             │
│  ✓ Prescription Uploaded               │
│  ✓ Digitization Completed              │
│  ✓ Cart Created                        │
│  ✓ Order Placed                        │
│  ✓ Partner Confirmed                   │
│  ✓ Sample Collected                    │
│  ⏳ Sample Processing                   │
│  ○ Reports                             │
│                                        │
│  Collection Details:                   │
│  Date: Oct 6, 2025                     │
│  Time: 09:00 AM - 10:00 AM             │
│  Address: 123 Main St...               │
│                                        │
│  [Download Reports] (when ready)       │
└────────────────────────────────────────┘
```

### Admin Portal Pages

#### 1. Lab Services List
**Route**: `/admin/lab/services`

```
┌────────────────────────────────────────┐
│  Lab Services                          │
│  [+ Add Service]                       │
├────────────────────────────────────────┤
│  Search: [_______]  Category: [All ▼]  │
├────────────────────────────────────────┤
│  Code    Name              Category    │
│  CBC     Complete Blood    Pathology   │
│          Count                    [Edit]│
│  LFT     Liver Function    Pathology   │
│          Test                     [Edit]│
│  XRAY    X-Ray Chest       Radiology   │
│                                   [Edit]│
└────────────────────────────────────────┘
```

#### 2. Vendors List
**Route**: `/admin/lab/vendors`

```
┌────────────────────────────────────────┐
│  Lab Vendors                           │
│  [+ Add Vendor]                        │
├────────────────────────────────────────┤
│  Name              Pincodes    Status  │
│  Dr. Lal PathLabs  50 areas    Active  │
│                           [Edit] [Price]│
│  Metropolis        30 areas    Active  │
│                           [Edit] [Price]│
└────────────────────────────────────────┘
```

#### 3. Vendor Pricing
**Route**: `/admin/lab/vendors/:id/pricing`

```
┌────────────────────────────────────────┐
│  Pricing - Dr. Lal PathLabs            │
│  [+ Add Service Pricing]               │
├────────────────────────────────────────┤
│  Service   MRP    Discounted  Home Fee │
│  CBC       ₹500   ₹300        ₹50      │
│                                   [Edit]│
│  LFT       ₹800   ₹450        ₹50      │
│                                   [Edit]│
└────────────────────────────────────────┘
```

#### 4. Slot Management
**Route**: `/admin/lab/vendors/:id/slots`

```
┌────────────────────────────────────────┐
│  Manage Slots - Dr. Lal PathLabs       │
│  [+ Create Bulk Slots]                 │
├────────────────────────────────────────┤
│  Pincode: [110001]                     │
│  Dates: [Oct 5] to [Oct 15]            │
│  Time Slots:                           │
│  [x] 09:00 AM - 10:00 AM               │
│  [x] 10:00 AM - 11:00 AM               │
│  [x] 02:00 PM - 03:00 PM               │
│                                        │
│  Max Bookings per Slot: [5]            │
│                                        │
│  [Create Slots]                        │
└────────────────────────────────────────┘
```

### Ops Portal Pages

#### 1. Digitization Queue
**Route**: `/ops/lab/prescriptions`

```
┌────────────────────────────────────────┐
│  Prescription Digitization Queue       │
├────────────────────────────────────────┤
│  Status: [Uploaded ▼]  [Refresh]       │
├────────────────────────────────────────┤
│  ID              Patient    Uploaded   │
│  PRESC-0001     John Doe   2h ago      │
│                         [View] [Digitize]│
│  PRESC-0002     Jane S.    5h ago      │
│                         [View] [Digitize]│
│  PRESC-0003     Bob J.     1d ago      │
│                         [View] [Digitize]│
└────────────────────────────────────────┘
```

#### 2. Digitization Screen
**Route**: `/ops/lab/prescriptions/:id/digitize`

```
┌────────────────────────────────────────┐
│  Digitize Prescription                 │
│  ID: PRESC-20251003-0001               │
├────────────────────────────────────────┤
│  ┌──────────────┐  ┌─────────────────┐│
│  │              │  │ Patient:        ││
│  │ Prescription │  │ John Doe (Self) ││
│  │   Image      │  │                 ││
│  │   Preview    │  │ Select Tests:   ││
│  │              │  │ [Search tests]  ││
│  │              │  │                 ││
│  │              │  │ Selected:       ││
│  │              │  │ [x] CBC         ││
│  └──────────────┘  │ [x] LFT         ││
│                    │ [x] Lipid       ││
│                    │                 ││
│                    │ [Create Cart]   ││
│                    └─────────────────┘│
└────────────────────────────────────────┘
```

#### 3. Orders Management
**Route**: `/ops/lab/orders`

```
┌────────────────────────────────────────┐
│  Lab Orders                            │
├────────────────────────────────────────┤
│  Status: [All ▼]  Date: [Today ▼]      │
├────────────────────────────────────────┤
│  Order ID        Patient    Status     │
│  LABORD-0001    John Doe   Placed      │
│                         [Confirm] [View]│
│  LABORD-0002    Jane S.    Confirmed   │
│                    [Collected] [View]   │
│  LABORD-0003    Bob J.     Collected   │
│                    [Upload Report]      │
└────────────────────────────────────────┘
```

#### 4. Upload Reports
**Route**: `/ops/lab/orders/:id/upload-report`

```
┌────────────────────────────────────────┐
│  Upload Lab Reports                    │
│  Order: LABORD-20251003-0001           │
│  Patient: John Doe                     │
├────────────────────────────────────────┤
│  Tests:                                │
│  - Complete Blood Count (CBC)          │
│  - Liver Function Test (LFT)           │
│  - Lipid Profile                       │
│                                        │
│  Upload Reports (PDF):                 │
│  ┌──────────────────────────────────┐ │
│  │  Drag & drop or click            │ │
│  │  (Multiple PDFs allowed)         │ │
│  └──────────────────────────────────┘ │
│                                        │
│  [Cancel]  [Upload & Complete]         │
└────────────────────────────────────────┘
```

---

## IMPLEMENTATION PHASES

### Phase 1: Foundation (Week 1)
- Database schemas
- Basic CRUD APIs
- Admin portal for services & vendors

### Phase 2: Core Flow (Week 2)
- Prescription upload (member)
- Digitization interface (ops)
- Cart review (member)

### Phase 3: Ordering (Week 3)
- Partner selection
- Slot booking
- Order placement

### Phase 4: Tracking & Reports (Week 4)
- Order status tracking
- Report upload (ops)
- Report download (member)

---

## DETAILED STEP-BY-STEP PLAN

### BACKEND SETUP

#### Step 1: Create Database Schemas (Day 1)
```
Location: api/src/modules/lab/schemas/

Files to create:
1. lab-prescription.schema.ts
2. lab-cart.schema.ts
3. lab-service.schema.ts
4. lab-vendor.schema.ts
5. lab-vendor-pricing.schema.ts
6. lab-vendor-slot.schema.ts
7. lab-order.schema.ts

For each schema:
- Define TypeScript interface
- Add Mongoose decorators (@Prop)
- Define enums
- Add indexes
- Add timestamps
```

#### Step 2: Create DTOs (Day 1-2)
```
Location: api/src/modules/lab/dto/

Files to create:
1. upload-prescription.dto.ts
2. create-cart.dto.ts
3. create-service.dto.ts
4. create-vendor.dto.ts
5. create-pricing.dto.ts
6. create-slot.dto.ts
7. place-order.dto.ts

Use class-validator decorators:
- @IsString(), @IsNumber(), @IsEnum()
- @IsOptional() for optional fields
- @Type() for nested objects
```

#### Step 3: Create Services (Day 2-3)
```
Location: api/src/modules/lab/

Files to create:
1. lab-prescriptions.service.ts
   - uploadPrescription()
   - getPrescriptions()
   - updateStatus()
   - digitizePrescription()

2. lab-carts.service.ts
   - createCart()
   - getActiveCarts()
   - getCartById()
   - removeItemFromCart()

3. lab-services.service.ts
   - createService()
   - getAllServices()
   - updateService()
   - deleteService()

4. lab-vendors.service.ts
   - createVendor()
   - getVendors()
   - updateVendor()
   - getVendorsByPincode()

5. lab-pricing.service.ts
   - setPricing()
   - getPricingByVendor()
   - calculateOrderTotal()

6. lab-slots.service.ts
   - createBulkSlots()
   - getAvailableSlots()
   - bookSlot()

7. lab-orders.service.ts
   - placeOrder()
   - getOrders()
   - confirmOrder()
   - uploadReports()
   - completeOrder()
```

#### Step 4: Create Controllers (Day 3-4)
```
Location: api/src/modules/lab/

Files to create:
1. lab-member.controller.ts
   - Member-facing endpoints
   - /api/member/lab/*

2. lab-admin.controller.ts
   - Admin-facing endpoints
   - /api/admin/lab/*

3. lab-ops.controller.ts
   - Ops-facing endpoints
   - /api/ops/lab/*

For each controller:
- Use @Controller() decorator
- Add route decorators (@Get, @Post, @Patch, @Delete)
- Add @UseGuards() for auth
- Add @ApiTags() for Swagger docs
```

#### Step 5: File Upload Configuration (Day 4)
```
Location: api/src/modules/lab/config/

Create multer.config.ts:
- Storage: uploads/lab-prescriptions/{userId}/
- Storage: uploads/lab-reports/{orderId}/
- Allowed types: image/jpeg, image/png, application/pdf
- Max size: 10MB
- Max files: 5 per upload

Similar to existing memberclaims multer config
```

#### Step 6: Create Lab Module (Day 4)
```
Location: api/src/modules/lab/

Create lab.module.ts:
- Import all schemas
- Import all services
- Import all controllers
- Export services for use in other modules

Register in app.module.ts:
- Add LabModule to imports
```

### FRONTEND SETUP - MEMBER PORTAL

#### Step 7: Create Lab Tests Landing Page (Day 5)
```
Location: web-member/app/member/lab-tests/

Create page.tsx:
- Header with title and description
- Upload prescription button (opens modal)
- Select existing prescription button
- Active carts section (fetch from API)
- My orders section (link to orders page)
- FAQs accordion
- Sample prescription images

API calls:
- GET /api/member/lab/carts/active
- GET /api/member/lab/prescriptions?status=UPLOADED
```

#### Step 8: Prescription Upload Modal (Day 5)
```
Location: web-member/components/

Create LabPrescriptionUploadModal.tsx:
- Patient selection dropdown
- File upload zone (drag & drop)
- File preview
- Notes textarea
- Upload button

Use react-dropzone for file upload
API: POST /api/member/lab/prescriptions/upload
```

#### Step 9: Cart Review Page (Day 6)
```
Location: web-member/app/member/lab-tests/cart/[cartId]/

Create page.tsx:
- Display cart items
- Remove item button
- Change patient button (modal)
- Continue to partner selection

API calls:
- GET /api/member/lab/carts/:cartId
- DELETE /api/member/lab/carts/:cartId/items/:serviceId
```

#### Step 10: Partner Selection Page (Day 6-7)
```
Location: web-member/app/member/lab-tests/select-partner/[cartId]/

Create page.tsx:
- Pincode input
- Search button
- List of vendors with pricing
- Home collection / center visit badges
- Select button for each vendor

API: POST /api/member/lab/orders/check-availability
```

#### Step 11: Collection Details Page (Day 7)
```
Location: web-member/app/member/lab-tests/collection-details/[cartId]/

Create page.tsx:
- Collection type radio buttons
- Address selection (if home collection)
- Address form
- Continue button

Store in state/localStorage temporarily
```

#### Step 12: Slot Selection Page (Day 7-8)
```
Location: web-member/app/member/lab-tests/select-slot/[cartId]/

Create page.tsx:
- Date picker (next 7 days)
- Available slots grid
- Slot selection
- Continue button

API: GET /api/member/lab/vendors/:vendorId/slots
```

#### Step 13: Order Review & Payment (Day 8)
```
Location: web-member/app/member/lab-tests/review/[cartId]/

Create page.tsx:
- Display all details (patient, vendor, collection, items)
- Price breakdown
- Total amount
- Confirm & Pay button

API: POST /api/member/lab/orders/place
```

#### Step 14: Order Tracking Page (Day 9)
```
Location: web-member/app/member/lab-tests/orders/[orderId]/

Create page.tsx:
- Order status badge
- Timeline component (vertical)
- Order details
- Collection details
- Download reports button (when available)

API calls:
- GET /api/member/lab/orders/:orderId
- GET /api/member/lab/orders/:orderId/reports
```

#### Step 15: Orders List Page (Day 9)
```
Location: web-member/app/member/lab-tests/orders/

Create page.tsx:
- List of all user's lab orders
- Filter by status
- Search by order ID
- Card for each order with status
- Click to view details

API: GET /api/member/lab/orders
```

### FRONTEND SETUP - ADMIN PORTAL

#### Step 16: Lab Services Management (Day 10)
```
Location: web-admin/app/admin/lab/services/

Create page.tsx:
- Services list table
- Add service button (modal)
- Edit service (modal)
- Delete/deactivate service

API calls:
- GET /api/admin/lab/services
- POST /api/admin/lab/services
- PATCH /api/admin/lab/services/:id
```

#### Step 17: Vendors Management (Day 10-11)
```
Location: web-admin/app/admin/lab/vendors/

Create page.tsx:
- Vendors list
- Add vendor button (opens form)
- Edit vendor
- View pricing button (navigate to pricing page)

API calls:
- GET /api/admin/lab/vendors
- POST /api/admin/lab/vendors
- PATCH /api/admin/lab/vendors/:id
```

#### Step 18: Vendor Pricing Page (Day 11)
```
Location: web-admin/app/admin/lab/vendors/[id]/pricing/

Create page.tsx:
- Vendor details header
- Service pricing table
- Add pricing button (modal)
- Edit pricing

API calls:
- GET /api/admin/lab/vendors/:id/pricing
- POST /api/admin/lab/vendors/:id/pricing
```

#### Step 19: Slot Management Page (Day 11-12)
```
Location: web-admin/app/admin/lab/vendors/[id]/slots/

Create page.tsx:
- Create bulk slots form
- Pincode input
- Date range picker
- Time slots checkboxes
- Max bookings input
- Create button

API: POST /api/admin/lab/vendors/:id/slots/bulk
```

### FRONTEND SETUP - OPS PORTAL

#### Step 20: Digitization Queue (Day 12)
```
Location: web-admin/app/ops/lab/prescriptions/

Create page.tsx:
- Prescriptions table
- Status filter
- View button (shows prescription image)
- Digitize button (navigate to digitization page)

API: GET /api/ops/lab/prescriptions/queue
```

#### Step 21: Digitization Screen (Day 12-13)
```
Location: web-admin/app/ops/lab/prescriptions/[id]/digitize/

Create page.tsx:
- Split screen layout
- Left: Prescription image viewer
- Right: Service selection
- Search services
- Add to cart
- Create cart button

API calls:
- GET /api/ops/lab/prescriptions/:id
- GET /api/admin/lab/services (for search)
- POST /api/ops/lab/prescriptions/:id/digitize
```

#### Step 22: Orders Management (Day 13)
```
Location: web-admin/app/ops/lab/orders/

Create page.tsx:
- Orders table
- Status filter
- Date filter
- Confirm button (for placed orders)
- Mark collected button
- Upload report button
- View details

API calls:
- GET /api/ops/lab/orders
- PATCH /api/ops/lab/orders/:id/confirm
- PATCH /api/ops/lab/orders/:id/collect
```

#### Step 23: Upload Reports Page (Day 13-14)
```
Location: web-admin/app/ops/lab/orders/[id]/upload-report/

Create page.tsx:
- Order details header
- Tests list
- File upload zone (multiple PDFs)
- Upload & complete button

API: POST /api/ops/lab/orders/:id/reports/upload
```

### TESTING & POLISH

#### Step 24: End-to-End Testing (Day 14)
```
Test complete flow:
1. Member uploads prescription
2. Ops digitizes and creates cart
3. Member reviews cart
4. Member selects partner
5. Member books slot
6. Member places order
7. Ops confirms order
8. Ops marks collected
9. Ops uploads reports
10. Member downloads reports

Fix any bugs found
```

#### Step 25: UI Polish (Day 14-15)
```
- Consistent styling across pages
- Loading states
- Error messages
- Success notifications
- Empty states
- Mobile responsiveness
```

---

## TODO LIST (EXECUTION SEQUENCE)

### PHASE 1: DATABASE & BACKEND FOUNDATION (Days 1-4)

#### Day 1: Database Schemas
- [ ] Create `lab-prescription.schema.ts` with all fields and indexes
- [ ] Create `lab-cart.schema.ts` with items array
- [ ] Create `lab-service.schema.ts` with category enum
- [ ] Create `lab-vendor.schema.ts` with pincode array
- [ ] Create `lab-vendor-pricing.schema.ts` with pricing fields
- [ ] Create `lab-vendor-slot.schema.ts` with booking tracking
- [ ] Create `lab-order.schema.ts` with complete order lifecycle
- [ ] Test schema compilation with `npm run build`

#### Day 2: DTOs & Validation
- [ ] Create `upload-prescription.dto.ts` with file validation
- [ ] Create `create-cart.dto.ts` with items validation
- [ ] Create `create-service.dto.ts` with required fields
- [ ] Create `create-vendor.dto.ts` with contact info
- [ ] Create `create-pricing.dto.ts` with price validation
- [ ] Create `create-slot.dto.ts` with date/time validation
- [ ] Create `place-order.dto.ts` with all order fields
- [ ] Create `query-*.dto.ts` files for list endpoints

#### Day 3: Core Services - Part 1
- [ ] Create `lab-prescriptions.service.ts`
  - [ ] Implement `uploadPrescription()` with file handling
  - [ ] Implement `getPrescriptions()` with filtering
  - [ ] Implement `getPrescriptionById()`
  - [ ] Implement `updateStatus()`
  - [ ] Implement `digitizePrescription()` (creates cart)
- [ ] Create `lab-carts.service.ts`
  - [ ] Implement `createCart()` with prescription link
  - [ ] Implement `getActiveCarts()` for user
  - [ ] Implement `getCartById()` with items
  - [ ] Implement `removeItemFromCart()`
  - [ ] Implement `updateCartStatus()`

#### Day 4: Core Services - Part 2
- [ ] Create `lab-services.service.ts`
  - [ ] Implement `createService()` with validation
  - [ ] Implement `getAllServices()` with pagination
  - [ ] Implement `getServicesByCategory()`
  - [ ] Implement `updateService()`
  - [ ] Implement `deactivateService()`
- [ ] Create `lab-vendors.service.ts`
  - [ ] Implement `createVendor()`
  - [ ] Implement `getVendors()` with pagination
  - [ ] Implement `getVendorsByPincode()`
  - [ ] Implement `updateVendor()`
- [ ] Create `lab-pricing.service.ts`
  - [ ] Implement `setPricing()` for vendor-service
  - [ ] Implement `getPricingByVendor()`
  - [ ] Implement `calculateOrderTotal()` helper
- [ ] Create `lab-slots.service.ts`
  - [ ] Implement `createBulkSlots()` with date range
  - [ ] Implement `getAvailableSlots()` with booking check
  - [ ] Implement `bookSlot()` with capacity check
  - [ ] Implement `releaseSlot()` for cancellation
- [ ] Create multer config for file uploads
- [ ] Ensure uploads directory structure created

### PHASE 2: BACKEND APIs (Days 5-6)

#### Day 5: Member APIs
- [ ] Create `lab-member.controller.ts`
- [ ] **Prescription APIs:**
  - [ ] `POST /api/member/lab/prescriptions/upload` with multer
  - [ ] `GET /api/member/lab/prescriptions` with status filter
  - [ ] `GET /api/member/lab/prescriptions/:id`
- [ ] **Cart APIs:**
  - [ ] `GET /api/member/lab/carts/active`
  - [ ] `GET /api/member/lab/carts/:cartId`
  - [ ] `DELETE /api/member/lab/carts/:cartId/items/:serviceId`
- [ ] **Order APIs - Part 1:**
  - [ ] `POST /api/member/lab/orders/check-availability` (vendors by pincode)
  - [ ] `GET /api/member/lab/vendors/:vendorId/slots`
- [ ] Test all member endpoints with Postman/Thunder Client

#### Day 6: Admin & Ops APIs
- [ ] Create `lab-admin.controller.ts`
- [ ] **Service Management:**
  - [ ] `POST /api/admin/lab/services`
  - [ ] `GET /api/admin/lab/services` with search
  - [ ] `PATCH /api/admin/lab/services/:id`
  - [ ] `DELETE /api/admin/lab/services/:id`
- [ ] **Vendor Management:**
  - [ ] `POST /api/admin/lab/vendors`
  - [ ] `GET /api/admin/lab/vendors`
  - [ ] `PATCH /api/admin/lab/vendors/:id`
- [ ] **Pricing Management:**
  - [ ] `POST /api/admin/lab/vendors/:vendorId/pricing`
  - [ ] `GET /api/admin/lab/vendors/:vendorId/pricing`
- [ ] **Slot Management:**
  - [ ] `POST /api/admin/lab/vendors/:vendorId/slots/bulk`
- [ ] Create `lab-ops.controller.ts`
- [ ] **Ops Prescription APIs:**
  - [ ] `GET /api/ops/lab/prescriptions/queue`
  - [ ] `GET /api/ops/lab/prescriptions/:id`
  - [ ] `POST /api/ops/lab/prescriptions/:id/digitize`
  - [ ] `PATCH /api/ops/lab/prescriptions/:id/status`
- [ ] Test all admin and ops endpoints

### PHASE 3: BACKEND ORDER FLOW (Day 7)

#### Day 7: Order APIs
- [ ] Create `lab-orders.service.ts` (complete implementation)
  - [ ] Implement `placeOrder()` with slot booking
  - [ ] Implement `getOrders()` with filters
  - [ ] Implement `getOrderById()` with timeline
  - [ ] Implement `confirmOrder()` (ops)
  - [ ] Implement `markCollected()` (ops)
  - [ ] Implement `uploadReports()` with file handling
  - [ ] Implement `completeOrder()` (ops)
  - [ ] Implement `cancelOrder()`
- [ ] Add order endpoints to member controller:
  - [ ] `POST /api/member/lab/orders/place`
  - [ ] `GET /api/member/lab/orders` (user's orders)
  - [ ] `GET /api/member/lab/orders/:orderId`
  - [ ] `GET /api/member/lab/orders/:orderId/reports`
- [ ] Add order endpoints to ops controller:
  - [ ] `GET /api/ops/lab/orders` (all orders)
  - [ ] `PATCH /api/ops/lab/orders/:orderId/confirm`
  - [ ] `PATCH /api/ops/lab/orders/:orderId/collect`
  - [ ] `POST /api/ops/lab/orders/:orderId/reports/upload`
  - [ ] `PATCH /api/ops/lab/orders/:orderId/complete`
- [ ] Create `lab.module.ts` and register all services/controllers
- [ ] Add LabModule to `app.module.ts`
- [ ] Test complete order flow via API

### PHASE 4: ADMIN PORTAL UI (Days 8-10)

#### Day 8: Services Management
- [ ] Create `/admin/lab/services/page.tsx`
  - [ ] Services list table with search
  - [ ] Add service modal/form
  - [ ] Edit service modal
  - [ ] Delete confirmation dialog
- [ ] Create service form component
  - [ ] Code, name, category fields
  - [ ] Description, sample type fields
  - [ ] Form validation
- [ ] Connect to APIs (GET, POST, PATCH, DELETE)
- [ ] Test CRUD operations

#### Day 9: Vendor Management
- [ ] Create `/admin/lab/vendors/page.tsx`
  - [ ] Vendors list table
  - [ ] Add vendor button
  - [ ] Edit vendor button
  - [ ] Navigate to pricing button
- [ ] Create vendor form component
  - [ ] Name, code, contact info
  - [ ] Pincode multi-select/tags input
  - [ ] Home collection & center visit checkboxes
  - [ ] Form validation
- [ ] Connect to vendor APIs
- [ ] Test vendor creation/editing

#### Day 10: Pricing & Slots
- [ ] Create `/admin/lab/vendors/[id]/pricing/page.tsx`
  - [ ] Vendor header with name
  - [ ] Pricing table with all services
  - [ ] Add pricing modal
  - [ ] Edit pricing modal
- [ ] Create pricing form component
  - [ ] Service dropdown
  - [ ] MRP, discounted price, home fee fields
  - [ ] Validation (discounted < MRP)
- [ ] Create `/admin/lab/vendors/[id]/slots/page.tsx`
  - [ ] Bulk slot creation form
  - [ ] Pincode input
  - [ ] Date range picker
  - [ ] Time slots checkboxes (morning/afternoon/evening)
  - [ ] Max bookings input
  - [ ] Create button
- [ ] Connect to pricing and slot APIs
- [ ] Test pricing setup and bulk slot creation

### PHASE 5: OPS PORTAL UI (Days 11-12)

#### Day 11: Digitization Queue
- [ ] Create `/ops/lab/prescriptions/page.tsx`
  - [ ] Prescriptions table
  - [ ] Status filter dropdown
  - [ ] Upload date sorting
  - [ ] View prescription button (modal with image)
  - [ ] Digitize button (navigate to digitization page)
- [ ] Create prescription viewer modal component
  - [ ] Display prescription image/PDF
  - [ ] Zoom controls
  - [ ] Download button
- [ ] Connect to prescriptions queue API
- [ ] Test viewing prescriptions

#### Day 12: Digitization Screen
- [ ] Create `/ops/lab/prescriptions/[id]/digitize/page.tsx`
  - [ ] Split layout (prescription left, form right)
  - [ ] Prescription image viewer component (reuse)
  - [ ] Service search with autocomplete
  - [ ] Selected tests list with remove option
  - [ ] Patient confirmation dropdown
  - [ ] Create cart button
- [ ] Create service search component
  - [ ] Search input with debounce
  - [ ] Service suggestions dropdown
  - [ ] Add to cart on select
- [ ] Connect to digitize API
- [ ] Test cart creation from prescription
- [ ] Verify cart appears in member portal

### PHASE 6: OPS ORDER MANAGEMENT (Day 13)

#### Day 13: Orders & Reports
- [ ] Create `/ops/lab/orders/page.tsx`
  - [ ] Orders table with filters
  - [ ] Status filter (Placed, Confirmed, Collected, etc.)
  - [ ] Date filter
  - [ ] Order actions based on status:
    - Placed → Confirm button
    - Confirmed → Mark Collected button
    - Collected → Upload Reports button
  - [ ] View details button
- [ ] Create order details modal
  - [ ] Patient & order info
  - [ ] Tests list
  - [ ] Collection details
  - [ ] Status timeline
- [ ] Create `/ops/lab/orders/[id]/upload-report/page.tsx`
  - [ ] Order summary header
  - [ ] Tests list
  - [ ] Multi-file upload zone
  - [ ] File preview list
  - [ ] Upload & Complete button
- [ ] Connect to order management APIs
- [ ] Test order confirmation flow
- [ ] Test report upload

### PHASE 7: MEMBER PORTAL UI (Days 14-17)

#### Day 14: Landing & Upload
- [ ] Create `/member/lab-tests/page.tsx`
  - [ ] Page header with benefits description
  - [ ] Upload prescription button
  - [ ] Select existing prescription button
  - [ ] Active carts section (cards)
  - [ ] My orders link
  - [ ] FAQs accordion
  - [ ] Sample prescription images
- [ ] Create `LabPrescriptionUploadModal.tsx` component
  - [ ] Patient selection dropdown (self/family)
  - [ ] File upload zone with drag & drop
  - [ ] File preview (image/PDF)
  - [ ] Notes textarea
  - [ ] Upload button with loading state
  - [ ] Success/error messages
- [ ] Use react-dropzone for file handling
- [ ] Connect to prescription upload API
- [ ] Test file upload and see in ops queue

#### Day 15: Cart Review & Partner Selection
- [ ] Create `/member/lab-tests/cart/[cartId]/page.tsx`
  - [ ] Cart header with request ID
  - [ ] Patient info display
  - [ ] Tests list with remove buttons
  - [ ] Change patient button (modal)
  - [ ] Continue to partner selection button
- [ ] Create patient selection modal
  - [ ] List of self + family members
  - [ ] Select patient
  - [ ] Confirm button
- [ ] Connect to cart APIs
- [ ] Test item removal and patient change
- [ ] Create `/member/lab-tests/select-partner/[cartId]/page.tsx`
  - [ ] Pincode input with validation
  - [ ] Search button
  - [ ] Vendors list with cards
  - [ ] Show pricing (MRP, discounted, savings %)
  - [ ] Collection type badges
  - [ ] Select button for each vendor
- [ ] Connect to check availability API
- [ ] Test vendor list by pincode

#### Day 16: Collection & Slot Selection
- [ ] Create `/member/lab-tests/collection-details/[cartId]/page.tsx`
  - [ ] Collection type radio buttons
  - [ ] Address section (conditional on home collection)
  - [ ] Saved address dropdown
  - [ ] New address form (collapsible)
  - [ ] Continue button
  - [ ] Store selection in state/context
- [ ] Create address form component
  - [ ] Line 1, line 2, city, state, pincode
  - [ ] Validation
- [ ] Create `/member/lab-tests/select-slot/[cartId]/page.tsx`
  - [ ] Date selector (next 7 days)
  - [ ] Time slots grid
  - [ ] Slot selection (radio style)
  - [ ] Available/full indicators
  - [ ] Continue button
- [ ] Connect to slots API
- [ ] Test slot availability and selection

#### Day 17: Review, Payment & Tracking
- [ ] Create `/member/lab-tests/review/[cartId]/page.tsx`
  - [ ] Order summary section
    - Patient details
    - Lab partner
    - Collection type, date, time
    - Address (if home collection)
  - [ ] Tests list with individual prices
  - [ ] Price breakdown section
    - Subtotal
    - Home collection charges
    - Total amount
  - [ ] Confirm & Pay button
- [ ] Connect to place order API
- [ ] Show success message with order ID
- [ ] Redirect to order tracking page
- [ ] Create `/member/lab-tests/orders/[orderId]/page.tsx`
  - [ ] Order header with ID and status badge
  - [ ] Timeline component (vertical stepper)
    - All 8 status steps
    - Completed steps with checkmark
    - Current step highlighted
    - Pending steps grayed out
  - [ ] Order details card
  - [ ] Collection details card
  - [ ] Download reports section (when status = COMPLETED)
- [ ] Create timeline component with icons
- [ ] Connect to order details API
- [ ] Test order tracking with different statuses
- [ ] Create `/member/lab-tests/orders/page.tsx`
  - [ ] Orders list (cards)
  - [ ] Status filter
  - [ ] Search by order ID
  - [ ] Each card shows: ID, date, status, tests count
  - [ ] Click to view details
- [ ] Connect to orders list API
- [ ] Test orders listing and navigation

### PHASE 8: TESTING & POLISH (Days 18-20)

#### Day 18: End-to-End Testing
- [ ] **Complete User Flow Test:**
  1. [ ] Create test services in admin portal
  2. [ ] Create test vendor with pricing in admin portal
  3. [ ] Create slots for vendor
  4. [ ] Member: Upload prescription
  5. [ ] Ops: Digitize prescription and create cart
  6. [ ] Member: Review cart (verify tests appear)
  7. [ ] Member: Enter pincode and select vendor (verify pricing)
  8. [ ] Member: Select collection type and address
  9. [ ] Member: Select time slot
  10. [ ] Member: Review and place order
  11. [ ] Ops: Confirm order
  12. [ ] Ops: Mark as collected
  13. [ ] Ops: Upload report
  14. [ ] Member: View order status (verify timeline)
  15. [ ] Member: Download report
- [ ] Document any bugs found
- [ ] Fix critical bugs

#### Day 19: Bug Fixes & Edge Cases
- [ ] Fix bugs from Day 18 testing
- [ ] Test edge cases:
  - [ ] No vendors available for pincode
  - [ ] No slots available
  - [ ] Remove all items from cart
  - [ ] Upload unsupported file type
  - [ ] Upload file exceeding size limit
  - [ ] Order cancellation
  - [ ] Prescription with no tests detected
- [ ] Add proper error handling
- [ ] Add loading states for all async operations
- [ ] Add empty states for lists

#### Day 20: UI Polish & Documentation
- [ ] **UI Consistency:**
  - [ ] Consistent button styles
  - [ ] Consistent card styles
  - [ ] Consistent colors (use Tailwind theme)
  - [ ] Consistent spacing
  - [ ] Consistent typography
- [ ] **Loading States:**
  - [ ] Add spinners for API calls
  - [ ] Skeleton loaders for lists
  - [ ] Disable buttons during submission
- [ ] **Empty States:**
  - [ ] No active carts
  - [ ] No orders yet
  - [ ] No prescriptions
  - [ ] No slots available
- [ ] **Success/Error Messages:**
  - [ ] Toast notifications for all actions
  - [ ] Clear error messages
  - [ ] Success confirmations
- [ ] **Mobile Responsiveness:**
  - [ ] Test all pages on mobile
  - [ ] Fix layout issues
  - [ ] Ensure tables are scrollable
- [ ] **Documentation:**
  - [ ] Update API documentation
  - [ ] Add comments to complex functions
  - [ ] Create user guide (optional)
  - [ ] Update main architecture docs

### FINAL CHECKLIST

#### Backend Completion
- [ ] All 7 database schemas created and tested
- [ ] All 8 DTOs created with validation
- [ ] All 7 services implemented with business logic
- [ ] All 3 controllers created (member, admin, ops)
- [ ] File upload working for prescriptions and reports
- [ ] Module registered in app.module.ts
- [ ] All endpoints tested with API client

#### Admin Portal Completion
- [ ] Services CRUD working
- [ ] Vendors CRUD working
- [ ] Pricing management working
- [ ] Bulk slot creation working
- [ ] All data persisted correctly

#### Ops Portal Completion
- [ ] Prescription queue displaying
- [ ] Prescription viewer working
- [ ] Digitization creating carts correctly
- [ ] Order confirmation working
- [ ] Sample collection marking working
- [ ] Report upload working
- [ ] Reports accessible to members

#### Member Portal Completion
- [ ] Landing page with all sections
- [ ] Prescription upload working
- [ ] Cart review working
- [ ] Partner selection by pincode working
- [ ] Collection details capture working
- [ ] Slot selection working
- [ ] Order review and placement working
- [ ] Order tracking with timeline working
- [ ] Orders list working
- [ ] Report download working

#### Quality Assurance
- [ ] No console errors
- [ ] All API errors handled gracefully
- [ ] Loading states everywhere
- [ ] Mobile responsive
- [ ] Fast page loads
- [ ] Intuitive navigation
- [ ] Clear user feedback

---

## NOTES & TIPS

### Keep It Simple
- Don't add payment gateway integration (just mark as paid)
- Don't add SMS/email notifications (just console.log for now)
- Don't add complex analytics or reporting
- Don't worry about production-level security (basic auth is fine)
- Don't optimize database queries excessively
- Don't add complex caching

### Focus On
- Core user flow working end-to-end
- Clean, understandable UI
- Clear status updates
- Easy navigation
- Data persistence
- Error handling (basic)

### Reuse Existing Code
- Copy multer config from memberclaims
- Copy auth guards from existing modules
- Copy modal components styles
- Copy table components from admin portal
- Copy file upload patterns

### Quick Wins
- Use Tailwind for styling (no custom CSS)
- Use existing UI components where possible
- Use simple file storage (local filesystem, no S3)
- Use simple IDs (timestamp + random, no UUID library)
- Use existing patterns from appointments/claims modules

---

## ESTIMATED TIMELINE

- **Phase 1 (Backend Foundation)**: 4 days
- **Phase 2 (Backend APIs)**: 2 days
- **Phase 3 (Backend Orders)**: 1 day
- **Phase 4 (Admin Portal)**: 3 days
- **Phase 5 (Ops Portal)**: 2 days
- **Phase 6 (Ops Orders)**: 1 day
- **Phase 7 (Member Portal)**: 4 days
- **Phase 8 (Testing & Polish)**: 3 days

**Total**: ~20 working days (4 weeks)

---

## SUCCESS CRITERIA

✅ **Must Have:**
- Member can upload prescription
- Ops can digitize and create cart
- Member can select vendor and book slot
- Member can place order
- Ops can confirm, mark collected, upload report
- Member can track order and download report

✅ **Nice to Have:**
- Search functionality in admin/ops portals
- Filters in lists
- Pagination in lists
- Order cancellation

❌ **Not Required:**
- Real payment gateway
- SMS/Email notifications
- Advanced analytics
- Real-time updates
- Complex security measures
- Production deployment optimization

---

**END OF IMPLEMENTATION PLAN**
