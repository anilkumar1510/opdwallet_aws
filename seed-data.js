/**
 * OPD Wallet Seed Data
 *
 * This file contains all essential seed data for setting up the OPD Wallet application.
 *
 * Usage:
 * 1. Start MongoDB: brew services start mongodb-community
 * 2. Run this script: mongosh opd_wallet seed-data.js
 *
 * Default Login Credentials:
 * - Admin Portal: admin@opdwallet.com / Password123!
 * - Member Portal: all@gmail.com / Password123!
 * - Doctor Portal: anil@doctor.com / Password123!
 * - TPA Portal: tpa@gmail.com / Password123!
 * - Operations Portal: opsadmin@gmail.com / Password123!
 */

// ============================================================================
// CATEGORY MASTER
// ============================================================================
const categoryMaster = [
  { categoryId: "CAT005", code: "ONLINE_CONSULT", name: "Online Consultation", isActive: true, displayOrder: 0, description: "Virtual consultations with doctors via video call or chat", isAvailableOnline: true, isPredefined: true },
  { categoryId: "CAT001", code: "CLINIC_CONSULT", name: "In-Clinic Consultation", isActive: true, displayOrder: 1, description: "Face-to-face consultations with doctors at clinic or hospital", isAvailableOnline: true, isPredefined: true },
  { categoryId: "CAT002", code: "PHARMACY", name: "Pharmacy", isActive: true, displayOrder: 2, description: "Purchase of prescribed medicines and pharmaceutical products", isAvailableOnline: true, isPredefined: true },
  { categoryId: "CAT003", code: "DIAGNOSTIC", name: "Diagnostic Services", isActive: true, displayOrder: 3, description: "Diagnostic imaging services including X-ray, MRI, CT scan, and ultrasound", isAvailableOnline: true, isPredefined: true },
  { categoryId: "CAT004", code: "LABORATORY", name: "Laboratory Services", isActive: true, displayOrder: 4, description: "Clinical laboratory tests including blood tests, urine tests, and pathology", isAvailableOnline: true, isPredefined: true },
  { categoryId: "CAT006", code: "DENTAL", name: "Dental Services", isActive: true, displayOrder: 6, description: "Dental care including checkups, cleaning, fillings, and oral treatments", isAvailableOnline: true, isPredefined: true },
  { categoryId: "CAT007", code: "VISION", name: "Vision Care", isActive: true, displayOrder: 7, description: "Eye care services including eye exams, glasses, and contact lenses", isAvailableOnline: true, isPredefined: true },
  { categoryId: "CAT008", code: "WELLNESS", name: "Wellness Programs", isActive: true, displayOrder: 8, description: "Preventive health services including annual health checks, vaccinations, and wellness programs", isAvailableOnline: true, isPredefined: true }
];

// ============================================================================
// SPECIALTY MASTER
// ============================================================================
const specialtyMaster = [
  { specialtyId: "SPEC001", code: "GENERAL_PHYSICIAN", name: "General Physician", description: "General medical consultation", icon: "stethoscope", isActive: true, displayOrder: 1 },
  { specialtyId: "SPEC002", code: "GYNECOLOGIST", name: "Gynaecologist", description: "Women's health", icon: "female-doctor", isActive: true, displayOrder: 2 },
  { specialtyId: "SPEC003", code: "PSYCHOLOGIST", name: "Psychologist", description: "Mental health", icon: "brain", isActive: true, displayOrder: 3 },
  { specialtyId: "SPEC004", code: "DERMATOLOGIST", name: "Dermatologist", description: "Skin care", icon: "skin", isActive: true, displayOrder: 4 },
  { specialtyId: "SPEC005", code: "NUTRITIONIST", name: "Nutritionist", description: "Diet consultation", icon: "apple", isActive: true, displayOrder: 5 },
  { specialtyId: "SPEC006", code: "CARDIOLOGIST", name: "Cardiologist", description: "Heart specialist", icon: "heart", isActive: true, displayOrder: 6 },
  { specialtyId: "SPEC007", code: "PEDIATRICIAN", name: "Pediatrician", description: "Child specialist", icon: "child", isActive: true, displayOrder: 7 },
  { specialtyId: "SPEC008", code: "ORTHOPEDIC", name: "Orthopedic", description: "Bone and joint", icon: "bone", isActive: true, displayOrder: 8 },
  { specialtyId: "SPEC009", code: "DENTIST", name: "Dentist", description: "Dental care", icon: "tooth", isActive: true, displayOrder: 9 }
];

// ============================================================================
// RELATIONSHIP MASTERS
// ============================================================================
const relationshipMasters = [
  { relationshipCode: "REL001", relationshipName: "Self", displayName: "Self", description: "Primary member", isActive: true },
  { relationshipCode: "REL002", relationshipName: "Spouse", displayName: "Spouse", description: "Spouse of primary member", isActive: true },
  { relationshipCode: "REL003", relationshipName: "Child", displayName: "Child", description: "Child of primary member", isActive: true },
  { relationshipCode: "REL004", relationshipName: "Father", displayName: "Father", description: "Father of primary member", isActive: true },
  { relationshipCode: "REL005", relationshipName: "Mother", displayName: "Mother", description: "Mother of primary member", isActive: true }
];

