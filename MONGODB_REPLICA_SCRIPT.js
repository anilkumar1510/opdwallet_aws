// ========================================
// MongoDB Database Replica Script
// Database: opd_wallet
// Generated: 2025-09-28
// Total Collections: 17
// Total Documents: 66
// ========================================
//
// This script recreates the entire opd_wallet database with:
// - All 17 collections
// - All 66 documents
// - All indexes
// - Complete data preservation
//
// Usage: mongosh "mongodb://admin:admin123@localhost:27017/opd_wallet?authSource=admin" < MONGODB_REPLICA_SCRIPT.js
// ========================================

// Switch to the opd_wallet database
use opd_wallet;

print("========================================");
print("Starting database replication...");
print("Database: opd_wallet");
print("Total Collections: 17");
print("Total Documents: 66");
print("========================================");

// ========================================
// COLLECTION: cug_master (8 documents)
// ========================================
print("\n[1/17] Creating cug_master collection...");

db.cug_master.drop();

db.cug_master.insertMany([
  {
    "_id": ObjectId("68d3b1ca48e9bac3566c05f7"),
    "cugId": "CUG001",
    "code": "GOOGLE",
    "name": "Google Inc.",
    "description": "Google corporate group",
    "isActive": true,
    "displayOrder": 1,
    "__v": 0,
    "createdAt": ISODate("2025-09-24T08:54:34.786Z"),
    "updatedAt": ISODate("2025-09-24T08:54:34.786Z")
  },
  {
    "_id": ObjectId("68d3b1ca48e9bac3566c05f8"),
    "cugId": "CUG002",
    "code": "MICROSOFT",
    "name": "Microsoft Corporation",
    "description": "Microsoft corporate group",
    "isActive": true,
    "displayOrder": 2,
    "__v": 0,
    "createdAt": ISODate("2025-09-24T08:54:34.787Z"),
    "updatedAt": ISODate("2025-09-24T08:54:34.787Z")
  },
  {
    "_id": ObjectId("68d3b1ca48e9bac3566c05f9"),
    "cugId": "CUG003",
    "code": "AMAZON",
    "name": "Amazon Inc.",
    "description": "Amazon corporate group",
    "isActive": true,
    "displayOrder": 3,
    "__v": 0,
    "createdAt": ISODate("2025-09-24T08:54:34.787Z"),
    "updatedAt": ISODate("2025-09-24T08:54:34.787Z")
  },
  {
    "_id": ObjectId("68d3b1ca48e9bac3566c05fa"),
    "cugId": "CUG004",
    "code": "APPLE",
    "name": "Apple Inc.",
    "description": "Apple corporate group",
    "isActive": true,
    "displayOrder": 4,
    "__v": 0,
    "createdAt": ISODate("2025-09-24T08:54:34.788Z"),
    "updatedAt": ISODate("2025-09-24T08:54:34.788Z")
  },
  {
    "_id": ObjectId("68d3b1ca48e9bac3566c05fb"),
    "cugId": "CUG005",
    "code": "META",
    "name": "Meta Platforms Inc.",
    "description": "Meta corporate group",
    "isActive": true,
    "displayOrder": 5,
    "__v": 0,
    "createdAt": ISODate("2025-09-24T08:54:34.788Z"),
    "updatedAt": ISODate("2025-09-24T08:54:34.788Z")
  },
  {
    "_id": ObjectId("68d3b1ca48e9bac3566c05fc"),
    "cugId": "CUG006",
    "code": "NETFLIX",
    "name": "Netflix Inc.",
    "description": "Netflix corporate group",
    "isActive": true,
    "displayOrder": 6,
    "__v": 0,
    "createdAt": ISODate("2025-09-24T08:54:34.788Z"),
    "updatedAt": ISODate("2025-09-24T08:54:34.788Z")
  },
  {
    "_id": ObjectId("68d3b1ca48e9bac3566c05fd"),
    "cugId": "CUG007",
    "code": "TESLA",
    "name": "Tesla Inc.",
    "description": "Tesla corporate group",
    "isActive": true,
    "displayOrder": 7,
    "__v": 0,
    "createdAt": ISODate("2025-09-24T08:54:34.788Z"),
    "updatedAt": ISODate("2025-09-24T08:54:34.788Z")
  },
  {
    "_id": ObjectId("68d3b1ca48e9bac3566c05fe"),
    "cugId": "CUG008",
    "code": "IBM",
    "name": "IBM Corporation",
    "description": "IBM corporate group",
    "isActive": true,
    "displayOrder": 8,
    "__v": 0,
    "createdAt": ISODate("2025-09-24T08:54:34.788Z"),
    "updatedAt": ISODate("2025-09-24T08:54:34.788Z")
  }
]);

// Create indexes
db.cug_master.createIndex({ "cugId": 1 }, { unique: true });
db.cug_master.createIndex({ "code": 1 }, { unique: true });
db.cug_master.createIndex({ "isActive": 1, "displayOrder": 1 });

print("✓ cug_master created with 8 documents");

// ========================================
// COLLECTION: specialty_master (9 documents)
// ========================================
print("\n[2/17] Creating specialty_master collection...");

db.specialty_master.drop();

