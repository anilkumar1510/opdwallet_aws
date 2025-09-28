// ========================================
// MongoDB Database Replica Script
// Database: opd_wallet
// Generated: 2025-09-28
// Total Collections: 15
// Total Documents: 44
// ========================================
//
// This script recreates the entire opd_wallet database with:
// - All 15 collections
// - All 44 documents
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
print("Total Collections: 15");
print("Total Documents: 44");
print("========================================");

// ========================================
// COLLECTION: cug_master (8 documents)
// ========================================
print("\n[1/15] Creating cug_master collection...");

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
print("\n[2/15] Creating specialty_master collection...");

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
// COLLECTION: relationship_masters (5 documents)
// ========================================
print("\n[3/15] Creating relationship_masters collection...");

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
print("\n[4/15] Creating category_master collection...");

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
print("\n[5/15] Creating service_master collection...");

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
print("\n[6/15] Creating policies collection...");

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
print("\n[7/15] Creating plan_configs collection...");

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
// COLLECTION: users (3 documents)
// ========================================
print("\n[8/15] Creating users collection...");

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
  }
]);

// Create indexes
db.users.createIndex({ "userId": 1 }, { unique: true });
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "memberId": 1 });
db.users.createIndex({ "employeeId": 1 }, { sparse: true });
db.users.createIndex({ "status": 1 });
db.users.createIndex({ "role": 1 });

print("✓ users created with 3 documents");

// ========================================
// COLLECTION: doctors (4 documents)
// ========================================
print("\n[9/15] Creating doctors collection...");

db.doctors.drop();

db.doctors.insertMany([
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
    "insuranceAccepted": [
      "MCLTech"
    ],
    "requiresConfirmation": true,
    "allowDirectBooking": false,
    "availableSlots": [
      {
        "date": "2025-09-28",
        "slots": [
          "09:00 AM",
          "10:00 AM",
          "11:00 AM",
          "02:00 PM",
          "03:00 PM"
        ]
      },
      {
        "date": "2025-09-29",
        "slots": [
          "09:00 AM",
          "10:00 AM",
          "11:00 AM",
          "02:00 PM",
          "03:00 PM"
        ]
      }
    ],
    "isActive": true,
    "availableOffline": true,
    "availableOnline": true
  },
  {
    "_id": ObjectId("68d8ab8e6cd3c49c7e4f87ff"),
    "doctorId": "DOC002",
    "name": "Dr. Rajesh Madan",
    "profilePhoto": "",
    "qualifications": "MBBS, MD",
    "specializations": [
      "General Medicine",
      "DNB - Cardiology",
      "Fellowship in Interventional Cardiology"
    ],
    "specialtyId": "SPEC001",
    "specialty": "General Physician",
    "experienceYears": 14,
    "rating": 4.5,
    "reviewCount": 98,
    "clinics": [
      {
        "clinicId": "CLINIC002",
        "name": "Max Hospital",
        "address": "Saket, New Delhi",
        "city": "Delhi (NCR)",
        "state": "Delhi",
        "pincode": "110017",
        "location": {
          "latitude": 28.5244,
          "longitude": 77.2066
        },
        "distanceKm": 22.34,
        "consultationFee": 800
      }
    ],
    "consultationFee": 800,
    "cashlessAvailable": true,
    "insuranceAccepted": [
      "MCLTech"
    ],
    "requiresConfirmation": false,
    "allowDirectBooking": true,
    "availableSlots": [
      {
        "date": "2025-09-28",
        "slots": [
          "10:00 AM",
          "11:00 AM",
          "04:00 PM",
          "05:00 PM"
        ]
      },
      {
        "date": "2025-09-29",
        "slots": [
          "10:00 AM",
          "11:00 AM",
          "04:00 PM",
          "05:00 PM"
        ]
      }
    ],
    "isActive": true,
    "availableOffline": true,
    "availableOnline": true
  },
  {
    "_id": ObjectId("68d8ab8e6cd3c49c7e4f8800"),
    "doctorId": "DOC003",
    "name": "Dr. Priya Sharma",
    "profilePhoto": "",
    "qualifications": "MBBS, MD (Dermatology)",
    "specializations": [
      "Dermatology",
      "Cosmetology",
      "Hair Transplant"
    ],
    "specialtyId": "SPEC004",
    "specialty": "Dermatologist",
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
    "insuranceAccepted": [
      "MCLTech"
    ],
    "requiresConfirmation": false,
    "allowDirectBooking": true,
    "availableSlots": [
      {
        "date": "2025-09-28",
        "slots": [
          "09:30 AM",
          "10:30 AM",
          "11:30 AM",
          "03:00 PM",
          "04:00 PM"
        ]
      },
      {
        "date": "2025-09-29",
        "slots": [
          "09:30 AM",
          "10:30 AM",
          "11:30 AM",
          "03:00 PM",
          "04:00 PM"
        ]
      }
    ],
    "isActive": true,
    "availableOffline": true,
    "availableOnline": true
  },
  {
    "_id": ObjectId("68d8ab8e6cd3c49c7e4f8801"),
    "doctorId": "DOC004",
    "name": "Dr. Anjali Verma",
    "profilePhoto": "",
    "qualifications": "MBBS, MD (Obstetrics & Gynecology)",
    "specializations": [
      "Gynecology",
      "Obstetrics",
      "Infertility"
    ],
    "specialtyId": "SPEC002",
    "specialty": "Gynaecologist",
    "experienceYears": 18,
    "rating": 4.9,
    "reviewCount": 342,
    "clinics": [
      {
        "clinicId": "CLINIC004",
        "name": "Apollo Hospital",
        "address": "Jasola, New Delhi",
        "city": "Delhi (NCR)",
        "state": "Delhi",
        "pincode": "110025",
        "location": {
          "latitude": 28.5403,
          "longitude": 77.2717
        },
        "distanceKm": 15.2,
        "consultationFee": 1500
      }
    ],
    "consultationFee": 1500,
    "cashlessAvailable": true,
    "insuranceAccepted": [
      "MCLTech"
    ],
    "requiresConfirmation": true,
    "allowDirectBooking": false,
    "availableSlots": [
      {
        "date": "2025-09-28",
        "slots": [
          "11:00 AM",
          "12:00 PM",
          "02:00 PM",
          "03:00 PM"
        ]
      },
      {
        "date": "2025-09-29",
        "slots": [
          "11:00 AM",
          "12:00 PM",
          "02:00 PM",
          "03:00 PM"
        ]
      }
    ],
    "isActive": true,
    "availableOffline": true,
    "availableOnline": true
  }
]);