// ============================================================================
// SERVICE MASTERS
// ============================================================================
const serviceMasters = [
  { serviceId: "SRV-DEN-001", code: "DEN001", name: "Dental Consultation", description: "General dental consultation and checkup", categoryId: "CAT006", isActive: true },
  { serviceId: "SRV-DEN-002", code: "DEN002", name: "Teeth Cleaning", description: "Professional teeth cleaning and scaling", categoryId: "CAT006", isActive: true },
  { serviceId: "SRV-DEN-003", code: "DEN003", name: "Tooth Extraction", description: "Simple tooth extraction procedure", categoryId: "CAT006", isActive: true },
  { serviceId: "SRV-DEN-004", code: "DEN004", name: "Root Canal Treatment", description: "Root canal therapy", categoryId: "CAT006", isActive: true },
  { serviceId: "SRV-DEN-005", code: "DEN005", name: "Dental Filling", description: "Cavity filling treatment", categoryId: "CAT006", isActive: true }
];

// ============================================================================
// CUG MASTER (Corporate User Groups)
// ============================================================================
const cugMaster = [
  { cugId: "CUG001", shortCode: "FLIP", companyName: "Flipkart", employeeCount: "1000-5000", isActive: true, displayOrder: 0 },
  { cugId: "CUG002", shortCode: "MSFT", companyName: "Microsoft", employeeCount: "501-1000", isActive: true, displayOrder: 1 },
  { cugId: "CUG003", shortCode: "AMZN", companyName: "Amazon", employeeCount: "1001-5000", isActive: true, displayOrder: 2 },
  { cugId: "CUG004", shortCode: "META", companyName: "Meta", employeeCount: "501-1000", isActive: true, displayOrder: 3 },
  { cugId: "CUG005", shortCode: "AAPL", companyName: "Apple", employeeCount: "1001-5000", isActive: true, displayOrder: 4 },
  { cugId: "CUG006", shortCode: "NFLX", companyName: "Netflix", employeeCount: "0-500", isActive: true, displayOrder: 5 }
];

// ============================================================================
// INTERNAL USERS (Admin, TPA, Operations, Finance)
// Password for all: Password123! (bcrypt hash below)
// ============================================================================
const passwordHash = "$2b$12$OMlbfZDYX23sqtwrKnkZVOcVN04k1MQ9t6OXo.oZeR/.vz50xMbKG";

const internalUsers = [
  {
    userId: "USR-2025-0001",
    employeeId: "EMP001",
    name: { firstName: "Super", lastName: "Admin", fullName: "Super Admin" },
    email: "admin@opdwallet.com",
    phone: { countryCode: "+91", number: "+919999999999" },
    role: "SUPER_ADMIN",
    status: "ACTIVE",
    passwordHash: passwordHash,
    mustChangePassword: false,
    userType: "internal"
  },
  {
    userId: "USR-2026-0025",
    employeeId: "EMP900",
    name: { firstName: "OPS", lastName: "ADMIN", fullName: "OPS ADMIN" },
    email: "opsadmin@gmail.com",
    phone: { countryCode: "+91", number: "8209344066" },
    role: "OPS_ADMIN",
    status: "ACTIVE",
    passwordHash: passwordHash,
    mustChangePassword: false,
    department: "Ops",
    designation: "MANAGER",
    userType: "internal"
  },
  {
    userId: "USR-2026-0021",
    employeeId: "EMP00978",
    name: { firstName: "TPA", lastName: "FINAL", fullName: "TPA FINAL" },
    email: "tpa@gmail.com",
    phone: { countryCode: "+91", number: "776768786868" },
    role: "TPA_ADMIN",
    status: "ACTIVE",
    passwordHash: passwordHash,
    mustChangePassword: false,
    department: "TPA",
    designation: "Manager",
    userType: "internal"
  }
];

// ============================================================================
// CLINICS
// ============================================================================
const clinics = [
  {
    clinicId: "CLN00007",
    name: "Noida Final",
    address: { line1: "Noida", city: "Noida", state: "UP", pincode: "201307", country: "India" },
    contactNumber: "9571066635",
    email: "noidac@gmail.com",
    operatingHours: {
      monday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
      tuesday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
      wednesday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
      thursday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
      friday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
      saturday: { isOpen: true, openTime: "09:00", closeTime: "14:00" },
      sunday: { isOpen: false, openTime: "09:00", closeTime: "14:00" }
    },
    facilities: [],
    isActive: true,
    hasDentalServices: true
  },
  {
    clinicId: "CLN00006",
    name: "Noida clinic 2",
    address: { line1: "sectir25", city: "Noida", state: "UP", pincode: "201301", country: "India" },
    contactNumber: "34456778",
    email: "noids@gmail.com",
    operatingHours: {
      monday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
      tuesday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
      wednesday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
      thursday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
      friday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
      saturday: { isOpen: true, openTime: "09:00", closeTime: "14:00" },
      sunday: { isOpen: false, openTime: "09:00", closeTime: "14:00" }
    },
    facilities: [],
    isActive: true,
    hasDentalServices: true
  },
  {
    clinicId: "CLN00005",
    name: "Noida Clinic",
    address: { line1: "Sector 24", city: "Noida", state: "UP", pincode: "201301", country: "India" },
    contactNumber: "1234567890",
    email: "Noida@gmail.com",
    operatingHours: {
      monday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
      tuesday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
      wednesday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
      thursday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
      friday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
      saturday: { isOpen: true, openTime: "09:00", closeTime: "14:00" },
      sunday: { isOpen: false, openTime: "09:00", closeTime: "14:00" }
    },
    facilities: [],
    isActive: true,
    hasDentalServices: true
  }
];