db.specialty_master.insertMany([
  {
    "_id": ObjectId("68d819d8a22b6fab8d4f87fe"),
    "specialtyId": "SPEC001",
    "code": "GENERAL_PHYSICIAN",
    "name": "General Physician",
    "description": "General medical consultation and primary care",
    "icon": "stethoscope",
    "isActive": true,
    "displayOrder": 1
  },
  {
    "_id": ObjectId("68d819d8a22b6fab8d4f87ff"),
    "specialtyId": "SPEC002",
    "code": "GYNECOLOGIST",
    "name": "Gynaecologist",
    "description": "Women's health and reproductive care",
    "icon": "female-doctor",
    "isActive": true,
    "displayOrder": 2
  },
  {
    "_id": ObjectId("68d819d8a22b6fab8d4f8800"),
    "specialtyId": "SPEC003",
    "code": "PSYCHOLOGIST",
    "name": "Psychologist",
    "description": "Mental health and psychological counseling",
    "icon": "brain",
    "isActive": true,
    "displayOrder": 3
  },
  {
    "_id": ObjectId("68d819d8a22b6fab8d4f8801"),
    "specialtyId": "SPEC004",
    "code": "DERMATOLOGIST",
    "name": "Dermatologist",
    "description": "Skin, hair, and nail care specialist",
    "icon": "skin",
    "isActive": true,
    "displayOrder": 4
  },
  {
    "_id": ObjectId("68d819d8a22b6fab8d4f8802"),
    "specialtyId": "SPEC005",
    "code": "NUTRITIONIST",
    "name": "Nutritionist",
    "description": "Diet and nutrition consultation",
    "icon": "apple",
    "isActive": true,
    "displayOrder": 5
  },
  {
    "_id": ObjectId("68d819d8a22b6fab8d4f8803"),
    "specialtyId": "SPEC006",
    "code": "SEXOLOGIST",
    "name": "Sexologist",
    "description": "Sexual health and wellness",
    "icon": "heart",
    "isActive": true,
    "displayOrder": 6
  },
  {
    "_id": ObjectId("68d819d8a22b6fab8d4f8804"),
    "specialtyId": "SPEC007",
    "code": "CARDIOLOGIST",
    "name": "Cardiologist",
    "description": "Heart and cardiovascular care",
    "icon": "heart-pulse",
    "isActive": true,
    "displayOrder": 7
  },
  {
    "_id": ObjectId("68d819d8a22b6fab8d4f8805"),
    "specialtyId": "SPEC008",
    "code": "PAEDIATRICIAN",
    "name": "Paediatrician",
    "description": "Child health and development",
    "icon": "baby",
    "isActive": true,
    "displayOrder": 8
  },
  {
    "_id": ObjectId("68d819d8a22b6fab8d4f8806"),
    "specialtyId": "SPEC009",
    "code": "DIABETOLOGIST",
    "name": "Diabetologist",
    "description": "Diabetes management and care",
    "icon": "glucose",
    "isActive": true,
    "displayOrder": 9
  }
]);

// Create indexes
db.specialty_master.createIndex({ "specialtyId": 1 }, { unique: true });
db.specialty_master.createIndex({ "code": 1 }, { unique: true });
db.specialty_master.createIndex({ "isActive": 1, "displayOrder": 1 });

print("✓ specialty_master created with 9 documents");

// ========================================
// COLLECTION: clinics (5 documents)
// ========================================
print("\n[3/17] Creating clinics collection...");

db.clinics.drop();

db.clinics.insertMany([
  {
    "_id": ObjectId("68d8f1bf847633d78c923b15"),
    "clinicId": "CLINIC001",
    "name": "Manipal Hospital",
    "phone": "+911123456789",
    "email": "contact@manipalhospitals.com",
    "address": {
      "street": "Sector 6, Dwarka",
      "city": "Delhi",
      "state": "Delhi",
      "pincode": "110075",
      "country": "India"
    },
    "location": {
      "latitude": 28.5921,
      "longitude": 77.046
    },
    "operatingHours": {
      "monday": { "open": "08:00", "close": "20:00", "closed": false },
      "tuesday": { "open": "08:00", "close": "20:00", "closed": false },
      "wednesday": { "open": "08:00", "close": "20:00", "closed": false },
      "thursday": { "open": "08:00", "close": "20:00", "closed": false },
      "friday": { "open": "08:00", "close": "20:00", "closed": false },
      "saturday": { "open": "09:00", "close": "18:00", "closed": false },
      "sunday": { "open": "09:00", "close": "14:00", "closed": false }
    },
    "facilities": ["Pharmacy", "Lab", "X-Ray", "ECG", "Emergency"],
    "isActive": true
  },
  {
    "_id": ObjectId("68d8f1bf847633d78c923b16"),
    "clinicId": "CLINIC002",
    "name": "Max Super Specialty Hospital",
    "phone": "+911198765432",
    "email": "info@maxhealthcare.com",
    "address": {
      "street": "Saket",
      "city": "Delhi",
      "state": "Delhi",
      "pincode": "110017",
      "country": "India"
    },
    "location": {
      "latitude": 28.5244,
      "longitude": 77.2066
    },
    "operatingHours": {
      "monday": { "open": "07:00", "close": "21:00", "closed": false },
      "tuesday": { "open": "07:00", "close": "21:00", "closed": false },
      "wednesday": { "open": "07:00", "close": "21:00", "closed": false },
      "thursday": { "open": "07:00", "close": "21:00", "closed": false },
      "friday": { "open": "07:00", "close": "21:00", "closed": false },
      "saturday": { "open": "08:00", "close": "20:00", "closed": false },
      "sunday": { "open": "08:00", "close": "16:00", "closed": false }
    },
    "facilities": ["Pharmacy", "Lab", "X-Ray", "CT Scan", "MRI", "ICU", "Emergency"],
    "isActive": true
  },
  {
    "_id": ObjectId("68d8f1bf847633d78c923b17"),
    "clinicId": "CLINIC003",
    "name": "Fortis Hospital",
    "phone": "+911187654321",
    "email": "care@fortishealthcare.com",
    "address": {
      "street": "Vasant Kunj",
      "city": "Delhi",
      "state": "Delhi",
      "pincode": "110070",
      "country": "India"
    },
    "location": {
      "latitude": 28.5167,
      "longitude": 77.1598
    },
    "operatingHours": {
      "monday": { "open": "08:00", "close": "20:00", "closed": false },
      "tuesday": { "open": "08:00", "close": "20:00", "closed": false },
      "wednesday": { "open": "08:00", "close": "20:00", "closed": false },
      "thursday": { "open": "08:00", "close": "20:00", "closed": false },
      "friday": { "open": "08:00", "close": "20:00", "closed": false },
      "saturday": { "open": "09:00", "close": "18:00", "closed": false },
      "sunday": { "open": "10:00", "close": "14:00", "closed": false }
    },
    "facilities": ["Pharmacy", "Lab", "X-Ray", "Ultrasound", "Emergency"],
    "isActive": true
  },
  {
    "_id": ObjectId("68d8f1bf847633d78c923b18"),
    "clinicId": "CLINIC004",
    "name": "Apollo Clinic",
    "phone": "+911176543210",
    "email": "info@apolloclinic.com",
    "address": {
      "street": "Nehru Place",
      "city": "Delhi",
      "state": "Delhi",
      "pincode": "110019",
      "country": "India"
    },
    "location": {
      "latitude": 28.5494,
      "longitude": 77.2501
    },
    "operatingHours": {
      "monday": { "open": "09:00", "close": "19:00", "closed": false },
      "tuesday": { "open": "09:00", "close": "19:00", "closed": false },
      "wednesday": { "open": "09:00", "close": "19:00", "closed": false },
      "thursday": { "open": "09:00", "close": "19:00", "closed": false },
      "friday": { "open": "09:00", "close": "19:00", "closed": false },
      "saturday": { "open": "09:00", "close": "17:00", "closed": false },
      "sunday": { "open": "09:00", "close": "13:00", "closed": true }
    },
    "facilities": ["Pharmacy", "Lab", "X-Ray"],
    "isActive": true
  },
  {
    "_id": ObjectId("68d8f1bf847633d78c923b19"),
    "clinicId": "CLINIC005",
    "name": "Sir Ganga Ram Hospital",
    "phone": "+911165432109",
    "email": "contact@sgrh.com",
    "address": {
      "street": "Rajinder Nagar",
      "city": "Delhi",
      "state": "Delhi",
      "pincode": "110060",
      "country": "India"
    },
    "location": {
      "latitude": 28.6409,
      "longitude": 77.1924
    },
    "operatingHours": {
      "monday": { "open": "08:00", "close": "20:00", "closed": false },
      "tuesday": { "open": "08:00", "close": "20:00", "closed": false },
      "wednesday": { "open": "08:00", "close": "20:00", "closed": false },
      "thursday": { "open": "08:00", "close": "20:00", "closed": false },
      "friday": { "open": "08:00", "close": "20:00", "closed": false },
      "saturday": { "open": "08:00", "close": "18:00", "closed": false },
      "sunday": { "open": "09:00", "close": "14:00", "closed": false }
    },
    "facilities": ["Pharmacy", "Lab", "X-Ray", "CT Scan", "Emergency", "ICU"],
    "isActive": true
  }
]);

