// Quick Seed Script for OPD Wallet
// Run this with: docker exec opd-mongo-dev mongosh -u admin -p admin123 --authenticationDatabase admin opd_wallet quick-seed.js

print("🚀 Starting OPD Wallet Quick Seed...");

// 1. Create Category Master Data
print("📁 Creating category_master...");
db.category_master.insertMany([
  {
    categoryId: "CAT-CONS",
    code: "CONSULTATION",
    name: "Consultation",
    isActive: true,
    displayOrder: 1,
    description: "Doctor consultations - general and specialist",
    isAvailableOnline: true
  },
  {
    categoryId: "CAT-PHARM",
    code: "PHARMACY",
    name: "Pharmacy",
    isActive: true,
    displayOrder: 2,
    description: "Medicine and pharmaceutical products",
    isAvailableOnline: true
  },
  {
    categoryId: "CAT-DIAG",
    code: "DIAGNOSTICS",
    name: "Diagnostics",
    isActive: true,
    displayOrder: 3,
    description: "Lab tests and diagnostic procedures",
    isAvailableOnline: false
  },
  {
    categoryId: "CAT-DENT",
    code: "DENTAL",
    name: "Dental",
    isActive: true,
    displayOrder: 4,
    description: "Dental care and procedures",
    isAvailableOnline: false
  }
]);

// 2. Create Relationship Masters
print("👨‍👩‍👧‍👦 Creating relationship_masters...");
db.relationship_masters.insertMany([
  {
    relationshipCode: "SELF",
    relationshipName: "Self",
    displayName: "Self",
    description: "Primary policy holder",
    isActive: true,
    sortOrder: 1
  },
  {
    relationshipCode: "SPOUSE",
    relationshipName: "Spouse",
    displayName: "Spouse",
    description: "Husband or Wife",
    isActive: true,
    sortOrder: 2
  },
  {
    relationshipCode: "CHILD",
    relationshipName: "Child",
    displayName: "Child",
    description: "Son or Daughter",
    isActive: true,
    sortOrder: 3
  },
  {
    relationshipCode: "MOTHER",
    relationshipName: "Mother",
    displayName: "Mother",
    description: "Mother",
    isActive: true,
    sortOrder: 4
  },
  {
    relationshipCode: "FATHER",
    relationshipName: "Father",
    displayName: "Father",
    description: "Father",
    isActive: true,
    sortOrder: 5
  }
]);

// 3. Create Service Master Data
print("🏥 Creating service_master...");
db.service_master.insertMany([
  {
    code: "CONS-GP",
    name: "General Physician Consultation",
    description: "Consultation with a general physician",
    category: "CONSULTATION",
    isActive: true,
    coveragePercentage: 100,
    copayAmount: 0,
    requiresPreAuth: false,
    requiresReferral: false,
    waitingPeriodDays: 0,
    requiredDocuments: []
  },
  {
    code: "CONS-SPEC",
    name: "Specialist Consultation",
    description: "Consultation with a medical specialist",
    category: "CONSULTATION",
    isActive: true,
    coveragePercentage: 100,
    copayAmount: 100,
    requiresPreAuth: false,
    requiresReferral: true,
    waitingPeriodDays: 0,
    requiredDocuments: ["REFERRAL"]
  },
  {
    code: "PHARM-GEN",
    name: "Generic Medicines",
    description: "Generic pharmaceutical products",
    category: "PHARMACY",
    isActive: true,
    coveragePercentage: 100,
    copayAmount: 0,
    requiresPreAuth: false,
    requiresReferral: false,
    waitingPeriodDays: 0,
    requiredDocuments: ["PRESCRIPTION"]
  },
  {
    code: "DIAG-BLOOD",
    name: "Blood Tests",
    description: "Basic blood work and pathology tests",
    category: "DIAGNOSTICS",
    isActive: true,
    coveragePercentage: 100,
    copayAmount: 50,
    requiresPreAuth: false,
    requiresReferral: false,
    waitingPeriodDays: 0,
    requiredDocuments: ["PRESCRIPTION"]
  }
]);

// 4. Create Specialty Master
print("🩺 Creating specialty_master...");
db.specialty_master.insertMany([
  {
    specialtyId: "SPEC001",
    name: "General Physician",
    description: "General medical consultation",
    isActive: true
  },
  {
    specialtyId: "SPEC002",
    name: "Dermatologist",
    description: "Skin care specialist",
    isActive: true
  },
  {
    specialtyId: "SPEC003",
    name: "Cardiologist",
    description: "Heart specialist",
    isActive: true
  },
  {
    specialtyId: "SPEC004",
    name: "Pediatrician",
    description: "Child health specialist",
    isActive: true
  },
  {
    specialtyId: "SPEC005",
    name: "Gynecologist",
    description: "Women's health specialist",
    isActive: true
  }
]);

// 5. Create CUG Master
print("🏢 Creating cug_master...");
db.cug_master.insertMany([
  {
    cugId: "CUG001",
    code: "TECH_CORP",
    name: "Tech Corp India",
    description: "Technology company employees",
    isActive: true
  },
  {
    cugId: "CUG002",
    code: "FINANCE_LTD",
    name: "Finance Ltd",
    description: "Financial services company",
    isActive: true
  }
]);

// 6. Create Counters
print("🔢 Creating counters...");
db.counters.insertMany([
  { _id: "userId", sequence_value: 1 },
  { _id: "policyId", sequence_value: 1 },
  { _id: "assignmentId", sequence_value: 1 },
  { _id: "doctorId", sequence_value: 1 },
  { _id: "clinicId", sequence_value: 1 },
  { _id: "appointmentId", sequence_value: 1 }
]);

// 7. Create Admin User (hashed password for 'admin123')
print("👤 Creating admin user...");
db.users.insertOne({
  userId: "USR001",
  uhid: "UH001",
  memberId: "MEM001",
  employeeId: "EMP001",
  relationship: "SELF",
  name: {
    firstName: "Admin",
    lastName: "User",
    fullName: "Admin User"
  },
  email: "admin@opdwallet.com",
  phone: "+919876543210",
  role: "ADMIN",
  status: "ACTIVE",
  // Password: admin123 (bcrypt hash with 12 rounds)
  passwordHash: "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIeWU2u3ZG",
  mustChangePassword: false,
  createdAt: new Date(),
  updatedAt: new Date()
});

print("✅ Quick seed completed successfully!");
print("");
print("📊 Collections created:");
print("  - category_master: " + db.category_master.countDocuments());
print("  - relationship_masters: " + db.relationship_masters.countDocuments());
print("  - service_master: " + db.service_master.countDocuments());
print("  - specialty_master: " + db.specialty_master.countDocuments());
print("  - cug_master: " + db.cug_master.countDocuments());
print("  - counters: " + db.counters.countDocuments());
print("  - users: " + db.users.countDocuments());
print("");
print("🔐 Admin Login Credentials:");
print("  Email: admin@opdwallet.com");
print("  Password: admin123");
print("");
print("🎉 You can now refresh MongoDB Compass to see the data!");
