# Doctor Portal - Advanced Features Implementation Plan
**Date:** October 12, 2025
**Features:** Digital Prescription Writing + Video Consultation
**Research-Based Comprehensive Plan**

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Feature 1: Digital Prescription Writing System](#feature-1-digital-prescription-writing-system)
3. [Feature 2: Video Consultation System](#feature-2-video-consultation-system)
4. [Database Architecture](#database-architecture)
5. [Implementation Timeline](#implementation-timeline)
6. [Cost Analysis](#cost-analysis)
7. [Technical Stack](#technical-stack)
8. [Security & Compliance](#security-compliance)

---

## Executive Summary

Based on extensive research, I recommend a phased approach to implement both features:

### Feature 1: Digital Prescription Writing
- **Approach:** Build custom mini-PMS (Practice Management System)
- **Drug Database:** RxNorm API (Free, U.S. NLM) + Indian Medicines Database
- **ICD-10 Codes:** NLM Clinical Tables API (Free)
- **Timeline:** 8-10 weeks
- **Cost:** Free APIs + Development effort

### Feature 2: Video Consultation
- **Recommended Solution:** Jitsi Meet (Self-hosted)
- **Alternative:** Daily.co (Paid, easier)
- **Integration:** Jitsi React SDK
- **Timeline:** 3-4 weeks
- **Cost:** $0 (Jitsi) or $99-499/month (Daily.co)

**Total Timeline:** 12-14 weeks for both features
**Total Cost:** $0-6000 (development only, free APIs)

---

# Feature 1: Digital Prescription Writing System

## 1.1 Research Findings

### Medical Databases & APIs (Indian Context)

#### ✅ **Recommended: Hybrid Approach**

1. **Indian Medicines Database:**
   - **DataRequisite** (https://datarequisite.com/)
     - 600,000+ Indian medicines
     - Regularly updated
     - Commercial license: ~$500-1000/year
     - Covers: Medicine names, composition, manufacturers, pricing

   - **Alternative: Kaggle Dataset** (Free)
     - 250,000+ allopathy medicines
     - Pricing information included
     - One-time setup, manual updates
     - Good for MVP

2. **International Drug Database (Free):**
   - **RxNorm API** (U.S. National Library of Medicine)
     - Free, no license needed
     - Normalized drug names
     - Drug interactions
     - API limit: 20 requests/second
     - URL: https://lhncbc.nlm.nih.gov/RxNav/APIs/

3. **ICD-10 Diagnosis Codes (Free):**
   - **NLM Clinical Tables API**
     - Free ICD-10-CM search
     - URL: https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search
     - 98,100+ diagnosis codes

   - **WHO ICD-11 API** (Alternative)
     - Latest ICD-11 codes
     - REST API
     - URL: https://icd.who.int/icdapi

---

## 1.2 System Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────┐
│                  Doctor Portal                           │
│                                                           │
│  ┌──────────────────┐    ┌──────────────────────┐      │
│  │ Prescription Pad │    │ Upload Prescription   │      │
│  │  (Write Mode)    │    │  (Scan/PDF Mode)      │      │
│  └────────┬─────────┘    └────────┬──────────────┘      │
│           │                       │                       │
│           └───────────┬───────────┘                       │
│                       │                                   │
│            ┌──────────▼─────────────┐                    │
│            │  Prescription Service   │                    │
│            │  - Validate             │                    │
│            │  - Generate PDF         │                    │
│            │  - Send to Patient      │                    │
│            └──────────┬──────────────┘                    │
└───────────────────────┼───────────────────────────────────┘
                        │
           ┌────────────▼─────────────┐
           │   MongoDB Database        │
           │                           │
           │  - Prescriptions          │
           │  - Medicines Master       │
           │  - Symptoms Master        │
           │  - Diagnoses (ICD-10)     │
           │  - Templates              │
           └───────────────────────────┘
                        │
           ┌────────────▼─────────────┐
           │   Member Portal           │
           │   (Health Records)        │
           │                           │
           │  - View Prescriptions     │
           │  - Download PDF           │
           │  - Order Medicines        │
           └───────────────────────────┘
```

---

## 1.3 Database Schema Design

### 1.3.1 Medicines Master Collection
```typescript
// Collection: medicines_master
{
  _id: ObjectId,
  medicineId: String,          // Unique ID: MED001
  name: String,                 // Dolo 650
  genericName: String,          // Paracetamol
  brandName: String,            // Dolo
  manufacturer: String,         // Micro Labs
  composition: String,          // Paracetamol 650mg
  strength: String,             // 650mg
  dosageForm: String,           // Tablet, Syrup, Injection
  packSize: String,             // 15 tablets
  mrp: Number,                  // 30.00
  category: String,             // Analgesic, Antibiotic
  schedule: String,             // H, H1, X (Drug Schedule)
  rxNormConcept: String,        // RxNorm concept ID
  isActive: Boolean,
  searchKeywords: [String],    // For autocomplete
  createdAt: Date,
  updatedAt: Date
}

// Indexes:
// 1. name (text index for search)
// 2. genericName (text index)
// 3. medicineId (unique)
```

### 1.3.2 Symptoms Master Collection
```typescript
// Collection: symptoms_master
{
  _id: ObjectId,
  symptomId: String,           // SYM001
  name: String,                // Fever
  description: String,
  category: String,            // General, Respiratory, Cardiovascular
  severity: String,            // Mild, Moderate, Severe
  commonDiagnoses: [           // Associated ICD-10 codes
    {
      icd10Code: String,       // R50.9
      diagnosisName: String,   // Fever, unspecified
      probability: Number      // 85 (%)
    }
  ],
  searchKeywords: [String],
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 1.3.3 Diagnoses Master Collection (ICD-10)
```typescript
// Collection: diagnoses_master
{
  _id: ObjectId,
  icd10Code: String,           // R50.9 (unique)
  diagnosisName: String,       // Fever, unspecified
  category: String,            // Symptoms, signs and abnormal clinical findings
  billable: Boolean,           // true
  description: String,
  commonSymptoms: [String],    // ["fever", "chills", "body ache"]
  commonMedicines: [           // Frequently prescribed medicines
    {
      medicineId: String,
      medicineName: String,
      frequency: Number        // How often prescribed (0-100)
    }
  ],
  searchKeywords: [String],
  version: String,             // 2026
  effectiveDate: Date,         // 2025-10-01
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 1.3.4 Prescription Templates Collection
```typescript
// Collection: prescription_templates
{
  _id: ObjectId,
  templateId: String,          // TMPL001
  doctorId: ObjectId,          // Doctor who created it
  name: String,                // "Common Cold Template"
  category: String,            // Respiratory, Fever, etc.
  diagnosis: {
    icd10Code: String,
    diagnosisName: String
  },
  symptoms: [String],
  medicines: [
    {
      medicineId: String,
      medicineName: String,
      dosage: String,          // 1-0-1
      duration: String,        // 5 days
      instructions: String,    // After food
      frequency: String        // Twice daily
    }
  ],
  advice: String,
  followUpDays: Number,        // 7
  isPublic: Boolean,           // Can other doctors use?
  usageCount: Number,          // How many times used
  createdAt: Date,
  updatedAt: Date
}
```

### 1.3.5 Digital Prescriptions Collection (Enhanced)
```typescript
// Collection: prescriptions (Enhanced existing)
{
  _id: ObjectId,
  prescriptionId: String,      // PRX001
  prescriptionNumber: String,  // Auto-generated: PRX-2025-001
  type: String,                // "DIGITAL" or "UPLOADED"

  // Appointment & Patient Info
  appointmentId: ObjectId,
  patientId: ObjectId,
  patientName: String,
  patientAge: Number,
  patientGender: String,
  patientBloodGroup: String,
  patientWeight: Number,       // in kg
  patientAllergies: [String],  // ["Penicillin", "Sulfa"]

  // Doctor Info
  doctorId: ObjectId,
  doctorName: String,
  doctorSpecialty: String,
  doctorRegistrationNo: String,
  doctorSignatureUrl: String,  // S3 URL

  // Clinical Information
  chiefComplaints: [
    {
      symptomId: String,
      symptomName: String,
      duration: String,        // "3 days"
      severity: String         // Mild/Moderate/Severe
    }
  ],

  diagnosis: {
    primary: {
      icd10Code: String,
      diagnosisName: String,
      notes: String
    },
    secondary: [               // Multiple diagnoses
      {
        icd10Code: String,
        diagnosisName: String,
        notes: String
      }
    ]
  },

  vitalSigns: {
    temperature: Number,       // 98.6 F
    bloodPressure: String,     // "120/80"
    pulse: Number,             // 72 bpm
    weight: Number,            // 70 kg
    height: Number,            // 170 cm
    bmi: Number,               // Auto-calculated
    spo2: Number               // 98%
  },

  // Prescription Details
  medicines: [
    {
      medicineId: String,
      medicineName: String,
      genericName: String,
      dosage: String,          // "1-0-1" (Morning-Afternoon-Night)
      dosageForm: String,      // Tablet/Syrup/Injection
      strength: String,        // 650mg
      duration: String,        // "5 days"
      durationDays: Number,    // 5
      frequency: String,       // "Twice daily"
      instructions: String,    // "After food"
      quantity: Number,        // 15 (tablets)
      isSubstitutable: Boolean // Generic allowed?
    }
  ],

  // Lab Tests (if any)
  labTests: [
    {
      testName: String,        // "Complete Blood Count"
      testCode: String,        // CBC
      priority: String,        // Routine/Urgent
      notes: String
    }
  ],

  // Advice & Follow-up
  advice: String,              // General instructions
  dietaryInstructions: String,
  lifestyleAdvice: String,
  followUpDate: Date,
  followUpRequired: Boolean,

  // Template Used (if any)
  templateId: String,
  templateName: String,

  // Digital Signature & Verification
  digitalSignature: String,    // Encrypted signature
  verificationCode: String,    // QR code data
  qrCodeUrl: String,           // Generated QR code image

  // Upload Info (if type = UPLOADED)
  uploadedFileUrl: String,     // S3 URL
  uploadedFileName: String,
  uploadedFileSize: Number,
  ocrExtractedText: String,    // OCR text if processed

  // Status & Tracking
  status: String,              // DRAFT, ISSUED, CANCELLED
  issuedAt: Date,
  cancelledAt: Date,
  cancellationReason: String,

  // Patient Access
  viewedByPatient: Boolean,
  viewedAt: Date,
  downloadedByPatient: Boolean,
  downloadCount: Number,

  // Pharmacy Integration
  dispensedBy: String,         // Pharmacy name
  dispensedAt: Date,
  dispensedAmount: Number,

  // Metadata
  createdAt: Date,
  updatedAt: Date,
  createdBy: ObjectId,         // Doctor ID
  lastModifiedBy: ObjectId
}

// Indexes:
// 1. prescriptionNumber (unique)
// 2. patientId + createdAt (compound)
// 3. doctorId + createdAt (compound)
// 4. appointmentId (unique)
// 5. status + createdAt (compound)
```

---

## 1.4 API Design

### 1.4.1 Medicines API
```typescript
// Search medicines with autocomplete
GET /api/medicines/search?q=dolo&limit=10
Response: {
  medicines: [
    {
      medicineId: "MED001",
      name: "Dolo 650",
      genericName: "Paracetamol",
      strength: "650mg",
      dosageForm: "Tablet",
      manufacturer: "Micro Labs",
      mrp: 30.00
    }
  ]
}

// Get medicine details
GET /api/medicines/:medicineId
Response: {
  medicine: { /* Full details */ }
}

// Get popular medicines by specialty
GET /api/medicines/popular?specialty=general-medicine&limit=20

// Get medicine interactions
GET /api/medicines/:medicineId/interactions?with=MED002,MED003
```

### 1.4.2 Symptoms & Diagnosis API
```typescript
// Search symptoms
GET /api/symptoms/search?q=fever&limit=10

// Get symptom details with common diagnoses
GET /api/symptoms/:symptomId
Response: {
  symptom: {
    symptomId: "SYM001",
    name: "Fever",
    commonDiagnoses: [
      {
        icd10Code: "R50.9",
        diagnosisName: "Fever, unspecified",
        probability: 85
      }
    ]
  }
}

// Search ICD-10 diagnoses
GET /api/diagnoses/search?q=fever&limit=10

// Get diagnosis details
GET /api/diagnoses/:icd10Code
Response: {
  diagnosis: {
    icd10Code: "R50.9",
    diagnosisName: "Fever, unspecified",
    commonSymptoms: ["fever", "chills"],
    commonMedicines: [...]
  }
}
```

### 1.4.3 Prescription Templates API
```typescript
// Get doctor's templates
GET /api/doctor/templates
Response: {
  templates: [
    {
      templateId: "TMPL001",
      name: "Common Cold",
      category: "Respiratory",
      usageCount: 45
    }
  ]
}

// Create template
POST /api/doctor/templates
Body: {
  name: "Common Cold",
  diagnosis: { icd10Code: "J00", name: "Acute nasopharyngitis" },
  medicines: [...],
  advice: "Rest and drink fluids"
}

// Use template
POST /api/doctor/prescriptions/from-template
Body: {
  templateId: "TMPL001",
  appointmentId: "APT001",
  modifications: { /* Any changes */ }
}
```

### 1.4.4 Digital Prescription API
```typescript
// Create digital prescription
POST /api/doctor/prescriptions
Body: {
  appointmentId: "APT001",
  chiefComplaints: [
    { symptomId: "SYM001", symptomName: "Fever", duration: "3 days" }
  ],
  diagnosis: {
    primary: { icd10Code: "R50.9", diagnosisName: "Fever" }
  },
  vitalSigns: { temperature: 101.5, pulse: 82 },
  medicines: [
    {
      medicineId: "MED001",
      medicineName: "Dolo 650",
      dosage: "1-0-1",
      duration: "5 days",
      instructions: "After food"
    }
  ],
  advice: "Rest and drink fluids",
  followUpDays: 7
}
Response: {
  prescriptionId: "PRX001",
  prescriptionNumber: "PRX-2025-001",
  pdfUrl: "https://s3.../prescription.pdf",
  qrCodeUrl: "https://s3.../qr-code.png"
}

// Get prescription details
GET /api/doctor/prescriptions/:prescriptionId

// Update prescription (if DRAFT)
PATCH /api/doctor/prescriptions/:prescriptionId

// Cancel prescription
DELETE /api/doctor/prescriptions/:prescriptionId
Body: { reason: "Incorrect diagnosis" }

// Get patient's prescriptions (for doctor)
GET /api/doctor/patients/:patientId/prescriptions

// Generate prescription PDF
GET /api/doctor/prescriptions/:prescriptionId/pdf
```

### 1.4.5 Member Portal API (Patient View)
```typescript
// Get my prescriptions
GET /api/member/prescriptions?page=1&limit=10
Response: {
  prescriptions: [
    {
      prescriptionNumber: "PRX-2025-001",
      doctorName: "Dr. John Doe",
      diagnosis: "Fever",
      issuedAt: "2025-10-12",
      medicines: 3,
      pdfUrl: "..."
    }
  ],
  total: 45,
  page: 1
}

// Get prescription details
GET /api/member/prescriptions/:prescriptionId

// Download prescription PDF
GET /api/member/prescriptions/:prescriptionId/download

// Verify prescription (QR code scan)
GET /api/public/prescriptions/verify?code=ABC123XYZ
```

---

## 1.5 UI/UX Design

### 1.5.1 Prescription Writing Interface (Doctor Portal)

```
┌──────────────────────────────────────────────────────────────┐
│  Appointment: APT-2025-001 | Patient: Rahul Kumar (32/M)     │
│  Date: Oct 12, 2025        | UHID: UH001234                   │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  [Write Prescription] [Upload Prescription] [Use Template]     │
└──────────────────────────────────────────────────────────────┘

╔══════════════════════════════════════════════════════════════╗
║  VITAL SIGNS                                                   ║
╠══════════════════════════════════════════════════════════════╣
║  Temperature: [101.5] F   BP: [120/80] mmHg   Pulse: [82] bpm║
║  Weight: [70] kg   Height: [170] cm   SPO2: [98] %            ║
╚══════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════╗
║  CHIEF COMPLAINTS                                              ║
╠══════════════════════════════════════════════════════════════╣
║  [+ Add Symptom]                                               ║
║  ┌──────────────────────────────────────────────────────────┐║
║  │ 1. Fever - 3 days - Moderate                         [x] │║
║  │ 2. Body ache - 2 days - Mild                         [x] │║
║  └──────────────────────────────────────────────────────────┘║
╚══════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════╗
║  DIAGNOSIS                                                     ║
╠══════════════════════════════════════════════════════════════╣
║  Primary: [Search ICD-10...]                                  ║
║  Selected: R50.9 - Fever, unspecified                         ║
║                                                                ║
║  Secondary: [+ Add]                                            ║
╚══════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════╗
║  MEDICINES                                        [+ Add]       ║
╠══════════════════════════════════════════════════════════════╣
║  ┌──────────────────────────────────────────────────────────┐║
║  │ 1. Dolo 650 (Paracetamol 650mg) - Tablet            [x] │║
║  │    Dosage: [1]-[0]-[1]  Duration: [5] days                │║
║  │    Instructions: [After food ▾]                           │║
║  │    Quantity: 15 tablets                                   │║
║  │    ☑ Generic substitution allowed                        │║
║  ├──────────────────────────────────────────────────────────┤║
║  │ 2. Azithromycin 500mg - Tablet                       [x] │║
║  │    Dosage: [1]-[0]-[0]  Duration: [3] days                │║
║  │    Instructions: [Before food ▾]                          │║
║  │    Quantity: 3 tablets                                    │║
║  └──────────────────────────────────────────────────────────┘║
╚══════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════╗
║  ADVICE & INSTRUCTIONS                                         ║
╠══════════════════════════════════════════════════════════════╣
║  [Rest and drink plenty of fluids. Avoid cold water.]         ║
║                                                                ║
║  Follow-up: ☑ Required  Date: [Oct 19, 2025]                 ║
╚══════════════════════════════════════════════════════════════╝

[Save as Draft] [Issue Prescription] [Save as Template]
```

### 1.5.2 Medicine Search (Autocomplete)
```
┌──────────────────────────────────────────────────────────────┐
│ Search Medicine: [dolo___]                                     │
├──────────────────────────────────────────────────────────────┤
│ ▸ Dolo 650 (Paracetamol 650mg) - ₹30.00                      │
│ ▸ Dolo 500 (Paracetamol 500mg) - ₹25.00                      │
│ ▸ Dolo Cold (Paracetamol + Phenylephrine) - ₹35.00           │
│ ▸ Dolomol 650 (Paracetamol 650mg) - ₹28.00                   │
└──────────────────────────────────────────────────────────────┘
```

### 1.5.3 Generated Prescription PDF (Patient View)
```
╔══════════════════════════════════════════════════════════════╗
║                    DR. JOHN DOE                                ║
║            MBBS, MD (General Medicine)                         ║
║         Reg. No: MH-12345 | Ph: +91-9876543210                ║
║  Clinic: Apollo Hospital, Mumbai | Email: dr.john@apollo.com  ║
╠══════════════════════════════════════════════════════════════╣
║                                                                ║
║  Prescription No: PRX-2025-001                                 ║
║  Date: October 12, 2025                                        ║
║                                                                ║
║  Patient: Rahul Kumar                 Age/Sex: 32 yrs / Male  ║
║  UHID: UH001234                       Blood Group: O+          ║
║  Weight: 70 kg                        Allergies: None          ║
╠══════════════════════════════════════════════════════════════╣
║  Chief Complaints:                                             ║
║  • Fever - 3 days - Moderate severity                          ║
║  • Body ache - 2 days - Mild severity                          ║
║                                                                ║
║  Vital Signs:                                                  ║
║  Temperature: 101.5°F | BP: 120/80 mmHg | Pulse: 82 bpm       ║
║  SpO2: 98%                                                     ║
║                                                                ║
║  Diagnosis:                                                    ║
║  R50.9 - Fever, unspecified                                    ║
╠══════════════════════════════════════════════════════════════╣
║  Rx                                                            ║
║                                                                ║
║  1. Tab. Dolo 650 (Paracetamol 650mg)                         ║
║     Dosage: 1 - 0 - 1 (After food)                            ║
║     Duration: 5 days                                           ║
║     Qty: 15 tablets                                            ║
║                                                                ║
║  2. Tab. Azithromycin 500mg                                    ║
║     Dosage: 1 - 0 - 0 (Before food)                           ║
║     Duration: 3 days                                           ║
║     Qty: 3 tablets                                             ║
╠══════════════════════════════════════════════════════════════╣
║  Advice:                                                       ║
║  • Rest and drink plenty of fluids                             ║
║  • Avoid cold water                                            ║
║  • Follow-up if fever persists beyond 5 days                   ║
║                                                                ║
║  Next Visit: October 19, 2025                                  ║
╠══════════════════════════════════════════════════════════════╣
║                                                    ┌─────────┐ ║
║  Dr. John Doe                                     │  QR     │ ║
║  Signature _______________                        │  CODE   │ ║
║  Date: Oct 12, 2025                               │  [##]   │ ║
║                                                    └─────────┘ ║
║  This prescription is digitally generated and verified.        ║
║  Scan QR code to verify authenticity.                          ║
╚══════════════════════════════════════════════════════════════╝
```

---

## 1.6 Implementation Phases

### Phase 1: Data Setup (Week 1-2)
**Tasks:**
1. Set up MongoDB collections with indexes
2. Import Indian Medicines Database
   - Option A: Purchase DataRequisite license ($500-1000)
   - Option B: Use Kaggle dataset (Free, manual update)
3. Import ICD-10 codes from NLM API
4. Create seed data for symptoms master
5. Set up RxNorm API integration
6. Create data sync scripts

**Deliverables:**
- medicines_master: 250,000+ records
- diagnoses_master: 98,000+ ICD-10 codes
- symptoms_master: 500+ common symptoms
- API integration tested

---

### Phase 2: Backend API Development (Week 3-5)
**Tasks:**
1. **Medicines Service** (Week 3)
   - Search API with autocomplete
   - Medicine details API
   - Popular medicines by specialty
   - Drug interaction checker (RxNorm integration)

2. **Symptoms & Diagnosis Service** (Week 3-4)
   - Symptoms search API
   - ICD-10 search API
   - Diagnosis details with suggested medicines

3. **Prescription Service** (Week 4-5)
   - Create digital prescription
   - Generate PDF with QR code
   - Prescription CRUD operations
   - Template management
   - Patient prescription history

4. **Validation & Business Logic**
   - Check for drug interactions
   - Validate dosage and duration
   - Ensure primary member check
   - Digital signature generation

**Deliverables:**
- 15+ API endpoints
- PDF generation service (using PDFKit or Puppeteer)
- QR code generation
- Unit tests (80% coverage)

---

### Phase 3: Doctor Portal UI (Week 6-7)
**Tasks:**
1. **Prescription Writing Interface** (Week 6)
   - Chief complaints section with symptom autocomplete
   - Vital signs input
   - Diagnosis section with ICD-10 search
   - Medicine section with advanced search
   - Dosage calculator
   - Advice & follow-up section

2. **Smart Features** (Week 6-7)
   - Medicine autocomplete with fuzzy search
   - Dosage templates (1-0-1, 1-1-1, etc.)
   - Drag-and-drop medicine reordering
   - Quick templates for common conditions
   - Real-time drug interaction warnings
   - Duplicate medicine detection

3. **Upload Prescription** (Week 7)
   - File upload (PDF, JPG, PNG)
   - Preview before save
   - Link to appointment

4. **Template Management** (Week 7)
   - Create template from prescription
   - Edit templates
   - Use template for new prescription
   - Share templates (optional)

**Deliverables:**
- Complete prescription writing UI
- Upload prescription feature
- Template management UI
- Responsive design (mobile-friendly)

---

### Phase 4: Member Portal Integration (Week 8)
**Tasks:**
1. **Health Records Section** (Enhance existing)
   - View all prescriptions (list)
   - Filter by date, doctor, diagnosis
   - View prescription details
   - Download PDF
   - Print prescription

2. **Prescription Verification**
   - QR code scanner (optional)
   - Public verification page

**Deliverables:**
- Enhanced health records page
- Prescription download feature
- PDF viewer integrated

---

### Phase 5: Testing & Optimization (Week 9-10)
**Tasks:**
1. **Integration Testing**
   - End-to-end prescription flow
   - Medicine search performance (< 200ms)
   - PDF generation (< 2 seconds)
   - Mobile responsiveness

2. **Load Testing**
   - 1000+ concurrent users
   - Medicine database queries optimization
   - Add database indexes

3. **Bug Fixes & Polish**
   - UI/UX improvements
   - Accessibility (ARIA labels)
   - Error handling

4. **Documentation**
   - API documentation (Swagger)
   - User manual for doctors
   - Admin guide

**Deliverables:**
- Test reports
- Performance benchmarks
- Documentation

---

## 1.7 Technical Considerations

### Data Sync Strategy
```typescript
// Cron job: Daily medicine database sync
// Run at 2 AM IST
async function syncMedicinesDatabase() {
  // If using DataRequisite API
  const latestMedicines = await dataRequisiteAPI.getUpdates()

  // Bulk upsert
  await MedicineModel.bulkWrite(
    latestMedicines.map(med => ({
      updateOne: {
        filter: { medicineId: med.id },
        update: { $set: med },
        upsert: true
      }
    }))
  )

  console.log(`Synced ${latestMedicines.length} medicines`)
}

// Cron job: Weekly ICD-10 codes update
async function syncICD10Codes() {
  // Fetch from NLM API
  const icd10Codes = await nlmAPI.getICD10Codes()

  // Update database
  await DiagnosisModel.bulkWrite(...)
}
```

### Medicine Search Optimization
```typescript
// Create text index for fast search
db.medicines_master.createIndex({
  name: "text",
  genericName: "text",
  searchKeywords: "text"
}, {
  weights: {
    name: 10,
    genericName: 5,
    searchKeywords: 1
  }
})

// Autocomplete query with scoring
async function searchMedicines(query: string, limit: number = 10) {
  return await MedicineModel.find(
    { $text: { $search: query } },
    { score: { $meta: "textScore" } }
  )
  .sort({ score: { $meta: "textScore" } })
  .limit(limit)
  .lean()
}
```

### PDF Generation Service
```typescript
import PDFDocument from 'pdfkit'
import QRCode from 'qrcode'

async function generatePrescriptionPDF(prescription: Prescription) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 })

  // Header
  doc.fontSize(20).text('Dr. John Doe', { align: 'center' })
  doc.fontSize(12).text('MBBS, MD (General Medicine)')

  // Patient details
  doc.fontSize(14).text(`Patient: ${prescription.patientName}`)
  doc.text(`Date: ${formatDate(prescription.issuedAt)}`)

  // Medicines
  prescription.medicines.forEach((med, index) => {
    doc.fontSize(12)
    doc.text(`${index + 1}. ${med.medicineName} (${med.strength})`)
    doc.fontSize(10)
    doc.text(`   Dosage: ${med.dosage}`)
    doc.text(`   Duration: ${med.duration}`)
  })

  // Generate QR code
  const qrCodeData = await QRCode.toDataURL(prescription.verificationCode)
  doc.image(qrCodeData, { width: 100 })

  // Save to S3
  const pdfBuffer = await streamToBuffer(doc)
  const s3Url = await uploadToS3(pdfBuffer, `prescriptions/${prescription.prescriptionId}.pdf`)

  return s3Url
}
```

---

# Feature 2: Video Consultation System

## 2.1 Research Findings

### Video Platform Comparison

| Feature | Jitsi Meet (Self-hosted) | Daily.co | Whereby | Twilio Video |
|---------|--------------------------|----------|---------|--------------|
| **Cost** | FREE (Server cost only) | $99-499/mo | $9.99-149/mo | Pay-per-use |
| **Setup Complexity** | High (DevOps) | Low (SDK) | Low (Embed) | Medium |
| **HIPAA Compliance** | Yes (self-hosted) | Yes (Enterprise) | Yes (Paid) | Yes |
| **Max Participants** | 100+ | 200 | 50 | 50 |
| **Recording** | Yes (local) | Yes (cloud) | Yes (paid) | Yes |
| **Screen Sharing** | Yes | Yes | Yes | Yes |
| **React SDK** | ✅ Official | ✅ Official | ✅ Official | ✅ Official |
| **WebRTC** | Yes | Yes | Yes | Yes |
| **Mobile Support** | Yes | Yes | Yes | Yes |
| **Customization** | High | Medium | Low | High |
| **Best For** | Budget-conscious | Startups | Simple embed | Enterprise |

### ✅ Recommendation: Jitsi Meet (Self-hosted)

**Reasons:**
1. **Cost:** FREE (only server costs ~$20-50/month)
2. **Full Control:** Complete data privacy, HIPAA-compliant
3. **Unlimited Usage:** No per-minute charges
4. **Customizable:** Full branding, custom features
5. **React SDK:** Official support, easy integration

**Alternative for Quick Start:** Daily.co (if you need faster deployment and don't mind $99/month)

---

## 2.2 System Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Online Consultation Flow                  │
└─────────────────────────────────────────────────────────────┘

1. Patient books appointment → Selects "ONLINE" type
2. Doctor receives appointment notification
3. At appointment time:
   ├─ Doctor clicks "Start Consultation" on Doctor Portal
   ├─ System generates unique room ID
   ├─ Patient receives notification with "Join Consultation" link
   └─ Both join Jitsi Meet room

┌──────────────────┐           ┌──────────────────┐
│  Doctor Portal   │           │  Member Portal   │
│                  │           │                  │
│ [Start Video] ──┼──────────▶│ [Join Video]     │
└────────┬─────────┘           └────────┬─────────┘
         │                              │
         │      ┌──────────────────┐    │
         └─────▶│  Jitsi Meet      │◀───┘
                │  Video Room      │
                │  (Self-hosted)   │
                └──────────────────┘
                         │
                ┌────────▼────────┐
                │  Consultation   │
                │  Recording      │
                │  (Optional)     │
                └─────────────────┘
                         │
                ┌────────▼────────┐
                │  Prescription   │
                │  + Notes        │
                │  (Auto-linked)  │
                └─────────────────┘
```

---

## 2.3 Database Schema

### 2.3.1 Video Consultations Collection
```typescript
// Collection: video_consultations
{
  _id: ObjectId,
  consultationId: String,        // VID001
  appointmentId: ObjectId,        // Link to appointment

  // Participants
  doctorId: ObjectId,
  doctorName: String,
  patientId: ObjectId,
  patientName: String,

  // Room Details
  roomId: String,                 // Unique Jitsi room ID
  roomName: String,               // Human-readable name
  roomPassword: String,           // Optional password
  jitsiDomain: String,            // meet.jit.si or self-hosted
  roomUrl: String,                // Full meeting URL

  // Scheduling
  scheduledStartTime: Date,
  actualStartTime: Date,
  endTime: Date,
  duration: Number,               // in minutes

  // Status Tracking
  status: String,                 // SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW
  doctorJoinedAt: Date,
  patientJoinedAt: Date,

  // Recording (if enabled)
  recordingEnabled: Boolean,
  recordingUrl: String,           // S3 URL
  recordingDuration: Number,
  recordingSize: Number,          // in MB

  // Quality Metrics
  videoQuality: String,           // HD, SD, LOW
  audioQuality: String,
  networkIssues: [
    {
      timestamp: Date,
      issue: String,              // "Patient disconnected"
      duration: Number
    }
  ],

  // Post-Consultation
  prescriptionId: ObjectId,       // Created after consultation
  notesId: ObjectId,              // Doctor's notes
  feedback: {
    doctorRating: Number,         // 1-5
    patientRating: Number,
    doctorComments: String,
    patientComments: String
  },

  // Metadata
  createdAt: Date,
  updatedAt: Date
}

// Indexes:
// 1. appointmentId (unique)
// 2. roomId (unique)
// 3. doctorId + scheduledStartTime (compound)
// 4. patientId + scheduledStartTime (compound)
// 5. status + scheduledStartTime (compound)
```

### 2.3.2 Consultation Notes Collection
```typescript
// Collection: consultation_notes
{
  _id: ObjectId,
  noteId: String,                 // NOTE001
  consultationId: ObjectId,
  appointmentId: ObjectId,

  // Patient Info
  patientId: ObjectId,
  patientName: String,

  // Doctor Info
  doctorId: ObjectId,
  doctorName: String,

  // Clinical Notes
  chiefComplaints: String,        // Free-form text
  historyOfPresentIllness: String,
  pastMedicalHistory: String,
  familyHistory: String,
  allergies: [String],
  currentMedications: [String],

  // Examination Findings
  generalExamination: String,
  systemicExamination: String,

  // Assessment & Plan
  diagnosis: String,
  differentialDiagnosis: [String],
  investigationsOrdered: [String],
  treatmentPlan: String,
  followUpInstructions: String,

  // Voice Notes (if recorded)
  voiceNoteUrl: String,
  voiceNoteDuration: Number,
  voiceNoteTranscript: String,    // Auto-transcribed (optional)

  // Metadata
  createdAt: Date,
  updatedAt: Date,
  lastModifiedBy: ObjectId
}
```

---

## 2.4 API Design

### 2.4.1 Video Consultation API
```typescript
// Start video consultation (Doctor)
POST /api/doctor/consultations/start
Body: {
  appointmentId: "APT001"
}
Response: {
  consultationId: "VID001",
  roomUrl: "https://meet.yourapp.com/room-APT001-xyz",
  roomPassword: "abc123" // optional
}

// Join video consultation (Patient)
POST /api/member/consultations/join
Body: {
  appointmentId: "APT001"
}
Response: {
  consultationId: "VID001",
  roomUrl: "https://meet.yourapp.com/room-APT001-xyz",
  doctorName: "Dr. John Doe",
  status: "IN_PROGRESS" // or "WAITING_FOR_DOCTOR"
}

// Get consultation status
GET /api/consultations/:consultationId/status
Response: {
  status: "IN_PROGRESS",
  doctorJoined: true,
  patientJoined: true,
  startedAt: "2025-10-12T10:00:00Z",
  duration: 15 // minutes
}

// End consultation (Doctor)
POST /api/doctor/consultations/:consultationId/end
Body: {
  notes: "Patient doing well. Prescribed medications.",
  followUpRequired: true,
  followUpDays: 7
}
Response: {
  consultationId: "VID001",
  duration: 20,
  prescriptionId: "PRX001" // if created
}

// Get consultation history
GET /api/doctor/consultations?page=1&limit=20
GET /api/member/consultations?page=1&limit=20
```

### 2.4.2 Jitsi Room Management
```typescript
// Generate JWT token for Jitsi room (if using JWT auth)
POST /api/jitsi/generate-token
Body: {
  roomName: "room-APT001",
  userName: "Dr. John Doe",
  email: "john@example.com",
  moderator: true
}
Response: {
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  expiresAt: "2025-10-12T12:00:00Z"
}

// Get recording (if enabled)
GET /api/consultations/:consultationId/recording
Response: {
  recordingUrl: "https://s3.../recording.mp4",
  duration: 1200, // seconds
  size: 250 // MB
}
```

---

## 2.5 Jitsi Meet Integration

### 2.5.1 Installation (Self-hosted)

**Option A: Quick Deployment (Docker)**
```bash
# Install Docker and Docker Compose
sudo apt update
sudo apt install docker.io docker-compose

# Clone Jitsi Docker setup
git clone https://github.com/jitsi/docker-jitsi-meet
cd docker-jitsi-meet

# Generate .env file
cp env.example .env

# Set your domain
echo "PUBLIC_URL=https://meet.yourdomain.com" >> .env

# Generate strong passwords
./gen-passwords.sh

# Start Jitsi
docker-compose up -d

# Configure SSL (Let's Encrypt)
sudo certbot --nginx -d meet.yourdomain.com
```

**Option B: Native Installation (Ubuntu/Debian)**
```bash
# Add Jitsi repository
echo 'deb https://download.jitsi.org stable/' | sudo tee /etc/apt/sources.list.d/jitsi-stable.list
wget -qO - https://download.jitsi.org/jitsi-key.gpg.key | sudo apt-key add -

# Install Jitsi Meet
sudo apt update
sudo apt install jitsi-meet

# During installation, enter your domain: meet.yourdomain.com

# Configure SSL
sudo /usr/share/jitsi-meet/scripts/install-letsencrypt-cert.sh
```

**Server Requirements:**
- 2 CPU cores
- 4GB RAM (minimum), 8GB recommended
- 50GB SSD storage
- Ubuntu 20.04/22.04 or Debian 11
- Public IP with domain name
- Ports: 80, 443, 4443, 10000 (UDP)

**Estimated Cost:** $20-50/month (AWS EC2 t3.medium or DigitalOcean droplet)

---

### 2.5.2 React Integration

**Install Jitsi React SDK**
```bash
npm install @jitsi/react-sdk
```

**Doctor Portal: Video Consultation Component**
```typescript
// components/VideoConsultation.tsx
'use client'

import { JitsiMeeting } from '@jitsi/react-sdk'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface VideoConsultationProps {
  appointmentId: string
  consultationId: string
  roomName: string
  doctorName: string
  patientName: string
  jwt?: string // Optional JWT token
}

export default function VideoConsultation({
  appointmentId,
  consultationId,
  roomName,
  doctorName,
  patientName,
  jwt
}: VideoConsultationProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [callEnded, setCallEnded] = useState(false)

  const jitsiConfig = {
    startWithAudioMuted: false,
    startWithVideoMuted: false,
    enableWelcomePage: false,
    prejoinPageEnabled: false,
    disableDeepLinking: true,
    toolbarButtons: [
      'microphone',
      'camera',
      'closedcaptions',
      'desktop',
      'fullscreen',
      'fodeviceselection',
      'hangup',
      'chat',
      'settings',
      'videoquality',
      'filmstrip',
      'stats',
      'shortcuts',
    ],
  }

  const jitsiInterfaceConfig = {
    SHOW_JITSI_WATERMARK: false,
    SHOW_WATERMARK_FOR_GUESTS: false,
    DEFAULT_BACKGROUND: '#474747',
    DISABLE_VIDEO_BACKGROUND: false,
    TOOLBAR_ALWAYS_VISIBLE: true,
    TOOLBAR_TIMEOUT: 4000,
  }

  const handleJitsiAPI = (api: any) => {
    // API event listeners
    api.on('readyToClose', handleCallEnd)
    api.on('participantJoined', handleParticipantJoined)
    api.on('participantLeft', handleParticipantLeft)
    api.on('videoConferenceJoined', handleConferenceJoined)

    setIsLoading(false)
  }

  const handleCallEnd = async () => {
    // End consultation on backend
    await fetch(`/api/doctor/consultations/${consultationId}/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        endedBy: 'DOCTOR',
        appointmentId
      })
    })

    setCallEnded(true)
    router.push(`/doctorview/appointments/${appointmentId}?prescribe=true`)
  }

  const handleParticipantJoined = (participant: any) => {
    console.log('Participant joined:', participant.displayName)
  }

  const handleParticipantLeft = (participant: any) => {
    console.log('Participant left:', participant.displayName)
  }

  const handleConferenceJoined = (data: any) => {
    console.log('Conference joined:', data)
  }

  if (callEnded) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Consultation Ended</h2>
          <p className="text-gray-600 mb-6">Redirecting to prescription...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-50">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Connecting to video room...</p>
          </div>
        </div>
      )}

      <JitsiMeeting
        domain="meet.yourapp.com" // Your Jitsi domain
        roomName={roomName}
        configOverwrite={jitsiConfig}
        interfaceConfigOverwrite={jitsiInterfaceConfig}
        userInfo={{
          displayName: doctorName,
          email: 'doctor@yourapp.com',
        }}
        jwt={jwt} // If using JWT authentication
        onApiReady={handleJitsiAPI}
        getIFrameRef={(iframeRef) => {
          iframeRef.style.height = '100%'
          iframeRef.style.width = '100%'
        }}
      />
    </div>
  )
}
```

**Doctor Portal: Start Consultation Page**
```typescript
// app/doctorview/consultations/[appointmentId]/page.tsx
'use client'

