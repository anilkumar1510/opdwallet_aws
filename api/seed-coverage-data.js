const mongoose = require('mongoose');

async function seedCoverageData() {
  try {
    // Connect with auth if required - try multiple URIs
    const uris = [
      process.env.MONGODB_URI,
      'mongodb://admin:admin123@localhost:27017/opd_wallet?authSource=admin',
      'mongodb://admin:admin123@localhost:27017/opd_wallet?authSource=admin'
    ];

    let connected = false;
    for (const uri of uris) {
      if (!uri) continue;
      try {
        console.log(`Trying to connect with: ${uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
        await mongoose.connect(uri);
        connected = true;
        console.log('Successfully connected to MongoDB');
        break;
      } catch (err) {
        console.log(`Failed with this URI, trying next...`);
      }
    }

    if (!connected) {
      throw new Error('Could not connect to MongoDB with any URI');
    }

    const db = mongoose.connection.db;

    // Define required categories
    const categories = [
      {
        categoryId: 'CAT001',
        code: 'CONSULTATION',
        name: 'Consultation',
        description: 'Medical consultation services',
        isActive: true,
        displayOrder: 1
      },
      {
        categoryId: 'CAT002',
        code: 'PHARMACY',
        name: 'Pharmacy',
        description: 'Pharmacy and medication services',
        isActive: true,
        displayOrder: 2
      },
      {
        categoryId: 'CAT003',
        code: 'DIAGNOSTICS',
        name: 'Diagnostics',
        description: 'Diagnostic and lab test services',
        isActive: true,
        displayOrder: 3
      }
    ];

    // Define services for each category
    const services = [
      // Consultation services
      {
        serviceCode: 'CONS001',
        serviceName: 'General Practitioner Consultation',
        categoryId: 'CONSULTATION',
        isActive: true,
        displayOrder: 1,
        description: 'General medical consultation',
        maxLimit: 10,
        unit: 'visits'
      },
      {
        serviceCode: 'CONS002',
        serviceName: 'Specialist Consultation',
        categoryId: 'CONSULTATION',
        isActive: true,
        displayOrder: 2,
        description: 'Specialist doctor consultation',
        maxLimit: 5,
        unit: 'visits'
      },
      {
        serviceCode: 'CONS003',
        serviceName: 'Pediatric Consultation',
        categoryId: 'CONSULTATION',
        isActive: true,
        displayOrder: 3,
        description: 'Pediatric specialist consultation',
        maxLimit: 10,
        unit: 'visits'
      },
      {
        serviceCode: 'CONS004',
        serviceName: 'Emergency Consultation',
        categoryId: 'CONSULTATION',
        isActive: true,
        displayOrder: 4,
        description: 'Emergency medical consultation',
        maxLimit: 20,
        unit: 'visits'
      },
      // Pharmacy services
      {
        serviceCode: 'PHAR001',
        serviceName: 'Prescription Medication',
        categoryId: 'PHARMACY',
        isActive: true,
        displayOrder: 1,
        description: 'Prescribed medicines',
        maxLimit: 10000,
        unit: 'amount'
      },
      {
        serviceCode: 'PHAR002',
        serviceName: 'OTC Medication',
        categoryId: 'PHARMACY',
        isActive: true,
        displayOrder: 2,
        description: 'Over the counter medicines',
        maxLimit: 5000,
        unit: 'amount'
      },
      {
        serviceCode: 'PHAR003',
        serviceName: 'Chronic Medication',
        categoryId: 'PHARMACY',
        isActive: true,
        displayOrder: 3,
        description: 'Chronic condition medicines',
        maxLimit: 15000,
        unit: 'amount'
      },
      {
        serviceCode: 'PHAR004',
        serviceName: 'Specialty Drugs',
        categoryId: 'PHARMACY',
        isActive: true,
        displayOrder: 4,
        description: 'Specialty pharmaceutical drugs',
        maxLimit: 20000,
        unit: 'amount'
      },
      // Diagnostics services
      {
        serviceCode: 'DIAG001',
        serviceName: 'Blood Tests',
        categoryId: 'DIAGNOSTICS',
        isActive: true,
        displayOrder: 1,
        description: 'Complete blood count and tests',
        maxLimit: 20,
        unit: 'tests'
      },
      {
        serviceCode: 'DIAG002',
        serviceName: 'X-Ray',
        categoryId: 'DIAGNOSTICS',
        isActive: true,
        displayOrder: 2,
        description: 'X-ray imaging services',
        maxLimit: 10,
        unit: 'scans'
      },
      {
        serviceCode: 'DIAG003',
        serviceName: 'MRI Scan',
        categoryId: 'DIAGNOSTICS',
        isActive: true,
        displayOrder: 3,
        description: 'MRI imaging services',
        maxLimit: 3,
        unit: 'scans'
      },
      {
        serviceCode: 'DIAG004',
        serviceName: 'CT Scan',
        categoryId: 'DIAGNOSTICS',
        isActive: true,
        displayOrder: 4,
        description: 'CT scan imaging services',
        maxLimit: 5,
        unit: 'scans'
      },
      {
        serviceCode: 'DIAG005',
        serviceName: 'Ultrasound',
        categoryId: 'DIAGNOSTICS',
        isActive: true,
        displayOrder: 5,
        description: 'Ultrasound imaging services',
        maxLimit: 10,
        unit: 'scans'
      }
    ];

    // Insert categories
    console.log('Seeding categories...');
    for (const category of categories) {
      await db.collection('category_master').replaceOne(
        { code: category.code },
        { ...category, createdAt: new Date(), updatedAt: new Date() },
        { upsert: true }
      );
      console.log(`  ✓ ${category.code}: ${category.name}`);
    }

    // Insert services
    console.log('\nSeeding services...');
    for (const service of services) {
      await db.collection('service_types').replaceOne(
        { serviceCode: service.serviceCode },
        { ...service, createdAt: new Date(), updatedAt: new Date() },
        { upsert: true }
      );
      console.log(`  ✓ ${service.serviceCode}: ${service.serviceName} (${service.categoryId})`);
    }

    // Verify data
    const categoryCount = await db.collection('category_master').countDocuments({ isActive: true });
    const serviceCount = await db.collection('service_types').countDocuments({ isActive: true });

    console.log('\n=== Seed Complete ===');
    console.log(`Total active categories: ${categoryCount}`);
    console.log(`Total active services: ${serviceCount}`);

    await mongoose.disconnect();
    console.log('\nDatabase connection closed.');
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

// Run the seed
seedCoverageData();