// Create indexes
db.clinics.createIndex({ "clinicId": 1 }, { unique: true });
db.clinics.createIndex({ "address.city": 1 });
db.clinics.createIndex({ "isActive": 1 });

print("✓ clinics created with 5 documents");

// ========================================
// COLLECTION: doctor_slots (17 documents)
// ========================================
print("\n[4/17] Creating doctor_slots collection...");

db.doctor_slots.drop();

db.doctor_slots.insertMany([
  {
    "_id": ObjectId("68d8f3be7062d1aac546a644"),
    "slotId": "SLOT001",
    "doctorId": "DOC001",
    "clinicId": "CLINIC001",
    "dayOfWeek": "MONDAY",
    "startTime": "09:00",
    "endTime": "13:00",
    "slotDuration": 30,
    "consultationFee": 1000,
    "consultationType": "IN_CLINIC",
    "maxAppointments": 8,
    "isActive": true
  },
  {
    "_id": ObjectId("68d8f3be7062d1aac546a645"),
    "slotId": "SLOT002",
    "doctorId": "DOC001",
    "clinicId": "CLINIC001",
    "dayOfWeek": "WEDNESDAY",
    "startTime": "14:00",
    "endTime": "18:00",
    "slotDuration": 30,
    "consultationFee": 1000,
    "consultationType": "IN_CLINIC",
    "maxAppointments": 8,
    "isActive": true
  },
  {
    "_id": ObjectId("68d8f3be7062d1aac546a646"),
    "slotId": "SLOT003",
    "doctorId": "DOC001",
    "clinicId": "CLINIC001",
    "dayOfWeek": "FRIDAY",
    "startTime": "10:00",
    "endTime": "14:00",
    "slotDuration": 30,
    "consultationFee": 900,
    "consultationType": "ONLINE",
    "maxAppointments": 10,
    "isActive": true
  },
  {
    "_id": ObjectId("68d8f3be7062d1aac546a647"),
    "slotId": "SLOT004",
    "doctorId": "DOC002",
    "clinicId": "CLINIC002",
    "dayOfWeek": "TUESDAY",
    "startTime": "08:00",
    "endTime": "12:00",
    "slotDuration": 30,
    "consultationFee": 1500,
    "consultationType": "IN_CLINIC",
    "maxAppointments": 8,
    "isActive": true
  },
  {
    "_id": ObjectId("68d8f3be7062d1aac546a648"),
    "slotId": "SLOT005",
    "doctorId": "DOC002",
    "clinicId": "CLINIC002",
    "dayOfWeek": "THURSDAY",
    "startTime": "15:00",
    "endTime": "19:00",
    "slotDuration": 30,
    "consultationFee": 1500,
    "consultationType": "IN_CLINIC",
    "maxAppointments": 8,
    "isActive": true
  },
  {
    "_id": ObjectId("68d8f3be7062d1aac546a649"),
    "slotId": "SLOT006",
    "doctorId": "DOC002",
    "clinicId": "CLINIC002",
    "dayOfWeek": "SATURDAY",
    "startTime": "09:00",
    "endTime": "13:00",
    "slotDuration": 30,
    "consultationFee": 1400,
    "consultationType": "ONLINE",
    "maxAppointments": 10,
    "isActive": true
  },
  {
    "_id": ObjectId("68d8f3be7062d1aac546a64a"),
    "slotId": "SLOT007",
    "doctorId": "DOC003",
    "clinicId": "CLINIC003",
    "dayOfWeek": "MONDAY",
    "startTime": "10:00",
    "endTime": "14:00",
    "slotDuration": 20,
    "consultationFee": 1200,
    "consultationType": "IN_CLINIC",
    "maxAppointments": 12,
    "isActive": true
  },
  {
    "_id": ObjectId("68d8f3be7062d1aac546a64b"),
    "slotId": "SLOT008",
    "doctorId": "DOC003",
    "clinicId": "CLINIC003",
    "dayOfWeek": "WEDNESDAY",
    "startTime": "15:00",
    "endTime": "19:00",
    "slotDuration": 20,
    "consultationFee": 1200,
    "consultationType": "IN_CLINIC",
    "maxAppointments": 12,
    "isActive": true
  },
  {
    "_id": ObjectId("68d8f3be7062d1aac546a64c"),
    "slotId": "SLOT009",
    "doctorId": "DOC003",
    "clinicId": "CLINIC003",
    "dayOfWeek": "FRIDAY",
    "startTime": "16:00",
    "endTime": "20:00",
    "slotDuration": 20,
    "consultationFee": 1000,
    "consultationType": "ONLINE",
    "maxAppointments": 15,
    "isActive": true
  },
  {
    "_id": ObjectId("68d8f3be7062d1aac546a64d"),
    "slotId": "SLOT010",
    "doctorId": "DOC004",
    "clinicId": "CLINIC004",
    "dayOfWeek": "MONDAY",
    "startTime": "09:00",
    "endTime": "13:00",
    "slotDuration": 30,
    "consultationFee": 1300,
    "consultationType": "IN_CLINIC",
    "maxAppointments": 8,
    "isActive": true
  },
  {
    "_id": ObjectId("68d8f3be7062d1aac546a64e"),
    "slotId": "SLOT011",
    "doctorId": "DOC004",
    "clinicId": "CLINIC004",
    "dayOfWeek": "THURSDAY",
    "startTime": "14:00",
    "endTime": "18:00",
    "slotDuration": 30,
    "consultationFee": 1300,
    "consultationType": "IN_CLINIC",
    "maxAppointments": 8,
    "isActive": true
  },
  {
    "_id": ObjectId("68d8f3be7062d1aac546a64f"),
    "slotId": "SLOT012",
    "doctorId": "DOC005",
    "clinicId": "CLINIC005",
    "dayOfWeek": "TUESDAY",
    "startTime": "09:00",
    "endTime": "13:00",
    "slotDuration": 20,
    "consultationFee": 900,
    "consultationType": "IN_CLINIC",
    "maxAppointments": 12,
    "isActive": true
  },
  {
    "_id": ObjectId("68d8f3be7062d1aac546a650"),
    "slotId": "SLOT013",
    "doctorId": "DOC005",
    "clinicId": "CLINIC005",
    "dayOfWeek": "THURSDAY",
    "startTime": "10:00",
    "endTime": "14:00",
    "slotDuration": 20,
    "consultationFee": 900,
    "consultationType": "IN_CLINIC",
    "maxAppointments": 12,
    "isActive": true
  },
  {
    "_id": ObjectId("68d8f3be7062d1aac546a651"),
    "slotId": "SLOT014",
    "doctorId": "DOC005",
    "clinicId": "CLINIC005",
    "dayOfWeek": "SATURDAY",
    "startTime": "15:00",
    "endTime": "18:00",
    "slotDuration": 20,
    "consultationFee": 800,
    "consultationType": "ONLINE",
    "maxAppointments": 15,
    "isActive": true
  },
  {
    "_id": ObjectId("68d8f3be7062d1aac546a652"),
    "slotId": "SLOT015",
    "doctorId": "DOC006",
    "clinicId": "CLINIC001",
    "dayOfWeek": "WEDNESDAY",
    "startTime": "09:00",
    "endTime": "13:00",
    "slotDuration": 30,
    "consultationFee": 1100,
    "consultationType": "IN_CLINIC",
    "maxAppointments": 8,
    "isActive": true
  },
  {
    "_id": ObjectId("68d8f3be7062d1aac546a653"),
    "slotId": "SLOT016",
    "doctorId": "DOC006",
    "clinicId": "CLINIC001",
    "dayOfWeek": "FRIDAY",
    "startTime": "14:00",
    "endTime": "18:00",
    "slotDuration": 30,
    "consultationFee": 1100,
    "consultationType": "IN_CLINIC",
    "maxAppointments": 8,
    "isActive": true
  },
  {
    "_id": ObjectId("68d8f3be7062d1aac546a654"),
    "slotId": "SLOT017",
    "doctorId": "DOC006",
    "clinicId": "CLINIC001",
    "dayOfWeek": "SATURDAY",
    "startTime": "10:00",
    "endTime": "13:00",
    "slotDuration": 30,
    "consultationFee": 1000,
    "consultationType": "ONLINE",
    "maxAppointments": 10,
    "isActive": true
  }
]);