// ============================================================================
// DOCTORS
// Password: Password123!
// ============================================================================
const doctorPasswordHash = "$2b$10$/n/Zgzallpin9AmAZfwIL.Hx1BnbWWUBceR0pWRDzTRjzWbWRP.Zu";

const doctors = [
  {
    doctorId: "DOC10002",
    name: "Anil",
    qualifications: "MBBS",
    specializations: ["General Physician"],
    specialtyId: "SPEC001",
    specialty: "General Physician",
    experienceYears: 5,
    rating: 0,
    reviewCount: 0,
    phone: "56565656545",
    email: "anil@doctor.com",
    role: "DOCTOR",
    languages: [],
    isActive: true,
    clinics: [{ clinicId: "CLN00006", name: "Noida clinic 2", address: "sectir25", city: "Noida", state: "UP", pincode: "201301", consultationFee: 1000 }],
    consultationFee: 1000,
    availableOnline: true,
    availableOffline: true,
    password: doctorPasswordHash,
    hasValidSignature: false
  },
  {
    doctorId: "DOC10003",
    name: "Jammy",
    qualifications: "MBBS",
    specializations: ["General Physician"],
    specialtyId: "SPEC001",
    specialty: "General Physician",
    experienceYears: 25,
    rating: 0,
    reviewCount: 0,
    email: "jam@gmail.com",
    role: "DOCTOR",
    languages: [],
    isActive: true,
    clinics: [{ clinicId: "CLN00007", name: "Noida Final", address: "Noida", city: "Noida", state: "UP", pincode: "201307", consultationFee: 1400 }],
    consultationFee: 1400,
    availableOnline: true,
    availableOffline: true,
    password: doctorPasswordHash,
    hasValidSignature: false
  },
  {
    doctorId: "DOC10004",
    name: "Doctor",
    qualifications: "MBBS,MD",
    specializations: ["General Physician"],
    specialtyId: "SPEC001",
    specialty: "General Physician",
    experienceYears: 8,
    rating: 0,
    reviewCount: 0,
    phone: "7890",
    email: "doctor@gmail.com",
    role: "DOCTOR",
    languages: [],
    isActive: true,
    clinics: [{ clinicId: "CLN00007", name: "Noida Final", address: "Noida", city: "Noida", state: "UP", pincode: "201307", consultationFee: 1000 }],
    consultationFee: 1000,
    availableOnline: true,
    availableOffline: true,
    password: doctorPasswordHash,
    hasValidSignature: false
  }
];

// ============================================================================
// USERS (Members)
// Password: Password123!
// ============================================================================
const memberPasswordHash = "$2b$10$Hsm6Z6g3XseVqapFLLU38.4S0Hotc37ujB7jUh8x7FEWy48Rh48tW";

const users = [
  {
    userId: "USR-2026-0022",
    uhid: "UHID567",
    memberId: "MEM567",
    employeeId: "EMP567",
    name: { firstName: "All", lastName: "All", fullName: "All All" },
    email: "all@gmail.com",
    phone: "8209144066",
    dob: new Date("2000-01-30"),
    gender: "MALE",
    bloodGroup: "B+",
    cugId: "CUG001",
    role: "MEMBER",
    status: "ACTIVE",
    passwordHash: memberPasswordHash,
    mustChangePassword: false,
    relationship: "REL001",
    isActive: true
  },
  {
    userId: "USR-2026-0024",
    uhid: "UHID690",
    memberId: "MEM690",
    employeeId: "EMP568",
    name: { firstName: "All", lastName: "Spouse", fullName: "All Spouse" },
    email: "alls@gmail.com",
    phone: "8209244066",
    dob: new Date("2000-01-31"),
    gender: "FEMALE",
    bloodGroup: "A+",
    cugId: "CUG001",
    role: "MEMBER",
    status: "ACTIVE",
    passwordHash: memberPasswordHash,
    mustChangePassword: false,
    primaryMemberId: "MEM567",
    relationship: "REL002"
  }
];

// ============================================================================
// POLICIES
// ============================================================================
const policies = [
  {
    policyNumber: "POL-2026-0003",
    name: "All Policy",
    description: "Comprehensive OPD policy with all benefits",
    ownerPayer: "INSURER",
    status: "ACTIVE",
    effectiveFrom: new Date("2026-01-28"),
    effectiveTo: new Date("2026-04-27")
  }
];

