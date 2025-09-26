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