import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model, Types } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { LabService } from '../modules/lab/schemas/lab-service.schema';
import { LabVendor } from '../modules/lab/schemas/lab-vendor.schema';
import { LabVendorPricing } from '../modules/lab/schemas/lab-vendor-pricing.schema';
import { LabVendorSlot } from '../modules/lab/schemas/lab-vendor-slot.schema';

/**
 * Lab Module Database Seeding Script
 *
 * This script seeds all lab-related collections with test data:
 * - Lab Services (test catalog)
 * - Lab Vendors (lab partners)
 * - Lab Vendor Pricing (vendor-specific pricing)
 * - Lab Vendor Slots (availability slots)
 *
 * Usage:
 * npm run seed:lab
 */

// ========== LAB SERVICES (Test Catalog) ==========
const labServices = [
  // PATHOLOGY - Blood Tests
  {
    serviceId: 'LAB-001',
    code: 'CBC',
    name: 'Complete Blood Count (CBC)',
    category: 'PATHOLOGY',
    description: 'Complete blood count with differential count',
    sampleType: 'Blood',
    preparationInstructions: 'No special preparation required',
    isActive: true,
    displayOrder: 1,
  },
  {
    serviceId: 'LAB-002',
    code: 'FBS',
    name: 'Fasting Blood Sugar',
    category: 'PATHOLOGY',
    description: 'Blood glucose test after overnight fasting',
    sampleType: 'Blood',
    preparationInstructions: '8-10 hours fasting required',
    isActive: true,
    displayOrder: 2,
  },
  {
    serviceId: 'LAB-003',
    code: 'PPBS',
    name: 'Post Prandial Blood Sugar',
    category: 'PATHOLOGY',
    description: 'Blood glucose test 2 hours after meal',
    sampleType: 'Blood',
    preparationInstructions: 'Take test 2 hours after meal',
    isActive: true,
    displayOrder: 3,
  },
  {
    serviceId: 'LAB-004',
    code: 'HBA1C',
    name: 'HbA1c (Glycated Hemoglobin)',
    category: 'PATHOLOGY',
    description: 'Average blood sugar over past 3 months',
    sampleType: 'Blood',
    preparationInstructions: 'No fasting required',
    isActive: true,
    displayOrder: 4,
  },
  {
    serviceId: 'LAB-005',
    code: 'LIPID',
    name: 'Lipid Profile',
    category: 'PATHOLOGY',
    description: 'Total Cholesterol, HDL, LDL, Triglycerides, VLDL',
    sampleType: 'Blood',
    preparationInstructions: '12-14 hours fasting required',
    isActive: true,
    displayOrder: 5,
  },
  {
    serviceId: 'LAB-006',
    code: 'LFT',
    name: 'Liver Function Test (LFT)',
    category: 'PATHOLOGY',
    description: 'SGOT, SGPT, Bilirubin, Alkaline Phosphatase, Proteins',
    sampleType: 'Blood',
    preparationInstructions: '8-10 hours fasting recommended',
    isActive: true,
    displayOrder: 6,
  },
  {
    serviceId: 'LAB-007',
    code: 'KFT',
    name: 'Kidney Function Test (KFT)',
    category: 'PATHOLOGY',
    description: 'Urea, Creatinine, BUN, Uric Acid',
    sampleType: 'Blood',
    preparationInstructions: 'No special preparation required',
    isActive: true,
    displayOrder: 7,
  },
  {
    serviceId: 'LAB-008',
    code: 'TFT',
    name: 'Thyroid Function Test (TFT)',
    category: 'PATHOLOGY',
    description: 'TSH, T3, T4',
    sampleType: 'Blood',
    preparationInstructions: 'No special preparation required',
    isActive: true,
    displayOrder: 8,
  },
  {
    serviceId: 'LAB-009',
    code: 'VITD',
    name: 'Vitamin D (25-OH)',
    category: 'PATHOLOGY',
    description: 'Vitamin D deficiency test',
    sampleType: 'Blood',
    preparationInstructions: 'No special preparation required',
    isActive: true,
    displayOrder: 9,
  },
  {
    serviceId: 'LAB-010',
    code: 'VITB12',
    name: 'Vitamin B12',
    category: 'PATHOLOGY',
    description: 'Vitamin B12 deficiency test',
    sampleType: 'Blood',
    preparationInstructions: 'No special preparation required',
    isActive: true,
    displayOrder: 10,
  },
  {
    serviceId: 'LAB-011',
    code: 'ESR',
    name: 'ESR (Erythrocyte Sedimentation Rate)',
    category: 'PATHOLOGY',
    description: 'Inflammation marker test',
    sampleType: 'Blood',
    preparationInstructions: 'No special preparation required',
    isActive: true,
    displayOrder: 11,
  },
  {
    serviceId: 'LAB-012',
    code: 'CRP',
    name: 'C-Reactive Protein (CRP)',
    category: 'PATHOLOGY',
    description: 'Inflammation and infection marker',
    sampleType: 'Blood',
    preparationInstructions: 'No special preparation required',
    isActive: true,
    displayOrder: 12,
  },
  {
    serviceId: 'LAB-013',
    code: 'URINE-RE',
    name: 'Urine Routine Examination',
    category: 'PATHOLOGY',
    description: 'Complete urine analysis',
    sampleType: 'Urine',
    preparationInstructions: 'First morning sample preferred',
    isActive: true,
    displayOrder: 13,
  },
  {
    serviceId: 'LAB-014',
    code: 'DENGUE',
    name: 'Dengue NS1 Antigen & IgG/IgM',
    category: 'PATHOLOGY',
    description: 'Dengue fever detection',
    sampleType: 'Blood',
    preparationInstructions: 'No special preparation required',
    isActive: true,
    displayOrder: 14,
  },
  {
    serviceId: 'LAB-015',
    code: 'TYPHOID',
    name: 'Typhoid (Widal Test)',
    category: 'PATHOLOGY',
    description: 'Typhoid fever antibody test',
    sampleType: 'Blood',
    preparationInstructions: 'No special preparation required',
    isActive: true,
    displayOrder: 15,
  },
  {
    serviceId: 'LAB-016',
    code: 'IRON',
    name: 'Serum Iron Studies',
    category: 'PATHOLOGY',
    description: 'Serum Iron, TIBC, Transferrin Saturation, Ferritin',
    sampleType: 'Blood',
    preparationInstructions: '8-10 hours fasting required',
    isActive: true,
    displayOrder: 16,
  },
  {
    serviceId: 'LAB-017',
    code: 'PSA',
    name: 'PSA (Prostate Specific Antigen)',
    category: 'PATHOLOGY',
    description: 'Prostate cancer screening',
    sampleType: 'Blood',
    preparationInstructions: 'No sexual activity 48 hours before test',
    isActive: true,
    displayOrder: 17,
  },
  {
    serviceId: 'LAB-018',
    code: 'CA125',
    name: 'CA 125 (Cancer Antigen 125)',
    category: 'PATHOLOGY',
    description: 'Ovarian cancer marker',
    sampleType: 'Blood',
    preparationInstructions: 'No special preparation required',
    isActive: true,
    displayOrder: 18,
  },

  // RADIOLOGY - Imaging Tests
  {
    serviceId: 'LAB-019',
    code: 'XRAY-CHEST',
    name: 'X-Ray Chest PA View',
    category: 'RADIOLOGY',
    description: 'Chest X-ray posterior-anterior view',
    sampleType: 'Imaging',
    preparationInstructions: 'Remove all metal objects and jewelry',
    isActive: true,
    displayOrder: 19,
  },
  {
    serviceId: 'LAB-020',
    code: 'XRAY-ABD',
    name: 'X-Ray Abdomen',
    category: 'RADIOLOGY',
    description: 'Abdominal X-ray',
    sampleType: 'Imaging',
    preparationInstructions: 'Empty bladder before test',
    isActive: true,
    displayOrder: 20,
  },
  {
    serviceId: 'LAB-021',
    code: 'USG-ABD',
    name: 'Ultrasound Whole Abdomen',
    category: 'RADIOLOGY',
    description: 'Sonography of abdominal organs',
    sampleType: 'Imaging',
    preparationInstructions: '6 hours fasting, drink 3-4 glasses of water 1 hour before',
    isActive: true,
    displayOrder: 21,
  },
  {
    serviceId: 'LAB-022',
    code: 'USG-PELVIS',
    name: 'Ultrasound Pelvis',
    category: 'RADIOLOGY',
    description: 'Pelvic ultrasound',
    sampleType: 'Imaging',
    preparationInstructions: 'Full bladder required - drink 3-4 glasses of water',
    isActive: true,
    displayOrder: 22,
  },

  // CARDIOLOGY - Heart Tests
  {
    serviceId: 'LAB-023',
    code: 'ECG',
    name: 'ECG (Electrocardiogram)',
    category: 'CARDIOLOGY',
    description: '12-lead ECG',
    sampleType: 'Cardiac',
    preparationInstructions: 'Wear loose comfortable clothing',
    isActive: true,
    displayOrder: 23,
  },
  {
    serviceId: 'LAB-024',
    code: 'ECHO',
    name: '2D Echo (Echocardiography)',
    category: 'CARDIOLOGY',
    description: 'Ultrasound of the heart',
    sampleType: 'Cardiac',
    preparationInstructions: 'No special preparation required',
    isActive: true,
    displayOrder: 24,
  },
  {
    serviceId: 'LAB-025',
    code: 'TMT',
    name: 'TMT (Treadmill Test)',
    category: 'CARDIOLOGY',
    description: 'Exercise stress test',
    sampleType: 'Cardiac',
    preparationInstructions: 'Light meal 2 hours before, wear sports shoes',
    isActive: true,
    displayOrder: 25,
  },
];