// ============================================================================
// LAB SERVICES
// ============================================================================
const labServices = [
  { serviceId: "LAB-001", code: "CBC", name: "Complete Blood Count (CBC)", category: "PATHOLOGY", sampleType: "Blood", preparationInstructions: "No special preparation required", isActive: true, displayOrder: 1 },
  { serviceId: "LAB-002", code: "FBS", name: "Fasting Blood Sugar", category: "PATHOLOGY", sampleType: "Blood", preparationInstructions: "8-10 hours fasting required", isActive: true, displayOrder: 2 },
  { serviceId: "LAB-003", code: "PPBS", name: "Post Prandial Blood Sugar", category: "PATHOLOGY", sampleType: "Blood", preparationInstructions: "Take test 2 hours after meal", isActive: true, displayOrder: 3 },
  { serviceId: "LAB-004", code: "HBA1C", name: "HbA1c (Glycated Hemoglobin)", category: "PATHOLOGY", sampleType: "Blood", preparationInstructions: "No fasting required", isActive: true, displayOrder: 4 },
  { serviceId: "LAB-005", code: "LIPID", name: "Lipid Profile", category: "PATHOLOGY", sampleType: "Blood", preparationInstructions: "12-14 hours fasting required", isActive: true, displayOrder: 5 },
  { serviceId: "LAB-006", code: "LFT", name: "Liver Function Test (LFT)", category: "PATHOLOGY", sampleType: "Blood", preparationInstructions: "8-10 hours fasting recommended", isActive: true, displayOrder: 6 },
  { serviceId: "LAB-007", code: "KFT", name: "Kidney Function Test (KFT)", category: "PATHOLOGY", sampleType: "Blood", preparationInstructions: "No special preparation required", isActive: true, displayOrder: 7 },
  { serviceId: "LAB-008", code: "TFT", name: "Thyroid Function Test (TFT)", category: "PATHOLOGY", sampleType: "Blood", preparationInstructions: "No special preparation required", isActive: true, displayOrder: 8 },
  { serviceId: "LAB-009", code: "VITD", name: "Vitamin D (25-OH)", category: "PATHOLOGY", sampleType: "Blood", preparationInstructions: "No special preparation required", isActive: true, displayOrder: 9 },
  { serviceId: "LAB-010", code: "VITB12", name: "Vitamin B12", category: "PATHOLOGY", sampleType: "Blood", preparationInstructions: "No special preparation required", isActive: true, displayOrder: 10 },
  { serviceId: "LAB-011", code: "ECG", name: "ECG (Electrocardiogram)", category: "CARDIOLOGY", sampleType: "Cardiac", preparationInstructions: "Wear loose comfortable clothing", isActive: true, displayOrder: 11 },
  { serviceId: "LAB-012", code: "ECHO", name: "2D Echo (Echocardiography)", category: "CARDIOLOGY", sampleType: "Cardiac", preparationInstructions: "No special preparation required", isActive: true, displayOrder: 12 },
  { serviceId: "SVC-CORTISOL", code: "CORTISOL", name: "Cortisol", category: "PATHOLOGY", sampleType: "Blood", preparationInstructions: "No special preparation required", isActive: true, displayOrder: 13 },
  { serviceId: "SVC-XRAY", code: "X-RAY", name: "X-Ray", category: "RADIOLOGY", sampleType: "Imaging", preparationInstructions: "Remove metallic objects", isActive: true, displayOrder: 14 },
  { serviceId: "SVC-ULTRASOUND", code: "ULTRASOUND", name: "Ultrasound", category: "RADIOLOGY", sampleType: "Imaging", preparationInstructions: "May require full bladder depending on area", isActive: true, displayOrder: 15 },
  { serviceId: "SVC-CTSCAN", code: "CT-SCAN", name: "CT Scan", category: "RADIOLOGY", sampleType: "Imaging", preparationInstructions: "Fasting may be required, remove metallic objects", isActive: true, displayOrder: 16 },
  { serviceId: "SVC-MRI", code: "MRI", name: "MRI Scan", category: "RADIOLOGY", sampleType: "Imaging", preparationInstructions: "Remove all metallic objects, inform about implants", isActive: true, displayOrder: 17 }
];

