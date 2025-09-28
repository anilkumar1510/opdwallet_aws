# Online Consultation Feature - Database Schema Changes Report

**Date:** 2025-09-28
**Feature:** Online Consultation Implementation
**Collections Modified:** 2 (doctors, appointments)

---

## 1. DOCTORS COLLECTION (`doctors`)

### Schema Changes

#### **Added Fields:**

| Field Name | Type | Default | Required | Description |
|------------|------|---------|----------|-------------|
| `availableOnline` | Boolean | `true` | No | Indicates if doctor is available for online consultations |
| `availableOffline` | Boolean | `true` | No | Indicates if doctor is available for in-clinic consultations |

#### **Previously Added Fields (In-Clinic Feature):**

| Field Name | Type | Default | Required | Description |
|------------|------|---------|----------|-------------|
| `specialty` | String | - | Yes | Doctor's specialty name (e.g., "General Physician") |
| `rating` | Number | `0` | No | Doctor's rating (0-5 scale) |
| `reviewCount` | Number | `0` | No | Number of reviews received |
| `experienceYears` | Number | - | Yes | Years of experience |

### Data Migration Status

✅ **All 4 doctors updated successfully**

```javascript
// Sample Doctor Document
{
  _id: ObjectId('68d8ab8e6cd3c49c7e4f87fe'),
  doctorId: 'DOC001',
  name: 'Dr. Vikas Mittal',
  specialty: 'General Physician',
  experienceYears: 16,
  rating: 4.7,
  reviewCount: 156,
  availableOnline: true,    // NEW FIELD
  availableOffline: true,   // NEW FIELD
  qualifications: 'MBBS, MD',
  specializations: ['Pulmonary Medicine', 'Tuberculosis & Respiratory Diseases'],
  specialtyId: 'SPEC001',
  consultationFee: 1000,
  clinics: [...],
  availableSlots: [
    {
      date: '2025-09-28',
      slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM']
    }
  ],
  isActive: true
}
```

### API Changes

#### **New Query Parameter:**
- `GET /api/doctors?type=ONLINE` - Filters doctors where `availableOnline: true`
- `GET /api/doctors?type=OFFLINE` - Filters doctors where `availableOffline: true`

#### **New Computed Field in Response:**
- `availableInMinutes: number | null` - Calculated server-side based on today's slot times
  - Returns `null` if no slots available today
  - Returns `0` if a slot is available now
  - Returns minutes until next available slot

**Example API Response:**
```json
{
  "doctorId": "DOC001",
  "name": "Dr. Vikas Mittal",
  "specialty": "General Physician",
  "rating": 4.7,
  "availableOnline": true,
  "availableOffline": true,
  "availableInMinutes": 15,  // NEW COMPUTED FIELD
  "consultationFee": 1000
}
```

---

## 2. APPOINTMENTS COLLECTION (`appointments`)

### Schema Changes

#### **Added Fields:**

| Field Name | Type | Enum Values | Required | Description |
|------------|------|-------------|----------|-------------|
| `contactNumber` | String | - | No | Phone number where doctor will call the patient |
| `callPreference` | String | VOICE, VIDEO, BOTH | No | Patient's preferred call mode for online consultation |

#### **Existing appointmentType Values:**
- `IN_CLINIC` - For in-clinic consultations
- `ONLINE` - For online consultations (NEW)

### Complete Appointment Schema

```typescript
{
  appointmentId: string,           // Unique identifier
  appointmentNumber: string,       // Sequential number (34078, 34079, ...)
  userId: ObjectId,                // Reference to user
  patientName: string,             // Name of patient
  patientId: string,               // Relationship ID or 'SELF'
  doctorId: string,                // Reference to doctor
  doctorName: string,
  specialty: string,
  clinicId: string,                // Empty for online consultations
  clinicName: string,              // Empty for online consultations
  clinicAddress: string,           // Empty for online consultations
  appointmentType: string,         // 'IN_CLINIC' or 'ONLINE'
  appointmentDate: string,         // ISO date format
  timeSlot: string,                // 'Immediate' or time like '10:00 AM'
  consultationFee: number,
  status: string,                  // PENDING_CONFIRMATION, CONFIRMED, COMPLETED, CANCELLED
  paymentStatus: string,           // PENDING, PAID, FREE
  amountPaid: number,
  coveredByInsurance: boolean,
  contactNumber: string,           // NEW - For online consultations
  callPreference: string,          // NEW - VOICE, VIDEO, or BOTH
  requestedAt: Date,
  confirmedAt: Date
}
```

### Sample Online Appointment Document

```javascript
{
  appointmentId: 'APT-20250928-001',
  appointmentNumber: '34078',
  userId: ObjectId('68ce7f937ca7c61fde3135fb'),
  patientName: 'John Doe',
  patientId: 'SELF',
  doctorId: 'DOC001',
  doctorName: 'Dr. Vikas Mittal',
  specialty: 'General Physician',
  clinicId: '',                    // Empty for online
  clinicName: '',                  // Empty for online
  clinicAddress: '',               // Empty for online
  appointmentType: 'ONLINE',       // NEW TYPE
  appointmentDate: '2025-09-28',
  timeSlot: 'Immediate',           // or '10:00 AM' if scheduled
  consultationFee: 1000,
  status: 'PENDING_CONFIRMATION',
  paymentStatus: 'PENDING',
  amountPaid: 0,
  coveredByInsurance: true,
  contactNumber: '+919876543210',  // NEW FIELD
  callPreference: 'BOTH',          // NEW FIELD
  requestedAt: ISODate('2025-09-28T10:30:00.000Z'),
  confirmedAt: null
}
```