// Create indexes
db.doctor_slots.createIndex({ "slotId": 1 }, { unique: true });
db.doctor_slots.createIndex({ "doctorId": 1, "dayOfWeek": 1 });
db.doctor_slots.createIndex({ "clinicId": 1 });
db.doctor_slots.createIndex({ "isActive": 1 });

print("✓ doctor_slots created with 17 documents");

// ========================================
// COLLECTION: doctors (6 documents)
// ========================================
print("\n[5/17] Creating doctors collection...");

db.doctors.drop();

db.doctors.insertMany([
  {
    "_id": ObjectId("68d8f32515b884ab1eb3b35c"),
    "doctorId": "DOC001",
    "name": "Dr. Vikas Mittal",
    "profilePhoto": "",
    "qualifications": "MBBS, MD (Pulmonary Medicine)",
    "specializations": ["Pulmonary Medicine", "Tuberculosis & Respiratory Diseases"],
    "specialtyId": "SPEC001",
    "specialty": "General Physician",
    "phone": "+919876543210",
    "email": "vikas.mittal@hospital.com",
    "registrationNumber": "DMC/12345/2009",
    "languages": ["English", "Hindi"],
    "experienceYears": 16,
    "rating": 4.7,
    "reviewCount": 156,
    "consultationFee": 1000,
    "cashlessAvailable": true,
    "insuranceAccepted": ["MCLTech"],
    "requiresConfirmation": false,
    "allowDirectBooking": true,
    "availableOnline": true,
    "availableOffline": true,
    "isActive": true
  },
  {
    "_id": ObjectId("68d8f32515b884ab1eb3b35d"),
    "doctorId": "DOC002",
    "name": "Dr. Amit Kumar",
    "profilePhoto": "",
    "qualifications": "MBBS, MD (Cardiology)",
    "specializations": ["Cardiology", "Interventional Cardiology"],
    "specialtyId": "SPEC002",
    "specialty": "Cardiologist",
    "phone": "+919876543211",
    "email": "amit.kumar@hospital.com",
    "registrationNumber": "DMC/23456/2005",
    "languages": ["English", "Hindi", "Punjabi"],
    "experienceYears": 20,
    "rating": 4.9,
    "reviewCount": 289,
    "consultationFee": 1500,
    "cashlessAvailable": true,
    "insuranceAccepted": ["MCLTech"],
    "requiresConfirmation": false,
    "allowDirectBooking": true,
    "availableOnline": true,
    "availableOffline": true,
    "isActive": true
  },
  {
    "_id": ObjectId("68d8f32515b884ab1eb3b35e"),
    "doctorId": "DOC003",
    "name": "Dr. Priya Sharma",
    "profilePhoto": "",
    "qualifications": "MBBS, MD (Dermatology)",
    "specializations": ["Dermatology", "Cosmetology", "Hair Transplant"],
    "specialtyId": "SPEC004",
    "specialty": "Dermatologist",
    "phone": "+919876543212",
    "email": "priya.sharma@hospital.com",
    "registrationNumber": "DMC/34567/2013",
    "languages": ["English", "Hindi"],
    "experienceYears": 12,
    "rating": 4.8,
    "reviewCount": 234,
    "consultationFee": 1200,
    "cashlessAvailable": true,
    "insuranceAccepted": ["MCLTech"],
    "requiresConfirmation": false,
    "allowDirectBooking": true,
    "availableOnline": true,
    "availableOffline": true,
    "isActive": true
  },
  {
    "_id": ObjectId("68d8f32515b884ab1eb3b35f"),
    "doctorId": "DOC004",
    "name": "Dr. Rajesh Verma",
    "profilePhoto": "",
    "qualifications": "MBBS, MS (Orthopedics)",
    "specializations": ["Orthopedic Surgery", "Sports Medicine", "Joint Replacement"],
    "specialtyId": "SPEC005",
    "specialty": "Orthopedic",
    "phone": "+919876543213",
    "email": "rajesh.verma@hospital.com",
    "registrationNumber": "DMC/45678/2007",
    "languages": ["English", "Hindi"],
    "experienceYears": 18,
    "rating": 4.6,
    "reviewCount": 178,
    "consultationFee": 1300,
    "cashlessAvailable": true,
    "insuranceAccepted": ["MCLTech"],
    "requiresConfirmation": true,
    "allowDirectBooking": false,
    "availableOnline": false,
    "availableOffline": true,
    "isActive": true
  },
  {
    "_id": ObjectId("68d8f32515b884ab1eb3b360"),
    "doctorId": "DOC005",
    "name": "Dr. Sunita Mehta",
    "profilePhoto": "",
    "qualifications": "MBBS, MD (Pediatrics)",
    "specializations": ["Pediatrics", "Child Development", "Neonatology"],
    "specialtyId": "SPEC003",
    "specialty": "Pediatrician",
    "phone": "+919876543214",
    "email": "sunita.mehta@hospital.com",
    "registrationNumber": "DMC/56789/2010",
    "languages": ["English", "Hindi", "Bengali"],
    "experienceYears": 15,
    "rating": 4.9,
    "reviewCount": 312,
    "consultationFee": 900,
    "cashlessAvailable": true,
    "insuranceAccepted": ["MCLTech"],
    "requiresConfirmation": false,
    "allowDirectBooking": true,
    "availableOnline": true,
    "availableOffline": true,
    "isActive": true
  },
  {
    "_id": ObjectId("68d8f32515b884ab1eb3b361"),
    "doctorId": "DOC006",
    "name": "Dr. Anil Kapoor",
    "profilePhoto": "",
    "qualifications": "MBBS, MS (ENT)",
    "specializations": ["ENT Surgery", "Head and Neck Surgery", "Voice Disorders"],
    "specialtyId": "SPEC006",
    "specialty": "ENT Specialist",
    "phone": "+919876543215",
    "email": "anil.kapoor@hospital.com",
    "registrationNumber": "DMC/67890/2011",
    "languages": ["English", "Hindi"],
    "experienceYears": 14,
    "rating": 4.5,
    "reviewCount": 145,
    "consultationFee": 1100,
    "cashlessAvailable": true,
    "insuranceAccepted": ["MCLTech"],
    "requiresConfirmation": false,
    "allowDirectBooking": true,
    "availableOnline": true,
    "availableOffline": true,
    "isActive": true
  }
]);