import { useEffect, useState } from 'use'
import { useParams } from 'next/navigation'
import VideoConsultation from '@/components/VideoConsultation'

export default function ConsultationPage() {
  const { appointmentId } = useParams()
  const [consultation, setConsultation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    startConsultation()
  }, [appointmentId])

  const startConsultation = async () => {
    try {
      const response = await fetch('/api/doctor/consultations/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appointmentId })
      })

      if (!response.ok) throw new Error('Failed to start consultation')

      const data = await response.json()
      setConsultation(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  }

  if (error) {
    return <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-red-600 mb-4">Error</h2>
        <p>{error}</p>
      </div>
    </div>
  }

  return (
    <VideoConsultation
      appointmentId={appointmentId as string}
      consultationId={consultation.consultationId}
      roomName={consultation.roomName}
      doctorName={consultation.doctorName}
      patientName={consultation.patientName}
      jwt={consultation.jwt}
    />
  )
}
```

**Member Portal: Join Consultation**
```typescript
// app/member/consultations/[appointmentId]/page.tsx
// Similar to doctor portal, but with "Join" instead of "Start"

export default function JoinConsultationPage() {
  // ... similar logic

  const joinConsultation = async () => {
    const response = await fetch('/api/member/consultations/join', {
      method: 'POST',
      body: JSON.stringify({ appointmentId })
    })
    // ...
  }

  return (
    <VideoConsultation
      appointmentId={appointmentId}
      consultationId={consultation.consultationId}
      roomName={consultation.roomName}
      doctorName={consultation.doctorName}
      patientName="You"
      jwt={consultation.jwt}
    />
  )
}
```

---

### 2.5.3 Backend Implementation

**Generate Jitsi Room**
```typescript
// api/src/modules/video-consultation/video-consultation.service.ts
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import * as jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class VideoConsultationService {
  constructor(
    @InjectModel('VideoConsultation') private consultationModel: Model<any>,
    @InjectModel('Appointment') private appointmentModel: Model<any>
  ) {}

  async startConsultation(appointmentId: string, doctorId: string) {
    // Get appointment details
    const appointment = await this.appointmentModel.findById(appointmentId)
    if (!appointment) throw new Error('Appointment not found')

    if (appointment.doctorId.toString() !== doctorId) {
      throw new Error('Unauthorized')
    }

    // Generate unique room name
    const roomId = uuidv4()
    const roomName = `opd-consult-${appointmentId}-${roomId.slice(0, 8)}`

    // Generate JWT token (if using JWT auth)
    const jwtToken = this.generateJitsiJWT({
      roomName,
      userName: appointment.doctorName,
      email: appointment.doctorEmail,
      moderator: true // Doctor is moderator
    })

    // Create consultation record
    const consultation = await this.consultationModel.create({
      consultationId: `VID${Date.now()}`,
      appointmentId,
      doctorId: appointment.doctorId,
      doctorName: appointment.doctorName,
      patientId: appointment.patientId,
      patientName: appointment.patientName,
      roomId,
      roomName,
      jitsiDomain: process.env.JITSI_DOMAIN || 'meet.jit.si',
      roomUrl: `https://${process.env.JITSI_DOMAIN || 'meet.jit.si'}/${roomName}`,
      scheduledStartTime: appointment.appointmentDate,
      actualStartTime: new Date(),
      status: 'IN_PROGRESS',
      doctorJoinedAt: new Date()
    })

    // Update appointment status
    await this.appointmentModel.findByIdAndUpdate(appointmentId, {
      status: 'IN_CONSULTATION',
      consultationStartedAt: new Date()
    })

    // Send notification to patient
    await this.notifyPatient(appointment.patientId, consultation)

    return {
      consultationId: consultation.consultationId,
      roomName,
      roomUrl: consultation.roomUrl,
      jwt: jwtToken,
      doctorName: appointment.doctorName,
      patientName: appointment.patientName
    }
  }

  async joinConsultation(appointmentId: string, patientId: string) {
    // Find existing consultation
    const consultation = await this.consultationModel.findOne({
      appointmentId,
      patientId
    })

    if (!consultation) {
      throw new Error('No active consultation found')
    }

    // Generate JWT token for patient
    const jwtToken = this.generateJitsiJWT({
      roomName: consultation.roomName,
      userName: consultation.patientName,
      email: '',
      moderator: false // Patient is not moderator
    })

    // Update consultation
    await this.consultationModel.findByIdAndUpdate(consultation._id, {
      patientJoinedAt: new Date()
    })

    return {
      consultationId: consultation.consultationId,
      roomName: consultation.roomName,
      roomUrl: consultation.roomUrl,
      jwt: jwtToken,
      doctorName: consultation.doctorName,
      patientName: consultation.patientName,
      status: consultation.status
    }
  }

  async endConsultation(consultationId: string, doctorId: string) {
    const consultation = await this.consultationModel.findOne({
      consultationId,
      doctorId
    })

    if (!consultation) throw new Error('Consultation not found')

    const duration = Math.floor(
      (new Date().getTime() - consultation.actualStartTime.getTime()) / 60000
    ) // minutes

    await this.consultationModel.findByIdAndUpdate(consultation._id, {
      status: 'COMPLETED',
      endTime: new Date(),
      duration
    })

    // Update appointment status
    await this.appointmentModel.findByIdAndUpdate(consultation.appointmentId, {
      status: 'COMPLETED',
      consultationCompletedAt: new Date()
    })

    return {
      consultationId,
      duration,
      appointmentId: consultation.appointmentId
    }
  }

  private generateJitsiJWT(data: {
    roomName: string
    userName: string
    email: string
    moderator: boolean
  }) {
    const payload = {
      context: {
        user: {
          name: data.userName,
          email: data.email
        }
      },
      room: data.roomName,
      moderator: data.moderator,
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 2) // 2 hours
    }

    return jwt.sign(payload, process.env.JITSI_JWT_SECRET, {
      algorithm: 'HS256',
      issuer: process.env.JITSI_JWT_APP_ID
    })
  }

  private async notifyPatient(patientId: string, consultation: any) {
    // Send notification via your notification service
    // Email, SMS, Push notification, etc.
  }
}
```

---

## 2.6 Implementation Phases

### Phase 1: Infrastructure Setup (Week 1)
**Tasks:**
1. Set up Jitsi Meet server (Docker or native)
2. Configure domain and SSL certificate
3. Test basic video calls
4. Configure firewall and network
5. Set up JWT authentication (optional but recommended)
6. Configure STUN/TURN servers for better connectivity

**Deliverables:**
- Working Jitsi server at meet.yourapp.com
- SSL certificate installed
- Admin access configured

---

### Phase 2: Backend API Development (Week 1-2)
**Tasks:**
1. Create VideoConsultation schema
2. Implement consultation start/join/end APIs
3. JWT token generation for Jitsi rooms
4. Notification system integration
5. Update appointment flow for online consultations

**Deliverables:**
- 8 API endpoints
- Consultation tracking in database
- Notification system

---

### Phase 3: Frontend Integration (Week 2-3)
**Tasks:**
1. **Doctor Portal**
   - "Start Video Consultation" button on appointment details
   - Video consultation page with Jitsi embed
   - End consultation flow
   - Redirect to prescription writing

2. **Member Portal**
   - "Join Video Consultation" button/notification
   - Video consultation page
   - Waiting room (if doctor hasn't joined)

3. **UI Enhancements**
   - Connection quality indicator
   - Timer showing consultation duration
   - Chat feature
   - Screen sharing controls
   - Recording indicator (if enabled)

**Deliverables:**
- Complete video consultation UI
- Responsive design
- Mobile support

---

### Phase 4: Testing & Optimization (Week 3-4)
**Tasks:**
1. **Network Testing**
   - Test with slow internet (3G, 4G)
   - Test with multiple participants
   - Test across devices (desktop, mobile, tablet)

2. **Integration Testing**
   - End-to-end consultation flow
   - Notification delivery
   - Prescription linking after consultation

3. **Performance Optimization**
   - Optimize video quality settings
   - Configure bandwidth limits
   - Set up monitoring (Jitsi stats)

**Deliverables:**
- Test reports
- Performance metrics
- User documentation

---

## 2.7 Advanced Features (Optional)

### Recording Consultations
```typescript
// Enable recording in Jitsi config
const jitsiConfig = {
  // ...
  fileRecordingsEnabled: true,
  localRecording: {
    enabled: true,
    format: 'flac'
  },
  // For cloud recording (requires Jibri setup)
  recordingService: {
    enabled: true,
    sharingEnabled: true
  }
}

