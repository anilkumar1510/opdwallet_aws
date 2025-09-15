// MongoDB Secure Initialization Script
print('Starting MongoDB secure initialization...');

// Switch to admin database
db = db.getSiblingDB('admin');

// Create root user if not exists
try {
  db.createUser({
    user: process.env.MONGODB_ROOT_USERNAME || 'root',
    pwd: process.env.MONGODB_ROOT_PASSWORD || 'changeMe123!',
    roles: [
      { role: 'root', db: 'admin' }
    ]
  });
  print('Root user created');
} catch (e) {
  print('Root user already exists');
}

// Switch to application database
db = db.getSiblingDB('opd_wallet');

// Create application user
try {
  db.createUser({
    user: process.env.MONGODB_USERNAME || 'opduser',
    pwd: process.env.MONGODB_PASSWORD || 'changeMe456!',
    roles: [
      { role: 'readWrite', db: 'opd_wallet' },
      { role: 'dbAdmin', db: 'opd_wallet' }
    ]
  });
  print('Application user created');
} catch (e) {
  print('Application user already exists');
}

// Create indexes for performance (Rule #6)
db.users.createIndex({ email: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
db.users.createIndex({ phone: 1 }, { unique: true, sparse: true });
db.users.createIndex({ uhid: 1 }, { unique: true });
db.users.createIndex({ memberId: 1 }, { unique: true });
db.users.createIndex({ userId: 1 }, { unique: true });
db.users.createIndex({ role: 1, status: 1 });

db.policies.createIndex({ policyNumber: 1 }, { unique: true });
db.policies.createIndex({ status: 1, effectiveFrom: 1 });

db.userPolicyAssignments.createIndex({ userId: 1, status: 1 });
db.userPolicyAssignments.createIndex({ policyId: 1, status: 1 });
db.userPolicyAssignments.createIndex({ userId: 1, policyId: 1, effectiveFrom: 1 });

db.claims.createIndex({ claimId: 1 }, { unique: true });
db.claims.createIndex({ userId: 1, status: 1 });
db.claims.createIndex({ serviceDate: 1 });

db.transactions.createIndex({ transactionId: 1 }, { unique: true });
db.transactions.createIndex({ userId: 1, createdAt: -1 });

db.appointments.createIndex({ appointmentId: 1 }, { unique: true });
db.appointments.createIndex({ userId: 1, appointmentDate: 1 });

// Create audit log collection with TTL
db.createCollection('auditLogs');
db.auditLogs.createIndex({ createdAt: 1 }, { expireAfterSeconds: 63072000 }); // 2 years

print('Indexes created successfully');

// Insert test data with secure password hash
db.users.insertOne({
  userId: 'USR000001',
  uhid: 'UH000001',
  memberId: 'OPD000001',
  email: 'member@test.com',
  passwordHash: '$2b$12$YourSecureHashHere', // Will be updated
  role: 'MEMBER',
  relationship: 'SELF',
  name: {
    firstName: 'John',
    lastName: 'Doe',
    fullName: 'John Doe'
  },
  phone: '+1234567890',
  status: 'ACTIVE',
  mustChangePassword: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

print('MongoDB secure initialization completed');