// ========== LAB VENDORS (Lab Partners) ==========
const labVendors = [
  {
    vendorId: 'VENDOR-001',
    name: 'PathLab Diagnostics',
    code: 'PATHLAB',
    contactInfo: {
      phone: '+91-9876543210',
      email: 'info@pathlab.com',
      address: 'Shop No. 12, Medical Center, Mumbai, Maharashtra',
    },
    serviceablePincodes: ['400001', '400002', '400003', '400004', '400005'],
    homeCollection: true,
    centerVisit: true,
    homeCollectionCharges: 50,
    description: 'Leading diagnostic center with NABL accreditation',
    isActive: true,
  },
  {
    vendorId: 'VENDOR-002',
    name: 'Dr. Lal PathLabs',
    code: 'DRLAL',
    contactInfo: {
      phone: '+91-9876543211',
      email: 'support@lalpathlabs.com',
      address: 'Ground Floor, Health Plaza, Mumbai, Maharashtra',
    },
    serviceablePincodes: ['400001', '400002', '400003', '400006', '400007'],
    homeCollection: true,
    centerVisit: true,
    homeCollectionCharges: 75,
    description: 'National chain with advanced testing facilities',
    isActive: true,
  },
  {
    vendorId: 'VENDOR-003',
    name: 'Thyrocare Technologies',
    code: 'THYROCARE',
    contactInfo: {
      phone: '+91-9876543212',
      email: 'care@thyrocare.com',
      address: 'Lab Complex, Andheri, Mumbai, Maharashtra',
    },
    serviceablePincodes: ['400001', '400002', '400004', '400008', '400009'],
    homeCollection: true,
    centerVisit: false,
    homeCollectionCharges: 40,
    description: 'Specialized in preventive health checkups',
    isActive: true,
  },
  {
    vendorId: 'VENDOR-004',
    name: 'Metropolis Healthcare',
    code: 'METROPOLIS',
    contactInfo: {
      phone: '+91-9876543213',
      email: 'info@metropolisindia.com',
      address: '1st Floor, Diagnostic Center, Mumbai, Maharashtra',
    },
    serviceablePincodes: ['400001', '400003', '400005', '400007', '400009'],
    homeCollection: true,
    centerVisit: true,
    homeCollectionCharges: 60,
    description: 'Fully automated lab with quick turnaround time',
    isActive: true,
  },
];

