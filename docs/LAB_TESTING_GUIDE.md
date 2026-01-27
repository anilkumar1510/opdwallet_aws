# Lab Module - Complete Testing Guide

## Prerequisites

Before testing, ensure:
1. MongoDB is running
2. API server is running
3. All three web portals (member, admin, doctor) are running
4. You have credentials for:
   - A member account
   - An admin/operations account

---

## Step 1: Seed Lab Data

First, populate the lab tables with test data.

### 1.1 Navigate to API Directory
```bash
cd api
```

### 1.2 Run Lab Seed Script
```bash
npm run seed:lab
```

### 1.3 Verify Seeding Success
You should see output like:
```
✅ Lab Services: 25
✅ Lab Vendors: 4
✅ Pricing Records: 100
✅ Time Slots: 2520
```

### What Gets Seeded?

**Lab Services (25 tests):**
- 18 Pathology tests (CBC, Blood Sugar, Lipid Profile, Liver/Kidney/Thyroid tests, etc.)
- 4 Radiology tests (X-Ray Chest/Abdomen, Ultrasound)
- 3 Cardiology tests (ECG, 2D Echo, TMT)

**Lab Vendors (4 partners):**
1. **PathLab Diagnostics** - ₹50 home collection
2. **Dr. Lal PathLabs** - ₹75 home collection
3. **Thyrocare Technologies** - ₹40 home collection (no center visit)
4. **Metropolis Healthcare** - ₹60 home collection

**Service Areas:**
- All vendors service Mumbai pincodes: 400001-400009
- Use any of these pincodes during testing

**Time Slots:**
- Generated for next 14 days
- 9 slots per day (8 AM to 6 PM)
- Each slot can handle 5 bookings

---

## Step 2: Test Complete Lab Workflow

### PHASE 1: Upload Prescription (Member Portal)

#### 2.1 Login as Member
1. Open Member Portal: `http://localhost/` or `http://localhost:3002/` (or production URL)
2. Login with your member credentials
3. Verify you're logged in successfully

#### 2.2 Navigate to Lab Tests
1. Click on **Lab Tests** from the dashboard/menu
2. You should land on `/member/lab-tests` page

#### 2.3 Upload Prescription
1. Click **Upload Prescription** button
2. You'll be on `/member/lab-tests/upload`
3. **Select a prescription image:**
   - Use any medical prescription image/PDF
   - Or use a sample prescription (take a photo of any medical document)
   - File size must be < 10MB
   - Formats: JPG, PNG, PDF

4. **Fill in details:**
   - Patient Name: (auto-filled with your name, can modify)
   - Notes: (optional) e.g., "Need urgent processing"

5. Click **Upload Prescription**

#### 2.4 Verify Upload Success
- You should see success message: "Prescription uploaded successfully!"
- You'll be redirected back to `/member/lab-tests`
- **Record the prescription ID** shown (format: `PRES-1234567890-ABC123`)

#### 2.5 Check Prescription Status
1. On the lab tests page, you should see your uploaded prescription
2. Status should be: **UPLOADED** (yellow/pending status)
3. Note: Cart is not created yet - waiting for ops team to digitize

**✅ CHECKPOINT 1:**
- [ ] Prescription uploaded successfully
- [ ] Prescription ID recorded
- [ ] Status shows "UPLOADED"
- [ ] Prescription appears in list

---

### PHASE 2: Digitize Prescription (Admin Portal)

#### 2.6 Login as Operations/Admin User
1. Open Admin Portal: `http://localhost/admin` or `http://localhost:3001/admin` (or production URL)
2. Login with admin/operations credentials
3. Navigate to **Operations** → **Lab** → **Prescriptions**

#### 2.7 View Prescription Queue
1. You should see the uploaded prescription in the queue
2. Look for the prescription ID you recorded earlier
3. Status should be **UPLOADED**
4. Click on the prescription to view details

#### 2.8 Digitize the Prescription
1. Click **Digitize** button (or similar action)
2. You'll be on `/operations/lab/prescriptions/[id]/digitize`
3. You'll see two panels:
   - **Left:** Prescription image
   - **Right:** Test selection interface

#### 2.9 Add Tests to Cart
1. **Search for tests** in the search box:
   ```
   Examples to add:
   - CBC (Complete Blood Count)
   - FBS (Fasting Blood Sugar)
   - LIPID (Lipid Profile)
   ```