// ============================================================================
// LAB VENDORS
// ============================================================================
const labVendors = [
  {
    vendorId: "VENDOR-002",
    name: "Dr. Lal PathLabs",
    code: "DRLAL",
    contactInfo: { phone: "+91-9876543211", email: "support@lalpathlabs.com", address: "Ground Floor, Health Plaza, Mumbai, Maharashtra" },
    serviceablePincodes: ["400001", "400002", "400003", "400006", "400007", "110018", "201307"],
    homeCollection: true,
    centerVisit: true,
    homeCollectionCharges: 75,
    description: "National chain with advanced testing facilities",
    isActive: true,
    offersLabServices: true,
    services: ["LAB-012", "SVC-CTSCAN", "LAB-002", "LAB-011", "SVC-CORTISOL", "LAB-001"]
  },
  {
    vendorId: "VENDOR-004",
    name: "Metropolis Healthcare",
    code: "METROPOLIS",
    contactInfo: { phone: "+91-9876543213", email: "info@metropolisindia.com", address: "1st Floor, Diagnostic Center, Mumbai, Maharashtra" },
    serviceablePincodes: ["400001", "400003", "400005", "400007", "400009", "201307"],
    homeCollection: true,
    centerVisit: true,
    homeCollectionCharges: 60,
    description: "Fully automated lab with quick turnaround time",
    isActive: true,
    offersLabServices: true,
    services: ["LAB-012", "SVC-CTSCAN", "LAB-001"]
  }
];

// ============================================================================
// DIAGNOSTIC VENDORS
// ============================================================================
const diagnosticVendors = [
  {
    vendorId: "DIAG-VEN-001",
    name: "HCL Diagnostics",
    code: "HCL",
    contactInfo: { phone: "56768899", email: "hcl@gmail.com", address: "HCL, 201307" },
    serviceablePincodes: ["201307"],
    services: ["DIAG-SVC-001"],
    homeCollection: true,
    centerVisit: true,
    homeCollectionCharges: 50,
    isActive: true
  }
];

// ============================================================================
// DIAGNOSTIC SERVICES
// ============================================================================
const diagnosticServices = [
  {
    serviceId: "DIAG-SVC-001",
    code: "CT SCAN",
    name: "CT Scan",
    category: "RADIOLOGY",
    bodyPart: "Chest",
    requiresContrast: false,
    isActive: true,
    displayOrder: 0
  }
];

// ============================================================================
// COUNTERS
// ============================================================================
const counters = [
  { _id: "user", seq: 30 },
  { _id: "policy", seq: 6 },
  { _id: "doctor", seq: 6 },
  { _id: "clinic", seq: 8 },
  { _id: "transaction", seq: 1 },
  { _id: "doctor-slot", seq: 31 },
  { _id: "payment", seq: 1 },
  { _id: "appointment", seq: 1 },
  { _id: "doctor-clinic-assignment", seq: 15 },
  { _id: "consultation-note", seq: 1 }
];

// ============================================================================
// DOCTOR SLOTS
// ============================================================================
const doctorSlots = [
  { slotId: "SLOT000001", doctorId: "DOC10002", clinicId: "CLN00006", dayOfWeek: "MONDAY", startTime: "09:00", endTime: "17:00", slotDuration: 30, consultationFee: 500, consultationType: "IN_CLINIC", isActive: true, blockedDates: [], maxAppointments: 20 },
  { slotId: "SLOT000002", doctorId: "DOC10002", clinicId: "CLN00007", dayOfWeek: "MONDAY", startTime: "09:00", endTime: "17:00", slotDuration: 30, consultationFee: 500, consultationType: "IN_CLINIC", isActive: true, blockedDates: [], maxAppointments: 20 },
  { slotId: "SLOT000003", doctorId: "DOC10002", clinicId: "CLN00007", dayOfWeek: "TUESDAY", startTime: "09:00", endTime: "17:00", slotDuration: 30, consultationFee: 500, consultationType: "IN_CLINIC", isActive: true, blockedDates: [], maxAppointments: 20 },
  { slotId: "SLOT000004", doctorId: "DOC10002", clinicId: "CLN00007", dayOfWeek: "WEDNESDAY", startTime: "09:00", endTime: "17:00", slotDuration: 30, consultationFee: 500, consultationType: "IN_CLINIC", isActive: true, blockedDates: [], maxAppointments: 20 },
  { slotId: "SLOT000005", doctorId: "DOC10002", clinicId: "CLN00007", dayOfWeek: "THURSDAY", startTime: "09:00", endTime: "17:00", slotDuration: 30, consultationFee: 500, consultationType: "IN_CLINIC", isActive: true, blockedDates: [], maxAppointments: 20 },
  { slotId: "SLOT000006", doctorId: "DOC10002", clinicId: "CLN00007", dayOfWeek: "FRIDAY", startTime: "09:00", endTime: "17:00", slotDuration: 30, consultationFee: 500, consultationType: "IN_CLINIC", isActive: true, blockedDates: [], maxAppointments: 20 },
  { slotId: "SLOT000007", doctorId: "DOC10002", clinicId: "CLN00007", dayOfWeek: "SATURDAY", startTime: "09:00", endTime: "17:00", slotDuration: 30, consultationFee: 500, consultationType: "IN_CLINIC", isActive: true, blockedDates: [], maxAppointments: 20 },
  { slotId: "SLOT000008", doctorId: "DOC10003", clinicId: "CLN00007", dayOfWeek: "MONDAY", startTime: "09:00", endTime: "17:00", slotDuration: 30, consultationFee: 800, consultationType: "ONLINE", isActive: true, blockedDates: [], maxAppointments: 2 },
  { slotId: "SLOT000009", doctorId: "DOC10003", clinicId: "CLN00007", dayOfWeek: "TUESDAY", startTime: "09:00", endTime: "17:00", slotDuration: 30, consultationFee: 1400, consultationType: "IN_CLINIC", isActive: true, blockedDates: [], maxAppointments: 2 },
  { slotId: "SLOT000010", doctorId: "DOC10004", clinicId: "CLN00007", dayOfWeek: "MONDAY", startTime: "09:00", endTime: "17:00", slotDuration: 30, consultationFee: 800, consultationType: "ONLINE", isActive: true, blockedDates: [], maxAppointments: 1 },
  { slotId: "SLOT000011", doctorId: "DOC10004", clinicId: "CLN00007", dayOfWeek: "TUESDAY", startTime: "09:00", endTime: "17:00", slotDuration: 30, consultationFee: 900, consultationType: "IN_CLINIC", isActive: true, blockedDates: [], maxAppointments: 1 }
];