// Helper function to generate slots for next 7 days
function generateSlots(vendorId: Types.ObjectId, pincodes: string[]) {
  const slots: any[] = [];
  const timeSlots = [
    { timeSlot: '08:00 AM - 09:00 AM', startTime: '08:00', endTime: '09:00' },
    { timeSlot: '09:00 AM - 10:00 AM', startTime: '09:00', endTime: '10:00' },
    { timeSlot: '10:00 AM - 11:00 AM', startTime: '10:00', endTime: '11:00' },
    { timeSlot: '11:00 AM - 12:00 PM', startTime: '11:00', endTime: '12:00' },
    { timeSlot: '12:00 PM - 01:00 PM', startTime: '12:00', endTime: '13:00' },
    { timeSlot: '02:00 PM - 03:00 PM', startTime: '14:00', endTime: '15:00' },
    { timeSlot: '03:00 PM - 04:00 PM', startTime: '15:00', endTime: '16:00' },
    { timeSlot: '04:00 PM - 05:00 PM', startTime: '16:00', endTime: '17:00' },
    { timeSlot: '05:00 PM - 06:00 PM', startTime: '17:00', endTime: '18:00' },
  ];

  // Generate slots for next 14 days
  for (let day = 0; day < 14; day++) {
    const date = new Date();
    date.setDate(date.getDate() + day);
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

    pincodes.forEach((pincode) => {
      timeSlots.forEach((slot) => {
        slots.push({
          slotId: `SLOT-${vendorId}-${dateStr}-${pincode}-${slot.startTime}`,
          vendorId,
          pincode,
          date: dateStr,
          timeSlot: slot.timeSlot,
          startTime: slot.startTime,
          endTime: slot.endTime,
          maxBookings: 5,
          currentBookings: 0,
          isActive: true,
        });
      });
    });
  }

  return slots;
}

