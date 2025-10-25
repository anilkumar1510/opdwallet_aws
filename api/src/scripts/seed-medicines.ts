import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { Medicine } from '../modules/doctors/schemas/medicine.schema';

/**
 * Medicine Database Seeding Script
 *
 * This script seeds the medicine_database collection with commonly prescribed
 * Indian medicines across various therapeutic categories.
 *
 * Data includes:
 * - Generic names (MCI compliant - UPPERCASE)
 * - Brand names (popular Indian brands)
 * - Manufacturer information
 * - Dosage forms (tablet, capsule, syrup, injection, etc.)
 * - Strength information
 * - Composition details
 *
 * Usage:
 * npm run seed:medicines
 */

const indianMedicines = [
  // ========== ANALGESICS & ANTI-INFLAMMATORY ==========
  {
    genericName: 'PARACETAMOL',
    brandNames: ['Crocin', 'Dolo', 'Calpol', 'Pacimol'],
    manufacturer: 'Multiple',
    form: 'Tablet',
    strength: '500mg',
    composition: 'Paracetamol 500mg',
  },
  {
    genericName: 'PARACETAMOL',
    brandNames: ['Calpol Syrup', 'Dolo Suspension'],
    manufacturer: 'Multiple',
    form: 'Syrup',
    strength: '120mg/5ml',
    composition: 'Paracetamol 120mg per 5ml',
  },
  {
    genericName: 'IBUPROFEN',
    brandNames: ['Brufen', 'Combiflam', 'Ibugesic'],
    manufacturer: 'Abbott / Cipla',
    form: 'Tablet',
    strength: '400mg',
    composition: 'Ibuprofen 400mg',
  },
  {
    genericName: 'DICLOFENAC',
    brandNames: ['Voveran', 'Diclomol', 'Dynapar'],
    manufacturer: 'Novartis / Cipla',
    form: 'Tablet',
    strength: '50mg',
    composition: 'Diclofenac Sodium 50mg',
  },
  {
    genericName: 'ACECLOFENAC',
    brandNames: ['Zerodol', 'Hifenac', 'Aceclo'],
    manufacturer: 'Ipca / Intas',
    form: 'Tablet',
    strength: '100mg',
    composition: 'Aceclofenac 100mg',
  },
  {
    genericName: 'TRAMADOL',
    brandNames: ['Tramazac', 'Ultracet', 'Contramal'],
    manufacturer: 'Sun Pharma / Cipla',
    form: 'Tablet',
    strength: '50mg',
    composition: 'Tramadol 50mg',
  },

  // ========== ANTIBIOTICS ==========
  {
    genericName: 'AMOXICILLIN',
    brandNames: ['Mox', 'Novamox', 'Amoxil'],
    manufacturer: 'Ranbaxy / Cipla',
    form: 'Capsule',
    strength: '500mg',
    composition: 'Amoxicillin 500mg',
  },
  {
    genericName: 'AMOXICILLIN + CLAVULANIC ACID',
    brandNames: ['Augmentin', 'Clavam', 'Moxclav'],
    manufacturer: 'GSK / Alkem',
    form: 'Tablet',
    strength: '625mg',
    composition: 'Amoxicillin 500mg + Clavulanic Acid 125mg',
  },
  {
    genericName: 'AZITHROMYCIN',
    brandNames: ['Azithral', 'Azee', 'Zathrin'],
    manufacturer: 'Alembic / Cipla',
    form: 'Tablet',
    strength: '500mg',
    composition: 'Azithromycin 500mg',
  },
  {
    genericName: 'CIPROFLOXACIN',
    brandNames: ['Ciplox', 'Cifran', 'Ciprox'],
    manufacturer: 'Cipla / Ranbaxy',
    form: 'Tablet',
    strength: '500mg',
    composition: 'Ciprofloxacin 500mg',
  },
  {
    genericName: 'CEFIXIME',
    brandNames: ['Taxim-O', 'Ceftas', 'Cefolac'],
    manufacturer: 'Alkem / Cipla',
    form: 'Tablet',
    strength: '200mg',
    composition: 'Cefixime 200mg',
  },
  {
    genericName: 'DOXYCYCLINE',
    brandNames: ['Doxycip', 'Doxt', 'Vibramycin'],
    manufacturer: 'Cipla / Pfizer',
    form: 'Capsule',
    strength: '100mg',
    composition: 'Doxycycline 100mg',
  },
  {
    genericName: 'METRONIDAZOLE',
    brandNames: ['Flagyl', 'Metrogyl', 'Metro'],
    manufacturer: 'Sanofi / Unique',
    form: 'Tablet',
    strength: '400mg',
    composition: 'Metronidazole 400mg',
  },

  // ========== ANTACIDS & ANTIULCER ==========
  {
    genericName: 'PANTOPRAZOLE',
    brandNames: ['Pan', 'Pantop', 'Nupenta'],
    manufacturer: 'Alkem / Sun Pharma',
    form: 'Tablet',
    strength: '40mg',
    composition: 'Pantoprazole 40mg',
  },
  {
    genericName: 'OMEPRAZOLE',
    brandNames: ['Omez', 'Prilosec', 'Ocid'],
    manufacturer: 'Dr Reddy\'s',
    form: 'Capsule',
    strength: '20mg',
    composition: 'Omeprazole 20mg',
  },
  {
    genericName: 'RANITIDINE',
    brandNames: ['Aciloc', 'Rantac', 'Zinetac'],
    manufacturer: 'Cadila / Ranbaxy',
    form: 'Tablet',
    strength: '150mg',
    composition: 'Ranitidine 150mg',
  },
  {
    genericName: 'RABEPRAZOLE',
    brandNames: ['Rablet', 'Rabicip', 'Razo'],
    manufacturer: 'Lupin / Cipla',
    form: 'Tablet',
    strength: '20mg',
    composition: 'Rabeprazole 20mg',
  },
  {
    genericName: 'DOMPERIDONE',
    brandNames: ['Domstal', 'Domperi', 'Dom-DT'],
    manufacturer: 'Torrent / Cipla',
    form: 'Tablet',
    strength: '10mg',
    composition: 'Domperidone 10mg',
  },

  // ========== ANTIHISTAMINES & ANTI-ALLERGIC ==========
  {
    genericName: 'CETIRIZINE',
    brandNames: ['Zyrtec', 'Okacet', 'Ceteze'],
    manufacturer: 'UCB / Cipla',
    form: 'Tablet',
    strength: '10mg',
    composition: 'Cetirizine 10mg',
  },
  {
    genericName: 'LEVOCETIRIZINE',
    brandNames: ['Levocet', 'Lcz', 'Xyzal'],
    manufacturer: 'Cipla / Glenmark',
    form: 'Tablet',
    strength: '5mg',
    composition: 'Levocetirizine 5mg',
  },
  {
    genericName: 'MONTELUKAST',
    brandNames: ['Montair', 'Montek', 'Singulair'],
    manufacturer: 'Cipla / Sun Pharma',
    form: 'Tablet',
    strength: '10mg',
    composition: 'Montelukast 10mg',
  },
  {
    genericName: 'FEXOFENADINE',
    brandNames: ['Allegra', 'Fexo', 'Fexova'],
    manufacturer: 'Sanofi / Cipla',
    form: 'Tablet',
    strength: '120mg',
    composition: 'Fexofenadine 120mg',
  },

  // ========== COUGH & COLD ==========
  {
    genericName: 'DEXTROMETHORPHAN + CHLORPHENIRAMINE',
    brandNames: ['Corex', 'Cofdex', 'Tossex'],
    manufacturer: 'Pfizer / Cipla',
    form: 'Syrup',
    strength: '100ml',
    composition: 'Dextromethorphan + Chlorpheniramine',
  },
  {
    genericName: 'AMBROXOL',
    brandNames: ['Mucinac', 'Ambrolite', 'Ambrodil'],
    manufacturer: 'Cipla / Sun Pharma',
    form: 'Syrup',
    strength: '15mg/5ml',
    composition: 'Ambroxol 15mg per 5ml',
  },
  {
    genericName: 'BROMHEXINE',
    brandNames: ['Ascoril', 'Brozeet', 'Brofex'],
    manufacturer: 'Glenmark / Cipla',
    form: 'Tablet',
    strength: '8mg',
    composition: 'Bromhexine 8mg',
  },

  // ========== ANTIDIABETIC ==========
  {
    genericName: 'METFORMIN',
    brandNames: ['Glycomet', 'Glucophage', 'Obimet'],
    manufacturer: 'USV / Cipla',
    form: 'Tablet',
    strength: '500mg',
    composition: 'Metformin 500mg',
  },
  {
    genericName: 'GLIMEPIRIDE',
    brandNames: ['Amaryl', 'Glimisave', 'Gemer'],
    manufacturer: 'Sanofi / USV',
    form: 'Tablet',
    strength: '2mg',
    composition: 'Glimepiride 2mg',
  },
  {
    genericName: 'VILDAGLIPTIN',
    brandNames: ['Galvus', 'Zomelis', 'Jalra'],
    manufacturer: 'Novartis / Glenmark',
    form: 'Tablet',
    strength: '50mg',
    composition: 'Vildagliptin 50mg',
  },
  {
    genericName: 'SITAGLIPTIN',
    brandNames: ['Januvia', 'Zita', 'Sitared'],
    manufacturer: 'MSD / Sun Pharma',
    form: 'Tablet',
    strength: '100mg',
    composition: 'Sitagliptin 100mg',
  },

  // ========== ANTIHYPERTENSIVE ==========
  {
    genericName: 'AMLODIPINE',
    brandNames: ['Amlong', 'Stamlo', 'Norvasc'],
    manufacturer: 'Micro Labs / Pfizer',
    form: 'Tablet',
    strength: '5mg',
    composition: 'Amlodipine 5mg',
  },
  {
    genericName: 'TELMISARTAN',
    brandNames: ['Telma', 'Telmikind', 'Telsar'],
    manufacturer: 'Glenmark / Mankind',
    form: 'Tablet',
    strength: '40mg',
    composition: 'Telmisartan 40mg',
  },
  {
    genericName: 'ATENOLOL',
    brandNames: ['Aten', 'Tenormin', 'Betacard'],
    manufacturer: 'Zydus / AstraZeneca',
    form: 'Tablet',
    strength: '50mg',
    composition: 'Atenolol 50mg',
  },
  {
    genericName: 'LOSARTAN',
    brandNames: ['Losar', 'Cozaar', 'Repace'],
    manufacturer: 'Cipla / MSD',
    form: 'Tablet',
    strength: '50mg',
    composition: 'Losartan 50mg',
  },
  {
    genericName: 'RAMIPRIL',
    brandNames: ['Cardace', 'Ramipres', 'Altace'],
    manufacturer: 'Aventis / Lupin',
    form: 'Tablet',
    strength: '5mg',
    composition: 'Ramipril 5mg',
  },

  // ========== LIPID LOWERING ==========
  {
    genericName: 'ATORVASTATIN',
    brandNames: ['Atorva', 'Lipitor', 'Storvas'],
    manufacturer: 'Zydus / Pfizer',
    form: 'Tablet',
    strength: '10mg',
    composition: 'Atorvastatin 10mg',
  },
  {
    genericName: 'ROSUVASTATIN',
    brandNames: ['Rosuvas', 'Crestor', 'Rozat'],
    manufacturer: 'Sun Pharma / AstraZeneca',
    form: 'Tablet',
    strength: '10mg',
    composition: 'Rosuvastatin 10mg',
  },
  {
    genericName: 'FENOFIBRATE',
    brandNames: ['Fenocor', 'Lipanthyl', 'Fenolip'],
    manufacturer: 'Abbott / Sun Pharma',
    form: 'Tablet',
    strength: '160mg',
    composition: 'Fenofibrate 160mg',
  },

  // ========== ANTICOAGULANTS ==========
  {
    genericName: 'ASPIRIN',
    brandNames: ['Ecosprin', 'Disprin', 'Aspent'],
    manufacturer: 'USV / Reckitt Benckiser',
    form: 'Tablet',
    strength: '75mg',
    composition: 'Aspirin 75mg',
  },
  {
    genericName: 'CLOPIDOGREL',
    brandNames: ['Plavix', 'Clopivas', 'Deplatt'],
    manufacturer: 'Sanofi / Cipla',
    form: 'Tablet',
    strength: '75mg',
    composition: 'Clopidogrel 75mg',
  },

  // ========== VITAMINS & SUPPLEMENTS ==========
  {
    genericName: 'VITAMIN D3',
    brandNames: ['Calcirol', 'D-Rise', 'Uprise D3'],
    manufacturer: 'Cadila / Cipla',
    form: 'Capsule',
    strength: '60000 IU',
    composition: 'Cholecalciferol 60000 IU',
  },
  {
    genericName: 'VITAMIN B COMPLEX',
    brandNames: ['Becosules', 'Neurobion', 'Nervigen'],
    manufacturer: 'Pfizer / Merck',
    form: 'Capsule',
    strength: 'Multi',
    composition: 'B1, B6, B12 Complex',
  },
  {
    genericName: 'CALCIUM + VITAMIN D3',
    brandNames: ['Shelcal', 'Calcimax', 'Cal-D'],
    manufacturer: 'Torrent / Cipla',
    form: 'Tablet',
    strength: '500mg+250IU',
    composition: 'Calcium 500mg + Vitamin D3 250 IU',
  },
  {
    genericName: 'IRON + FOLIC ACID',
    brandNames: ['Autrin', 'Fefol', 'Folvite'],
    manufacturer: 'Lupin / Abbott',
    form: 'Tablet',
    strength: '100mg+1.5mg',
    composition: 'Ferrous Ascorbate 100mg + Folic Acid 1.5mg',
  },

  // ========== THYROID MEDICATIONS ==========
  {
    genericName: 'LEVOTHYROXINE',
    brandNames: ['Thyronorm', 'Eltroxin', 'Thyrox'],
    manufacturer: 'Abbott / GSK',
    form: 'Tablet',
    strength: '50mcg',
    composition: 'Levothyroxine Sodium 50mcg',
  },
  {
    genericName: 'LEVOTHYROXINE',
    brandNames: ['Thyronorm', 'Eltroxin'],
    manufacturer: 'Abbott / GSK',
    form: 'Tablet',
    strength: '100mcg',
    composition: 'Levothyroxine Sodium 100mcg',
  },

  // ========== ANTIEMETIC ==========
  {
    genericName: 'ONDANSETRON',
    brandNames: ['Emeset', 'Zofran', 'Ondem'],
    manufacturer: 'Cipla / GSK',
    form: 'Tablet',
    strength: '4mg',
    composition: 'Ondansetron 4mg',
  },

  // ========== ANTIFUNGAL ==========
  {
    genericName: 'FLUCONAZOLE',
    brandNames: ['Flucos', 'Diflucan', 'Forcan'],
    manufacturer: 'Cipla / Pfizer',
    form: 'Tablet',
    strength: '150mg',
    composition: 'Fluconazole 150mg',
  },
  {
    genericName: 'CLOTRIMAZOLE',
    brandNames: ['Candid', 'Canesten', 'Clozole'],
    manufacturer: 'Glenmark / Bayer',
    form: 'Cream',
    strength: '1%',
    composition: 'Clotrimazole 1% w/w',
  },

  // ========== ANTIPROTOZOAL ==========
  {
    genericName: 'TINIDAZOLE',
    brandNames: ['Tiniba', 'Tindamax', 'Fasigyn'],
    manufacturer: 'Wockhardt / Pfizer',
    form: 'Tablet',
    strength: '500mg',
    composition: 'Tinidazole 500mg',
  },

  // ========== MUSCLE RELAXANTS ==========
  {
    genericName: 'THIOCOLCHICOSIDE',
    brandNames: ['Myospaz', 'Myoril', 'Muscoril'],
    manufacturer: 'Sun Pharma / A Menarini',
    form: 'Tablet',
    strength: '4mg',
    composition: 'Thiocolchicoside 4mg',
  },

  // ========== ANTISPASMODIC ==========
  {
    genericName: 'DROTAVERINE',
    brandNames: ['Drotin', 'Meftal Spas', 'Spasmo Proxyvon'],
    manufacturer: 'Ranbaxy / Blue Cross',
    form: 'Tablet',
    strength: '80mg',
    composition: 'Drotaverine 80mg',
  },
  {
    genericName: 'DICYCLOMINE',
    brandNames: ['Meftal Spas', 'Cyclospas', 'Colimex'],
    manufacturer: 'Blue Cross / Zydus',
    form: 'Tablet',
    strength: '20mg',
    composition: 'Dicyclomine 20mg',
  },

  // ========== ANTI-ANXIETY ==========
  {
    genericName: 'ALPRAZOLAM',
    brandNames: ['Alprax', 'Xanax', 'Restyl'],
    manufacturer: 'Torrent / Pfizer',
    form: 'Tablet',
    strength: '0.5mg',
    composition: 'Alprazolam 0.5mg',
  },

  // ========== ANTI-DEPRESSANTS ==========
  {
    genericName: 'ESCITALOPRAM',
    brandNames: ['Nexito', 'Rexipra', 'Lexapro'],
    manufacturer: 'Sun Pharma / Intas',
    form: 'Tablet',
    strength: '10mg',
    composition: 'Escitalopram 10mg',
  },
  {
    genericName: 'FLUOXETINE',
    brandNames: ['Fludac', 'Prozac', 'Flu'],
    manufacturer: 'Cadila / Lilly',
    form: 'Capsule',
    strength: '20mg',
    composition: 'Fluoxetine 20mg',
  },

  // ========== ANTICONVULSANTS ==========
  {
    genericName: 'LEVETIRACETAM',
    brandNames: ['Levera', 'Keppra', 'Levipil'],
    manufacturer: 'Sun Pharma / UCB',
    form: 'Tablet',
    strength: '500mg',
    composition: 'Levetiracetam 500mg',
  },

  // ========== BRONCHODILATORS ==========
  {
    genericName: 'SALBUTAMOL',
    brandNames: ['Asthalin', 'Ventolin', 'Sal'],
    manufacturer: 'Cipla / GSK',
    form: 'Inhaler',
    strength: '100mcg',
    composition: 'Salbutamol 100mcg per puff',
  },
  {
    genericName: 'SALBUTAMOL',
    brandNames: ['Asthalin Syrup', 'Ventolin Syrup'],
    manufacturer: 'Cipla / GSK',
    form: 'Syrup',
    strength: '2mg/5ml',
    composition: 'Salbutamol 2mg per 5ml',
  },

  // ========== STEROIDS ==========
  {
    genericName: 'PREDNISOLONE',
    brandNames: ['Wysolone', 'Omnacortil', 'Predcort'],
    manufacturer: 'Wyeth / Macleods',
    form: 'Tablet',
    strength: '5mg',
    composition: 'Prednisolone 5mg',
  },
  {
    genericName: 'DEXAMETHASONE',
    brandNames: ['Dexona', 'Decdan', 'Dexasone'],
    manufacturer: 'Zydus / Cipla',
    form: 'Tablet',
    strength: '0.5mg',
    composition: 'Dexamethasone 0.5mg',
  },

  // ========== PROTON PUMP INHIBITORS COMBINATIONS ==========
  {
    genericName: 'PANTOPRAZOLE + DOMPERIDONE',
    brandNames: ['Pan-D', 'Pantop-D', 'Pentab-DSR'],
    manufacturer: 'Alkem / Sun Pharma',
    form: 'Capsule',
    strength: '40mg+30mg',
    composition: 'Pantoprazole 40mg + Domperidone 30mg',
  },

  // ========== ANTIBIOTIC COMBINATIONS ==========
  {
    genericName: 'OFLOXACIN + ORNIDAZOLE',
    brandNames: ['Oflox-OZ', 'Zanocin-OZ', 'O2'],
    manufacturer: 'Cipla / Ranbaxy',
    form: 'Tablet',
    strength: '200mg+500mg',
    composition: 'Ofloxacin 200mg + Ornidazole 500mg',
  },

  // ========== PAIN RELIEF COMBINATIONS ==========
  {
    genericName: 'PARACETAMOL + DICLOFENAC',
    brandNames: ['Voveran Plus', 'Dynapar QPS'],
    manufacturer: 'Novartis / Troikaa',
    form: 'Tablet',
    strength: '325mg+50mg',
    composition: 'Paracetamol 325mg + Diclofenac 50mg',
  },
  {
    genericName: 'ACECLOFENAC + PARACETAMOL',
    brandNames: ['Zerodol-P', 'Hifenac-P', 'Acenac-P'],
    manufacturer: 'Ipca / Intas',
    form: 'Tablet',
    strength: '100mg+325mg',
    composition: 'Aceclofenac 100mg + Paracetamol 325mg',
  },
  {
    genericName: 'TRAMADOL + PARACETAMOL',
    brandNames: ['Ultracet', 'Dolotram', 'Tramadol-P'],
    manufacturer: 'Janssen / Cipla',
    form: 'Tablet',
    strength: '37.5mg+325mg',
    composition: 'Tramadol 37.5mg + Paracetamol 325mg',
  },
];

