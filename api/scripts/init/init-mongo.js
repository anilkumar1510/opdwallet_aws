// MongoDB initialization script
// This runs when MongoDB container starts for the first time

db = db.getSiblingDB('opd_wallet_prod');

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ memberId: 1 }, { unique: true, sparse: true });
db.users.createIndex({ userId: 1 }, { unique: true });
db.users.createIndex({ role: 1, status: 1 });

db.policies.createIndex({ policyNumber: 1 }, { unique: true });
db.policies.createIndex({ status: 1 });

db.userPolicyAssignments.createIndex({ userId: 1, status: 1 });
db.userPolicyAssignments.createIndex({ policyId: 1, status: 1 });

// Create default admin user
db.users.insertOne({
  userId: "USR000001",
  email: "admin@test.com",
  passwordHash: "$2b$12$RZxKmM6j5kZv5.yF0I0XpuCJkKoSY1tpWY8uRZvR8nIHCgDsD1P2y", // Test123!
  role: "ADMIN",
  status: "ACTIVE",
  name: {
    firstName: "Admin",
    lastName: "User",
    fullName: "Admin User"
  },
  phone: "+1234567890",
  createdAt: new Date(),
  updatedAt: new Date()
});

// Create default member user
db.users.insertOne({
  userId: "USR000002",
  uhid: "UH000001",
  memberId: "OPD000001",
  email: "member@test.com",
  passwordHash: "$2b$12$RZxKmM6j5kZv5.yF0I0XpuCJkKoSY1tpWY8uRZvR8nIHCgDsD1P2y", // Test123!
  role: "MEMBER",
  status: "ACTIVE",
  relationship: "SELF",
  name: {
    firstName: "John",
    lastName: "Doe",
    fullName: "John Doe"
  },
  phone: "+1234567891",
  createdAt: new Date(),
  updatedAt: new Date()
});

// Create default policy
db.policies.insertOne({
  policyNumber: "POL000001",
  name: "Standard OPD Plan",
  description: "Basic outpatient coverage for employees",
  status: "ACTIVE",
  effectiveFrom: new Date(),
  ownerPayer: "Test Company Ltd",
  createdAt: new Date(),
  updatedAt: new Date()
});

// Initialize counters
db.counters.insertMany([
  { _id: "userId", seq: 2 },
  { _id: "policyId", seq: 1 },
  { _id: "claimId", seq: 0 },
  { _id: "appointmentId", seq: 0 }
]);

print("Database initialized successfully!");