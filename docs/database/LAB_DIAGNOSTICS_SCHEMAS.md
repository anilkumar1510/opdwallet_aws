# OPD WALLET - LAB DIAGNOSTICS SCHEMAS

**Document Version:** 3.3
**Last Updated:** October 15, 2025
**Database:** MongoDB (opd_wallet)

> **Quick Navigation:**
> - [Database Overview](./DATABASE_OVERVIEW.md) - Complete database structure and relationships
> - [Core Schemas](./CORE_SCHEMAS.md) - Core system collections
> - [Master Data Schemas](./MASTER_DATA_SCHEMAS.md) - Master data collections
> - [Healthcare Schemas](./HEALTHCARE_SCHEMAS.md) - Healthcare-related collections
> - [Wallet & Claims Schemas](./WALLET_CLAIMS_SCHEMAS.md) - Wallet and claims management
> - [Notifications Schemas](./NOTIFICATIONS_SCHEMAS.md) - Notification system

---

## TABLE OF CONTENTS

1. [lab_prescriptions](#1-lab_prescriptions)
2. [lab_carts](#2-lab_carts)
3. [lab_services](#3-lab_services)
4. [lab_vendors](#4-lab_vendors)
5. [lab_vendor_pricing](#5-lab_vendor_pricing)
6. [lab_vendor_slots](#6-lab_vendor_slots)
7. [lab_orders](#7-lab_orders)

---

## COMPLETE SCHEMA DEFINITIONS

### 1. lab_prescriptions

**Collection Name:** `lab_prescriptions`
**Purpose:** Store uploaded lab test prescriptions from members
**Document Count:** Variable
**Timestamps:** Yes (createdAt, updatedAt)

#### Schema Definition

```typescript
{
  _id: ObjectId,
  prescriptionId: string,             // REQUIRED, UNIQUE - "RX-YYYYMMDD-####"
  userId: ObjectId,                   // REQUIRED, REF: 'User'
  patientId: string,                  // REQUIRED
  patientName: string,                // REQUIRED

  // File information
  fileName: string,                   // REQUIRED - Stored filename
  originalName: string,               // REQUIRED - Original uploaded filename
  fileType: string,                   // REQUIRED - MIME type (image/jpeg, application/pdf)
  fileSize: number,                   // REQUIRED - File size in bytes
  filePath: string,                   // REQUIRED - Storage path
  uploadedAt: Date,                   // REQUIRED, DEFAULT: now()

  // Status tracking
  status: string,                     // REQUIRED, ENUM: UPLOADED, DIGITIZING, DIGITIZED, DELAYED
  digitizedBy: string,                // OPS user who digitized
  digitizedAt: Date,
  digitizingStartedAt: Date,
  delayReason: string,

  // Cart reference
  cartId: ObjectId,                   // REF: 'LabCart' - Created after digitization
  notes: string,

  createdAt: Date,
  updatedAt: Date
}
```

#### Enums

**PrescriptionStatus:**
```typescript
enum PrescriptionStatus {
  UPLOADED = 'UPLOADED',              // Initial upload by member
  DIGITIZING = 'DIGITIZING',          // OPS is digitizing
  DIGITIZED = 'DIGITIZED',            // Digitization complete, cart created
  DELAYED = 'DELAYED'                 // Delayed due to issues
}
```

#### Indexes

```typescript
{ prescriptionId: 1 }, { unique: true }       // Unique index
{ userId: 1, status: 1 }                      // Compound index for user queries
{ status: 1, uploadedAt: 1 }                  // Compound index for queue management
```

#### Validation Rules

1. **prescriptionId** - Must be unique, format "RX-YYYYMMDD-####"
2. **userId** - Must reference a valid User document
3. **status** - Must be one of the defined enum values
4. **fileType** - Allowed: image/jpeg, image/png, application/pdf
5. **fileSize** - Maximum 10MB
6. **cartId** - Created only when status is DIGITIZED

#### Sample Data Example

```json
{
  "_id": ObjectId("674d8e123abc456789012720"),
  "prescriptionId": "RX-20251005-0001",
  "userId": ObjectId("674d8e123abc456789012345"),
  "patientId": "USR001",
  "patientName": "John Doe",
  "fileName": "prescription_1728123456.jpg",
  "originalName": "lab_prescription.jpg",
  "fileType": "image/jpeg",
  "fileSize": 1245678,
  "filePath": "./uploads/lab-prescriptions/prescription_1728123456.jpg",
  "uploadedAt": ISODate("2025-10-05T09:00:00Z"),
  "status": "DIGITIZED",
  "digitizedBy": "OPS001",
  "digitizedAt": ISODate("2025-10-05T10:00:00Z"),
  "digitizingStartedAt": ISODate("2025-10-05T09:30:00Z"),
  "cartId": ObjectId("674d8e123abc456789012730"),
  "notes": "Routine blood work",
  "createdAt": ISODate("2025-10-05T09:00:00Z"),
  "updatedAt": ISODate("2025-10-05T10:00:00Z")
}
```

---

### 2. lab_carts

**Collection Name:** `lab_carts`
**Purpose:** Digitized lab test carts with services from prescriptions
**Document Count:** Variable
**Timestamps:** Yes (createdAt, updatedAt)

#### Schema Definition

```typescript
{
  _id: ObjectId,
  cartId: string,                     // REQUIRED, UNIQUE - "CART-YYYYMMDD-####"
  prescriptionId: ObjectId,           // REQUIRED, REF: 'LabPrescription'
  userId: ObjectId,                   // REQUIRED, REF: 'User'
  patientId: string,                  // REQUIRED
  patientName: string,                // REQUIRED

  // Cart items
  items: Array<{
    serviceId: ObjectId,              // REQUIRED, REF: 'LabService'
    serviceName: string,              // REQUIRED
    serviceCode: string,              // REQUIRED
    category: string,                 // REQUIRED - PATHOLOGY, RADIOLOGY, etc.
    description: string
  }>,

  // Status
  status: string,                     // ENUM: CREATED, REVIEWED, ORDERED, CANCELLED
  createdBy: string,                  // REQUIRED - OPS user who created cart

  // Order reference
  orderId: ObjectId,                  // REF: 'LabOrder' - Set when order is placed

  createdAt: Date,
  updatedAt: Date
}
```

#### Enums

**CartStatus:**
```typescript
enum CartStatus {
  CREATED = 'CREATED',                // Cart created by OPS
  REVIEWED = 'REVIEWED',              // Member has reviewed
  ORDERED = 'ORDERED',                // Order placed
  CANCELLED = 'CANCELLED'             // Cart cancelled
}
```

#### Indexes

```typescript
{ cartId: 1 }, { unique: true }               // Unique index
{ userId: 1, status: 1 }                      // Compound index for user queries
{ prescriptionId: 1 }                         // Single field index
```

#### Validation Rules

1. **cartId** - Must be unique, format "CART-YYYYMMDD-####"
2. **prescriptionId** - Must reference a valid LabPrescription document
3. **userId** - Must reference a valid User document
4. **items** - Must contain at least 1 item
5. **items.serviceId** - Must reference a valid LabService document
6. **status** - Must be one of the defined enum values

#### Sample Data Example

```json
{
  "_id": ObjectId("674d8e123abc456789012730"),
  "cartId": "CART-20251005-0001",
  "prescriptionId": ObjectId("674d8e123abc456789012720"),
  "userId": ObjectId("674d8e123abc456789012345"),
  "patientId": "USR001",
  "patientName": "John Doe",
  "items": [
    {
      "serviceId": ObjectId("674d8e123abc456789012740"),
      "serviceName": "Complete Blood Count (CBC)",
      "serviceCode": "CBC001",
      "category": "PATHOLOGY",
      "description": "Complete blood count with differential"
    },
    {
      "serviceId": ObjectId("674d8e123abc456789012741"),
      "serviceName": "Lipid Profile",
      "serviceCode": "LIP001",
      "category": "PATHOLOGY",
      "description": "Complete lipid panel"
    }
  ],
  "status": "REVIEWED",
  "createdBy": "OPS001",
  "createdAt": ISODate("2025-10-05T10:00:00Z"),
  "updatedAt": ISODate("2025-10-05T11:00:00Z")
}
```

---

### 3. lab_services

**Collection Name:** `lab_services`
**Purpose:** Master catalog of lab diagnostic services/tests
**Document Count:** Admin-managed
**Timestamps:** Yes (createdAt, updatedAt)

#### Schema Definition

```typescript
{
  _id: ObjectId,
  serviceId: string,                  // REQUIRED, UNIQUE - "SVC-####"
  code: string,                       // REQUIRED, UNIQUE, UPPERCASE - Service code
  name: string,                       // REQUIRED - Service display name
  category: string,                   // REQUIRED, ENUM: PATHOLOGY, RADIOLOGY, CARDIOLOGY, ENDOSCOPY, OTHER
  description: string,
  sampleType: string,                 // Blood, Urine, Tissue, etc.
  preparationInstructions: string,    // Fasting requirements, etc.
  isActive: boolean,                  // DEFAULT: true
  displayOrder: number,               // DEFAULT: 0 - Sort order
  createdAt: Date,
  updatedAt: Date
}
```

#### Enums

**LabServiceCategory:**
```typescript
enum LabServiceCategory {
  PATHOLOGY = 'PATHOLOGY',
  RADIOLOGY = 'RADIOLOGY',
  CARDIOLOGY = 'CARDIOLOGY',
  ENDOSCOPY = 'ENDOSCOPY',
  OTHER = 'OTHER'
}
```

#### Indexes

```typescript
{ serviceId: 1 }, { unique: true }            // Unique index
{ code: 1 }, { unique: true }                 // Unique index
{ category: 1, isActive: 1 }                  // Compound index for category queries
```

#### Validation Rules

1. **serviceId** - Must be unique, format "SVC-####"
2. **code** - Must be unique, uppercase
3. **category** - Must be one of the defined enum values
4. **name** - Required, minimum 3 characters
5. **isActive** - Controls visibility in booking flow

#### Sample Data Example

```json
{
  "_id": ObjectId("674d8e123abc456789012740"),
  "serviceId": "SVC-0001",
  "code": "CBC001",
  "name": "Complete Blood Count (CBC)",
  "category": "PATHOLOGY",
  "description": "Complete blood count with differential count",
  "sampleType": "Blood",
  "preparationInstructions": "No special preparation required",
  "isActive": true,
  "displayOrder": 1,
  "createdAt": ISODate("2025-10-01T00:00:00Z"),
  "updatedAt": ISODate("2025-10-01T00:00:00Z")
}
```

---

### 4. lab_vendors

**Collection Name:** `lab_vendors`
**Purpose:** Partner laboratory vendors and diagnostic centers
**Document Count:** Admin-managed
**Timestamps:** Yes (createdAt, updatedAt)

#### Schema Definition

```typescript
{
  _id: ObjectId,
  vendorId: string,                   // REQUIRED, UNIQUE - "VND-####"
  name: string,                       // REQUIRED - Vendor name
  code: string,                       // REQUIRED, UNIQUE, UPPERCASE - Vendor code

  // Contact information
  contactInfo: {
    phone: string,                    // REQUIRED
    email: string,                    // REQUIRED
    address: string                   // REQUIRED
  },

  // Service areas
  serviceablePincodes: string[],      // DEFAULT: [] - Array of pincodes served

  // Collection types
  homeCollection: boolean,            // DEFAULT: true - Offers home collection
  centerVisit: boolean,               // DEFAULT: true - Offers center visit
  homeCollectionCharges: number,      // DEFAULT: 50 - Charges for home collection

  description: string,
  isActive: boolean,                  // DEFAULT: true

  createdAt: Date,
  updatedAt: Date
}
```

#### Indexes

```typescript
{ vendorId: 1 }, { unique: true }             // Unique index
{ code: 1 }, { unique: true }                 // Unique index
{ serviceablePincodes: 1 }                    // Array index for pincode queries
{ isActive: 1 }                               // Single field index
```

#### Validation Rules

1. **vendorId** - Must be unique, format "VND-####"
2. **code** - Must be unique, uppercase
3. **contactInfo.phone** - Required, valid phone format
4. **contactInfo.email** - Required, valid email format
5. **serviceablePincodes** - Array of 6-digit pincodes
6. **homeCollectionCharges** - Must be >= 0

#### Sample Data Example

```json
{
  "_id": ObjectId("674d8e123abc456789012750"),
  "vendorId": "VND-0001",
  "name": "Path Labs Delhi",
  "code": "PATHLAB",
  "contactInfo": {
    "phone": "+91-11-45678901",
    "email": "delhi@pathlabs.com",
    "address": "123 Medical Street, Dwarka, New Delhi - 110075"
  },
  "serviceablePincodes": ["110001", "110002", "110075", "110078"],
  "homeCollection": true,
  "centerVisit": true,
  "homeCollectionCharges": 100,
  "description": "Premium diagnostic lab with NABL accreditation",
  "isActive": true,
  "createdAt": ISODate("2025-10-01T00:00:00Z"),
  "updatedAt": ISODate("2025-10-01T00:00:00Z")
}
```

---

### 5. lab_vendor_pricing

**Collection Name:** `lab_vendor_pricing`
**Purpose:** Vendor-specific pricing for lab services
**Document Count:** Admin-managed
**Timestamps:** Yes (createdAt, updatedAt)

#### Schema Definition

```typescript
{
  _id: ObjectId,
  vendorId: ObjectId,                 // REQUIRED, REF: 'LabVendor'
  serviceId: ObjectId,                // REQUIRED, REF: 'LabService'
  actualPrice: number,                // REQUIRED - MRP/Original price
  discountedPrice: number,            // REQUIRED - Selling price after discount
  homeCollectionCharges: number,      // DEFAULT: 0 - Additional charges for home collection
  isActive: boolean,                  // DEFAULT: true
  createdAt: Date,
  updatedAt: Date
}
```

#### Indexes

```typescript
{ vendorId: 1, serviceId: 1 }, { unique: true }  // Composite unique index
{ serviceId: 1, isActive: 1 }                     // Compound index for service queries
```

#### Validation Rules

1. **vendorId** - Must reference a valid LabVendor document
2. **serviceId** - Must reference a valid LabService document
3. **actualPrice** - Must be > 0
4. **discountedPrice** - Must be > 0 and <= actualPrice
5. **homeCollectionCharges** - Must be >= 0
6. **Uniqueness** - One pricing entry per vendor-service combination

#### Sample Data Example

```json
{
  "_id": ObjectId("674d8e123abc456789012760"),
  "vendorId": ObjectId("674d8e123abc456789012750"),
  "serviceId": ObjectId("674d8e123abc456789012740"),
  "actualPrice": 500,
  "discountedPrice": 350,
  "homeCollectionCharges": 0,
  "isActive": true,
  "createdAt": ISODate("2025-10-01T00:00:00Z"),
  "updatedAt": ISODate("2025-10-01T00:00:00Z")
}
```

---

### 6. lab_vendor_slots

**Collection Name:** `lab_vendor_slots`
**Purpose:** Available time slots for sample collection at vendor locations
**Document Count:** Admin-managed
**Timestamps:** Yes (createdAt, updatedAt)

#### Schema Definition

```typescript
{
  _id: ObjectId,
  slotId: string,                     // REQUIRED - "SLOT-####"
  vendorId: ObjectId,                 // REQUIRED, REF: 'LabVendor'
  pincode: string,                    // REQUIRED - Service location pincode
  date: string,                       // REQUIRED - YYYY-MM-DD format
  timeSlot: string,                   // REQUIRED - "09:00 AM - 10:00 AM"
  startTime: string,                  // REQUIRED - "09:00"
  endTime: string,                    // REQUIRED - "10:00"
  maxBookings: number,                // REQUIRED, DEFAULT: 5 - Maximum bookings per slot
  currentBookings: number,            // DEFAULT: 0 - Current booking count
  isActive: boolean,                  // DEFAULT: true
  createdAt: Date,
  updatedAt: Date
}
```

#### Indexes

```typescript
{ vendorId: 1, date: 1, pincode: 1 }          // Compound index for availability queries
{ date: 1, isActive: 1 }                      // Compound index for date queries
```

#### Validation Rules

1. **slotId** - Required, unique identifier
2. **vendorId** - Must reference a valid LabVendor document
3. **pincode** - Must be 6-digit pincode
4. **date** - Must be in YYYY-MM-DD format, future date
5. **maxBookings** - Must be > 0
6. **currentBookings** - Must be >= 0 and <= maxBookings
7. **startTime/endTime** - Must be valid time format (HH:MM)

#### Sample Data Example

```json
{
  "_id": ObjectId("674d8e123abc456789012770"),
  "slotId": "SLOT-0001",
  "vendorId": ObjectId("674d8e123abc456789012750"),
  "pincode": "110075",
  "date": "2025-10-10",
  "timeSlot": "09:00 AM - 10:00 AM",
  "startTime": "09:00",
  "endTime": "10:00",
  "maxBookings": 5,
  "currentBookings": 2,
  "isActive": true,
  "createdAt": ISODate("2025-10-05T00:00:00Z"),
  "updatedAt": ISODate("2025-10-06T08:00:00Z")
}
```

---

### 7. lab_orders

**Collection Name:** `lab_orders`
**Purpose:** Final lab test orders with payment and report tracking
**Document Count:** Variable
**Timestamps:** Yes (createdAt, updatedAt)

#### Schema Definition

```typescript
{
  _id: ObjectId,
  orderId: string,                    // REQUIRED, UNIQUE - "ORD-YYYYMMDD-####"
  userId: ObjectId,                   // REQUIRED, REF: 'User'
  cartId: ObjectId,                   // REQUIRED, REF: 'LabCart'
  prescriptionId: ObjectId,           // REQUIRED, REF: 'LabPrescription'
  vendorId: ObjectId,                 // REQUIRED, REF: 'LabVendor'
  vendorName: string,                 // REQUIRED

  // Order items
  items: Array<{
    serviceId: ObjectId,              // REQUIRED, REF: 'LabService'
    serviceName: string,              // REQUIRED
    serviceCode: string,              // REQUIRED
    actualPrice: number,              // REQUIRED
    discountedPrice: number           // REQUIRED
  }>,

  // Status
  status: string,                     // ENUM: PLACED, CONFIRMED, SAMPLE_COLLECTED, PROCESSING, COMPLETED, CANCELLED

  // Collection details
  collectionType: string,             // ENUM: HOME_COLLECTION, CENTER_VISIT
  collectionAddress: {
    fullName: string,
    phone: string,
    addressLine1: string,
    addressLine2: string,
    pincode: string,
    city: string,
    state: string
  },
  collectionDate: string,             // YYYY-MM-DD
  collectionTime: string,             // "09:00 AM - 10:00 AM"
  slotId: ObjectId,                   // REF: 'LabVendorSlot'

  // Pricing
  totalActualPrice: number,           // REQUIRED - Sum of actual prices
  totalDiscountedPrice: number,       // REQUIRED - Sum of discounted prices
  homeCollectionCharges: number,      // REQUIRED - 0 for center visit
  finalAmount: number,                // REQUIRED - Total payable amount

  // Payment
  paymentStatus: string,              // ENUM: PENDING, COMPLETED, FAILED, REFUNDED
  paymentMode: string,
  paymentDate: Date,

  // Legacy fields (backward compatibility)
  subtotal: number,
  discount: number,
  totalAmount: number,
  paymentInfo: {
    status: string,
    transactionId: string,
    paymentMethod: string,
    paidAt: Date,
    amount: number
  },

  // Reports
  reportUrl: string,                  // DEPRECATED - Use reports array
  reports: Array<{
    fileName: string,
    originalName: string,
    filePath: string,
    uploadedAt: Date,
    uploadedBy: string
  }>,
  reportUploadedAt: Date,

  // Timestamps
  placedAt: Date,
  confirmedAt: Date,
  confirmedBy: string,
  collectedAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  cancellationReason: string,
  notes: string,

  createdAt: Date,
  updatedAt: Date
}
```

#### Enums

**OrderStatus:**
```typescript
enum OrderStatus {
  PLACED = 'PLACED',                  // Order placed by member
  CONFIRMED = 'CONFIRMED',            // Confirmed by OPS/vendor
  SAMPLE_COLLECTED = 'SAMPLE_COLLECTED',  // Sample collected
  PROCESSING = 'PROCESSING',          // Lab processing
  COMPLETED = 'COMPLETED',            // Reports uploaded
  CANCELLED = 'CANCELLED'             // Order cancelled
}
```

**CollectionType:**
```typescript
enum CollectionType {
  HOME_COLLECTION = 'HOME_COLLECTION',
  CENTER_VISIT = 'CENTER_VISIT'
}
```

**PaymentStatus:**
```typescript
enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}
```

#### Indexes

```typescript
{ orderId: 1 }, { unique: true }              // Unique index
{ userId: 1, status: 1 }                      // Compound index for user queries
{ vendorId: 1, status: 1 }                    // Compound index for vendor queries
{ status: 1, createdAt: -1 }                  // Compound index for status queries
{ prescriptionId: 1 }                         // Single field index
{ cartId: 1 }                                 // Single field index
```

#### Validation Rules

1. **orderId** - Must be unique, format "ORD-YYYYMMDD-####"
2. **userId** - Must reference a valid User document
3. **cartId** - Must reference a valid LabCart document
4. **prescriptionId** - Must reference a valid LabPrescription document
5. **vendorId** - Must reference a valid LabVendor document
6. **items** - Must contain at least 1 item
7. **status** - Must be one of the defined enum values
8. **collectionType** - Must be one of the defined enum values
9. **paymentStatus** - Must be one of the defined enum values
10. **finalAmount** - Must be > 0
11. **collectionAddress** - Required for HOME_COLLECTION type

#### Sample Data Example

```json
{
  "_id": ObjectId("674d8e123abc456789012780"),
  "orderId": "ORD-20251005-0001",
  "userId": ObjectId("674d8e123abc456789012345"),
  "cartId": ObjectId("674d8e123abc456789012730"),
  "prescriptionId": ObjectId("674d8e123abc456789012720"),
  "vendorId": ObjectId("674d8e123abc456789012750"),
  "vendorName": "Path Labs Delhi",
  "items": [
    {
      "serviceId": ObjectId("674d8e123abc456789012740"),
      "serviceName": "Complete Blood Count (CBC)",
      "serviceCode": "CBC001",
      "actualPrice": 500,
      "discountedPrice": 350
    },
    {
      "serviceId": ObjectId("674d8e123abc456789012741"),
      "serviceName": "Lipid Profile",
      "serviceCode": "LIP001",
      "actualPrice": 800,
      "discountedPrice": 600
    }
  ],
  "status": "SAMPLE_COLLECTED",
  "collectionType": "HOME_COLLECTION",
  "collectionAddress": {
    "fullName": "John Doe",
    "phone": "+919876543210",
    "addressLine1": "123 Main Street",
    "addressLine2": "Apartment 4B",
    "pincode": "110075",
    "city": "Delhi",
    "state": "Delhi"
  },
  "collectionDate": "2025-10-10",
  "collectionTime": "09:00 AM - 10:00 AM",
  "slotId": ObjectId("674d8e123abc456789012770"),
  "totalActualPrice": 1300,
  "totalDiscountedPrice": 950,
  "homeCollectionCharges": 100,
  "finalAmount": 1050,
  "paymentStatus": "COMPLETED",
  "paymentMode": "WALLET",
  "paymentDate": ISODate("2025-10-06T10:00:00Z"),
  "reports": [],
  "placedAt": ISODate("2025-10-06T10:00:00Z"),
  "confirmedAt": ISODate("2025-10-06T11:00:00Z"),
  "confirmedBy": "OPS001",
  "collectedAt": ISODate("2025-10-10T09:30:00Z"),
  "notes": "Patient fasting as instructed",
  "createdAt": ISODate("2025-10-06T10:00:00Z"),
  "updatedAt": ISODate("2025-10-10T09:30:00Z")
}
```

---


**Document Version:** 3.3
**Last Updated:** October 15, 2025
**For Questions:** Contact development team
