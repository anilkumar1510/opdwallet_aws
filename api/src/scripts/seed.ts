import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { User } from '../modules/users/schemas/user.schema';
import { Policy } from '../modules/policies/schemas/policy.schema';
import { Assignment } from '../modules/assignments/schemas/assignment.schema';
import { Counter } from '../modules/counters/schemas/counter.schema';
import { RelationshipMaster } from '../modules/masters/schemas/relationship-master.schema';
import { CategoryMaster } from '../modules/masters/schemas/category-master.schema';
import { ServiceMaster } from '../modules/masters/schemas/service-master.schema';
import { UserRole } from '../common/constants/roles.enum';
import { UserStatus, PolicyStatus, AssignmentStatus, RelationshipType } from '../common/constants/status.enum';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userModel = app.get<Model<User>>(getModelToken(User.name));
  const policyModel = app.get<Model<Policy>>(getModelToken(Policy.name));
  const assignmentModel = app.get<Model<Assignment>>(getModelToken(Assignment.name));
  const counterModel = app.get<Model<Counter>>(getModelToken(Counter.name));
  const relationshipModel = app.get<Model<RelationshipMaster>>(getModelToken(RelationshipMaster.name));
  const categoryModel = app.get<Model<CategoryMaster>>(getModelToken(CategoryMaster.name));
  const serviceModel = app.get<Model<ServiceMaster>>(getModelToken(ServiceMaster.name));

  try {
    console.log('🌱 Starting seed process...');

    // Clear existing data
    await Promise.all([
      userModel.deleteMany({}),
      policyModel.deleteMany({}),
      assignmentModel.deleteMany({}),
      counterModel.deleteMany({}),
      relationshipModel.deleteMany({}),
      categoryModel.deleteMany({}),
      serviceModel.deleteMany({}),
    ]);
    console.log('✅ Cleared existing data');

    // Initialize counters
    await counterModel.create([
      { _id: 'user', seq: 0 },
      { _id: 'policy', seq: 0 },
    ]);
    console.log('✅ Initialized counters');

    // Seed Relationship Master data
    const relationships = [
      {
        relationshipCode: 'REL002',
        relationshipName: 'SPOUSE',
        displayName: 'Spouse',
        description: 'Husband or Wife of the primary member',
        sortOrder: 1,
        isActive: true,
      },
      {
        relationshipCode: 'REL003',
        relationshipName: 'CHILD',
        displayName: 'Child',
        description: 'Son or Daughter of the primary member',
        sortOrder: 2,
        isActive: true,
      },
      {
        relationshipCode: 'REL004',
        relationshipName: 'FATHER',
        displayName: 'Father',
        description: 'Father of the primary member',
        sortOrder: 3,
        isActive: true,
      },
      {
        relationshipCode: 'REL005',
        relationshipName: 'MOTHER',
        displayName: 'Mother',
        description: 'Mother of the primary member',
        sortOrder: 4,
        isActive: true,
      }
    ];

    await relationshipModel.insertMany(relationships);
    console.log('✅ Seeded Relationship Master data');

    // Seed Category Master data
    const categories = [
      { categoryId: 'CONSULTATION', code: 'CAT001', name: 'Consultation Services', displayOrder: 1, isActive: true },
      { categoryId: 'PHARMACY', code: 'CAT002', name: 'Pharmacy Services', displayOrder: 2, isActive: true },
      { categoryId: 'DIAGNOSTICS', code: 'CAT003', name: 'Diagnostic Services', displayOrder: 3, isActive: true },
    ];

    await categoryModel.insertMany(categories);
    console.log('✅ Seeded Category Master data');

    // Seed Service Master data
    const serviceTypes = [
      // Consultation Services - CON prefix
      { code: 'CON001', name: 'General Medicine', category: 'CONSULTATION', isActive: true, coveragePercentage: 100, copayAmount: 0, requiresPreAuth: false, requiresReferral: false, waitingPeriodDays: 0, requiredDocuments: [] },
      { code: 'CON002', name: 'Pediatrics', category: 'CONSULTATION', isActive: true, coveragePercentage: 100, copayAmount: 0, requiresPreAuth: false, requiresReferral: false, waitingPeriodDays: 0, requiredDocuments: [] },
      { code: 'CON003', name: 'Gynecology', category: 'CONSULTATION', isActive: true, coveragePercentage: 100, copayAmount: 0, requiresPreAuth: false, requiresReferral: false, waitingPeriodDays: 0, requiredDocuments: [] },

      // Pharmacy Services - PHA prefix
      { code: 'PHA001', name: 'Retail Pharmacy', category: 'PHARMACY', isActive: true, coveragePercentage: 100, copayAmount: 0, requiresPreAuth: false, requiresReferral: false, waitingPeriodDays: 0, requiredDocuments: [] },
      { code: 'PHA002', name: 'E-Pharmacy', category: 'PHARMACY', isActive: true, coveragePercentage: 100, copayAmount: 0, requiresPreAuth: false, requiresReferral: false, waitingPeriodDays: 0, requiredDocuments: [] },

      // Diagnostic Services - LAB prefix
      { code: 'LAB001', name: 'CBC', category: 'DIAGNOSTICS', isActive: true, coveragePercentage: 100, copayAmount: 0, requiresPreAuth: false, requiresReferral: false, waitingPeriodDays: 0, requiredDocuments: [] },
      { code: 'LAB002', name: 'LFT', category: 'DIAGNOSTICS', isActive: true, coveragePercentage: 100, copayAmount: 0, requiresPreAuth: false, requiresReferral: false, waitingPeriodDays: 0, requiredDocuments: [] },
      { code: 'LAB003', name: 'Lipid Profile', category: 'DIAGNOSTICS', isActive: true, coveragePercentage: 100, copayAmount: 0, requiresPreAuth: false, requiresReferral: false, waitingPeriodDays: 0, requiredDocuments: [] },
      { code: 'LAB004', name: 'Thyroid Panel', category: 'DIAGNOSTICS', isActive: true, coveragePercentage: 100, copayAmount: 0, requiresPreAuth: false, requiresReferral: false, waitingPeriodDays: 0, requiredDocuments: [] },
      { code: 'LAB005', name: 'X-Ray', category: 'DIAGNOSTICS', isActive: true, coveragePercentage: 100, copayAmount: 0, requiresPreAuth: false, requiresReferral: false, waitingPeriodDays: 0, requiredDocuments: [] },
    ];

    await serviceModel.insertMany(serviceTypes);
    console.log('✅ Seeded Service Master data');

    // Create Super Admin
    const passwordHash = await bcrypt.hash('Admin@123', 12);

    const superAdmin = await userModel.create({
      userId: 'USR-2025-0001',
      uhid: 'UHID001',
      memberId: 'MEM001',
      employeeId: 'EMP001',
      relationship: RelationshipType.SELF,
      name: {
        firstName: 'Super',
        lastName: 'Admin',
        fullName: 'Super Admin',
      },
      email: 'admin@opdwallet.com',
      phone: '+919999999999',
      dob: new Date('1980-01-01'),
      gender: 'MALE',
      address: {
        line1: '123 Admin Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
      },
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      passwordHash,
      mustChangePassword: false,
    });
    console.log('✅ Created Super Admin (admin@opdwallet.com / Admin@123)');

    // Update counter after manual creation
    await counterModel.findByIdAndUpdate('user', { seq: 1 });

    // Create Sample Policy
    const policy = await policyModel.create({
      policyNumber: 'POL-2025-0001',
      name: 'Standard OPD Policy 2025',
      status: PolicyStatus.ACTIVE,
      effectiveFrom: new Date('2025-01-01'),
      effectiveTo: new Date('2025-12-31'),
      description: 'Standard outpatient department policy covering consultations, pharmacy, diagnostics, and preventive care',
      ownerPayer: 'CORPORATE',
      createdBy: superAdmin._id.toString(),
    });
    console.log('✅ Created Sample Policy');

    // Update policy counter
    await counterModel.findByIdAndUpdate('policy', { seq: 1 });

    // Create Sample Employee (SELF)
    const employee = await userModel.create({
      userId: 'USR-2025-0002',
      uhid: 'UHID002',
      memberId: 'MEM002',
      employeeId: 'EMP002',
      relationship: RelationshipType.SELF,
      name: {
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe',
      },
      email: 'john.doe@company.com',
      phone: '+919876543210',
      dob: new Date('1990-05-15'),
      gender: 'MALE',
      address: {
        line1: '456 Employee Avenue',
        line2: 'Apartment 12B',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560001',
      },
      role: UserRole.MEMBER,
      status: UserStatus.ACTIVE,
      passwordHash: await bcrypt.hash('Member@123', 12),
      mustChangePassword: false,
    });
    console.log('✅ Created Sample Employee (john.doe@company.com / Member@123)');

    // Create Dependent (SPOUSE)
    const dependent = await userModel.create({
      userId: 'USR-2025-0003',
      uhid: 'UHID003',
      memberId: 'MEM003',
      relationship: RelationshipType.SPOUSE,
      primaryMemberId: 'MEM002',
      name: {
        firstName: 'Jane',
        lastName: 'Doe',
        fullName: 'Jane Doe',
      },
      email: 'jane.doe@email.com',
      phone: '+919876543211',
      dob: new Date('1992-08-20'),
      gender: 'FEMALE',
      address: {
        line1: '456 Employee Avenue',
        line2: 'Apartment 12B',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560001',
      },
      role: UserRole.MEMBER,
      status: UserStatus.ACTIVE,
      passwordHash: await bcrypt.hash('Dependent@123', 12),
      mustChangePassword: false,
    });
    console.log('✅ Created Sample Dependent');

    // Update user counter
    await counterModel.findByIdAndUpdate('user', { seq: 3 });

    // Create Assignments
    await assignmentModel.create([
      {
        assignmentId: 'ASN-2025-0001',
        userId: employee._id,
        policyId: policy._id,
        status: AssignmentStatus.ACTIVE,
        effectiveFrom: new Date('2025-01-01'),
        assignedBy: superAdmin._id.toString(),
        notes: 'Initial assignment for employee',
      },
      {
        assignmentId: 'ASN-2025-0002',
        userId: dependent._id,
        policyId: policy._id,
        status: AssignmentStatus.ACTIVE,
        effectiveFrom: new Date('2025-01-01'),
        assignedBy: superAdmin._id.toString(),
        notes: 'Initial assignment for dependent',
      },
    ]);
    console.log('✅ Created Policy Assignments');

    console.log('\n🎉 Seed completed successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('-------------------');
    console.log('Super Admin: admin@opdwallet.com / Admin@123');
    console.log('Member: john.doe@company.com / Member@123');
    console.log('Dependent: jane.doe@email.com / Dependent@123');

  } catch (error) {
    console.error('❌ Seed failed:', error);
  } finally {
    await app.close();
  }
}

seed();