async function seedLab() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const labServiceModel = app.get<Model<LabService>>(getModelToken(LabService.name));
  const labVendorModel = app.get<Model<LabVendor>>(getModelToken(LabVendor.name));
  const labVendorPricingModel = app.get<Model<LabVendorPricing>>(getModelToken(LabVendorPricing.name));
  const labVendorSlotModel = app.get<Model<LabVendorSlot>>(getModelToken(LabVendorSlot.name));

  try {
    console.log('\n🏥 ========== LAB MODULE SEEDING ==========\n');

    // ========== 1. SEED LAB SERVICES ==========
    console.log('📋 Seeding Lab Services...');
    const existingServices = await labServiceModel.countDocuments();

    if (existingServices > 0) {
      console.log(`⚠️  Found ${existingServices} existing services. Clearing...`);
      await labServiceModel.deleteMany({});
    }

    await labServiceModel.insertMany(labServices);
    console.log(`✅ Inserted ${labServices.length} lab services`);
    console.log(`   - Pathology: ${labServices.filter(s => s.category === 'PATHOLOGY').length}`);
    console.log(`   - Radiology: ${labServices.filter(s => s.category === 'RADIOLOGY').length}`);
    console.log(`   - Cardiology: ${labServices.filter(s => s.category === 'CARDIOLOGY').length}\n`);

    // ========== 2. SEED LAB VENDORS ==========
    console.log('🏢 Seeding Lab Vendors...');
    const existingVendors = await labVendorModel.countDocuments();

    if (existingVendors > 0) {
      console.log(`⚠️  Found ${existingVendors} existing vendors. Clearing...`);
      await labVendorModel.deleteMany({});
    }

    const insertedVendors = await labVendorModel.insertMany(labVendors);
    console.log(`✅ Inserted ${insertedVendors.length} lab vendors\n`);

    // ========== 3. SEED VENDOR PRICING ==========
    console.log('💰 Seeding Vendor Pricing...');
    const existingPricing = await labVendorPricingModel.countDocuments();

    if (existingPricing > 0) {
      console.log(`⚠️  Found ${existingPricing} existing pricing records. Clearing...`);
      await labVendorPricingModel.deleteMany({});
    }

    const allServices = await labServiceModel.find();
    const pricingData: any[] = [];

    // Define pricing strategy for each vendor
    const vendorPricingStrategies = [
      { vendorIndex: 0, name: 'PathLab', discount: 0.8, variance: 0.1 },      // 20% discount, ±10% variance
      { vendorIndex: 1, name: 'Dr. Lal', discount: 0.85, variance: 0.08 },     // 15% discount, ±8% variance
      { vendorIndex: 2, name: 'Thyrocare', discount: 0.75, variance: 0.12 },   // 25% discount, ±12% variance
      { vendorIndex: 3, name: 'Metropolis', discount: 0.82, variance: 0.09 },  // 18% discount, ±9% variance
    ];

    // Base prices for different test categories
    const basePrices: { [key: string]: number } = {
      'CBC': 300,
      'FBS': 100,
      'PPBS': 100,
      'HBA1C': 600,
      'LIPID': 800,
      'LFT': 700,
      'KFT': 600,
      'TFT': 800,
      'VITD': 1200,
      'VITB12': 1000,
      'ESR': 100,
      'CRP': 400,
      'URINE-RE': 200,
      'DENGUE': 1200,
      'TYPHOID': 400,
      'IRON': 900,
      'PSA': 800,
      'CA125': 1500,
      'XRAY-CHEST': 400,
      'XRAY-ABD': 500,
      'USG-ABD': 1200,
      'USG-PELVIS': 1000,
      'ECG': 300,
      'ECHO': 1800,
      'TMT': 2500,
    };

    insertedVendors.forEach((vendor, vendorIndex) => {
      const strategy = vendorPricingStrategies[vendorIndex];

      allServices.forEach((service) => {
        const basePrice = basePrices[service.code] || 500;

        // Add random variance
        const variance = 1 + (Math.random() * 2 - 1) * strategy.variance;
        const actualPrice = Math.round(basePrice * variance);
        const discountedPrice = Math.round(actualPrice * strategy.discount);

        pricingData.push({
          vendorId: vendor._id,
          serviceId: service._id,
          actualPrice,
          discountedPrice,
          homeCollectionCharges: vendor.homeCollectionCharges,
          isActive: true,
        });
      });
    });

    await labVendorPricingModel.insertMany(pricingData);
    console.log(`✅ Inserted ${pricingData.length} pricing records`);
    console.log(`   (${allServices.length} services × ${insertedVendors.length} vendors)\n`);

    // ========== 4. SEED VENDOR SLOTS ==========
    console.log('📅 Seeding Vendor Slots (next 14 days)...');
    const existingSlots = await labVendorSlotModel.countDocuments();

    if (existingSlots > 0) {
      console.log(`⚠️  Found ${existingSlots} existing slots. Clearing...`);
      await labVendorSlotModel.deleteMany({});
    }

    let allSlots: any[] = [];
    insertedVendors.forEach((vendor, index) => {
      const slots = generateSlots(vendor._id as Types.ObjectId, labVendors[index].serviceablePincodes);
      allSlots = allSlots.concat(slots);
    });

    await labVendorSlotModel.insertMany(allSlots);
    console.log(`✅ Inserted ${allSlots.length} time slots`);
    console.log(`   (14 days × 9 slots/day × multiple pincodes per vendor)\n`);

    // ========== SUMMARY ==========
    console.log('🎉 ========== SEEDING COMPLETED ==========\n');
    console.log('📊 Summary:');
    console.log(`   ✅ Lab Services: ${labServices.length}`);
    console.log(`   ✅ Lab Vendors: ${insertedVendors.length}`);
    console.log(`   ✅ Pricing Records: ${pricingData.length}`);
    console.log(`   ✅ Time Slots: ${allSlots.length}\n`);

    console.log('🔍 Sample Pricing Comparison (CBC test):');
    const cbcService = allServices.find(s => s.code === 'CBC');
    if (cbcService) {
      const cbcPricing = await labVendorPricingModel
        .find({ serviceId: cbcService._id })
        .populate('vendorId', 'name');

      cbcPricing.forEach((pricing: any) => {
        console.log(`   ${pricing.vendorId.name}: ₹${pricing.actualPrice} → ₹${pricing.discountedPrice} (Save ₹${pricing.actualPrice - pricing.discountedPrice})`);
      });
    }

    console.log('\n✨ Lab module is now ready for testing!\n');
    console.log('📝 Next Steps:');
    console.log('   1. Upload a prescription as a member');
    console.log('   2. Digitize it in the admin portal');
    console.log('   3. Select vendor and book a slot');
    console.log('   4. Create an order\n');

  } catch (error) {
    console.error('❌ Lab seeding failed:', error);
    throw error;
  } finally {
    await app.close();
  }
}

seedLab();