---

## 3. NO CHANGES TO EXISTING COLLECTIONS

The following collections were **NOT modified**:

- ✅ `specialty_master` - Reused as-is for online consultations
- ✅ `users` - No changes required
- ✅ `relationships` - No changes required
- ✅ All other collections remain unchanged

---

## 4. BACKWARD COMPATIBILITY

### ✅ All Changes Are Backward Compatible

1. **New fields have default values:**
   - `availableOnline: true` (default)
   - `availableOffline: true` (default)
   - `contactNumber`: optional field
   - `callPreference`: optional field

2. **Existing in-clinic flow unaffected:**
   - All existing in-clinic appointments continue to work
   - Existing doctors can still be booked for in-clinic visits
   - No breaking changes to existing APIs

3. **Nullable/Optional fields:**
   - `contactNumber` and `callPreference` are optional
   - System handles absence gracefully
   - Only populated for online appointments

---

## 5. INDEXES

### Existing Indexes (Unchanged)

**doctors collection:**
```javascript
{ specialtyId: 1, isActive: 1 }
{ doctorId: 1 }
{ 'clinics.city': 1 }
```

**appointments collection:**
```javascript
{ userId: 1, status: 1 }
{ appointmentId: 1 }
{ appointmentNumber: 1 }
{ doctorId: 1, appointmentDate: 1 }
```

### Recommended New Indexes (Future Optimization)

```javascript
// For online consultation filtering
db.doctors.createIndex({ availableOnline: 1, isActive: 1 })

// For filtering online appointments
db.appointments.createIndex({ appointmentType: 1, status: 1 })
db.appointments.createIndex({ userId: 1, appointmentType: 1, status: 1 })
```

---

## 6. DATA STATISTICS

### Current State (as of 2025-09-28)

| Collection | Total Documents | Online-Enabled | Notes |
|------------|----------------|----------------|-------|
| `doctors` | 4 | 4 (100%) | All doctors support both online and offline |
| `appointments` | 0 | 0 | No appointments created yet (fresh feature) |
| `specialty_master` | 9 | 9 (reused) | All specialties available for online |

---

## 7. FEATURE CAPABILITIES

### What Works Now

1. ✅ **Doctor Discovery**
   - Filter doctors by `type=ONLINE`
   - Show "Available in X mins" badge
   - Filter "Available Now" (within 5 minutes)

2. ✅ **Appointment Booking**
   - Book immediate consultation ("Consult Now")
   - Schedule for later (with date/time slot selection)
   - Provide contact number per appointment
   - Choose call preference (Voice/Video/Both)

3. ✅ **Dual Mode Support**
   - Same doctor can support both online and in-clinic
   - Separate flows for each consultation type
   - Independent availability management

### Data Flow

```
User Dashboard
    ↓
Online Consult Landing Page
    ↓
Select Specialty (reuses specialty_master)
    ↓
Select Doctor (filtered by availableOnline: true)
    ↓
Doctor shows availableInMinutes badge
    ↓
Select Patient + Contact Number + Call Preference
    ↓
Choose Time: Now vs Schedule Later
    ↓
Create Appointment (appointmentType: 'ONLINE')
    ↓
Appointment stored with contactNumber & callPreference
```

---

## 8. SEED DATA UPDATES

### Updated Seed Scripts

**File:** `/api/seed-doctors.js`

Changes:
- Added `availableOnline: true` to all doctors
- Added `availableOffline: true` to all doctors
- Updated slot dates to use dynamic dates (today + tomorrow)

```javascript
{
  doctorId: 'DOC001',
  name: 'Dr. Vikas Mittal',
  // ... other fields
  availableOnline: true,      // ADDED
  availableOffline: true,     // ADDED
  availableSlots: [
    {
      date: new Date().toISOString().split('T')[0],  // UPDATED: Dynamic date
      slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM']
    }
  ]
}
```

---

## 9. MIGRATION SCRIPT EXECUTED

```javascript
// Migration executed on 2025-09-28
db.doctors.updateMany(
  {},
  {
    $set: {
      availableOnline: true,
      availableOffline: true
    }
  }
)

// Result: Modified 4 documents
```

---

## 10. ROLLBACK PLAN (If Needed)

### To Revert Changes:

```javascript
// 1. Remove new fields from doctors
db.doctors.updateMany(
  {},
  {
    $unset: {
      availableOnline: "",
      availableOffline: ""
    }
  }
)

// 2. Delete all online appointments
db.appointments.deleteMany({ appointmentType: 'ONLINE' })

// 3. No other collections need rollback
```

---

## SUMMARY

✅ **2 collections modified** (doctors, appointments)
✅ **4 new fields added** (2 per collection)
✅ **100% backward compatible**
✅ **Zero breaking changes**
✅ **All existing data intact**
✅ **4 doctors migrated successfully**
✅ **Ready for production use**