import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { RelationshipMaster } from './schemas/relationship-master.schema';

async function seedRelationshipMaster() {
  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    const relationshipModel = app.get<Model<RelationshipMaster>>(getModelToken(RelationshipMaster.name));

    console.log('🌱 Seeding Relationship Master data...');

    const relationships = [
      {
        relationshipCode: 'SELF',
        relationshipName: 'Self',
        displayName: 'Primary Member',
        description: 'The primary policy holder',
        sortOrder: 1,
        isActive: true,
      },
      {
        relationshipCode: 'SPOUSE',
        relationshipName: 'Spouse',
        displayName: 'Spouse',
        description: 'Husband or Wife of the primary member',
        sortOrder: 2,
        isActive: true,
      },
      {
        relationshipCode: 'CHILD',
        relationshipName: 'Child',
        displayName: 'Child',
        description: 'Son or Daughter of the primary member',
        sortOrder: 3,
        isActive: true,
      },
      {
        relationshipCode: 'PARENT',
        relationshipName: 'Parent',
        displayName: 'Parent',
        description: 'Father or Mother of the primary member',
        sortOrder: 4,
        isActive: true,
      },
      {
        relationshipCode: 'SIBLING',
        relationshipName: 'Sibling',
        displayName: 'Sibling',
        description: 'Brother or Sister of the primary member',
        sortOrder: 5,
        isActive: true,
      },
      {
        relationshipCode: 'GRANDPARENT',
        relationshipName: 'Grandparent',
        displayName: 'Grandparent',
        description: 'Grandfather or Grandmother of the primary member',
        sortOrder: 6,
        isActive: true,
      },
      {
        relationshipCode: 'GRANDCHILD',
        relationshipName: 'Grandchild',
        displayName: 'Grandchild',
        description: 'Grandson or Granddaughter of the primary member',
        sortOrder: 7,
        isActive: true,
      }
    ];

    // Clear existing data
    await relationshipModel.deleteMany({});

    // Insert new data
    await relationshipModel.insertMany(relationships);

    console.log('✅ Relationship Master data seeded successfully');
    console.log(`📊 Inserted ${relationships.length} relationship types`);

    await app.close();
  } catch (error) {
    console.error('❌ Error seeding relationship master:', error);
    process.exit(1);
  }
}

seedRelationshipMaster();