2. **For each test:**
   - Type test name in search box
   - Select from dropdown results
   - Click **+** icon to add
   - Test appears in "Selected Tests" section

3. **Add at least 3-5 tests** for realistic testing

4. **Verify selected tests:**
   - Check the "Selected Tests" count
   - Remove any wrong test with **X** button
   - Ensure test codes and names are correct

#### 2.10 Create Cart
1. Click **Create Cart** button
2. Wait for processing
3. Success message: "Prescription digitized and cart created successfully"

#### 2.11 Verify Digitization
- Prescription status → **DIGITIZED**
- A cart should be automatically created
- Cart ID will be generated (format: `CART-1234567890-ABC123`)
- **Record the cart ID**

**✅ CHECKPOINT 2:**
- [ ] Prescription status changed to "DIGITIZED"
- [ ] Cart created successfully
- [ ] Cart ID recorded
- [ ] All selected tests appear in cart

**Alternative Path: Mark as Delayed**
- If prescription is unclear, you can click **Mark Delayed**
- Enter delay reason (e.g., "Prescription image not clear")
- Status → **DELAYED**
- No cart is created

---

### PHASE 3: Review Cart (Member Portal)

#### 2.12 Go Back to Member Portal
1. Switch back to Member Portal
2. Navigate to **Lab Tests** page
3. You should now see your prescription with status **DIGITIZED**

#### 2.13 View Cart
1. Click on **View Cart** or similar button
2. You'll be on `/member/lab-tests/cart/[cartId]`
3. **Verify cart details:**
   - All tests you added are listed
   - Test names and codes are correct
   - Patient name is correct

**✅ CHECKPOINT 3:**
- [ ] Cart visible in member portal
- [ ] All tests are listed correctly
- [ ] Patient details are correct

---

### PHASE 4: Select Vendor & Book Slot (Member Portal)

#### 2.14 Choose a Lab Vendor
1. On the cart page, click **Select Vendor** or **Proceed to Book**
2. **Enter your pincode** (use: 400001, 400002, or any from 400001-400009)
3. You'll see list of available vendors for your pincode

4. **Compare vendors:**
   ```
   Example display:

   PathLab Diagnostics
   - Total: ₹850
   - Home Collection: ₹50
   - Final: ₹900

   Dr. Lal PathLabs
   - Total: ₹920
   - Home Collection: ₹75
   - Final: ₹995

   Thyrocare Technologies
   - Total: ₹780
   - Home Collection: ₹40
   - Final: ₹820  ← Cheapest

   Metropolis Healthcare
   - Total: ₹890
   - Home Collection: ₹60
   - Final: ₹950
   ```

5. **Select a vendor** (e.g., click on "Thyrocare Technologies")

#### 2.15 Choose Collection Type
1. You'll be on `/member/lab-tests/cart/[id]/vendor/[vendorId]`
2. **Select collection type:**
   - **Home Collection:** Sample collected at your address (charges apply)
   - **Center Visit:** Visit lab center (no extra charges)

3. **If Home Collection:**
   - Fill in complete address:
     - Full Name
     - Phone Number
     - Address Line 1
     - Address Line 2 (optional)
     - Pincode (e.g., 400001)
     - City (e.g., Mumbai)
     - State (e.g., Maharashtra)

#### 2.16 Select Date & Time Slot
1. **Choose collection date:**
   - Calendar will show next 14 days
   - Pick any available date

2. **Select time slot:**
   ```
   Available slots:
   ○ 08:00 AM - 09:00 AM
   ○ 09:00 AM - 10:00 AM  ← Select this
   ○ 10:00 AM - 11:00 AM
   ○ 11:00 AM - 12:00 PM
   ... etc
   ```

3. **Verify slot availability:**
   - Green = Available (0-4 bookings)
   - Yellow = Limited (4 bookings)
   - Red = Full (5 bookings)

#### 2.17 Review Order Summary
Before placing order, verify:
```
Order Summary:
─────────────────────────
Tests: 3 tests
  • CBC - ₹250
  • FBS - ₹80
  • Lipid Profile - ₹470
─────────────────────────
Subtotal:           ₹800
Home Collection:    ₹40
─────────────────────────
Total Amount:       ₹840
─────────────────────────
```