async function seedMedicines() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const medicineModel = app.get<Model<Medicine>>(getModelToken(Medicine.name));

  try {
    console.log('🌱 Starting medicine database seeding...');
    console.log(`📊 Total medicines to seed: ${indianMedicines.length}`);

    // Check if medicine database is empty
    const existingCount = await medicineModel.countDocuments();
    console.log(`📋 Existing medicines in database: ${existingCount}`);

    if (existingCount > 0) {
      console.log('⚠️  Medicine database is not empty');
      console.log('🔄 Clearing existing medicine data...');
      await medicineModel.deleteMany({});
      console.log('✅ Cleared existing medicine data');
    }

    // Prepare medicines with searchText
    const medicinesToInsert = indianMedicines.map(medicine => ({
      ...medicine,
      searchText: `${medicine.genericName} ${medicine.brandNames.join(' ')} ${medicine.manufacturer} ${medicine.form}`,
      isActive: true,
    }));

    // Insert medicines in batches for better performance
    const batchSize = 50;
    let insertedCount = 0;

    for (let i = 0; i < medicinesToInsert.length; i += batchSize) {
      const batch = medicinesToInsert.slice(i, i + batchSize);
      await medicineModel.insertMany(batch);
      insertedCount += batch.length;
      console.log(`✅ Inserted ${insertedCount}/${medicinesToInsert.length} medicines`);
    }

    console.log('\n🎉 Medicine database seeded successfully!');
    console.log(`📊 Total medicines: ${insertedCount}`);

    // Display category breakdown
    console.log('\n📋 Category Breakdown:');
    const categories = [
      'Analgesics & Anti-inflammatory',
      'Antibiotics',
      'Antacids & Antiulcer',
      'Antihistamines & Anti-allergic',
      'Cough & Cold',
      'Antidiabetic',
      'Antihypertensive',
      'Lipid Lowering',
      'Vitamins & Supplements',
      'Others',
    ];

    categories.forEach(category => {
      const count = medicinesToInsert.filter(m =>
        m.searchText.toLowerCase().includes(category.toLowerCase())
      ).length;
      if (count > 0) {
        console.log(`   ${category}: ${count} medicines`);
      }
    });

    // Display some sample medicines
    console.log('\n📝 Sample Medicines:');
    const samples = await medicineModel.find().limit(5).lean();
    samples.forEach((med: any) => {
      console.log(`   - ${med.genericName} (${med.brandNames.join(', ')}) - ${med.form} ${med.strength}`);
    });

    console.log('\n✨ Medicine autocomplete is now ready to use!');

  } catch (error) {
    console.error('❌ Medicine seeding failed:', error);
    throw error;
  } finally {
    await app.close();
  }
}

seedMedicines();
