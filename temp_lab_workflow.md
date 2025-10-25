# Lab Module - Complete Workflow Documentation

## Overview

The lab diagnostics module allows members to order lab tests (blood tests, X-rays, etc.) by uploading their prescription, and having operations staff convert it into an order.

---

## The Complete Lab Journey

### Step 1: Member Uploads Prescription 📤
**Member Portal** (`/member/lab-tests/upload`)

- Member takes a photo of their doctor's prescription for lab tests
- Uploads the image/PDF (max 10MB)
- Adds patient name and optional notes
- System creates a **LabPrescription** record with status `UPLOADED`
- File is saved to `uploads/lab-prescriptions/`

### Step 2: Operations Team Digitizes 💻
**Admin Portal** (`/operations/lab/prescriptions/[id]/digitize`)

The operations team sees the uploaded prescription and converts it to a digital cart:

1. **View prescription image** side-by-side with a test catalog
2. **Search lab services** by name or code (e.g., "CBC", "Blood Sugar")
3. **Add tests** from the catalog that match the prescription
4. **Create cart** or mark as "Delayed" if unclear

When digitized:
- Prescription status → `DIGITIZED`
- A **LabCart** is automatically created with all selected tests
- Member gets notified that their cart is ready

### Step 3: Member Reviews Cart 🛒
**Member Portal** (`/member/lab-tests/cart/[id]`)

- Member sees all the tests that were added
- Reviews test names, codes, and categories
- Can proceed to select a vendor

### Step 4: Member Selects Lab Vendor 🏥
**Member Portal** (`/member/lab-tests/cart/[id]/vendor/[vendorId]`)

Member chooses:

1. **Lab vendor** (based on their pincode)
   - System shows only vendors that service their area
   - Each vendor has their own pricing for tests

2. **Collection type:**
   - **Home Collection**: Lab person comes to your home (extra charges apply)
   - **Center Visit**: Go to the lab center (no extra charges)

3. **Date & Time Slot** for sample collection
   - See available slots from the vendor
   - Book a specific time slot

### Step 5: Order Placement ✅
**System creates LabOrder:**

**Pricing calculation:**
- Fetches each test's price from the vendor's pricing table
- Calculates: `actualPrice` (MRP) vs `discountedPrice` (selling price)
- Adds home collection charges if applicable
- Final amount = total discounted price + home collection charges

**Order details:**
- Order ID generated (e.g., `ORD-1234567890-ABC123`)
- Status: `PLACED`
- Payment status: `PENDING`
- Collection address (if home collection)
- Collection date/time and slot booking

### Step 6: Order Fulfillment 📦
**Operations team manages order through statuses:**

1. **`PLACED`** → New order received
2. **`CONFIRMED`** → Vendor confirmed the booking
3. **`SAMPLE_COLLECTED`** → Sample collected from patient
4. **`PROCESSING`** → Lab is testing the samples
5. **`COMPLETED`** → Report uploaded and ready
6. **`CANCELLED`** → Order cancelled (with reason)

---

## Database Structure (7 Collections)

### 1. `lab_services` - Test Catalog
All available tests in the system:
```
- serviceId, code, name
- category: PATHOLOGY, RADIOLOGY, CARDIOLOGY, etc.
- sampleType: "Blood", "Urine", etc.
- preparationInstructions
- isActive, displayOrder
```

### 2. `lab_vendors` - Lab Partners
Lab service providers:
```
- vendorId, name, code
- contactInfo: phone, email, address
- serviceablePincodes: ["400001", "400002"]
- homeCollection: true/false
- homeCollectionCharges: 50
- isActive
```

### 3. `lab_vendor_pricing` - Vendor-specific Pricing
Each vendor's price for each test:
```
- vendorId + serviceId (unique combination)
- actualPrice: 500 (MRP)
- discountedPrice: 400 (selling price)
- isActive
```

### 4. `lab_vendor_slots` - Availability Slots
Time slots for sample collection:
```
- vendorId, pincode, date
- timeSlot: "09:00 AM - 10:00 AM"
- startTime: "09:00", endTime: "10:00"
- maxBookings: 5
- currentBookings: 2 (incremented when booked)
- isActive
```