// Create indexes
db.doctors.createIndex({ "doctorId": 1 }, { unique: true });
db.doctors.createIndex({ "specialtyId": 1, "isActive": 1 });
db.doctors.createIndex({ "clinics.city": 1 });

print("✓ doctors created with 4 documents");

// ========================================
// COLLECTION: appointments (3 documents)
// ========================================
print("\n[10/15] Creating appointments collection...");

db.appointments.drop();

db.appointments.insertMany([
  {
    "_id": ObjectId("68d8be547598aaf2c62c42c7"),
    "appointmentId": "APT34078",
    "appointmentNumber": "34078",
    "userId": ObjectId("68ce7f937ca7c61fde3135fb"),
    "patientName": "John Doe",
    "patientId": "68ce7f937ca7c61fde3135fb",
    "doctorId": "DOC001",
    "doctorName": "Dr. Vikas Mittal",
    "specialty": "General Physician",
    "clinicId": "CLINIC001",
    "clinicName": "Manipal Hospital",
    "clinicAddress": "Sector 6, Dwarka, New Delhi",
    "appointmentType": "IN_CLINIC",
    "appointmentDate": "2025-09-28",
    "timeSlot": "10:00 AM",
    "consultationFee": 1000,
    "status": "PENDING_CONFIRMATION",
    "requestedAt": ISODate("2025-09-28T04:49:24.134Z"),
    "paymentStatus": "PENDING",
    "amountPaid": 0,
    "coveredByInsurance": true,
    "createdAt": ISODate("2025-09-28T04:49:24.138Z"),
    "updatedAt": ISODate("2025-09-28T04:49:24.138Z"),
    "__v": 0
  },
  {
    "_id": ObjectId("68d8c3b7c3ca66e96a35f082"),
    "appointmentId": "APT34079",
    "appointmentNumber": "34079",
    "userId": ObjectId("68ce7f937ca7c61fde3135fb"),
    "patientName": "John Doe",
    "patientId": "SELF",
    "doctorId": "DOC004",
    "doctorName": "Dr. Anjali Verma",
    "specialty": "Gynaecologist",
    "clinicId": "",
    "clinicName": "",
    "clinicAddress": "",
    "appointmentType": "ONLINE",
    "appointmentDate": "2025-09-28",
    "timeSlot": "Immediate",
    "consultationFee": 1500,
    "status": "PENDING_CONFIRMATION",
    "requestedAt": ISODate("2025-09-28T05:12:23.851Z"),
    "paymentStatus": "PENDING",
    "amountPaid": 0,
    "coveredByInsurance": true,
    "contactNumber": "+919876543210",
    "callPreference": "BOTH",
    "createdAt": ISODate("2025-09-28T05:12:23.860Z"),
    "updatedAt": ISODate("2025-09-28T05:12:23.860Z"),
    "__v": 0
  },
  {
    "_id": ObjectId("68d8c3d7c3ca66e96a35f0cd"),
    "appointmentId": "APT34080",
    "appointmentNumber": "34080",
    "userId": ObjectId("68ce7f937ca7c61fde3135fb"),
    "patientName": "John Doe",
    "patientId": "SELF",
    "doctorId": "DOC001",
    "doctorName": "Dr. Vikas Mittal",
    "specialty": "General Physician",
    "clinicId": "",
    "clinicName": "",
    "clinicAddress": "",
    "appointmentType": "ONLINE",
    "appointmentDate": "2025-09-28",
    "timeSlot": "Immediate",
    "consultationFee": 1000,
    "status": "PENDING_CONFIRMATION",
    "requestedAt": ISODate("2025-09-28T05:12:55.296Z"),
    "paymentStatus": "PENDING",
    "amountPaid": 0,
    "coveredByInsurance": true,
    "contactNumber": "+919876543210",
    "callPreference": "BOTH",
    "createdAt": ISODate("2025-09-28T05:12:55.299Z"),
    "updatedAt": ISODate("2025-09-28T05:12:55.299Z"),
    "__v": 0
  }
]);