#### 2.18 Place Order
1. Click **Place Order** button
2. Wait for processing (server calculates final pricing)
3. Success message: "Order placed successfully!"

#### 2.19 Get Order Details
- Order ID generated (format: `ORD-1234567890-ABC123`)
- **Record the order ID**
- Order status: **PLACED**
- Payment status: **PENDING**

**✅ CHECKPOINT 4:**
- [ ] Vendor selected successfully
- [ ] Collection type chosen
- [ ] Date & time slot booked
- [ ] Order placed successfully
- [ ] Order ID recorded

---

### PHASE 5: View & Track Order (Member Portal)

#### 2.20 Navigate to Orders
1. Go to **Lab Tests** → **Orders** or `/member/lab-tests/orders`
2. You should see your new order listed

#### 2.21 View Order Details
1. Click on the order
2. You'll be on `/member/lab-tests/orders/[orderId]`

3. **Verify order information:**
   - Order ID
   - Order status: **PLACED**
   - Vendor name
   - Collection type (Home/Center)
   - Collection date & time
   - Collection address (if home collection)
   - Test items list
   - Pricing breakdown
   - Payment status

**✅ CHECKPOINT 5:**
- [ ] Order appears in orders list
- [ ] Order details are correct
- [ ] Status shows "PLACED"
- [ ] All information matches what you entered

---

### PHASE 6: Manage Order (Admin Portal)

#### 2.22 View Order in Admin Portal
1. Switch to Admin Portal
2. Navigate to **Operations** → **Lab** → **Orders**
3. Find your order by Order ID

#### 2.23 Update Order Status - CONFIRMED
1. Click on your order
2. Click **Confirm Order** button (or update status dropdown)
3. Status changes: **PLACED** → **CONFIRMED**
4. `confirmedAt` timestamp recorded
5. Member can see updated status

#### 2.24 Update Order Status - SAMPLE_COLLECTED
1. Click **Mark Sample Collected** (or update status)
2. Status changes: **CONFIRMED** → **SAMPLE_COLLECTED**
3. `collectedAt` timestamp recorded

#### 2.25 Update Order Status - PROCESSING
1. Update status to **PROCESSING**
2. This indicates lab is testing the samples

#### 2.26 Upload Report & Complete Order
1. Status: **PROCESSING** → **COMPLETED**
2. **Upload test report:**
   - Click **Upload Report** button
   - Select report PDF file
   - File gets saved to `uploads/lab-reports/`

3. **Complete the order:**
   - Click **Complete Order**
   - Status → **COMPLETED**
   - `completedAt` timestamp recorded
   - Report becomes available for download

**✅ CHECKPOINT 6:**
- [ ] Order status updated to CONFIRMED
- [ ] Order status updated to SAMPLE_COLLECTED
- [ ] Order status updated to PROCESSING
- [ ] Report uploaded successfully
- [ ] Order status updated to COMPLETED

---

### PHASE 7: Verify Complete Workflow (Member Portal)

#### 2.27 Check Final Order Status
1. Go back to Member Portal
2. Navigate to order details
3. **Verify:**
   - Status shows: **COMPLETED**
   - Report is available for download
   - All timestamps are recorded
   - Order lifecycle is complete

#### 2.28 Download Report
1. Click **Download Report** button
2. PDF file downloads successfully
3. Open and verify it's the correct report

**✅ CHECKPOINT 7:**
- [ ] Order status shows "COMPLETED" in member portal
- [ ] Report download link is visible
- [ ] Report downloads successfully
- [ ] Complete workflow verified

---

## Step 3: Test Edge Cases & Validations

### Test Case 1: Delayed Prescription
1. Upload a new prescription
2. In admin portal, click **Mark Delayed** instead of digitizing
3. Enter reason: "Prescription image is blurry"
4. Verify prescription status → **DELAYED**
5. No cart should be created
6. Member should see delayed status with reason

### Test Case 2: Multiple Vendors Comparison
1. Digitize a prescription with same tests
2. Check pricing from all 4 vendors
3. Verify:
   - Different prices for same tests
   - Home collection charges vary
   - Total amounts are different
   - Cheapest option is highlighted