// ============================================================================
// DOCTOR CLINIC ASSIGNMENTS
// ============================================================================
const doctorClinicAssignments = [
  { assignmentId: "ASSIGN000001", doctorId: "DOC10002", clinicId: "CLN00007", isActive: true },
  { assignmentId: "ASSIGN000002", doctorId: "DOC10002", clinicId: "CLN00006", isActive: true },
  { assignmentId: "ASSIGN000003", doctorId: "DOC10002", clinicId: "CLN00005", isActive: true },
  { assignmentId: "ASSIGN000004", doctorId: "DOC10003", clinicId: "CLN00007", isActive: true },
  { assignmentId: "ASSIGN000005", doctorId: "DOC10004", clinicId: "CLN00007", isActive: true }
];

// ============================================================================
// CLINIC SERVICE PRICING (Dental & Vision)
// ============================================================================
const clinicServicePricing = [
  { serviceCode: "DENTAL_SERVICES_ENABLED", clinicId: "CLN00007", category: "CAT006", isEnabled: true },
  { serviceCode: "DENTAL_CHECKUP", clinicId: "CLN00007", category: "CAT006", isEnabled: true, price: 1000 },
  { serviceCode: "DENTAL_FILLING", clinicId: "CLN00007", category: "CAT006", isEnabled: true, price: 1000 },
  { serviceCode: "ROOT_CANAL", clinicId: "CLN00007", category: "CAT006", isEnabled: true, price: 1000 },
  { serviceCode: "TOOTH_EXTRACTION", clinicId: "CLN00007", category: "CAT006", isEnabled: true, price: 1000 },
  { serviceCode: "DENTAL_XRAY", clinicId: "CLN00007", category: "CAT006", isEnabled: true, price: 1000 },
  { serviceCode: "TEETH_WHITENING", clinicId: "CLN00007", category: "CAT006", isEnabled: true, price: 1000 },
  { serviceCode: "VISION_SERVICES_ENABLED", clinicId: "CLN00007", category: "CAT007", isEnabled: true },
  { serviceCode: "EYE_EXAM", clinicId: "CLN00007", category: "CAT007", isEnabled: true },
  { serviceCode: "REFRACTION_TEST", clinicId: "CLN00007", category: "CAT007", isEnabled: true },
  { serviceCode: "CONTACT_LENS_FITTING", clinicId: "CLN00007", category: "CAT007", isEnabled: true },
  { serviceCode: "GLAUCOMA_SCREENING", clinicId: "CLN00007", category: "CAT007", isEnabled: true },
  { serviceCode: "RETINAL_EXAM", clinicId: "CLN00007", category: "CAT007", isEnabled: true },
  { serviceCode: "EYEGLASSES", clinicId: "CLN00007", category: "CAT007", isEnabled: true }
];

// ============================================================================
// AHC PACKAGES (Annual Health Check)
// ============================================================================
const ahcPackages = [
  {
    packageId: "AHC-PKG-001",
    name: "Executive Health Check",
    effectiveFrom: new Date("2026-01-01"),
    effectiveTo: new Date("2026-12-31"),
    labServiceIds: ["LAB-001"],
    diagnosticServiceIds: ["DIAG-SVC-001"],
    isActive: true
  }
];

// ============================================================================
// CATEGORY-SPECIALTY MAPPING
// ============================================================================
const categorySpecialtyMapping = [
  { categoryId: "CAT001", specialtyCode: "SPEC001", isEnabled: true },
  { categoryId: "CAT001", specialtyCode: "SPEC002", isEnabled: true },
  { categoryId: "CAT001", specialtyCode: "SPEC003", isEnabled: true },
  { categoryId: "CAT001", specialtyCode: "SPEC004", isEnabled: true },
  { categoryId: "CAT005", specialtyCode: "SPEC001", isEnabled: true },
  { categoryId: "CAT005", specialtyCode: "SPEC002", isEnabled: true }
];

// ============================================================================
// PLAN CONFIGS
// ============================================================================
// Note: This requires policyId from the policies collection
// The plan config will be inserted after policy is created

// ============================================================================
// SEED FUNCTION
// ============================================================================
print("Starting OPD Wallet seed...");