// Create indexes
db.appointments.createIndex({ "appointmentId": 1 }, { unique: true });
db.appointments.createIndex({ "appointmentNumber": 1 }, { unique: true });
db.appointments.createIndex({ "userId": 1, "status": 1 });
db.appointments.createIndex({ "doctorId": 1, "appointmentDate": 1 });

print("✓ appointments created with 3 documents");

// ========================================
// COLLECTION: counters (2 documents)
// ========================================
print("\n[11/15] Creating counters collection...");

db.counters.drop();

db.counters.insertMany([
  {
    "_id": "policy",
    "seq": 3,
    "__v": 0
  },
  {
    "_id": "user",
    "seq": 3,
    "__v": 0
  }
]);

// Create index
db.counters.createIndex({ "_id": 1 }, { unique: true });

print("✓ counters created with 2 documents");

// ========================================
// COLLECTION: wallet_transactions (0 documents)
// ========================================
print("\n[12/15] Creating wallet_transactions collection...");

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
print("\n[13/15] Creating user_wallets collection...");

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
print("\n[14/15] Creating userPolicyAssignments collection...");

db.userPolicyAssignments.drop();
db.createCollection("userPolicyAssignments");

// Create indexes
db.userPolicyAssignments.createIndex({ "userId": 1, "policyId": 1 }, { unique: true });
db.userPolicyAssignments.createIndex({ "policyId": 1 });
db.userPolicyAssignments.createIndex({ "status": 1 });

print("✓ userPolicyAssignments created (empty)");

// ========================================
// COLLECTION: auditLogs (0 documents)
// ========================================
print("\n[15/15] Creating auditLogs collection...");

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
print("- Total Collections: 15");
print("- Total Documents: 44");
print("- Master Data: 30 documents");
print("- User Data: 3 documents");
print("- Doctor Data: 4 documents");
print("- Appointment Data: 3 documents");
print("- Policy Data: 2 documents");
print("- Counter Data: 2 documents");
print("- Empty Collections: 4 (wallet_transactions, user_wallets, userPolicyAssignments, auditLogs)");
print("\nAll indexes created successfully!");
print("========================================");