// Create indexes
db.doctors.createIndex({ "doctorId": 1 }, { unique: true });
db.doctors.createIndex({ "specialtyId": 1, "isActive": 1 });
db.doctors.createIndex({ "email": 1 });
db.doctors.createIndex({ "phone": 1 });

print("✓ doctors created with 6 documents");

// ========================================
// COLLECTION: relationship_masters (5 documents)
// ========================================
print("\n[6/17] Creating relationship_masters collection...");

db.relationship_masters.drop();

db.relationship_masters.insertMany([
  {
    "_id": ObjectId("68d2306561787a99ccba405d"),
    "relationshipCode": "REL001",
    "relationshipName": "Self",
    "displayName": "Self",
    "description": "Primary member",
    "isActive": true,
    "createdAt": ISODate("2025-09-23T05:30:13.523Z"),
    "updatedAt": ISODate("2025-09-23T05:30:13.523Z")
  },
  {
    "_id": ObjectId("68d2306561787a99ccba405e"),
    "relationshipCode": "REL002",
    "relationshipName": "Spouse",
    "displayName": "Spouse",
    "description": "Spouse of the primary member",
    "isActive": true,
    "createdAt": ISODate("2025-09-23T05:30:13.523Z"),
    "updatedAt": ISODate("2025-09-23T05:30:13.523Z")
  },
  {
    "_id": ObjectId("68d2306561787a99ccba405f"),
    "relationshipCode": "REL003",
    "relationshipName": "Child",
    "displayName": "Child",
    "description": "Child of the primary member",
    "isActive": true,
    "createdAt": ISODate("2025-09-23T05:30:13.523Z"),
    "updatedAt": ISODate("2025-09-23T05:30:13.523Z")
  },
  {
    "_id": ObjectId("68d2306561787a99ccba4060"),
    "relationshipCode": "REL004",
    "relationshipName": "Father",
    "displayName": "Father",
    "description": "Father of the primary member",
    "isActive": true,
    "createdAt": ISODate("2025-09-23T05:30:13.523Z"),
    "updatedAt": ISODate("2025-09-23T05:30:13.523Z")
  },
  {
    "_id": ObjectId("68d2306561787a99ccba4061"),
    "relationshipCode": "REL005",
    "relationshipName": "Mother",
    "displayName": "Mother",
    "description": "Mother of the primary member",
    "isActive": true,
    "createdAt": ISODate("2025-09-23T05:30:13.523Z"),
    "updatedAt": ISODate("2025-09-23T05:30:13.523Z")
  }
]);