// Clear existing data
db.category_master.deleteMany({});
db.specialty_master.deleteMany({});
db.relationship_masters.deleteMany({});
db.service_masters.deleteMany({});
db.cug_master.deleteMany({});
db.internal_users.deleteMany({});
db.clinics.deleteMany({});
db.doctors.deleteMany({});
db.users.deleteMany({});
db.policies.deleteMany({});
db.lab_services.deleteMany({});
db.lab_vendors.deleteMany({});
db.diagnostic_vendors.deleteMany({});
db.diagnostic_services.deleteMany({});
db.counters.deleteMany({});
db.doctor_slots.deleteMany({});
db.doctorClinicAssignments.deleteMany({});
db.clinic_service_pricing.deleteMany({});
db.ahc_packages.deleteMany({});

// Insert seed data
db.category_master.insertMany(categoryMaster);
print("✓ Inserted category_master");

db.specialty_master.insertMany(specialtyMaster);
print("✓ Inserted specialty_master");

db.relationship_masters.insertMany(relationshipMasters);
print("✓ Inserted relationship_masters");

db.service_masters.insertMany(serviceMasters);
print("✓ Inserted service_masters");

db.cug_master.insertMany(cugMaster);
print("✓ Inserted cug_master");

db.internal_users.insertMany(internalUsers);
print("✓ Inserted internal_users");

db.clinics.insertMany(clinics);
print("✓ Inserted clinics");

db.doctors.insertMany(doctors);
print("✓ Inserted doctors");

db.users.insertMany(users);
print("✓ Inserted users");

db.policies.insertMany(policies);
print("✓ Inserted policies");

db.lab_services.insertMany(labServices);
print("✓ Inserted lab_services");

db.lab_vendors.insertMany(labVendors);
print("✓ Inserted lab_vendors");

db.diagnostic_vendors.insertMany(diagnosticVendors);
print("✓ Inserted diagnostic_vendors");

db.diagnostic_services.insertMany(diagnosticServices);
print("✓ Inserted diagnostic_services");

db.counters.insertMany(counters);
print("✓ Inserted counters");

db.doctor_slots.insertMany(doctorSlots);
print("✓ Inserted doctor_slots");

db.doctorClinicAssignments.insertMany(doctorClinicAssignments);
print("✓ Inserted doctorClinicAssignments");

db.clinic_service_pricing.insertMany(clinicServicePricing);
print("✓ Inserted clinic_service_pricing");

db.ahc_packages.insertMany(ahcPackages);
print("✓ Inserted ahc_packages");

db.category_specialty_mapping.deleteMany({});
db.category_specialty_mapping.insertMany(categorySpecialtyMapping);
print("✓ Inserted category_specialty_mapping");

// Get the inserted policy to create plan_config and user policy assignment
const insertedPolicy = db.policies.findOne({ policyNumber: "POL-2026-0003" });
const insertedUser = db.users.findOne({ email: "all@gmail.com" });
const insertedSpouse = db.users.findOne({ email: "alls@gmail.com" });
const insertedAdmin = db.internal_users.findOne({ email: "admin@opdwallet.com" });