// Save recording to S3 after consultation
async function saveRecording(consultationId: string, recordingFile: Buffer) {
  const s3Url = await uploadToS3(
    recordingFile,
    `consultations/${consultationId}/recording.mp4`
  )

  await VideoConsultationModel.findOneAndUpdate(
    { consultationId },
    {
      recordingUrl: s3Url,
      recordingSize: recordingFile.length / (1024 * 1024), // MB
      recordingDuration: await getVideoDuration(recordingFile)
    }
  )

  return s3Url
}
```

### Waiting Room
```typescript
// Enable waiting room (patients wait for doctor to admit)
const jitsiConfig = {
  // ...
  enableLobby: true,
  lobbyEnabled: true
}

// Doctor can admit patient from lobby
api.executeCommand('overwriteConfig', { lobbyEnabled: false })
```

### Custom Branding
```typescript
const jitsiInterfaceConfig = {
  // ...
  APP_NAME: 'OPD Wallet Consultation',
  BRAND_WATERMARK_LINK: 'https://yourapp.com',
  DEFAULT_LOGO_URL: 'https://yourapp.com/logo.png',
  DEFAULT_WELCOME_PAGE_LOGO_URL: 'https://yourapp.com/logo-large.png'
}
```

---

# Combined Implementation Timeline

## Overview: 12-14 Weeks

### Month 1: Prescription System Foundation
**Week 1-2:** Data setup + Database design
- Import medicines database (250K+ records)
- Import ICD-10 codes (98K+ codes)
- Create symptoms master (500+ symptoms)
- Set up API integrations (RxNorm, NLM)

**Week 3-4:** Backend API development
- Medicines search API
- Symptoms & diagnosis API
- Prescription CRUD API
- Template management

### Month 2: Prescription UI + Video Setup
**Week 5-6:** Doctor portal prescription UI
- Prescription writing interface
- Medicine autocomplete
- Dosage calculator
- Template management UI

**Week 7:** Video consultation infrastructure
- Set up Jitsi server
- Configure SSL and domain
- Test video calls

**Week 8:** Video consultation backend
- Start/join/end consultation APIs
- JWT token generation
- Notification system

### Month 3: Video UI + Testing
**Week 9-10:** Video consultation UI
- Doctor portal video integration
- Member portal video integration
- UI/UX enhancements

**Week 11:** Member portal integration
- Enhanced health records
- Prescription viewing
- Video consultation joining

**Week 12:** Integration testing
- End-to-end prescription flow
- End-to-end video consultation flow
- Performance testing

**Week 13-14:** Final testing & deployment
- Load testing
- Bug fixes
- Documentation
- Production deployment

---

# Cost Analysis

## One-Time Costs

| Item | Cost (USD) | Notes |
|------|------------|-------|
| Medicines Database License | $500-1000 | DataRequisite (or use free Kaggle) |
| Jitsi Server Setup | $0-500 | DIY = $0, Hire DevOps = $500 |
| SSL Certificate | $0 | Let's Encrypt (free) |
| **Total One-Time** | **$500-1500** | **$0 if using free alternatives** |

## Monthly Recurring Costs

| Item | Cost/Month (USD) | Notes |
|------|------------------|-------|
| Jitsi Server (AWS EC2 t3.medium) | $30-50 | 2 vCPU, 4GB RAM |
| Storage (S3) for PDFs/Recordings | $10-20 | ~100GB |
| Medicines Database Updates | $0-100 | If using paid service |
| Bandwidth | $10-30 | Video streaming |
| **Total Monthly** | **$50-200** | **Scales with usage** |

## Alternative: Daily.co (Managed Video)

| Plan | Cost/Month | Features |
|------|------------|----------|
| Starter | $99 | 10K minutes, 50 rooms |
| Growth | $249 | 100K minutes, 100 rooms |
| Scale | $499 | 500K minutes, 500 rooms |

---

# Security & Compliance

## 1. Data Privacy (HIPAA-like for India)

### Encryption
- **In Transit:** All APIs use HTTPS (TLS 1.3)
- **At Rest:** MongoDB encryption at rest
- **Prescriptions:** AES-256 encryption for sensitive data

### Access Control
```typescript
// Role-based access for prescriptions
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DOCTOR)
async createPrescription(@Request() req, @Body() dto: CreatePrescriptionDto) {
  // Only doctor who created appointment can prescribe
  const appointment = await this.appointmentService.findOne(dto.appointmentId)
  if (appointment.doctorId.toString() !== req.user.userId) {
    throw new ForbiddenException()
  }
  // ...
}
```

### Audit Logging
```typescript
// Log all prescription access
async logPrescriptionAccess(prescriptionId: string, userId: string, action: string) {
  await this.auditLogModel.create({
    entity: 'PRESCRIPTION',
    entityId: prescriptionId,
    userId,
    action, // VIEW, CREATE, UPDATE, DELETE, DOWNLOAD
    timestamp: new Date(),
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  })
}
```

## 2. Video Consultation Security

### Jitsi Security Configuration
```javascript
// /etc/jitsi/meet/meet.yourapp.com-config.js
config.enableSecurityDomains = true;
config.enableUserRolesBasedOnToken = true;
config.enableLobby = true; // Waiting room
config.p2p.enabled = false; // Force through server (more secure)