// Create indexes
db.relationship_masters.createIndex({ "relationshipCode": 1 }, { unique: true });
db.relationship_masters.createIndex({ "isActive": 1 });

print("✓ relationship_masters created with 5 documents");

// ========================================
// COLLECTION: category_master (4 documents)
// ========================================
print("\n[7/17] Creating category_master collection...");

db.category_master.drop();

db.category_master.insertMany([
  {
    "_id": ObjectId("68cfc905439a95df10e177de"),
    "categoryId": "CAT001",
    "code": "CAT001",
    "name": "Consult",
    "isActive": true,
    "displayOrder": 1,
    "description": "Consult",
    "createdAt": ISODate("2025-09-21T09:44:37.330Z"),
    "updatedAt": ISODate("2025-09-21T18:08:08.988Z"),
    "__v": 0,
    "isAvailableOnline": true
  },
  {
    "_id": ObjectId("68d03ef5fa8b4b75ce1e0ee8"),
    "categoryId": "CAT002",
    "code": "CAT002",
    "name": "Pharmacy",
    "isActive": true,
    "displayOrder": 2,
    "description": "Pharmacy",
    "createdAt": ISODate("2025-09-21T18:07:49.704Z"),
    "updatedAt": ISODate("2025-09-21T18:07:49.704Z"),
    "__v": 0,
    "isAvailableOnline": false
  },
  {
    "_id": ObjectId("68d24470ac81047284e76ef0"),
    "categoryId": "CAT003",
    "code": "CAT003",
    "name": "Labs",
    "isActive": true,
    "displayOrder": 3,
    "description": "Labs",
    "createdAt": ISODate("2025-09-23T06:55:44.115Z"),
    "updatedAt": ISODate("2025-09-23T06:55:44.115Z"),
    "__v": 0,
    "isAvailableOnline": false
  },
  {
    "_id": ObjectId("68d4160891b40c366683466c"),
    "categoryId": "CAT004",
    "code": "CAT004",
    "name": "Dental",
    "isActive": true,
    "displayOrder": 4,
    "description": "Dental",
    "createdAt": ISODate("2025-09-24T16:02:16.946Z"),
    "updatedAt": ISODate("2025-09-24T16:02:16.946Z"),
    "__v": 0,
    "isAvailableOnline": false
  }
]);

// Create indexes
db.category_master.createIndex({ "categoryId": 1 }, { unique: true });
db.category_master.createIndex({ "code": 1 }, { unique: true });
db.category_master.createIndex({ "isActive": 1, "displayOrder": 1 });

print("✓ category_master created with 4 documents");

// ========================================
// COLLECTION: service_master (4 documents)
// ========================================
print("\n[8/17] Creating service_master collection...");

db.service_master.drop();

db.service_master.insertMany([
  {
    "_id": ObjectId("68d166124568043bbad6b106"),
    "code": "CON001",
    "name": "General Physician",
    "description": "dfggfd",
    "category": "CAT001",
    "isActive": true,
    "coveragePercentage": 100,
    "copayAmount": 0,
    "requiresPreAuth": false,
    "requiresReferral": false,
    "waitingPeriodDays": 0,
    "requiredDocuments": [],
    "createdAt": ISODate("2025-09-22T15:06:58.637Z"),
    "updatedAt": ISODate("2025-09-23T10:30:05.410Z"),
    "__v": 0
  },
  {
    "_id": ObjectId("68d39016e92a1f728a949db6"),
    "code": "CON002",
    "name": "Gynecologist ",
    "description": "Gynecologist ",
    "category": "CAT001",
    "isActive": true,
    "coveragePercentage": 100,
    "copayAmount": 0,
    "requiresPreAuth": false,
    "requiresReferral": false,
    "waitingPeriodDays": 0,
    "requiredDocuments": [],
    "createdAt": ISODate("2025-09-24T06:30:46.531Z"),
    "updatedAt": ISODate("2025-09-24T06:30:46.531Z"),
    "__v": 0
  },
  {
    "_id": ObjectId("68d3902de92a1f728a949dbe"),
    "code": "CON003",
    "name": "Pharmacy",
    "description": "",
    "category": "CAT002",
    "isActive": true,
    "coveragePercentage": 100,
    "copayAmount": 0,
    "requiresPreAuth": false,
    "requiresReferral": false,
    "waitingPeriodDays": 0,
    "requiredDocuments": [],
    "createdAt": ISODate("2025-09-24T06:31:09.723Z"),
    "updatedAt": ISODate("2025-09-24T06:31:09.723Z"),
    "__v": 0
  },
  {
    "_id": ObjectId("68d3903de92a1f728a949dc7"),
    "code": "CON004",
    "name": "Labs",
    "description": "",
    "category": "CAT003",
    "isActive": true,
    "coveragePercentage": 100,
    "copayAmount": 0,
    "requiresPreAuth": false,
    "requiresReferral": false,
    "waitingPeriodDays": 0,
    "requiredDocuments": [],
    "createdAt": ISODate("2025-09-24T06:31:25.683Z"),
    "updatedAt": ISODate("2025-09-24T06:31:25.683Z"),
    "__v": 0
  }
]);

// Create indexes
db.service_master.createIndex({ "code": 1 }, { unique: true });
db.service_master.createIndex({ "category": 1 });
db.service_master.createIndex({ "isActive": 1 });

print("✓ service_master created with 4 documents");

// ========================================
// COLLECTION: policies (1 document)
// ========================================
print("\n[9/17] Creating policies collection...");

db.policies.drop();

