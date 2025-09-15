import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { User } from '../modules/users/schemas/user.schema';
import { Policy } from '../modules/policies/schemas/policy.schema';
import { Assignment } from '../modules/assignments/schemas/assignment.schema';
import { Counter } from '../modules/counters/schemas/counter.schema';
import { UserRole } from '../common/constants/roles.enum';
import { UserStatus, PolicyStatus, AssignmentStatus, RelationshipType } from '../common/constants/status.enum';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userModel = app.get<Model<User>>(getModelToken(User.name));
  const policyModel = app.get<Model<Policy>>(getModelToken(Policy.name));
  const assignmentModel = app.get<Model<Assignment>>(getModelToken(Assignment.name));
  const counterModel = app.get<Model<Counter>>(getModelToken(Counter.name));

  try {
    console.log('🌱 Starting seed process...');

    // Clear existing data
    await Promise.all([
      userModel.deleteMany({}),
      policyModel.deleteMany({}),
      assignmentModel.deleteMany({}),
      counterModel.deleteMany({}),
    ]);
    console.log('✅ Cleared existing data');

    // Initialize counters
    await counterModel.create([
      { _id: 'user', seq: 0 },
      { _id: 'policy', seq: 0 },
    ]);
    console.log('✅ Initialized counters');

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
      ownerPayer: 'Corporate',
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
        userId: employee._id,
        policyId: policy._id,
        status: AssignmentStatus.ACTIVE,
        effectiveFrom: new Date('2025-01-01'),
        assignedBy: superAdmin._id.toString(),
        notes: 'Initial assignment for employee',
      },
      {
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