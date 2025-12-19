import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:admin123@mongo:27017/opd_wallet?authSource=admin';

// Helper to generate IDs
const generateId = (prefix: string, num: number) => `${prefix}-${String(num).padStart(4, '0')}`;

async function seedDatabase() {
  console.log('🚀 Starting comprehensive database seeding...\n');

  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db!;

    // Drop all existing collections
    console.log('🗑️  Dropping all existing collections...');
    const collections = await db.listCollections().toArray();
    for (const collection of collections) {
      await db.dropCollection(collection.name);
      console.log(`   Dropped: ${collection.name}`);
    }
    console.log('✅ All collections dropped\n');

    // ============================================================
    // TIER 0: System & Master Data (No Dependencies)
    // ============================================================
    console.log('📊 TIER 0: Seeding System & Master Data...\n');

    // 1. Counters
    console.log('   [1/9] Seeding counters...');
    await db.collection('counters').insertMany([
      { _id: 'userId' as any, seq: 3 },
      { _id: 'policyNumber' as any, seq: 1 },
      { _id: 'assignmentId' as any, seq: 2 },
      { _id: 'appointmentId' as any, seq: 5 },
      { _id: 'claimId' as any, seq: 1 },
      { _id: 'labPrescriptionId' as any, seq: 1 },
      { _id: 'labCartId' as any, seq: 1 },
      { _id: 'labOrderId' as any, seq: 1 },
      { _id: 'paymentId' as any, seq: 1 },
      { _id: 'transactionId' as any, seq: 1 },
    ]);
    console.log('   ✅ Counters seeded');

    // 2. Category Master
    console.log('   [2/9] Seeding category_master...');
    await db.collection('category_master').insertMany([
      { categoryId: 'CAT001', code: 'CONSULTATION', name: 'Consultation', isActive: true, displayOrder: 1, description: 'Doctor consultations', isAvailableOnline: true },
      { categoryId: 'CAT002', code: 'DIAGNOSTICS', name: 'Diagnostics', isActive: true, displayOrder: 2, description: 'Diagnostic tests and scans', isAvailableOnline: false },
      { categoryId: 'CAT003', code: 'PHARMACY', name: 'Pharmacy', isActive: true, displayOrder: 3, description: 'Medicines and prescriptions', isAvailableOnline: false },
      { categoryId: 'CAT004', code: 'DENTAL', name: 'Dental Care', isActive: true, displayOrder: 4, description: 'Dental treatments', isAvailableOnline: false },
      { categoryId: 'CAT005', code: 'VISION', name: 'Vision Care', isActive: true, displayOrder: 5, description: 'Eye care and optical', isAvailableOnline: false },
      { categoryId: 'CAT006', code: 'WELLNESS', name: 'Wellness', isActive: true, displayOrder: 6, description: 'Wellness and preventive care', isAvailableOnline: true },
    ]);
    console.log('   ✅ Category master seeded');

    // 3. Relationship Master
    console.log('   [3/9] Seeding relationship_masters...');
    await db.collection('relationship_masters').insertMany([
      { relationshipCode: 'REL001', relationshipName: 'Self', displayName: 'Self', isActive: true, sortOrder: 1, createdAt: new Date(), updatedAt: new Date() },
      { relationshipCode: 'REL002', relationshipName: 'Spouse', displayName: 'Spouse', isActive: true, sortOrder: 2, createdAt: new Date(), updatedAt: new Date() },
      { relationshipCode: 'SON', relationshipName: 'Son', displayName: 'Son', isActive: true, sortOrder: 3, createdAt: new Date(), updatedAt: new Date() },
      { relationshipCode: 'DAUGHTER', relationshipName: 'Daughter', displayName: 'Daughter', isActive: true, sortOrder: 4, createdAt: new Date(), updatedAt: new Date() },
      { relationshipCode: 'REL004', relationshipName: 'Father', displayName: 'Father', isActive: true, sortOrder: 5, createdAt: new Date(), updatedAt: new Date() },
      { relationshipCode: 'REL005', relationshipName: 'Mother', displayName: 'Mother', isActive: true, sortOrder: 6, createdAt: new Date(), updatedAt: new Date() },
    ]);
    console.log('   ✅ Relationship masters seeded');

    // 4. CUG Master
    console.log('   [4/9] Seeding cug_master...');
    await db.collection('cug_master').insertMany([
      { cugId: 'CUG001', code: 'TECHCORP', name: 'Tech Corp Employees', isActive: true, displayOrder: 1, description: 'Corporate employees group', createdAt: new Date(), updatedAt: new Date() },
    ]);
    console.log('   ✅ CUG master seeded');

    // 5. Service Master
    console.log('   [5/9] Seeding service_master...');
    await db.collection('service_master').insertMany([
      { code: 'CONSULT_GP', name: 'General Physician Consultation', category: 'CONSULTATION', isActive: true, coveragePercentage: 100, copayAmount: 0, requiresPreAuth: false, requiresReferral: false, waitingPeriodDays: 0, requiredDocuments: [], createdAt: new Date(), updatedAt: new Date() },
      { code: 'CONSULT_SPECIALIST', name: 'Specialist Consultation', category: 'CONSULTATION', isActive: true, coveragePercentage: 100, copayAmount: 0, requiresPreAuth: false, requiresReferral: false, waitingPeriodDays: 0, requiredDocuments: [], createdAt: new Date(), updatedAt: new Date() },
    ]);
    console.log('   ✅ Service master seeded');

    // 6. Specialty Master
    console.log('   [6/9] Seeding specialty_master...');
    const specialties = await db.collection('specialty_master').insertMany([
      { specialtyId: 'SPEC001', code: 'GENERAL', name: 'General Medicine', description: 'General physicians', icon: '🏥', isActive: true, displayOrder: 1, createdAt: new Date(), updatedAt: new Date() },
      { specialtyId: 'SPEC002', code: 'CARDIO', name: 'Cardiology', description: 'Heart specialists', icon: '❤️', isActive: true, displayOrder: 2, createdAt: new Date(), updatedAt: new Date() },
      { specialtyId: 'SPEC003', code: 'DERMAT', name: 'Dermatology', description: 'Skin specialists', icon: '🩺', isActive: true, displayOrder: 3, createdAt: new Date(), updatedAt: new Date() },
      { specialtyId: 'SPEC004', code: 'PEDIA', name: 'Pediatrics', description: 'Child specialists', icon: '👶', isActive: true, displayOrder: 4, createdAt: new Date(), updatedAt: new Date() },
    ]);
    console.log('   ✅ Specialty master seeded');

    // 7. Medicine Database
    console.log('   [7/9] Seeding medicine_database...');
    await db.collection('medicine_database').insertMany([
      { genericName: 'Paracetamol', brandNames: ['Crocin', 'Dolo'], form: 'Tablet', strength: '500mg', searchText: 'paracetamol crocin dolo fever pain', isActive: true },
      { genericName: 'Amoxicillin', brandNames: ['Amoxil', 'Moxikind'], form: 'Capsule', strength: '500mg', searchText: 'amoxicillin amoxil antibiotic infection', isActive: true },
      { genericName: 'Cetirizine', brandNames: ['Zyrtec', 'Alerid'], form: 'Tablet', strength: '10mg', searchText: 'cetirizine zyrtec allergy antihistamine', isActive: true },
    ]);
    console.log('   ✅ Medicine database seeded');

    // 8. Diagnosis Database
    console.log('   [8/9] Seeding diagnosis_database...');
    await db.collection('diagnosis_database').insertMany([
      { diagnosisName: 'Common Cold', icdCode: 'J00', category: 'Respiratory', description: 'Viral upper respiratory infection', commonSymptoms: ['Cough', 'Runny nose', 'Sore throat'], searchText: 'common cold viral infection cough', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { diagnosisName: 'Hypertension', icdCode: 'I10', category: 'Cardiovascular', description: 'High blood pressure', commonSymptoms: ['Headache', 'Dizziness'], searchText: 'hypertension blood pressure bp high', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { diagnosisName: 'Type 2 Diabetes', icdCode: 'E11', category: 'Endocrine', description: 'Diabetes mellitus type 2', commonSymptoms: ['Increased thirst', 'Frequent urination', 'Fatigue'], searchText: 'diabetes sugar blood glucose', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    ]);
    console.log('   ✅ Diagnosis database seeded');

    // 9. Symptom Database
    console.log('   [9/9] Seeding symptom_database...');
    await db.collection('symptom_database').insertMany([
      { symptomName: 'Fever', category: 'General', severityLevels: ['Mild', 'Moderate', 'Severe'], relatedConditions: ['Common Cold', 'Flu'], searchText: 'fever temperature', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { symptomName: 'Cough', category: 'Respiratory', severityLevels: ['Mild', 'Moderate', 'Severe'], relatedConditions: ['Common Cold', 'Bronchitis'], searchText: 'cough dry wet phlegm', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { symptomName: 'Headache', category: 'Neurological', severityLevels: ['Mild', 'Moderate', 'Severe'], relatedConditions: ['Migraine', 'Tension headache'], searchText: 'headache pain head', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    ]);
    console.log('   ✅ Symptom database seeded\n');

    // ============================================================
    // TIER 1: Core Business Entities
    // ============================================================
    console.log('📊 TIER 1: Seeding Core Business Entities...\n');

    // 10. Policies
    console.log('   [1/5] Seeding policies...');
    const policies = await db.collection('policies').insertMany([
      {
        policyNumber: 'POL-2025-0001',
        name: 'Standard Health Plan',
        description: 'Basic health coverage for employees',
        ownerPayer: 'CORPORATE',
        corporateName: 'Tech Corp',
        status: 'ACTIVE',
        effectiveFrom: new Date('2025-01-01'),
        effectiveTo: new Date('2025-12-31'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const policyId = policies.insertedIds[0];
    console.log('   ✅ Policies seeded');

    // 11. Clinics
    console.log('   [2/5] Seeding clinics...');
    const clinics = await db.collection('clinics').insertMany([
      {
        clinicId: 'CLN-001',
        name: 'City Health Clinic',
        address: { line1: '123 Main Street', line2: 'Near Park', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', country: 'India' },
        location: { latitude: 19.0760, longitude: 72.8777 },
        contactNumber: '+91-9876543210',
        email: 'contact@cityhealthclinic.com',
        operatingHours: {
          monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
          tuesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
          wednesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
          thursday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
          friday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
          saturday: { isOpen: true, openTime: '09:00', closeTime: '14:00' },
          sunday: { isOpen: false },
        },
        facilities: ['X-Ray', 'Pharmacy', 'Lab'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    console.log('   ✅ Clinics seeded');

    // 12. Doctors
    console.log('   [3/5] Seeding doctors...');
    const hashedPassword = await bcrypt.hash('doctor123', 10);
    const doctors = await db.collection('doctors').insertMany([
      {
        doctorId: 'DOC-001',
        name: 'Dr. Rajesh Sharma',
        profilePhoto: '/images/doctors/dr-sharma.jpg',
        qualifications: 'MBBS, MD',
        specializations: ['General Medicine'],
        specialtyId: 'SPEC001',
        specialty: 'General Medicine',
        experienceYears: 15,
        rating: 4.5,
        reviewCount: 150,
        phone: '+91-9876543211',
        email: 'doctor@opdwallet.com',
        password: hashedPassword,
        role: 'DOCTOR',
        registrationNumber: 'MCI-12345',
        languages: ['English', 'Hindi'],
        isActive: true,
        clinics: [{ clinicId: 'CLN-001', clinicName: 'City Health Clinic' }],
        consultationFee: 500,
        availableOnline: true,
        availableOffline: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        doctorId: 'DOC-002',
        name: 'Dr. Priya Patel',
        profilePhoto: '/images/doctors/dr-patel.jpg',
        qualifications: 'MBBS, MD (Cardiology)',
        specializations: ['Cardiology'],
        specialtyId: 'SPEC002',
        specialty: 'Cardiology',
        experienceYears: 12,
        rating: 4.7,
        reviewCount: 200,
        phone: '+91-9876543212',
        email: 'priya.patel@opdwallet.com',
        password: hashedPassword,
        role: 'DOCTOR',
        registrationNumber: 'MCI-12346',
        languages: ['English', 'Hindi', 'Gujarati'],
        isActive: true,
        clinics: [{ clinicId: 'CLN-001', clinicName: 'City Health Clinic' }],
        consultationFee: 800,
        availableOnline: true,
        availableOffline: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    console.log('   ✅ Doctors seeded');

    // 13. Lab Vendors
    console.log('   [4/5] Seeding lab_vendors...');
    const labVendors = await db.collection('lab_vendors').insertMany([
      {
        vendorId: 'LABV-001',
        name: 'PathLab Diagnostics',
        code: 'PATHLAB',
        contactInfo: { phone: '+91-9876543220', email: 'contact@pathlab.com', address: 'Mumbai, Maharashtra' },
        serviceablePincodes: ['400001', '400002', '400003', '400051'],
        homeCollection: true,
        centerVisit: true,
        homeCollectionCharges: 50,
        description: 'Leading diagnostic center',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const labVendorId = labVendors.insertedIds[0];
    console.log('   ✅ Lab vendors seeded');

    // 14. Lab Services
    console.log('   [5/5] Seeding lab_services...');
    const labServices = await db.collection('lab_services').insertMany([
      {
        serviceId: 'LABS-001',
        code: 'CBC',
        name: 'Complete Blood Count',
        category: 'PATHOLOGY',
        description: 'Comprehensive blood test',
        sampleType: 'Blood',
        preparationInstructions: 'Fasting not required',
        isActive: true,
        displayOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        serviceId: 'LABS-002',
        code: 'LIPID',
        name: 'Lipid Profile',
        category: 'PATHOLOGY',
        description: 'Cholesterol and triglycerides test',
        sampleType: 'Blood',
        preparationInstructions: '12 hours fasting required',
        isActive: true,
        displayOrder: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const labServiceId1 = labServices.insertedIds[0];
    const labServiceId2 = labServices.insertedIds[1];
    console.log('   ✅ Lab services seeded\n');

    // ============================================================
    // TIER 2: Users
    // ============================================================
    console.log('📊 TIER 2: Seeding Users...\n');

    console.log('   [1/1] Seeding users...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const userPassword = await bcrypt.hash('user123', 10);
    const tpaPassword = await bcrypt.hash('tpa123', 10);

    const users = await db.collection('users').insertMany([
      {
        userId: 'USR-0001',
        uhid: 'UHID-0001',
        memberId: 'MEM-0001',
        employeeId: 'EMP-0001',
        name: { firstName: 'Admin', lastName: 'User', fullName: 'Admin User' },
        email: 'admin@opdwallet.com',
        phone: '+91-9999999999',
        dob: new Date('1985-01-01'),
        gender: 'MALE',
        bloodGroup: 'O+',
        corporateName: 'Tech Corp',
        role: 'ADMIN',
        status: 'ACTIVE',
        passwordHash: adminPassword,
        mustChangePassword: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: 'USR-0002',
        uhid: 'UHID-0002',
        memberId: 'MEM-0002',
        employeeId: 'EMP-0002',
        relationship: 'SELF',
        name: { firstName: 'Test', lastName: 'User', fullName: 'Test User' },
        email: 'user@gmail.com',
        phone: '+91-9876543200',
        dob: new Date('1990-05-15'),
        gender: 'MALE',
        bloodGroup: 'B+',
        corporateName: 'Tech Corp',
        role: 'MEMBER',
        status: 'ACTIVE',
        passwordHash: userPassword,
        mustChangePassword: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: 'USR-0003',
        uhid: 'UHID-0003',
        memberId: 'MEM-0002',
        relationship: 'SPOUSE',
        primaryMemberId: 'MEM-0002',
        name: { firstName: 'Jane', lastName: 'User', fullName: 'Jane User' },
        email: 'jane.user@gmail.com',
        phone: '+91-9876543201',
        dob: new Date('1992-08-20'),
        gender: 'FEMALE',
        bloodGroup: 'A+',
        corporateName: 'Tech Corp',
        role: 'MEMBER',
        status: 'ACTIVE',
        passwordHash: userPassword,
        mustChangePassword: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: 'USR-TPA-001',
        uhid: 'UHID-TPA-001',
        memberId: 'MEM-TPA-001',
        name: { firstName: 'TPA', lastName: 'Admin', fullName: 'TPA Admin' },
        email: 'tpa@opdwallet.com',
        phone: '+91-9999999998',
        role: 'TPA_ADMIN',
        status: 'ACTIVE',
        passwordHash: tpaPassword,
        mustChangePassword: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const userId1 = users.insertedIds[0]; // Admin
    const userId2 = users.insertedIds[1]; // Test User (user@gmail.com)
    const userId3 = users.insertedIds[2]; // Spouse
    const tpaUserId = users.insertedIds[3]; // TPA Admin
    console.log('   ✅ Users seeded (including user@gmail.com)\n');

    // ============================================================
    // TIER 3: User-Related Data
    // ============================================================
    console.log('📊 TIER 3: Seeding User-Related Data...\n');

    // 16. Addresses
    console.log('   [1/3] Seeding addresses...');
    const addresses = await db.collection('addresses').insertMany([
      {
        addressId: 'ADDR-001',
        userId: userId2,
        addressType: 'HOME',
        addressLine1: '123 Test Street',
        addressLine2: 'Near Main Market',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        landmark: 'Opposite Bank',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        addressId: 'ADDR-002',
        userId: userId2,
        addressType: 'WORK',
        addressLine1: 'Tech Corp Office',
        addressLine2: 'Business Park',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400051',
        landmark: 'Tower A',
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const addressId1 = addresses.insertedIds[0];
    console.log('   ✅ Addresses seeded');

    // 17. User Policy Assignments
    console.log('   [2/3] Seeding userPolicyAssignments...');
    const assignments = await db.collection('userPolicyAssignments').insertMany([
      {
        assignmentId: 'ASSGN-001',
        userId: userId2,
        policyId: policyId,
        effectiveFrom: new Date('2025-01-01'),
        effectiveTo: new Date('2025-12-31'),
        isActive: true,
        relationshipId: 'SELF',
        primaryMemberId: 'MEM-0002',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        assignmentId: 'ASSGN-002',
        userId: userId3,
        policyId: policyId,
        effectiveFrom: new Date('2025-01-01'),
        effectiveTo: new Date('2025-12-31'),
        isActive: true,
        relationshipId: 'SPOUSE',
        primaryMemberId: 'MEM-0002',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const assignmentId1 = assignments.insertedIds[0];
    const assignmentId2 = assignments.insertedIds[1];
    console.log('   ✅ User policy assignments seeded');

    // 18. Plan Configs
    console.log('   [3/3] Seeding plan_configs...');
    await db.collection('plan_configs').insertMany([
      {
        policyId: policyId,
        version: 1,
        status: 'PUBLISHED',
        isCurrent: true,
        benefits: {
          'in-clinic-consultation': { enabled: true, claimEnabled: true, vasEnabled: true, annualLimit: 50000, visitLimit: 10 },
          'online-consultation': { enabled: true, claimEnabled: true, vasEnabled: true, annualLimit: 20000, visitLimit: 20 },
          diagnostics: { enabled: true, claimEnabled: true, vasEnabled: true, annualLimit: 30000, rxRequired: true },
          pharmacy: { enabled: true, claimEnabled: true, vasEnabled: false, annualLimit: 25000, rxRequired: true },
        },
        wallet: {
          totalAnnualAmount: 100000,
          perClaimLimit: 10000,
          copay: { mode: 'PERCENT', value: 10 },
          partialPaymentEnabled: true,
          carryForward: { enabled: false },
          topUpAllowed: false,
        },
        coveredRelationships: ['SELF', 'SPOUSE', 'SON', 'DAUGHTER'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    console.log('   ✅ Plan configs seeded\n');

    // ============================================================
    // TIER 4: Financial Core
    // ============================================================
    console.log('📊 TIER 4: Seeding Financial Core...\n');

    // 19. User Wallets
    console.log('   [1/2] Seeding user_wallets...');
    const wallets = await db.collection('user_wallets').insertMany([
      {
        userId: userId2,
        policyAssignmentId: assignmentId1,
        totalBalance: { allocated: 100000, current: 95000, consumed: 5000, lastUpdated: new Date() },
        categoryBalances: [
          { categoryCode: 'CAT001', categoryName: 'Consultation', allocated: 50000, current: 49000, consumed: 1000, isUnlimited: false, lastTransaction: new Date() },
          { categoryCode: 'CAT002', categoryName: 'Diagnostics', allocated: 30000, current: 26000, consumed: 4000, isUnlimited: false, lastTransaction: new Date() },
          { categoryCode: 'CAT003', categoryName: 'Pharmacy', allocated: 20000, current: 20000, consumed: 0, isUnlimited: false, lastTransaction: new Date() },
        ],
        policyYear: '2025',
        effectiveFrom: new Date('2025-01-01'),
        effectiveTo: new Date('2025-12-31'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: userId3,
        policyAssignmentId: assignmentId2,
        totalBalance: { allocated: 100000, current: 100000, consumed: 0, lastUpdated: new Date() },
        categoryBalances: [
          { categoryCode: 'CAT001', categoryName: 'Consultation', allocated: 50000, current: 50000, consumed: 0, isUnlimited: false, lastTransaction: new Date() },
          { categoryCode: 'CAT002', categoryName: 'Diagnostics', allocated: 30000, current: 30000, consumed: 0, isUnlimited: false, lastTransaction: new Date() },
          { categoryCode: 'CAT003', categoryName: 'Pharmacy', allocated: 20000, current: 20000, consumed: 0, isUnlimited: false, lastTransaction: new Date() },
        ],
        policyYear: '2025',
        effectiveFrom: new Date('2025-01-01'),
        effectiveTo: new Date('2025-12-31'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const walletId1 = wallets.insertedIds[0];
    console.log('   ✅ User wallets seeded');

    // 20. Wallet Transactions
    console.log('   [2/2] Seeding wallet_transactions...');
    await db.collection('wallet_transactions').insertMany([
      {
        userId: userId2,
        userWalletId: walletId1,
        transactionId: 'WTXN-001',
        type: 'INITIALIZATION',
        amount: 100000,
        previousBalance: { total: 0 },
        newBalance: { total: 100000 },
        notes: 'Initial wallet allocation',
        processedAt: new Date('2025-01-01'),
        isReversed: false,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      },
      {
        userId: userId2,
        userWalletId: walletId1,
        transactionId: 'WTXN-002',
        type: 'DEBIT',
        amount: 1000,
        categoryCode: 'CAT001',
        previousBalance: { total: 100000, category: 50000 },
        newBalance: { total: 99000, category: 49000 },
        serviceType: 'APPOINTMENT',
        notes: 'Consultation fee debit',
        processedAt: new Date(),
        isReversed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    console.log('   ✅ Wallet transactions seeded\n');

    // ============================================================
    // TIER 5: Service Availability
    // ============================================================
    console.log('📊 TIER 5: Seeding Service Availability...\n');

    // 21. Doctor Slots
    console.log('   [1/3] Seeding doctor_slots...');
    await db.collection('doctor_slots').insertMany([
      {
        slotId: 'SLOT-001',
        doctorId: 'DOC-001',
        clinicId: 'CLN-001',
        dayOfWeek: 'MONDAY',
        startTime: '09:00',
        endTime: '12:00',
        slotDuration: 30,
        consultationFee: 500,
        consultationType: 'IN_CLINIC',
        isActive: true,
        maxAppointments: 20,
        blockedDates: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        slotId: 'SLOT-002',
        doctorId: 'DOC-001',
        clinicId: 'CLN-001',
        dayOfWeek: 'MONDAY',
        startTime: '14:00',
        endTime: '18:00',
        slotDuration: 30,
        consultationFee: 400,
        consultationType: 'ONLINE',
        isActive: true,
        maxAppointments: 20,
        blockedDates: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    console.log('   ✅ Doctor slots seeded');

    // 22. Lab Vendor Pricing
    console.log('   [2/3] Seeding lab_vendor_pricing...');
    await db.collection('lab_vendor_pricing').insertMany([
      {
        vendorId: labVendorId,
        serviceId: labServiceId1,
        actualPrice: 500,
        discountedPrice: 400,
        homeCollectionCharges: 50,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        vendorId: labVendorId,
        serviceId: labServiceId2,
        actualPrice: 800,
        discountedPrice: 650,
        homeCollectionCharges: 50,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    console.log('   ✅ Lab vendor pricing seeded');

    // 23. Lab Vendor Slots
    console.log('   [3/3] Seeding lab_vendor_slots...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    await db.collection('lab_vendor_slots').insertMany([
      {
        slotId: 'LABSLOT-001',
        vendorId: labVendorId,
        pincode: '400001',
        date: dateStr,
        timeSlot: '09:00 AM - 10:00 AM',
        startTime: '09:00',
        endTime: '10:00',
        maxBookings: 5,
        currentBookings: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        slotId: 'LABSLOT-002',
        vendorId: labVendorId,
        pincode: '400001',
        date: dateStr,
        timeSlot: '10:00 AM - 11:00 AM',
        startTime: '10:00',
        endTime: '11:00',
        maxBookings: 5,
        currentBookings: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    console.log('   ✅ Lab vendor slots seeded\n');

    // ============================================================
    // TIER 6: Bookings
    // ============================================================
    console.log('📊 TIER 6: Seeding Bookings...\n');

    // 24. Appointments
    console.log('   [1/2] Seeding appointments...');
    const appointments = await db.collection('appointments').insertMany([
      {
        appointmentId: 'APT-001',
        appointmentNumber: 'APT-2025-001',
        userId: userId2,
        patientName: 'Test User',
        patientId: 'USR-0002',
        doctorId: 'DOC-001',
        doctorName: 'Dr. Rajesh Sharma',
        specialty: 'General Medicine',
        slotId: 'SLOT-001',
        clinicId: 'CLN-001',
        clinicName: 'City Health Clinic',
        clinicAddress: '123 Main Street, Mumbai',
        appointmentType: 'IN_CLINIC',
        categoryCode: 'CAT001',
        appointmentDate: dateStr,
        timeSlot: '09:00 AM',
        consultationFee: 500,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        amountPaid: 50,
        copayAmount: 50,
        walletDebitAmount: 450,
        coveredByInsurance: true,
        contactNumber: '+91-9876543200',
        callPreference: 'BOTH',
        hasPrescription: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const appointmentId1 = appointments.insertedIds[0];
    console.log('   ✅ Appointments seeded');

    // 25. Lab Prescriptions
    console.log('   [2/2] Seeding lab_prescriptions...');
    const labPrescriptions = await db.collection('lab_prescriptions').insertMany([
      {
        prescriptionId: 'LABPRESC-001',
        userId: userId2,
        patientId: 'USR-0002',
        patientName: 'Test User',
        patientRelationship: 'SELF',
        prescriptionDate: new Date(),
        addressId: addressId1,
        pincode: '400001',
        fileName: 'prescription_001.pdf',
        originalName: 'lab_prescription.pdf',
        fileType: 'application/pdf',
        fileSize: 125000,
        filePath: '/uploads/prescriptions/prescription_001.pdf',
        uploadedAt: new Date(),
        status: 'UPLOADED',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const labPrescriptionId1 = labPrescriptions.insertedIds[0];
    console.log('   ✅ Lab prescriptions seeded\n');

    // ============================================================
    // TIER 7: Booking-Related
    // ============================================================
    console.log('📊 TIER 7: Seeding Booking-Related Data...\n');

    // 26-29: Video Consultations, Lab Carts, Digital Prescriptions, Doctor Prescriptions
    console.log('   [1/4] Seeding video_consultations...');
    await db.collection('videoconsultations').insertMany([
      {
        consultationId: 'VC-001',
        appointmentId: appointmentId1,
        doctorId: userId1,
        doctorName: 'Dr. Rajesh Sharma',
        patientId: userId2,
        patientName: 'Test User',
        roomId: 'room-apt-001',
        roomName: 'Consultation Room - APT-001',
        roomUrl: 'https://opdwallet.daily.co/room-apt-001',
        scheduledStartTime: new Date(),
        status: 'SCHEDULED',
        recordingEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    console.log('   ✅ Video consultations seeded');

    console.log('   [2/4] Seeding lab_carts...');
    const labCarts = await db.collection('lab_carts').insertMany([
      {
        cartId: 'CART-001',
        prescriptionId: labPrescriptionId1,
        userId: userId2,
        patientId: 'USR-0002',
        patientName: 'Test User',
        pincode: '400001',
        items: [
          { serviceId: labServiceId1, serviceName: 'Complete Blood Count', serviceCode: 'CBC', category: 'PATHOLOGY', description: 'Comprehensive blood test' },
          { serviceId: labServiceId2, serviceName: 'Lipid Profile', serviceCode: 'LIPID', category: 'PATHOLOGY', description: 'Cholesterol test' },
        ],
        selectedVendorIds: [labVendorId],
        status: 'CREATED',
        createdBy: 'USR-0002',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    console.log('   ✅ Lab carts seeded');

    console.log('   [3/4] Seeding digital_prescriptions...');
    await db.collection('digitalprescriptions').insertMany([
      {
        prescriptionId: 'DPRESC-001',
        appointmentId: appointmentId1,
        doctorId: 'DOC-001',
        doctorName: 'Dr. Rajesh Sharma',
        doctorQualification: 'MBBS, MD',
        doctorSpecialty: 'General Medicine',
        userId: userId2,
        patientName: 'Test User',
        patientAge: 35,
        patientGender: 'MALE',
        chiefComplaint: 'Fever and body ache',
        diagnosis: 'Viral Fever',
        medicines: [
          { medicineName: 'Paracetamol', dosage: '500mg', frequency: 'TDS', duration: '5 days', route: 'Oral', instructions: 'After food' },
        ],
        labTests: [],
        generalInstructions: 'Rest and drink plenty of fluids',
        prescriptionType: 'DIGITAL',
        pdfGenerated: false,
        createdDate: new Date(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    console.log('   ✅ Digital prescriptions seeded');

    console.log('   [4/4] Seeding doctor_prescriptions...');
    await db.collection('doctorprescriptions').insertMany([
      {
        prescriptionId: 'DOCPRESC-001',
        appointmentId: appointmentId1,
        doctorId: 'DOC-001',
        doctorName: 'Dr. Rajesh Sharma',
        userId: userId2,
        patientName: 'Test User',
        fileName: 'prescription_doc_001.pdf',
        filePath: '/uploads/prescriptions/prescription_doc_001.pdf',
        fileSize: 85000,
        uploadDate: new Date(),
        diagnosis: 'Viral Fever',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    console.log('   ✅ Doctor prescriptions seeded\n');

    // ============================================================
    // TIER 8: Orders & Claims (Skipping for now - complex)
    // ============================================================
    console.log('📊 TIER 8: Seeding Orders & Claims (Basic)...\n');
    console.log('   ⏭️  Skipping detailed lab_orders and memberclaims for now\n');

    // ============================================================
    // TIER 9: Financial Transactions (Basic)
    // ============================================================
    console.log('📊 TIER 9: Seeding Financial Transactions (Basic)...\n');
    console.log('   ⏭️  Skipping detailed payments and transactionsummaries for now\n');

    // ============================================================
    // TIER 10: Audit & Notifications
    // ============================================================
    console.log('📊 TIER 10: Seeding Audit & Notifications...\n');

    console.log('   [1/2] Seeding notifications...');
    await db.collection('notifications').insertMany([
      {
        userId: userId2,
        type: 'CLAIM_ASSIGNED',
        title: 'Welcome to OPD Wallet',
        message: 'Your account has been successfully created and activated.',
        priority: 'MEDIUM',
        isRead: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    console.log('   ✅ Notifications seeded');

    console.log('   [2/2] Seeding auditLogs...');
    await db.collection('auditLogs').insertMany([
      {
        userId: 'USR-0002',
        userEmail: 'user@gmail.com',
        userRole: 'MEMBER',
        action: 'LOGIN',
        resource: 'AUTH',
        description: 'User logged in successfully',
        isSystemAction: false,
        createdAt: new Date(),
      },
      {
        userId: 'USR-0001',
        userEmail: 'admin@opdwallet.com',
        userRole: 'ADMIN',
        action: 'CREATE',
        resource: 'USER',
        resourceId: userId2,
        description: 'Created new user account',
        isSystemAction: false,
        createdAt: new Date(),
      },
    ]);
    console.log('   ✅ Audit logs seeded\n');

    // ============================================================
    // Summary
    // ============================================================
    console.log('📊 SEEDING SUMMARY\n');
    console.log('=' .repeat(60));

    const collectionCounts = await Promise.all([
      db.collection('counters').countDocuments(),
      db.collection('category_master').countDocuments(),
      db.collection('relationship_masters').countDocuments(),
      db.collection('specialty_master').countDocuments(),
      db.collection('users').countDocuments(),
      db.collection('policies').countDocuments(),
      db.collection('userPolicyAssignments').countDocuments(),
      db.collection('user_wallets').countDocuments(),
      db.collection('addresses').countDocuments(),
      db.collection('doctors').countDocuments(),
      db.collection('clinics').countDocuments(),
      db.collection('appointments').countDocuments(),
      db.collection('lab_vendors').countDocuments(),
      db.collection('lab_services').countDocuments(),
      db.collection('lab_prescriptions').countDocuments(),
    ]);

    console.log(`✅ counters:                  ${collectionCounts[0]} documents`);
    console.log(`✅ category_master:           ${collectionCounts[1]} documents`);
    console.log(`✅ relationship_masters:      ${collectionCounts[2]} documents`);
    console.log(`✅ specialty_master:          ${collectionCounts[3]} documents`);
    console.log(`✅ users:                     ${collectionCounts[4]} documents`);
    console.log(`✅ policies:                  ${collectionCounts[5]} documents`);
    console.log(`✅ userPolicyAssignments:     ${collectionCounts[6]} documents`);
    console.log(`✅ user_wallets:              ${collectionCounts[7]} documents`);
    console.log(`✅ addresses:                 ${collectionCounts[8]} documents`);
    console.log(`✅ doctors:                   ${collectionCounts[9]} documents`);
    console.log(`✅ clinics:                   ${collectionCounts[10]} documents`);
    console.log(`✅ appointments:              ${collectionCounts[11]} documents`);
    console.log(`✅ lab_vendors:               ${collectionCounts[12]} documents`);
    console.log(`✅ lab_services:              ${collectionCounts[13]} documents`);
    console.log(`✅ lab_prescriptions:         ${collectionCounts[14]} documents`);
    console.log('=' .repeat(60));

    console.log('\n🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!\n');
    console.log('📝 Test Credentials:');
    console.log('   Admin:      admin@opdwallet.com / admin123');
    console.log('   Member:     user@gmail.com / user123');
    console.log('   TPA Admin:  tpa@opdwallet.com / tpa123');
    console.log('   Doctor:     doctor@opdwallet.com / doctor123\n');

  } catch (error) {
    console.error('❌ ERROR during seeding:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the seeder
seedDatabase()
  .then(() => {
    console.log('\n✨ Seeding process finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Seeding process failed:', error);
    process.exit(1);
  });