### 5. `lab_prescriptions` - Uploaded Prescriptions
```
- prescriptionId: "PRES-123..."
- userId, patientId, patientName
- fileName, filePath, fileType, fileSize
- status: UPLOADED → DIGITIZING → DIGITIZED / DELAYED
- cartId (linked after digitization)
- digitizedBy, digitizedAt
```

### 6. `lab_carts` - Shopping Carts
```
- cartId: "CART-123..."
- prescriptionId, userId, patientId
- items: [{ serviceId, serviceName, serviceCode, category }]
- status: CREATED → REVIEWED → ORDERED → CANCELLED
- createdBy (ops user who digitized)
- orderId (linked after order placement)
```

### 7. `lab_orders` - Final Orders
```
- orderId: "ORD-123..."
- userId, cartId, prescriptionId, vendorId
- items: [{ serviceId, serviceName, actualPrice, discountedPrice }]
- status: PLACED → CONFIRMED → SAMPLE_COLLECTED → PROCESSING → COMPLETED
- collectionType: HOME_COLLECTION / CENTER_VISIT
- collectionAddress, collectionDate, collectionTime, slotId
- totalActualPrice, totalDiscountedPrice, homeCollectionCharges, finalAmount
- paymentStatus: PENDING → COMPLETED / FAILED
- reports: [{ fileName, filePath, uploadedAt }]
- timestamps for each status
```

---

## Key Features

### Multi-vendor Support
- Different labs charge different prices for same test
- Vendors service specific pincodes
- Each vendor has their own availability slots

### Smart Pricing
- Server-side price calculation (security)
- Shows MRP vs discounted price
- Dynamic home collection charges

### Order Lifecycle Tracking
- Complete status tracking with timestamps
- Each status change recorded (confirmedAt, collectedAt, completedAt)
- Cancellation with reason tracking

### File Management
- Prescription uploads: 10MB limit, images/PDF only
- Report uploads when tests complete
- Multiple reports can be attached to one order

### Role-based Access
- **Members**: Upload prescription, view cart, place orders, track status
- **Operations**: Digitize prescriptions, manage orders, upload reports
- **Admins**: Manage vendors, pricing, services, slots

---

## Real-world Example

**User Story:**
1. Patient gets prescription from doctor for "CBC, Blood Sugar, Lipid Profile"
2. Uploads prescription photo via mobile app
3. Ops team digitizes it → adds 3 tests to cart
4. Member sees cart with 3 tests
5. Selects "PathLab" (₹350 total) over "Quest Diagnostics" (₹450)
6. Chooses home collection for next day 9-10 AM
7. Order placed: ₹350 + ₹50 home collection = ₹400
8. Sample collected next day
9. Report ready in 24 hours → uploaded by ops
10. Member downloads PDF report

---

## Module Architecture

### Backend Structure
**Location:** `api/src/modules/lab/`

**Controllers:**
- `lab-member.controller.ts` - Member-facing APIs
- `lab-ops.controller.ts` - Operations team APIs
- `lab-admin.controller.ts` - Admin configuration APIs

**Services:**
- `lab-prescription.service.ts` - Prescription management
- `lab-cart.service.ts` - Cart operations
- `lab-service.service.ts` - Test catalog management
- `lab-vendor.service.ts` - Vendor & pricing management
- `lab-order.service.ts` - Order processing

**Schemas:**
- 7 MongoDB schemas for all entities
- Proper indexing for performance
- Validation and enums for data integrity

### Frontend Structure
**Member Portal:** `web-member/app/member/lab-tests/`
- `/upload` - Upload prescription page
- `/cart/[id]` - Review cart page
- `/cart/[id]/vendor/[vendorId]` - Vendor selection & booking
- `/orders` - Order history
- `/orders/[orderId]` - Order details

**Admin Portal:** `web-admin/app/(admin)/`
- `/operations/lab/prescriptions` - Prescription queue
- `/operations/lab/prescriptions/[id]/digitize` - Digitization interface
- `/operations/lab/orders` - Order management
- `/lab/services` - Test catalog management
- `/lab/vendors` - Vendor management
- `/lab/vendors/[vendorId]/pricing` - Pricing configuration
- `/lab/vendors/[vendorId]/slots` - Slot management

---

This module is essentially an **e-commerce system specifically designed for lab test ordering**, with prescription-to-cart workflow, multi-vendor marketplace, slot booking, and complete order fulfillment tracking!