### Test Case 3: Slot Availability
1. Try booking same slot multiple times (max 5 bookings per slot)
2. After 5 bookings, slot should show "Full"
3. Verify `currentBookings` counter increments

### Test Case 4: Invalid Pincode
1. Try entering a pincode not in serviceable list (e.g., 999999)
2. Verify: No vendors appear
3. Error message: "No vendors available in your area"

### Test Case 5: Order Cancellation
1. Place an order
2. In admin portal, cancel the order
3. Enter cancellation reason
4. Verify status → **CANCELLED**
5. Verify `cancelledAt` timestamp
6. Member should see cancellation reason

### Test Case 6: Empty Cart
1. Try to proceed without digitizing prescription
2. Verify: Cart is not available
3. Proper error handling

### Test Case 7: File Upload Validation
1. Try uploading file > 10MB → should fail
2. Try uploading non-image file (e.g., .txt) → should fail
3. Try uploading without patient name → should fail

---

## Step 4: Verify Database Records

### Check MongoDB Collections

#### 4.1 Lab Services
```bash
# In MongoDB shell or Compass
db.lab_services.countDocuments()  // Should be 25
db.lab_services.find({ category: 'PATHOLOGY' }).count()  // Should be 18
```

#### 4.2 Lab Vendors
```bash
db.lab_vendors.countDocuments()  // Should be 4
db.lab_vendors.find({ isActive: true })
```

#### 4.3 Lab Vendor Pricing
```bash
db.lab_vendor_pricing.countDocuments()  // Should be 100 (25 services × 4 vendors)
db.lab_vendor_pricing.find({ serviceId: ObjectId('...') })  // Check pricing for one service
```

#### 4.4 Lab Vendor Slots
```bash
db.lab_vendor_slots.countDocuments()  // Should be ~2520
db.lab_vendor_slots.find({ date: '2025-10-26' })  // Check slots for specific date
```

#### 4.5 Lab Prescriptions
```bash
db.lab_prescriptions.find()  // Your uploaded prescriptions
db.lab_prescriptions.find({ status: 'DIGITIZED' })
```

#### 4.6 Lab Carts
```bash
db.lab_carts.find()  // Your created carts
db.lab_carts.find({ status: 'ORDERED' })
```

#### 4.7 Lab Orders
```bash
db.lab_orders.find()  // Your placed orders
db.lab_orders.find({ status: 'COMPLETED' })
```

---

## Step 5: Test API Endpoints Directly

### Using Postman/cURL

#### 5.1 Upload Prescription
```bash
POST /api/member/lab/prescriptions/upload
Content-Type: multipart/form-data

Fields:
- file: [prescription image]
- patientId: [your user ID]
- patientName: "Test Patient"
- notes: "Urgent processing needed"
```

#### 5.2 Get User Prescriptions
```bash
GET /api/member/lab/prescriptions
```

#### 5.3 Digitize Prescription
```bash
POST /api/ops/lab/prescriptions/[prescriptionId]/digitize
Content-Type: application/json

{
  "prescriptionId": "PRES-...",
  "status": "DIGITIZED",
  "items": [
    {
      "serviceId": "LAB-001",
      "serviceName": "Complete Blood Count (CBC)",
      "serviceCode": "CBC",
      "category": "PATHOLOGY"
    }
  ]
}
```

#### 5.4 Get Vendors by Pincode
```bash
GET /api/member/lab/vendors/available?pincode=400001
```

#### 5.5 Get Vendor Slots
```bash
GET /api/member/lab/vendors/[vendorId]/slots?pincode=400001&date=2025-10-26
```

#### 5.6 Create Order
```bash
POST /api/member/lab/orders
Content-Type: application/json

{
  "cartId": "CART-...",
  "vendorId": "[vendor ObjectId]",
  "collectionType": "HOME_COLLECTION",
  "collectionAddress": {
    "fullName": "Test User",
    "phone": "+91-9876543210",
    "addressLine1": "123 Test Street",
    "pincode": "400001",
    "city": "Mumbai",
    "state": "Maharashtra"
  },
  "collectionDate": "2025-10-26",
  "collectionTime": "09:00 AM - 10:00 AM",
  "slotId": "[slot ObjectId]"
}
```

---

## Troubleshooting