db.policies.insertMany([
  {
    "_id": ObjectId("68d22435e40093c9fcc11759"),
    "policyNumber": "POL-2025-0003",
    "name": "New Config",
    "description": "New Config",
    "ownerPayer": "INSURER",
    "status": "ACTIVE",
    "effectiveFrom": ISODate("2025-07-03T00:00:00.000Z"),
    "effectiveTo": ISODate("2025-11-27T00:00:00.000Z"),
    "createdBy": "68ce7f937ca7c61fde3135f3",
    "createdAt": ISODate("2025-09-23T04:38:13.103Z"),
    "updatedAt": ISODate("2025-09-23T04:38:13.103Z"),
    "__v": 0
  }
]);

// Create indexes
db.policies.createIndex({ "policyNumber": 1 }, { unique: true });
db.policies.createIndex({ "status": 1 });

print("✓ policies created with 1 document");

// ========================================
// COLLECTION: plan_configs (1 document)
// ========================================
print("\n[10/17] Creating plan_configs collection...");

db.plan_configs.drop();

db.plan_configs.insertMany([
  {
    "_id": ObjectId("68d4155f91b40c36668345fd"),
    "policyId": ObjectId("68d22435e40093c9fcc11759"),
    "version": 4,
    "status": "PUBLISHED",
    "isCurrent": true,
    "benefits": {
      "CAT001": {
        "enabled": true,
        "annualLimit": 2000
      }
    },
    "wallet": {
      "totalAnnualAmount": 4000,
      "perClaimLimit": 0,
      "copay": {
        "mode": "PERCENT",
        "value": 0
      },
      "partialPaymentEnabled": false,
      "carryForward": {
        "enabled": false,
        "percent": 0,
        "months": 0
      },
      "topUpAllowed": false
    },
    "enabledServices": {
      "CON001": {
        "enabled": true
      }
    },
    "coveredRelationships": [
      "REL001",
      "REL002",
      "REL003"
    ],
    "memberConfigs": {
      "REL001": {
        "inheritFromPrimary": true
      },
      "REL002": {
        "inheritFromPrimary": true
      },
      "REL003": {
        "inheritFromPrimary": true
      }
    },
    "createdBy": "68ce7f937ca7c61fde3135f3",
    "updatedBy": "68ce7f937ca7c61fde3135f3",
    "createdAt": ISODate("2025-09-24T15:59:27.939Z"),
    "updatedAt": ISODate("2025-09-24T15:59:38.564Z"),
    "__v": 0,
    "publishedAt": ISODate("2025-09-24T15:59:32.356Z"),
    "publishedBy": "68ce7f937ca7c61fde3135f3"
  }
]);

// Create indexes
db.plan_configs.createIndex({ "policyId": 1, "version": 1 }, { unique: true });
db.plan_configs.createIndex({ "policyId": 1, "isCurrent": 1 });
db.plan_configs.createIndex({ "status": 1 });

print("✓ plan_configs created with 1 document");

// ========================================
// COLLECTION: users (4 documents)
// ========================================
print("\n[11/17] Creating users collection...");

db.users.drop();

db.users.insertMany([
  {
    "_id": ObjectId("68ce7f937ca7c61fde3135f3"),
    "userId": "USR-2025-0001",
    "uhid": "UHID001",
    "memberId": "MEM001",
    "employeeId": "EMP001",
    "relationship": "REL001",
    "name": {
      "firstName": "Super",
      "lastName": "Admin",
      "fullName": "Super Admin",
      "_id": ObjectId("68ce7f937ca7c61fde3135f4")
    },
    "email": "admin@opdwallet.com",
    "phone": "+919999999999",
    "dob": ISODate("1980-01-01T00:00:00.000Z"),
    "gender": "MALE",
    "address": {
      "line1": "123 Admin Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001",
      "_id": ObjectId("68ce7f937ca7c61fde3135f5")
    },
    "role": "SUPER_ADMIN",
    "status": "ACTIVE",
    "passwordHash": "$2b$12$pGwngTCBq9h6L8SWIroVPO7dpAueIyc.gqBNuJ24AMmMjjOJrWkwi",
    "mustChangePassword": false,
    "createdAt": ISODate("2025-09-20T10:18:59.266Z"),
    "updatedAt": ISODate("2025-09-23T07:04:35.485Z"),
    "__v": 0
  },
  {
    "_id": ObjectId("68ce7f937ca7c61fde3135fb"),
    "userId": "USR-2025-0002",
    "uhid": "UHID002",
    "memberId": "MEM002",
    "employeeId": "EMP002",
    "relationship": "REL001",
    "name": {
      "firstName": "John",
      "lastName": "Doe",
      "fullName": "John Doe",
      "_id": ObjectId("68ce7f937ca7c61fde3135fc")
    },
    "email": "john.doe@company.com",
    "phone": "+919876543210",
    "dob": ISODate("1990-05-15T00:00:00.000Z"),
    "gender": "MALE",
    "address": {
      "line1": "456 Employee Avenue",
      "line2": "Apartment 12B",
      "city": "Bangalore",
      "state": "Karnataka",
      "pincode": "560001",
      "_id": ObjectId("68ce7f937ca7c61fde3135fd")
    },
    "role": "MEMBER",
    "status": "ACTIVE",
    "passwordHash": "$2b$12$io0VkRVrRkj.Fz1uhq4bBut3nVyAbdTBtLtdXwz2CaqckoU76w/RG",
    "mustChangePassword": false,
    "createdAt": ISODate("2025-09-20T10:18:59.444Z"),
    "updatedAt": ISODate("2025-09-24T12:23:16.674Z"),
    "__v": 0,
    "corporateName": "Google Inc."
  },
  {
    "_id": ObjectId("68ce7f937ca7c61fde3135ff"),
    "userId": "USR-2025-0003",
    "uhid": "UHID003",
    "memberId": "MEM003",
    "relationship": "REL002",
    "primaryMemberId": "MEM002",
    "name": {
      "firstName": "Jane",
      "lastName": "Doe",
      "fullName": "Jane Doe",
      "_id": ObjectId("68d3df35740f4f04f2291527")
    },
    "email": "jane.doe@email.com",
    "phone": "+919876543211",
    "dob": ISODate("1992-08-20T00:00:00.000Z"),
    "gender": "FEMALE",
    "address": {
      "line1": "456 Employee Avenue",
      "line2": "Apartment 12B",
      "city": "Bangalore",
      "state": "Karnataka",
      "pincode": "560001",
      "_id": ObjectId("68d3df35740f4f04f2291528")
    },
    "role": "MEMBER",
    "status": "ACTIVE",
    "passwordHash": "$2b$12$NzWH/8cOjRgWlhqxhUBd.uMEmHoIyeOMrmFZxwqriXZ6TgH5/ggqO",
    "mustChangePassword": false,
    "createdAt": ISODate("2025-09-20T10:18:59.617Z"),
    "updatedAt": ISODate("2025-09-24T12:08:21.275Z"),
    "__v": 0,
    "corporateName": "Google Inc.",
    "updatedBy": "68ce7f937ca7c61fde3135f3"
  },
  {
    "_id": ObjectId("68d8dbbf3c628cae98b34a45"),
    "userId": "USR-2025-0004",
    "uhid": "OPS001",
    "memberId": "OPS001",
    "relationship": "SELF",
    "name": {
      "firstName": "Operations",
      "lastName": "User",
      "_id": ObjectId("68d8dbbf3c628cae98b34a46"),
      "fullName": "Operations User"
    },
    "email": "ops@opdwallet.com",
    "phone": "+919077349172",
    "role": "OPS",
    "status": "ACTIVE",
    "passwordHash": "$2b$12$QsSAT/gv5LL0mBBRruuame4SJYUgn9mY5Hi4ozYVsIrzryTWWH6xm",
    "mustChangePassword": false,
    "createdBy": "68ce7f937ca7c61fde3135f3",
    "createdAt": ISODate("2025-09-28T06:54:55.600Z"),
    "updatedAt": ISODate("2025-09-28T06:54:55.600Z"),
    "__v": 0
  }
]);