// Enable end-to-end encryption
config.e2eping = {
  enabled: true
};
```

### JWT Authentication
- All rooms require JWT token
- Tokens expire after 2 hours
- Tokens are user-specific (doctor/patient)
- Room names are unique and unpredictable

### Recording Consent
```typescript
// Get patient consent before recording
async startRecording(consultationId: string) {
  const consultation = await this.consultationModel.findOne({ consultationId })

  // Check if patient consented
  if (!consultation.recordingConsentGiven) {
    throw new Error('Patient has not consented to recording')
  }

  // Start recording
  // ...
}
```

## 3. Prescription Verification

### QR Code with Digital Signature
```typescript
async generatePrescriptionQRCode(prescription: Prescription) {
  // Create verification data
  const verificationData = {
    prescriptionId: prescription.prescriptionId,
    prescriptionNumber: prescription.prescriptionNumber,
    doctorId: prescription.doctorId,
    patientId: prescription.patientId,
    issuedAt: prescription.issuedAt,
    hash: this.hashPrescription(prescription)
  }

  // Encrypt and sign
  const signature = crypto
    .createHmac('sha256', process.env.PRESCRIPTION_SECRET)
    .update(JSON.stringify(verificationData))
    .digest('hex')

  const qrData = {
    ...verificationData,
    signature
  }

  // Generate QR code
  const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(qrData))

  return qrCodeUrl
}