if (insertedPolicy && insertedAdmin) {
  // Create plan config
  const planConfig = {
    policyId: insertedPolicy._id,
    version: 1,
    status: "PUBLISHED",
    isCurrent: true,
    benefits: {
      CAT005: {
        enabled: true,
        annualLimit: 5000,
        claimEnabled: true,
        perClaimLimit: 500,
        allowedSpecialties: ["SPEC001", "SPEC002"],
        serviceTransactionLimits: { "SPEC001": 400, "SPEC002": 400 }
      },
      CAT001: {
        enabled: true,
        claimEnabled: true,
        annualLimit: 5000,
        perClaimLimit: 500,
        allowedSpecialties: ["SPEC001", "SPEC002", "SPEC003", "SPEC004"],
        serviceTransactionLimits: { "SPEC001": 400, "SPEC002": 400, "SPEC003": 400, "SPEC004": 400 }
      },
      CAT002: {
        enabled: true,
        annualLimit: 5000,
        claimEnabled: true,
        perClaimLimit: 500
      },
      CAT003: {
        enabled: true,
        annualLimit: 5000,
        claimEnabled: true,
        perClaimLimit: 500,
        allowedLabServiceCategories: ["RADIOLOGY", "ENDOSCOPY"],
        serviceTransactionLimits: { "RADIOLOGY": 500, "ENDOSCOPY": 500 }
      },
      CAT004: {
        enabled: true,
        annualLimit: 5000,
        claimEnabled: true,
        perClaimLimit: 500,
        allowedLabServiceCategories: ["PATHOLOGY", "CARDIOLOGY", "OTHER"],
        serviceTransactionLimits: { "PATHOLOGY": 600, "CARDIOLOGY": 600, "OTHER": 600 }
      },
      CAT006: {
        enabled: true,
        annualLimit: 5000,
        claimEnabled: true,
        perClaimLimit: 500,
        allowedServiceCodes: ["DENTAL_CHECKUP", "DENTAL_FILLING", "DENTAL_XRAY", "ROOT_CANAL", "TEETH_WHITENING", "TOOTH_EXTRACTION"],
        serviceTransactionLimits: { "DENTAL_CHECKUP": 300, "DENTAL_FILLING": 300, "DENTAL_XRAY": 300, "ROOT_CANAL": 300, "TEETH_WHITENING": 300, "TOOTH_EXTRACTION": 300 }
      },
      CAT007: {
        enabled: true,
        annualLimit: 5000,
        claimEnabled: true,
        perClaimLimit: 500,
        allowedServiceCodes: ["CONTACT_LENS_FITTING", "EYEGLASSES", "EYE_EXAM", "GLAUCOMA_SCREENING", "REFRACTION_TEST", "RETINAL_EXAM"],
        serviceTransactionLimits: { "CONTACT_LENS_FITTING": 400, "EYEGLASSES": 400, "EYE_EXAM": 400, "GLAUCOMA_SCREENING": 400, "REFRACTION_TEST": 400, "RETINAL_EXAM": 400 }
      },
      CAT008: {
        enabled: true,
        annualLimit: 5000,
        claimEnabled: false,
        allowedServiceCodes: ["ANNUAL_HEALTH_CHECKUP"],
        serviceTransactionLimits: { "ANNUAL_HEALTH_CHECKUP": 5000 }
      }
    },
    wallet: {
      allocationType: "INDIVIDUAL",
      totalAnnualAmount: 40000,
      perClaimLimit: 0,
      copay: { mode: "PERCENT", value: 40 },
      partialPaymentEnabled: false,
      carryForward: { enabled: false, percent: 0, months: 0 },
      topUpAllowed: false
    },
    policyDescription: {
      inclusions: [{ headline: "Doctor", description: "online offline" }],
      exclusions: [{ headline: "Pre-Existing Diseases", description: "Waiting Period Applicable" }]
    },
    coveredRelationships: ["REL001", "REL002"],
    memberConfigs: {
      REL001: { inheritFromPrimary: true },
      REL002: { inheritFromPrimary: true }
    },
    createdBy: insertedAdmin._id,
    updatedBy: insertedAdmin._id,
    publishedAt: new Date(),
    publishedBy: insertedAdmin._id
  };

  db.plan_configs.deleteMany({});
  db.plan_configs.insertOne(planConfig);
  print("✓ Inserted plan_configs");

  const insertedPlanConfig = db.plan_configs.findOne({ policyId: insertedPolicy._id });

  // Create user policy assignments
  if (insertedUser && insertedPlanConfig) {
    db.userPolicyAssignments.deleteMany({});
    db.userPolicyAssignments.insertMany([
      {
        assignmentId: "ASG-SEED-001",
        userId: insertedUser._id,
        policyId: insertedPolicy._id,
        planConfigId: insertedPlanConfig._id,
        effectiveFrom: new Date("2026-01-01"),
        effectiveTo: new Date("2026-12-31"),
        isActive: true,
        relationshipId: "REL001",
        createdBy: insertedAdmin._id,
        updatedBy: insertedAdmin._id
      },
      ...(insertedSpouse ? [{
        assignmentId: "ASG-SEED-002",
        userId: insertedSpouse._id,
        policyId: insertedPolicy._id,
        planConfigId: insertedPlanConfig._id,
        effectiveFrom: new Date("2026-01-01"),
        effectiveTo: new Date("2026-12-31"),
        isActive: true,
        relationshipId: "REL002",
        primaryMemberId: "MEM567",
        createdBy: insertedAdmin._id,
        updatedBy: insertedAdmin._id
      }] : [])
    ]);
    print("✓ Inserted userPolicyAssignments");

    // Create wallet for the user
    db.wallets.deleteMany({});
    db.wallets.insertMany([
      {
        userId: insertedUser._id,
        memberId: "MEM567",
        policyId: insertedPolicy._id,
        balance: 40000,
        totalAllocated: 40000,
        totalUsed: 0,
        totalRefunded: 0,
        isActive: true
      },
      ...(insertedSpouse ? [{
        userId: insertedSpouse._id,
        memberId: "MEM690",
        policyId: insertedPolicy._id,
        balance: 40000,
        totalAllocated: 40000,
        totalUsed: 0,
        totalRefunded: 0,
        isActive: true
      }] : [])
    ]);
    print("✓ Inserted wallets");
  }
}

print("\n============================================");
print("Seed completed successfully!");
print("============================================");
print("\nDefault Login Credentials:");
print("- Admin Portal: admin@opdwallet.com / Password123!");
print("- Member Portal: all@gmail.com / Password123!");
print("- Doctor Portal: anil@doctor.com / Password123!");
print("- TPA Portal: tpa@gmail.com / Password123!");
print("- Operations Portal: opsadmin@gmail.com / Password123!");
print("\nNote: After seeding, you may need to:");
print("1. Create policy assignments for users");
print("2. Configure plan configs for policies");
print("3. Set up category-specialty mappings");
