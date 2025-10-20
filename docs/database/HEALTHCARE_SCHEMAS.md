# OPD WALLET - HEALTHCARE SCHEMAS

**Document Version:** 3.3
**Last Updated:** October 15, 2025 (Video Consultations Integration)
**Database:** MongoDB (opd_wallet)

> **Quick Navigation:**
> - [Database Overview](./DATABASE_OVERVIEW.md) - Complete database structure and relationships
> - [Core Schemas](./CORE_SCHEMAS.md) - Core system collections
> - [Master Data Schemas](./MASTER_DATA_SCHEMAS.md) - Master data collections
> - [Wallet & Claims Schemas](./WALLET_CLAIMS_SCHEMAS.md) - Wallet and claims management
> - [Lab Diagnostics Schemas](./LAB_DIAGNOSTICS_SCHEMAS.md) - Lab services and orders
> - [Notifications Schemas](./NOTIFICATIONS_SCHEMAS.md) - Notification system

---

## TABLE OF CONTENTS

1. [doctors](#1-doctors)
2. [clinics](#2-clinics)
3. [doctor_prescriptions](#3-doctor_prescriptions)
4. [doctor_slots](#4-doctor_slots)
5. [appointments](#5-appointments)
6. [video_consultations](#6-video_consultations)

---

## COMPLETE SCHEMA DEFINITIONS

### 1. doctors

**Collection Name:** `doctors`
**Purpose:** Doctor profiles with clinic locations, specializations, and availability
**Document Count:** 6
**Timestamps:** Yes (createdAt, updatedAt)

#### Schema Definition

```typescript
{
  _id: ObjectId,
  doctorId: string,         // REQUIRED, UNIQUE - Doctor identifier
  name: string,             // REQUIRED - Doctor's full name
  profilePhoto?: string,    // OPTIONAL - Profile photo URL
  qualifications: string,   // REQUIRED - Educational qualifications (e.g., "MBBS, MD")
  specializations: string[], // REQUIRED - Array of specialization areas
  specialtyId: string,      // REQUIRED - References specialty_master.specialtyId
  phone?: string,           // OPTIONAL - Contact phone number
  email: string,            // REQUIRED, UNIQUE - Contact email address (used for authentication)
  password?: string,        // OPTIONAL - Hashed password for doctor portal login
  role: string,             // DEFAULT: 'DOCTOR' - User role for authentication
  registrationNumber?: string, // OPTIONAL - Medical registration number
  languages?: string[],     // OPTIONAL - Languages spoken by doctor
  specialty: string,        // REQUIRED - Specialty name (from specialty_master)
  experienceYears: number,  // REQUIRED - Years of experience
  rating: number,           // DEFAULT: 0 - Doctor rating (0-5)
  reviewCount: number,      // DEFAULT: 0 - Number of reviews
  clinics: Array<{          // REQUIRED - Array of clinic locations
    clinicId: string,       // REQUIRED - Clinic identifier
    name: string,           // REQUIRED - Clinic name
    address: string,        // REQUIRED - Clinic address
    city?: string,          // OPTIONAL - City name
    state?: string,         // OPTIONAL - State name
    pincode?: string,       // OPTIONAL - Postal code
    location?: {            // OPTIONAL - Geo-coordinates
      latitude: number,
      longitude: number
    },
    distanceKm?: number,    // OPTIONAL - Distance from user location
    consultationFee: number // REQUIRED - Consultation fee at this clinic
  }>,
  consultationFee: number,  // REQUIRED - Base consultation fee
  cashlessAvailable: boolean, // DEFAULT: true - Cashless payment available
  insuranceAccepted?: string[], // OPTIONAL - Array of accepted insurance providers
  requiresConfirmation: boolean, // DEFAULT: false - Appointment requires confirmation
  allowDirectBooking: boolean,   // DEFAULT: true - Allow direct booking without confirmation
  availableSlots?: Array<{  // OPTIONAL - Available appointment slots
    date: string,           // Date in YYYY-MM-DD format
    slots: string[]         // Array of time slots (e.g., "09:00 AM")
  }>,
  availableOnline: boolean, // DEFAULT: true - Available for online consultations
  availableOffline: boolean,// DEFAULT: true - Available for in-clinic consultations
  lastLogin?: Date,         // OPTIONAL - Last login timestamp for doctor portal
  isActive: boolean,        // DEFAULT: true - Is doctor profile active
  createdAt: Date,          // AUTO - Creation timestamp
  updatedAt: Date           // AUTO - Last update timestamp
}
```

#### Indexes

```typescript
{ doctorId: 1 }                            // Single field index
{ specialtyId: 1, isActive: 1 }            // Compound index for specialty queries
{ 'clinics.city': 1 }                      // Index on clinic city for location filtering
{ email: 1 }, { unique: true }             // Unique email for authentication
```

#### Validation Rules

1. **doctorId** - Must be unique, used for doctor identification
2. **email** - Must be unique and valid email format (required for authentication)
3. **password** - Hashed using bcrypt with salt rounds = 10 (required for portal access)
4. **role** - Defaults to 'DOCTOR', used for role-based access control
5. **specialtyId** - Must reference a valid specialty from specialty_master
6. **specialty** - Should match the name from specialty_master
7. **consultationFee** - Must be >= 0 (both at doctor and clinic level)
8. **clinics** - At least one clinic location required
9. **rating** - Should be between 0 and 5
10. **availableSlots** - Dates should be in YYYY-MM-DD format, times in 12-hour format
11. **lastLogin** - Automatically updated on successful login to doctor portal

#### Authentication Notes

- Doctors can now access a dedicated portal using their email and password
- JWT tokens are issued upon successful login with 8-hour expiry
- Tokens are stored in HTTP-only cookies named 'doctor_session'
- Authentication endpoints: `/auth/doctor/login`, `/auth/doctor/logout`, `/auth/doctor/profile`
- Role-based guards ensure only DOCTOR role can access doctor-specific endpoints

#### Sample Data Examples

```json
[
  {
    "_id": ObjectId("68d8ab8e6cd3c49c7e4f87fe"),
    "doctorId": "DOC001",
    "name": "Dr. Vikas Mittal",
    "profilePhoto": "",
    "qualifications": "MBBS, MD",
    "specializations": [
      "Pulmonary Medicine",
      "Tuberculosis & Respiratory Diseases",
      "Pulmonary Medicine, Fellow"
    ],
    "specialtyId": "SPEC001",
    "specialty": "General Physician",
    "email": "dr.vikas@example.com",
    "password": "$2b$10$...",
    "role": "DOCTOR",
    "registrationNumber": "MCI-12345",
    "languages": ["English", "Hindi"],
    "experienceYears": 16,
    "rating": 4.7,
    "reviewCount": 156,
    "clinics": [
      {
        "clinicId": "CLINIC001",
        "name": "Manipal Hospital",
        "address": "Sector 6, Dwarka, New Delhi",
        "city": "Delhi (NCR)",
        "state": "Delhi",
        "pincode": "110075",
        "location": {
          "latitude": 28.5921,
          "longitude": 77.046
        },
        "distanceKm": 12.67,
        "consultationFee": 1000
      }
    ],
    "consultationFee": 1000,
    "cashlessAvailable": true,
    "insuranceAccepted": ["MCLTech"],
    "requiresConfirmation": true,
    "allowDirectBooking": false,
    "availableSlots": [
      {
        "date": "2025-09-28",
        "slots": ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM"]
      },
      {
        "date": "2025-09-29",
        "slots": ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM"]
      }
    ],
    "availableOnline": true,
    "availableOffline": true,
    "lastLogin": ISODate("2025-10-15T08:30:00Z"),
    "isActive": true,
    "createdAt": ISODate("2025-09-27T00:00:00Z"),
    "updatedAt": ISODate("2025-10-15T08:30:00Z")
  },
  {
    "_id": ObjectId("68d8ab8e6cd3c49c7e4f8800"),
    "doctorId": "DOC003",
    "name": "Dr. Priya Sharma",
    "profilePhoto": "",
    "qualifications": "MBBS, MD (Dermatology)",
    "specializations": ["Dermatology", "Cosmetology", "Hair Transplant"],
    "specialtyId": "SPEC004",
    "specialty": "Dermatologist",
    "email": "dr.priya@example.com",
    "password": "$2b$10$...",
    "role": "DOCTOR",
    "experienceYears": 12,
    "rating": 4.8,
    "reviewCount": 234,
    "clinics": [
      {
        "clinicId": "CLINIC003",
        "name": "Fortis Hospital",
        "address": "Vasant Kunj, New Delhi",
        "city": "Delhi (NCR)",
        "state": "Delhi",
        "pincode": "110070",
        "location": {
          "latitude": 28.5167,
          "longitude": 77.1598
        },
        "distanceKm": 8.5,
        "consultationFee": 1200
      }
    ],
    "consultationFee": 1200,
    "cashlessAvailable": true,
    "insuranceAccepted": ["MCLTech"],
    "requiresConfirmation": false,
    "allowDirectBooking": true,
    "availableSlots": [
      {
        "date": "2025-09-28",
        "slots": ["09:30 AM", "10:30 AM", "11:30 AM", "03:00 PM", "04:00 PM"]
      }
    ],
    "availableOnline": true,
    "availableOffline": false,
    "isActive": true,
    "createdAt": ISODate("2025-09-27T00:00:00Z"),
    "updatedAt": ISODate("2025-09-27T00:00:00Z")
  }
]
```

---

### 2. clinics

**Collection Name:** `clinics`
**Purpose:** Store clinic/hospital locations with operating hours and contact information
**Document Count:** 5
**Timestamps:** Yes (createdAt, updatedAt)

#### Schema Definition

```typescript
{
  _id: ObjectId,                    // MongoDB auto-generated
  clinicId: string,                 // REQUIRED, UNIQUE - Clinic identifier (e.g., "CLINIC001")
  name: string,                     // REQUIRED - Clinic/hospital name
  address: string,                  // REQUIRED - Full clinic address
  city: string,                     // REQUIRED - City name
  state?: string,                   // OPTIONAL - State name
  pincode?: string,                 // OPTIONAL - Postal code
  phone?: string,                   // OPTIONAL - Contact phone number
  email?: string,                   // OPTIONAL - Contact email address
  location?: {                      // OPTIONAL - Geo-coordinates
    latitude: number,
    longitude: number
  },
  operatingHours?: {                // OPTIONAL - Operating hours by day
    [day: string]: {                // Day name (e.g., "Monday", "Tuesday")
      open: string,                 // Opening time (e.g., "09:00")
      close: string,                // Closing time (e.g., "18:00")
      isClosed: boolean             // Whether clinic is closed on this day
    }
  },
  facilities?: string[],            // OPTIONAL - Available facilities/services
  isActive: boolean,                // DEFAULT: true - Is clinic active
  createdAt: Date,                  // AUTO - Timestamp
  updatedAt: Date                   // AUTO - Timestamp
}
```

#### Indexes

```typescript
{ clinicId: 1 }, { unique: true }             // Unique index
{ city: 1, isActive: 1 }                      // Compound index for location queries
```

#### Validation Rules

1. **clinicId** - Must be unique across all clinics
2. **name** - Required, clinic/hospital name
3. **address** - Required, full street address
4. **city** - Required for location-based filtering
5. **operatingHours** - Optional, but if provided must have valid time formats

#### Sample Data Example

```json
{
  "_id": ObjectId("674d8e123abc456789012500"),
  "clinicId": "CLINIC001",
  "name": "Manipal Hospital Dwarka",
  "address": "Sector 6, Dwarka, New Delhi",
  "city": "Delhi (NCR)",
  "state": "Delhi",
  "pincode": "110075",
  "phone": "+91-11-45801234",
  "email": "dwarka@manipalhospitals.com",
  "location": {
    "latitude": 28.5921,
    "longitude": 77.046
  },
  "operatingHours": {
    "Monday": { "open": "08:00", "close": "20:00", "isClosed": false },
    "Tuesday": { "open": "08:00", "close": "20:00", "isClosed": false },
    "Wednesday": { "open": "08:00", "close": "20:00", "isClosed": false },
    "Thursday": { "open": "08:00", "close": "20:00", "isClosed": false },
    "Friday": { "open": "08:00", "close": "20:00", "isClosed": false },
    "Saturday": { "open": "09:00", "close": "18:00", "isClosed": false },
    "Sunday": { "open": "09:00", "close": "14:00", "isClosed": false }
  },
  "facilities": ["Emergency", "ICU", "Laboratory", "Pharmacy", "Radiology"],
  "isActive": true,
  "createdAt": ISODate("2025-09-28T00:00:00Z"),
  "updatedAt": ISODate("2025-09-28T00:00:00Z")
}
```

---

### 3. doctor_prescriptions

**Collection Name:** `doctor_prescriptions`
**Purpose:** Store prescriptions uploaded by doctors after appointments
**Document Count:** Variable
**Timestamps:** Yes (createdAt, updatedAt)

#### Schema Definition

```typescript
{
  _id: ObjectId,
  prescriptionId: string,       // REQUIRED, UNIQUE - Prescription identifier
  appointmentId: ObjectId,      // REQUIRED, UNIQUE - References appointments._id
  doctorId: string,             // REQUIRED - Doctor's identifier
  doctorName: string,           // REQUIRED - Doctor's full name
  userId: ObjectId,             // REQUIRED - References users._id (patient)
  patientName: string,          // REQUIRED - Patient's full name
  fileName: string,             // REQUIRED - Name of uploaded prescription file
  filePath: string,             // REQUIRED - Storage path of prescription file
  fileSize: number,             // REQUIRED - File size in bytes
  uploadDate: Date,             // REQUIRED - Date and time of upload
  diagnosis?: string,           // OPTIONAL - Medical diagnosis
  notes?: string,               // OPTIONAL - Additional notes from doctor
  isActive: boolean,            // DEFAULT: true - Is prescription active
  createdAt: Date,              // AUTO - Creation timestamp
  updatedAt: Date               // AUTO - Last update timestamp
}
```

#### Indexes

```typescript
{ prescriptionId: 1 }, { unique: true }       // Unique prescription ID
{ appointmentId: 1 }, { unique: true }        // One prescription per appointment
{ doctorId: 1, uploadDate: -1 }               // Doctor's prescriptions sorted by date
{ userId: 1, uploadDate: -1 }                 // Patient's prescriptions sorted by date
```

#### Validation Rules

1. **prescriptionId** - Must be unique across all prescriptions
2. **appointmentId** - Must reference a valid appointment, unique (one prescription per appointment)
3. **doctorId** - Must reference a valid doctor
4. **userId** - Must reference a valid user (patient)
5. **fileName** - Required, original uploaded file name
6. **filePath** - Required, stored in `/uploads/doctors/` directory
7. **fileSize** - Must be > 0, file size validation

#### Relationships

- **appointmentId** references `appointments._id`
- **doctorId** references `doctors.doctorId`
- **userId** references `users._id`
- Linked to `appointments.prescriptionId` and `appointments.hasPrescription` fields

#### Access Control

- Doctors can upload prescriptions only for their own appointments
- Patients can view prescriptions for their appointments
- Admin/Operations staff can view all prescriptions
- Prescriptions are served via static file server at `/uploads/doctors/`

#### Sample Data Example

```json
{
  "_id": ObjectId("68ce7f937ca7c61fde313abc"),
  "prescriptionId": "PRESC001",
  "appointmentId": ObjectId("68ce7f937ca7c61fde313def"),
  "doctorId": "DOC001",
  "doctorName": "Dr. Vikas Mittal",
  "userId": ObjectId("68ce7f937ca7c61fde313123"),
  "patientName": "Rajesh Kumar",
  "fileName": "prescription_20251006_143022.pdf",
  "filePath": "/uploads/doctors/DOC001/prescription_20251006_143022.pdf",
  "fileSize": 245678,
  "uploadDate": ISODate("2025-10-06T14:30:22Z"),
  "diagnosis": "Upper Respiratory Tract Infection",
  "notes": "Complete the full course of antibiotics. Follow up in 7 days if symptoms persist.",
  "isActive": true,
  "createdAt": ISODate("2025-10-06T14:30:22Z"),
  "updatedAt": ISODate("2025-10-06T14:30:22Z")
}
```

---

### 4. doctor_slots

**Collection Name:** `doctor_slots`
**Purpose:** Store weekly recurring time slots for doctor availability at specific clinics
**Document Count:** 17
**Timestamps:** Yes (createdAt, updatedAt)

#### Schema Definition

```typescript
{
  _id: ObjectId,                    // MongoDB auto-generated
  doctorId: string,                 // REQUIRED - References doctors.doctorId
  clinicId: string,                 // REQUIRED - References clinics.clinicId
  dayOfWeek: string,                // REQUIRED - Day name (e.g., "Monday", "Tuesday")
  startTime: string,                // REQUIRED - Start time (e.g., "09:00")
  endTime: string,                  // REQUIRED - End time (e.g., "10:00")
  slotDuration: number,             // DEFAULT: 30 - Duration in minutes
  maxPatients: number,              // DEFAULT: 1 - Maximum patients per slot
  isActive: boolean,                // DEFAULT: true - Is slot active
  consultationFee: number,          // REQUIRED - Consultation fee for this slot
  consultationType: string,         // REQUIRED, ENUM: ['IN_CLINIC', 'ONLINE', 'BOTH']
  createdAt: Date,                  // AUTO - Timestamp
  updatedAt: Date                   // AUTO - Timestamp
}
```

#### Enums

**ConsultationType:**
```typescript
enum ConsultationType {
  IN_CLINIC = 'IN_CLINIC',      // In-person clinic consultation
  ONLINE = 'ONLINE',            // Online/telemedicine consultation
  BOTH = 'BOTH'                 // Both in-clinic and online available
}
```

#### Indexes

```typescript
{ doctorId: 1, clinicId: 1, dayOfWeek: 1 }   // Compound index for slot queries
{ isActive: 1 }                               // Single field index for active slots
```

#### Validation Rules

1. **doctorId** - Must reference a valid doctor from doctors collection
2. **clinicId** - Must reference a valid clinic from clinics collection
3. **dayOfWeek** - Must be a valid day name (Monday-Sunday)
4. **startTime/endTime** - Must be valid time format (HH:MM)
5. **endTime** - Must be after startTime
6. **consultationType** - Must be one of the defined enum values

#### Sample Data Example

```json
{
  "_id": ObjectId("674d8e123abc456789012600"),
  "doctorId": "DOC001",
  "clinicId": "CLINIC001",
  "dayOfWeek": "Monday",
  "startTime": "09:00",
  "endTime": "10:00",
  "slotDuration": 30,
  "maxPatients": 1,
  "isActive": true,
  "consultationFee": 1000,
  "consultationType": "IN_CLINIC",
  "createdAt": ISODate("2025-09-28T00:00:00Z"),
  "updatedAt": ISODate("2025-09-28T00:00:00Z")
}
```

---

### 5. appointments

**Collection Name:** `appointments`
**Purpose:** Store appointment bookings with status tracking and payment information
**Document Count:** 0 (collection reset, data deleted)
**Timestamps:** Yes (createdAt, updatedAt)

#### Schema Definition

```typescript
{
  _id: ObjectId,
  appointmentId: string,        // REQUIRED, UNIQUE
  appointmentNumber: string,    // REQUIRED
  userId: ObjectId,             // REQUIRED, REF: 'User'
  patientName: string,          // REQUIRED
  patientId: string,            // REQUIRED
  doctorId: string,             // REQUIRED
  slotId?: ObjectId,            // OPTIONAL, REF: 'DoctorSlot' - Links to doctor_slots collection
  doctorName: string,           // REQUIRED
  specialty: string,            // REQUIRED
  clinicId?: string,            // OPTIONAL - Required for IN_CLINIC, not required for ONLINE appointments
  clinicName?: string,          // OPTIONAL - Required for IN_CLINIC, not required for ONLINE appointments
  clinicAddress?: string,       // OPTIONAL - Required for IN_CLINIC, not required for ONLINE appointments
  appointmentType: string,      // REQUIRED, ENUM: 'IN_CLINIC', 'ONLINE'
  appointmentDate: string,      // REQUIRED, Format: YYYY-MM-DD
  timeSlot: string,             // REQUIRED
  consultationFee: number,      // REQUIRED
  status: string,               // REQUIRED, ENUM: 'PENDING_CONFIRMATION', 'CONFIRMED', 'COMPLETED', 'CANCELLED', DEFAULT: 'PENDING_CONFIRMATION'
  requestedAt?: Date,
  confirmedAt?: Date,
  paymentStatus: string,        // REQUIRED, ENUM: 'PENDING', 'PAID', 'FREE', DEFAULT: 'PENDING'
  amountPaid: number,           // DEFAULT: 0
  coveredByInsurance: boolean,  // DEFAULT: true
  contactNumber?: string,       // OPTIONAL - Contact for appointment (required for ONLINE appointments)
  callPreference?: string,      // OPTIONAL, ENUM: 'VOICE', 'VIDEO', 'BOTH' - Required for ONLINE appointments
  prescriptionId?: ObjectId,    // OPTIONAL, REF: 'DoctorPrescription' - Links to uploaded prescription
  hasPrescription: boolean,     // DEFAULT: false - Indicates if prescription has been uploaded
  createdAt: Date,              // AUTO - Timestamp
  updatedAt: Date               // AUTO - Timestamp
}
```

#### Enums

**AppointmentType:**
```typescript
enum AppointmentType {
  IN_CLINIC = 'IN_CLINIC',      // In-person clinic appointment
  ONLINE = 'ONLINE'             // Online/teleconsultation appointment
}
```

**AppointmentStatus:**
```typescript
enum AppointmentStatus {
  PENDING_CONFIRMATION = 'PENDING_CONFIRMATION',  // Awaiting confirmation
  CONFIRMED = 'CONFIRMED',                        // Confirmed appointment
  COMPLETED = 'COMPLETED',                        // Appointment completed
  CANCELLED = 'CANCELLED'                         // Appointment cancelled
}
```

**PaymentStatus:**
```typescript
enum PaymentStatus {
  PENDING = 'PENDING',          // Payment pending
  PAID = 'PAID',                // Payment completed
  FREE = 'FREE'                 // Free/complimentary appointment
}
```

**CallPreference:**
```typescript
enum CallPreference {
  VOICE = 'VOICE',              // Voice call only
  VIDEO = 'VIDEO',              // Video call only
  BOTH = 'BOTH'                 // Both voice and video supported
}
```

#### Indexes

```typescript
{ userId: 1, status: 1 }                      // Compound index for user queries
{ appointmentId: 1 }                          // Single field index
{ appointmentNumber: 1 }                      // Single field index
{ doctorId: 1, appointmentDate: 1 }          // Compound index for doctor schedule
```

#### Validation Rules

1. **appointmentId** - Must be unique across all appointments
2. **appointmentType** - Must be either 'IN_CLINIC' or 'ONLINE'
3. **For IN_CLINIC appointments:**
   - clinicId, clinicName, and clinicAddress are typically provided
4. **For ONLINE appointments:**
   - contactNumber is required
   - callPreference is required (VOICE, VIDEO, or BOTH)
   - clinicId, clinicName, and clinicAddress are optional
5. **appointmentDate** - Must be in YYYY-MM-DD format
6. **status** - Must be one of the defined enum values
7. **paymentStatus** - Must be one of the defined enum values

#### Sample Data Examples

```json
[
  {
    "_id": ObjectId("68d9f5e66cd3c49c7e4f8801"),
    "appointmentId": "APT-001",
    "appointmentNumber": "APT20250928001",
    "userId": ObjectId("674d8e123abc456789012345"),
    "patientName": "John Doe",
    "patientId": "USR001",
    "doctorId": "DOC001",
    "doctorName": "Dr. Vikas Mittal",
    "specialty": "General Physician",
    "clinicId": "CLINIC001",
    "clinicName": "Manipal Hospital",
    "clinicAddress": "Sector 6, Dwarka, New Delhi",
    "appointmentType": "IN_CLINIC",
    "appointmentDate": "2025-09-30",
    "timeSlot": "10:00 AM",
    "consultationFee": 1000,
    "status": "CONFIRMED",
    "requestedAt": ISODate("2025-09-28T10:00:00Z"),
    "confirmedAt": ISODate("2025-09-28T10:30:00Z"),
    "paymentStatus": "PAID",
    "amountPaid": 1000,
    "coveredByInsurance": true,
    "createdAt": ISODate("2025-09-28T10:00:00Z"),
    "updatedAt": ISODate("2025-09-28T10:30:00Z")
  },
  {
    "_id": ObjectId("68d9f5e66cd3c49c7e4f8802"),
    "appointmentId": "APT-002",
    "appointmentNumber": "APT20250928002",
    "userId": ObjectId("674d8e123abc456789012345"),
    "patientName": "Jane Smith",
    "patientId": "USR002",
    "doctorId": "DOC003",
    "doctorName": "Dr. Priya Sharma",
    "specialty": "Dermatologist",
    "appointmentType": "ONLINE",
    "appointmentDate": "2025-09-29",
    "timeSlot": "03:00 PM",
    "consultationFee": 800,
    "status": "PENDING_CONFIRMATION",
    "requestedAt": ISODate("2025-09-28T11:00:00Z"),
    "paymentStatus": "PENDING",
    "amountPaid": 0,
    "coveredByInsurance": true,
    "contactNumber": "+919876543210",
    "callPreference": "VIDEO",
    "createdAt": ISODate("2025-09-28T11:00:00Z"),
    "updatedAt": ISODate("2025-09-28T11:00:00Z")
  }
]
```

---

### 6. video_consultations

**Collection Name:** `video_consultations`
**Purpose:** Store video consultation sessions for online appointments with WebRTC integration
**Document Count:** Variable (created when doctor starts online consultation)
**Timestamps:** Yes (createdAt, updatedAt)

**Status:** NEW (v6.7 - October 15, 2025)

#### Schema Definition

```typescript
{
  _id: ObjectId,
  consultationId: string,          // REQUIRED, UNIQUE - Format: VC-XXXXXXXXXX
  appointmentId: ObjectId,          // REQUIRED, REF: 'Appointment' - Links to appointments._id

  // Participants
  doctorId: ObjectId,               // REQUIRED, REF: 'User' - Doctor's user ID
  doctorName: string,               // REQUIRED - Doctor's full name
  patientId: ObjectId,              // REQUIRED, REF: 'User' - Patient's user ID
  patientName: string,              // REQUIRED - Patient's full name

  // Room Details (Jitsi Meet Integration)
  roomId: string,                   // REQUIRED, UNIQUE - Unique room identifier
  roomName: string,                 // REQUIRED - Human-readable room name
  roomPassword: string,             // OPTIONAL - Room password for security
  jitsiDomain: string,              // DEFAULT: 'meet.jit.si' - Jitsi server domain
  roomUrl: string,                  // REQUIRED - Full Jitsi room URL

  // Scheduling & Timing
  scheduledStartTime: Date,         // OPTIONAL - Scheduled consultation start time
  actualStartTime: Date,            // OPTIONAL - When consultation actually started
  endTime: Date,                    // OPTIONAL - When consultation ended
  duration: number,                 // OPTIONAL - Duration in minutes

  // Status Tracking
  status: string,                   // REQUIRED, ENUM: SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW
                                    // DEFAULT: SCHEDULED
  doctorJoinedAt: Date,             // OPTIONAL - Timestamp when doctor joined
  patientJoinedAt: Date,            // OPTIONAL - Timestamp when patient joined

  // Recording (Optional Feature)
  recordingEnabled: boolean,        // DEFAULT: false - Whether recording is enabled
  recordingUrl: string,             // OPTIONAL - URL to recorded consultation
  recordingDuration: number,        // OPTIONAL - Recording duration in minutes
  recordingSize: number,            // OPTIONAL - Recording file size in MB

  // Quality Metrics
  videoQuality: string,             // OPTIONAL - Video quality indicator
  audioQuality: string,             // OPTIONAL - Audio quality indicator
  networkIssues: [                  // DEFAULT: [] - Array of network issues during call
    {
      timestamp: Date,              // When the issue occurred
      issue: string,                // Description of the issue
      duration: number              // Duration of the issue in seconds
    }
  ],

  // Post-Consultation
  prescriptionId: ObjectId,         // OPTIONAL, REF: 'Prescription' - Linked prescription
  notesId: string,                  // OPTIONAL - Consultation notes reference
  feedback: {                       // OPTIONAL - Post-consultation feedback
    doctorRating: number,           // 1-5 rating by patient for doctor
    patientRating: number,          // 1-5 rating by doctor for patient
    doctorComments: string,         // Doctor's comments about consultation
    patientComments: string         // Patient's comments about consultation
  },
  endedBy: string,                  // OPTIONAL, ENUM: DOCTOR, PATIENT, SYSTEM - Who ended the call
  cancellationReason: string,       // OPTIONAL - Reason if cancelled

  // Timestamps
  createdAt: Date,                  // AUTO - Document creation timestamp
  updatedAt: Date                   // AUTO - Last update timestamp
}
```

#### Enums

**ConsultationStatus:**
```typescript
enum ConsultationStatus {
  SCHEDULED = 'SCHEDULED',        // Consultation created, waiting for participants
  IN_PROGRESS = 'IN_PROGRESS',    // Both doctor and patient have joined
  COMPLETED = 'COMPLETED',        // Consultation ended successfully
  CANCELLED = 'CANCELLED',        // Consultation cancelled before/during session
  NO_SHOW = 'NO_SHOW'            // Patient didn't join within expected time
}
```

**EndedBy:**
```typescript
enum EndedBy {
  DOCTOR = 'DOCTOR',             // Ended by doctor
  PATIENT = 'PATIENT',           // Ended by patient
  SYSTEM = 'SYSTEM'              // Ended by system (timeout, etc.)
}
```

#### Indexes

```typescript
{ appointmentId: 1 }                         // Find consultations by appointment
{ roomId: 1 }                                // Find consultation by room
{ doctorId: 1, scheduledStartTime: -1 }      // Doctor's consultations sorted by time
{ patientId: 1, scheduledStartTime: -1 }     // Patient's consultations sorted by time
{ status: 1, scheduledStartTime: -1 }        // Filter by status and time
```

#### Validation Rules

1. **consultationId** - Must be unique across all video consultations
2. **appointmentId** - Must reference a valid appointment with appointmentType = 'ONLINE'
3. **doctorId** and **patientId** - Must reference valid users
4. **roomId** - Must be unique to prevent room conflicts
5. **status** - Must be one of: SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW
6. **recordingSize** - Must be >= 0 (in MB)
7. **feedback.doctorRating** and **feedback.patientRating** - Must be between 1-5
8. **endedBy** - Must be one of: DOCTOR, PATIENT, SYSTEM

#### Status Workflow

```
SCHEDULED → IN_PROGRESS → COMPLETED
    ↓            ↓
CANCELLED    CANCELLED
    ↓
 NO_SHOW
```

- **SCHEDULED**: Consultation created, waiting for participants
- **IN_PROGRESS**: Both doctor and patient have joined
- **COMPLETED**: Consultation ended successfully
- **CANCELLED**: Consultation cancelled before/during session
- **NO_SHOW**: Patient didn't join within expected time

#### Relationships

- **appointmentId** references `appointments._id`
- **doctorId** references `users._id` (where role = 'DOCTOR')
- **patientId** references `users._id` (where role = 'MEMBER')
- **prescriptionId** references `doctor_prescriptions._id` (if prescription uploaded)

#### Access Control

- **Doctors**: Can start consultations, view own consultations, end consultations
- **Patients/Members**: Can join consultations, view own consultations
- **Admin/Operations**: Can view all consultations, access quality metrics

#### Sample Data Example

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "consultationId": "VC-1728123456",
  "appointmentId": ObjectId("507f1f77bcf86cd799439012"),
  "doctorId": ObjectId("507f1f77bcf86cd799439013"),
  "doctorName": "Dr. Sarah Johnson",
  "patientId": ObjectId("507f1f77bcf86cd799439014"),
  "patientName": "John Doe",
  "roomId": "opd-wallet-vc-1728123456",
  "roomName": "Dr. Sarah Johnson - John Doe Consultation",
  "roomPassword": "secure123",
  "jitsiDomain": "meet.jit.si",
  "roomUrl": "https://meet.jit.si/opd-wallet-vc-1728123456",
  "scheduledStartTime": ISODate("2025-10-15T10:00:00Z"),
  "actualStartTime": ISODate("2025-10-15T10:02:00Z"),
  "endTime": ISODate("2025-10-15T10:17:00Z"),
  "duration": 15,
  "status": "COMPLETED",
  "doctorJoinedAt": ISODate("2025-10-15T10:00:30Z"),
  "patientJoinedAt": ISODate("2025-10-15T10:02:00Z"),
  "recordingEnabled": false,
  "videoQuality": "HD",
  "audioQuality": "Good",
  "networkIssues": [],
  "prescriptionId": ObjectId("507f1f77bcf86cd799439015"),
  "feedback": {
    "doctorRating": 5,
    "patientRating": 4,
    "patientComments": "Very helpful consultation, doctor explained everything clearly"
  },
  "endedBy": "DOCTOR",
  "createdAt": ISODate("2025-10-15T09:55:00Z"),
  "updatedAt": ISODate("2025-10-15T10:17:30Z")
}
```

---

**Document Version:** 3.3
**Last Updated:** October 15, 2025 (Video Consultations Integration - v6.7)
**For Questions:** Contact development team
