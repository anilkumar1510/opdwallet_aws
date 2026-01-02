# Lab vs Diagnostics Data Flow Analysis

## Database Collections

### Lab Service
- **Collection**: `lab_prescriptions`
- **Schema**: `LabPrescription`
- **Service Type Field**: `serviceType: ServiceType.LAB`

### Diagnostics Service
- **Collection**: `diagnostic_prescriptions`
- **Schema**: `DiagnosticPrescription`
- **Service Type Field**: **NONE** (No serviceType field in schema)

---

## Frontend API Calls

### Lab Tests Page (`/member/lab-tests`)
**Fetches:**
```typescript
GET /api/member/lab/prescriptions
GET /api/member/lab/carts
```
**Displays:**
- Active carts
- 2 most recent prescriptions

### Diagnostics Page (`/member/diagnostics`)
**Fetches:**
```typescript
GET /api/member/diagnostics/prescriptions
GET /api/member/diagnostics/carts
```
**Displays:**
- Active carts
- 2 most recent prescriptions

### Bookings Page - Lab Tab (`/member/bookings?tab=lab`)
**Fetches:**
```typescript
fetchLabPrescriptions():
  GET /api/member/lab/prescriptions
  Filter: hasOrder === false

fetchLabOrders():
  GET /api/member/lab/orders

fetchLabCarts():
  GET /api/member/lab/carts
```

### Bookings Page - Diagnostics Tab (`/member/bookings?tab=diagnostics`)
**Fetches:**
```typescript
fetchDiagnosticPrescriptions():
  GET /api/member/diagnostics/prescriptions
  Filter: hasOrder === false

fetchDiagnosticOrders():
  GET /api/member/diagnostics/orders
```

---

## Backend Controllers

### Lab Member Controller (`/api/member/lab/`)
**Route Prefix**: `member/lab`

**Endpoints**:
- `POST /member/lab/prescriptions/upload` → Saves to `lab_prescriptions`
- `GET /member/lab/prescriptions` → Reads from `lab_prescriptions`
- `GET /member/lab/orders` → Reads from `lab_orders`
- `GET /member/lab/carts` → Reads from `lab_carts`

**Service**: `LabPrescriptionService`
- Uses model: `LabPrescription` (collection: `lab_prescriptions`)
- `findByUserId()` does aggregation join with `lab_orders`

### Diagnostic Member Controller (`/api/member/diagnostics/`)
**Route Prefix**: `member/diagnostics`

**Endpoints**:
- `POST /member/diagnostics/prescriptions/upload` → Saves to `diagnostic_prescriptions`
- `GET /member/diagnostics/prescriptions` → Reads from `diagnostic_prescriptions`
- `GET /member/diagnostics/orders` → Reads from `diagnostic_orders`
- `GET /member/diagnostics/carts` → Reads from `diagnostic_carts`

**Service**: `DiagnosticPrescriptionService`
- Uses model: `DiagnosticPrescription` (collection: `diagnostic_prescriptions`)
- `findByUserId()` does aggregation join with `diagnostic_orders`

---

## Aggregation Queries

### Lab Prescription Service - `findByUserId()`
```typescript
$lookup: {
  from: 'lab_orders',  // Joins with lab_orders
  localField: '_id',
  foreignField: 'prescriptionId',
  as: 'orders'
}
```
**Returns**: Prescriptions with `hasOrder` and `orderCount` fields

### Diagnostic Prescription Service - `findByUserId()`
```typescript
$lookup: {
  from: 'diagnostic_orders',  // Joins with diagnostic_orders
  localField: '_id',
  foreignField: 'prescriptionId',
  as: 'orders'
}
```
**Returns**: Prescriptions with `hasOrder` and `orderCount` fields

---

## Potential Issues

### Issue 1: Wrong Collection Join
**Problem**: If `DiagnosticPrescriptionService` accidentally joins with `lab_orders` instead of `diagnostic_orders`, it would cause mixing.

**Check**: Line 78 in `/api/src/modules/diagnostics/services/diagnostic-prescription.service.ts`
```typescript
from: 'diagnostic_orders'  // ✅ CORRECT
```

### Issue 2: Wrong Endpoint Called
**Problem**: Frontend might be calling wrong endpoint.

**Check**:
- `/member/bookings/page.tsx` line 487: `'/api/member/diagnostics/prescriptions'` ✅ CORRECT
- `/member/bookings/page.tsx` line 465: `'/api/member/diagnostics/orders'` ✅ CORRECT

### Issue 3: Mixed Upload Endpoint
**Problem**: Diagnostic upload might be going to lab endpoint.

**Check**: `/member/diagnostics/upload/page.tsx`
- Should POST to: `/api/member/diagnostics/prescriptions/upload`

---

## Testing Checklist

To verify data separation:

1. **Upload a Lab Prescription**
   - URL: `/member/lab-tests/upload`
   - POST to: `/api/member/lab/prescriptions/upload`
   - Check MongoDB: Should appear in `lab_prescriptions` collection only
   - Check Bookings Lab tab: Should appear under "Pending Review"
   - Check Bookings Diagnostics tab: Should NOT appear

2. **Upload a Diagnostic Prescription**
   - URL: `/member/diagnostics/upload`
   - POST to: `/api/member/diagnostics/prescriptions/upload`
   - Check MongoDB: Should appear in `diagnostic_prescriptions` collection only
   - Check Bookings Diagnostics tab: Should appear under "Pending Review"
   - Check Bookings Lab tab: Should NOT appear

3. **Check Browser Network Tab**
   - On Lab bookings tab, verify calls to `/api/member/lab/*` only
   - On Diagnostics bookings tab, verify calls to `/api/member/diagnostics/*` only

---

## Recommended Actions

1. **Verify Upload Endpoints**
   - Check `/member/diagnostics/upload/page.tsx` uses correct endpoint

2. **Add Service Type to Diagnostics Schema**
   - Add `serviceType` field to DiagnosticPrescription schema
   - Set default: `ServiceType.DIAGNOSTIC`
   - This provides extra safety layer

3. **Add Logging**
   - Add console.log in controllers to track which endpoint is hit
   - Add collection name in response for debugging

4. **Database Query**
   - Run MongoDB query to check for any diagnostic prescriptions in lab_prescriptions collection
   - Run MongoDB query to check for any lab prescriptions in diagnostic_prescriptions collection