// Create indexes
db.users.createIndex({ "userId": 1 }, { unique: true });
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "memberId": 1 });
db.users.createIndex({ "employeeId": 1 }, { sparse: true });
db.users.createIndex({ "status": 1 });
db.users.createIndex({ "role": 1 });

print("✓ users created with 4 documents");

// ========================================
// COLLECTION: counters (2 documents)
// ========================================
print("\n[12/17] Creating counters collection...");

db.counters.drop();

db.counters.insertMany([
  {
    "_id": "policy",
    "seq": 3,
    "__v": 0
  },
  {
    "_id": "user",
    "seq": 4,
    "__v": 0
  }
]);

// Create index
db.counters.createIndex({ "_id": 1 }, { unique: true });

print("✓ counters created with 2 documents");

// ========================================
// COLLECTION: wallet_transactions (0 documents)
// ========================================
print("\n[13/17] Creating wallet_transactions collection...");

db.wallet_transactions.drop();
db.createCollection("wallet_transactions");

// Create indexes
db.wallet_transactions.createIndex({ "transactionId": 1 }, { unique: true });
db.wallet_transactions.createIndex({ "userWalletId": 1 });
db.wallet_transactions.createIndex({ "userId": 1, "createdAt": -1 });
db.wallet_transactions.createIndex({ "type": 1 });
db.wallet_transactions.createIndex({ "status": 1 });

print("✓ wallet_transactions created (empty)");

// ========================================
// COLLECTION: user_wallets (0 documents)
// ========================================
print("\n[14/17] Creating user_wallets collection...");

db.user_wallets.drop();
db.createCollection("user_wallets");

// Create indexes
db.user_wallets.createIndex({ "walletId": 1 }, { unique: true });
db.user_wallets.createIndex({ "userId": 1 });
db.user_wallets.createIndex({ "policyAssignmentId": 1 });

print("✓ user_wallets created (empty)");

// ========================================
// COLLECTION: userPolicyAssignments (0 documents)
// ========================================
print("\n[15/17] Creating userPolicyAssignments collection...");

db.userPolicyAssignments.drop();
db.createCollection("userPolicyAssignments");

// Create indexes
db.userPolicyAssignments.createIndex({ "userId": 1, "policyId": 1 }, { unique: true });
db.userPolicyAssignments.createIndex({ "policyId": 1 });
db.userPolicyAssignments.createIndex({ "status": 1 });

print("✓ userPolicyAssignments created (empty)");

// ========================================
// COLLECTION: appointments (0 documents)
// ========================================
print("\n[16/17] Creating appointments collection...");

db.appointments.drop();
db.createCollection("appointments");

// Create indexes
db.appointments.createIndex({ "appointmentId": 1 }, { unique: true });
db.appointments.createIndex({ "appointmentNumber": 1 }, { unique: true });
db.appointments.createIndex({ "userId": 1, "status": 1 });
db.appointments.createIndex({ "doctorId": 1, "appointmentDate": 1 });
db.appointments.createIndex({ "slotId": 1 });

print("✓ appointments created (empty)");

// ========================================
// COLLECTION: auditLogs (0 documents)
// ========================================
print("\n[17/17] Creating auditLogs collection...");

db.auditLogs.drop();
db.createCollection("auditLogs");

// Create indexes
db.auditLogs.createIndex({ "userId": 1, "timestamp": -1 });
db.auditLogs.createIndex({ "action": 1 });
db.auditLogs.createIndex({ "module": 1 });
db.auditLogs.createIndex({ "timestamp": 1 }, { expireAfterSeconds: 63072000 }); // 2 years TTL

print("✓ auditLogs created (empty)");

// ========================================
// COMPLETION SUMMARY
// ========================================
print("\n========================================");
print("Database replication completed successfully!");
print("========================================");
print("\nSummary:");
print("- Total Collections: 17");
print("- Total Documents: 66");
print("- Master Data:");
print("  • CUG Master: 8 documents");
print("  • Specialty Master: 9 documents");
print("  • Relationship Masters: 5 documents");
print("  • Category Master: 4 documents");
print("  • Service Master: 4 documents");
print("- Healthcare Data:");
print("  • Clinics: 5 documents");
print("  • Doctor Slots: 17 documents");
print("  • Doctors: 6 documents (with phone, email, registrationNumber, languages)");
print("- User Data:");
print("  • Users: 4 documents (including 1 OPS user)");
print("- Policy Data:");
print("  • Policies: 1 document");
print("  • Plan Configs: 1 document");
print("- Counter Data: 2 documents");
print("- Empty Collections: 5 (wallet_transactions, user_wallets, userPolicyAssignments, appointments, auditLogs)");
print("\nAll indexes created successfully!");
print("========================================");