// Public verification endpoint
async verifyPrescription(qrData: string) {
  const data = JSON.parse(qrData)

  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.PRESCRIPTION_SECRET)
    .update(JSON.stringify({ ...data, signature: undefined }))
    .digest('hex')

  if (data.signature !== expectedSignature) {
    return { valid: false, reason: 'Invalid signature' }
  }

  // Verify prescription exists
  const prescription = await this.prescriptionModel.findOne({
    prescriptionId: data.prescriptionId
  })

  if (!prescription) {
    return { valid: false, reason: 'Prescription not found' }
  }

  // Verify hash
  if (this.hashPrescription(prescription) !== data.hash) {
    return { valid: false, reason: 'Prescription has been tampered' }
  }

  return {
    valid: true,
    prescription: {
      prescriptionNumber: prescription.prescriptionNumber,
      doctorName: prescription.doctorName,
      patientName: prescription.patientName,
      issuedAt: prescription.issuedAt,
      medicines: prescription.medicines
    }
  }
}
```

---

# Success Metrics

## Prescription System
- **Adoption:** 80%+ of doctors use digital prescription within 3 months
- **Speed:** Average time to create prescription: < 3 minutes
- **Accuracy:** < 1% error rate in medicine selection
- **Template Usage:** 50%+ prescriptions use templates
- **Patient Satisfaction:** 4.5+ rating for prescription clarity

## Video Consultation
- **Adoption:** 60%+ of online appointments use video
- **Quality:** < 5% calls with quality issues
- **Completion Rate:** 90%+ consultations complete successfully
- **Average Duration:** 15-20 minutes per consultation
- **Patient Satisfaction:** 4.5+ rating for video experience

---

# Risk Mitigation

## Technical Risks

| Risk | Mitigation |
|------|------------|
| Jitsi server downtime | Set up load balancer with backup server |
| Medicine database outdated | Weekly automated sync + manual review |
| PDF generation slow | Use queue system (Bull/Redis) |
| Video quality poor | Adaptive bitrate + bandwidth detection |
| Storage costs high | Compress PDFs, delete old recordings |

## Legal Risks

| Risk | Mitigation |
|------|------------|
| Prescription legality | Consult legal expert, add e-signature |
| Data privacy violation | Follow IT Act 2000, encrypt all data |
| Video recording consent | Get explicit consent before recording |
| Cross-border compliance | Block international users if needed |

---

# Conclusion

This comprehensive plan provides a complete roadmap for implementing both digital prescription writing and video consultation features. The key highlights:

**Prescription System:**
- ✅ Free/low-cost APIs (RxNorm, NLM ICD-10)
- ✅ Comprehensive medicine database (250K+ medicines)
- ✅ Smart autocomplete and templates
- ✅ PDF generation with QR code verification
- ✅ 8-10 weeks implementation

**Video Consultation:**
- ✅ Self-hosted Jitsi (cost-effective, HIPAA-ready)
- ✅ Official React SDK integration
- ✅ JWT authentication
- ✅ Recording capability (optional)
- ✅ 3-4 weeks implementation

**Total Investment:**
- Development Time: 12-14 weeks
- One-time Cost: $0-1500 (can be $0 with free alternatives)
- Monthly Cost: $50-200 (scales with usage)

**Next Steps:**
1. Approve the plan
2. Prioritize Phase 1 (Prescription) vs Phase 2 (Video) or parallel development
3. Allocate development resources
4. Set up infrastructure (Jitsi server, databases)
5. Begin implementation

Would you like me to start implementing any specific phase, or would you like to discuss modifications to this plan?