### Issue 1: Prescription Upload Fails
- **Check:** File size < 10MB
- **Check:** File type is image or PDF
- **Check:** Patient name is provided
- **Check:** User is logged in
- **Check:** API endpoint `/api/member/lab/prescriptions/upload` is accessible

### Issue 2: No Vendors Appear
- **Check:** Pincode is in serviceable list (400001-400009)
- **Check:** Vendors are seeded with `isActive: true`
- **Check:** Vendor pricing is available for tests in cart

### Issue 3: No Time Slots Available
- **Check:** Slots are generated for the date
- **Check:** Selected date is within next 14 days
- **Check:** Slots have `isActive: true`
- **Check:** Slots haven't reached `maxBookings` limit

### Issue 4: Order Placement Fails
- **Check:** Cart exists and status is not ORDERED
- **Check:** Vendor ID is valid
- **Check:** Slot ID is valid and not full
- **Check:** All required fields are provided
- **Check:** Server-side pricing calculation succeeds

### Issue 5: Cart Not Created After Digitization
- **Check:** Status was set to DIGITIZED (not DELAYED)
- **Check:** At least one test was added
- **Check:** Prescription exists in database
- **Check:** User ID from prescription is valid

---

## Success Criteria

You have successfully tested the lab module if:

✅ **Data Seeding:**
- [ ] 25 lab services seeded
- [ ] 4 vendors seeded
- [ ] 100 pricing records seeded
- [ ] 2500+ time slots seeded

✅ **Prescription Upload:**
- [ ] Can upload prescription image
- [ ] Prescription appears in member portal
- [ ] Status is UPLOADED

✅ **Prescription Digitization:**
- [ ] Can search and add tests
- [ ] Cart is created automatically
- [ ] Prescription status changes to DIGITIZED

✅ **Vendor Selection:**
- [ ] Can see multiple vendors
- [ ] Pricing comparison works
- [ ] Can select preferred vendor

✅ **Slot Booking:**
- [ ] Can see available slots
- [ ] Can select date and time
- [ ] Slot booking increments counter

✅ **Order Placement:**
- [ ] Order is created successfully
- [ ] Order ID is generated
- [ ] Pricing calculation is correct

✅ **Order Management:**
- [ ] Can update order status
- [ ] Can upload reports
- [ ] Can complete order

✅ **Member Experience:**
- [ ] Can track order status
- [ ] Can download report
- [ ] Complete workflow works end-to-end

---

## Next Steps After Testing

1. **Test with real prescriptions** from actual doctors
2. **Test payment integration** (if implemented)
3. **Test wallet deduction** for lab tests
4. **Test notifications** to member when cart is ready
5. **Test multiple concurrent orders**
6. **Test vendor-specific workflows**
7. **Load testing** with multiple users
8. **Security testing** (file upload vulnerabilities)

---

## Seeded Test Data Reference

### Lab Services You Can Use

**Common Blood Tests:**
- CBC (Complete Blood Count) - Code: CBC
- FBS (Fasting Blood Sugar) - Code: FBS
- PPBS (Post Prandial Blood Sugar) - Code: PPBS
- HbA1c - Code: HBA1C
- Lipid Profile - Code: LIPID
- Liver Function Test - Code: LFT
- Kidney Function Test - Code: KFT
- Thyroid Function Test - Code: TFT

**Vitamin Tests:**
- Vitamin D - Code: VITD
- Vitamin B12 - Code: VITB12

**Imaging Tests:**
- X-Ray Chest - Code: XRAY-CHEST
- X-Ray Abdomen - Code: XRAY-ABD
- Ultrasound Abdomen - Code: USG-ABD

**Cardiac Tests:**
- ECG - Code: ECG
- 2D Echo - Code: ECHO
- TMT - Code: TMT

### Vendors You Can Use

1. **PathLab Diagnostics** - Budget friendly, ₹50 home collection
2. **Dr. Lal PathLabs** - Premium, ₹75 home collection
3. **Thyrocare Technologies** - Most affordable, ₹40 home collection
4. **Metropolis Healthcare** - Mid-range, ₹60 home collection

### Serviceable Pincodes

Use any of these during testing:
- 400001, 400002, 400003, 400004, 400005
- 400006, 400007, 400008, 400009

---

**Happy Testing! 🧪**
