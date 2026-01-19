import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { Diagnosis } from '../modules/doctors/schemas/diagnosis.schema';

/**
 * Diagnosis Database Seeding Script
 *
 * This script seeds the diagnosis_database collection with commonly diagnosed
 * medical conditions across various categories.
 *
 * Data includes:
 * - Diagnosis names (medical conditions)
 * - ICD-10 codes (International Classification of Diseases)
 * - Categories (Infectious, Chronic, Respiratory, etc.)
 * - Common symptoms associated with each diagnosis
 * - Descriptions
 *
 * Usage:
 * npm run seed:diagnoses
 */

const commonDiagnoses = [
  // ========== INFECTIOUS DISEASES ==========
  {
    diagnosisName: 'Upper Respiratory Tract Infection (URTI)',
    icdCode: 'J06.9',
    category: 'Infectious',
    description: 'Infection of the upper airways including nose, sinuses, pharynx, and larynx',
    commonSymptoms: ['Sore throat', 'Runny nose', 'Cough', 'Fever', 'Headache'],
  },
  {
    diagnosisName: 'Viral Fever',
    icdCode: 'A99',
    category: 'Infectious',
    description: 'Fever caused by viral infection',
    commonSymptoms: ['High fever', 'Body ache', 'Fatigue', 'Headache', 'Chills'],
  },
  {
    diagnosisName: 'Gastroenteritis',
    icdCode: 'K52.9',
    category: 'Infectious',
    description: 'Inflammation of the gastrointestinal tract',
    commonSymptoms: ['Diarrhea', 'Vomiting', 'Abdominal pain', 'Nausea', 'Fever'],
  },
  {
    diagnosisName: 'Urinary Tract Infection (UTI)',
    icdCode: 'N39.0',
    category: 'Infectious',
    description: 'Bacterial infection of the urinary system',
    commonSymptoms: ['Burning urination', 'Frequent urination', 'Lower abdominal pain', 'Fever', 'Cloudy urine'],
  },
  {
    diagnosisName: 'Dengue Fever',
    icdCode: 'A90',
    category: 'Infectious',
    description: 'Mosquito-borne viral infection',
    commonSymptoms: ['High fever', 'Severe headache', 'Pain behind eyes', 'Joint pain', 'Rash', 'Low platelet count'],
  },
  {
    diagnosisName: 'Malaria',
    icdCode: 'B54',
    category: 'Infectious',
    description: 'Parasitic infection transmitted by mosquitoes',
    commonSymptoms: ['Periodic fever', 'Chills', 'Sweating', 'Headache', 'Fatigue', 'Muscle ache'],
  },
  {
    diagnosisName: 'Typhoid Fever',
    icdCode: 'A01.0',
    category: 'Infectious',
    description: 'Bacterial infection caused by Salmonella typhi',
    commonSymptoms: ['Sustained fever', 'Headache', 'Weakness', 'Abdominal pain', 'Loss of appetite'],
  },
  {
    diagnosisName: 'Tuberculosis (Pulmonary)',
    icdCode: 'A15.0',
    category: 'Infectious',
    description: 'Bacterial infection primarily affecting the lungs',
    commonSymptoms: ['Chronic cough', 'Hemoptysis', 'Night sweats', 'Weight loss', 'Fever', 'Chest pain'],
  },
  {
    diagnosisName: 'COVID-19',
    icdCode: 'U07.1',
    category: 'Infectious',
    description: 'Coronavirus disease 2019',
    commonSymptoms: ['Fever', 'Dry cough', 'Fatigue', 'Loss of taste or smell', 'Difficulty breathing'],
  },
  {
    diagnosisName: 'Pneumonia',
    icdCode: 'J18.9',
    category: 'Infectious',
    description: 'Infection of the lungs causing inflammation of air sacs',
    commonSymptoms: ['Cough with phlegm', 'Fever', 'Difficulty breathing', 'Chest pain', 'Fatigue'],
  },

  // ========== RESPIRATORY DISEASES ==========
  {
    diagnosisName: 'Bronchial Asthma',
    icdCode: 'J45.9',
    category: 'Respiratory',
    description: 'Chronic inflammatory disease of the airways',
    commonSymptoms: ['Wheezing', 'Shortness of breath', 'Chest tightness', 'Chronic cough', 'Difficulty breathing'],
  },
  {
    diagnosisName: 'Chronic Obstructive Pulmonary Disease (COPD)',
    icdCode: 'J44.9',
    category: 'Respiratory',
    description: 'Progressive lung disease causing breathing difficulties',
    commonSymptoms: ['Chronic cough', 'Shortness of breath', 'Wheezing', 'Chest tightness', 'Excessive mucus'],
  },
  {
    diagnosisName: 'Bronchitis (Acute)',
    icdCode: 'J20.9',
    category: 'Respiratory',
    description: 'Inflammation of the bronchial tubes',
    commonSymptoms: ['Cough with mucus', 'Chest discomfort', 'Fatigue', 'Shortness of breath', 'Mild fever'],
  },
  {
    diagnosisName: 'Allergic Rhinitis',
    icdCode: 'J30.4',
    category: 'Respiratory',
    description: 'Inflammation of nasal passages due to allergens',
    commonSymptoms: ['Sneezing', 'Runny nose', 'Nasal congestion', 'Itchy eyes', 'Watery eyes'],
  },
  {
    diagnosisName: 'Sinusitis',
    icdCode: 'J32.9',
    category: 'Respiratory',
    description: 'Inflammation of the sinuses',
    commonSymptoms: ['Facial pain', 'Nasal congestion', 'Thick nasal discharge', 'Headache', 'Reduced sense of smell'],
  },

  // ========== CARDIOVASCULAR DISEASES ==========
  {
    diagnosisName: 'Hypertension (Essential)',
    icdCode: 'I10',
    category: 'Cardiovascular',
    description: 'Persistently elevated blood pressure',
    commonSymptoms: ['Headache', 'Dizziness', 'Chest pain', 'Fatigue', 'Vision problems'],
  },
  {
    diagnosisName: 'Coronary Artery Disease',
    icdCode: 'I25.1',
    category: 'Cardiovascular',
    description: 'Reduced blood flow to heart muscle',
    commonSymptoms: ['Chest pain', 'Shortness of breath', 'Fatigue', 'Palpitations', 'Sweating'],
  },
  {
    diagnosisName: 'Congestive Heart Failure',
    icdCode: 'I50.9',
    category: 'Cardiovascular',
    description: 'Heart unable to pump blood effectively',
    commonSymptoms: ['Shortness of breath', 'Fatigue', 'Swollen legs', 'Rapid heartbeat', 'Cough'],
  },
  {
    diagnosisName: 'Atrial Fibrillation',
    icdCode: 'I48.9',
    category: 'Cardiovascular',
    description: 'Irregular heart rhythm',
    commonSymptoms: ['Palpitations', 'Chest pain', 'Dizziness', 'Fatigue', 'Shortness of breath'],
  },
  {
    diagnosisName: 'Angina Pectoris',
    icdCode: 'I20.9',
    category: 'Cardiovascular',
    description: 'Chest pain due to reduced blood flow to heart',
    commonSymptoms: ['Chest pain', 'Pressure in chest', 'Pain radiating to arm', 'Shortness of breath', 'Sweating'],
  },

  // ========== GASTROINTESTINAL DISEASES ==========
  {
    diagnosisName: 'Gastroesophageal Reflux Disease (GERD)',
    icdCode: 'K21.9',
    category: 'Gastrointestinal',
    description: 'Chronic acid reflux from stomach to esophagus',
    commonSymptoms: ['Heartburn', 'Regurgitation', 'Chest pain', 'Difficulty swallowing', 'Chronic cough'],
  },
  {
    diagnosisName: 'Peptic Ulcer Disease',
    icdCode: 'K27.9',
    category: 'Gastrointestinal',
    description: 'Open sores in stomach or small intestine lining',
    commonSymptoms: ['Abdominal pain', 'Bloating', 'Nausea', 'Vomiting', 'Dark stools'],
  },
  {
    diagnosisName: 'Irritable Bowel Syndrome (IBS)',
    icdCode: 'K58.9',
    category: 'Gastrointestinal',
    description: 'Functional disorder affecting the large intestine',
    commonSymptoms: ['Abdominal pain', 'Bloating', 'Diarrhea', 'Constipation', 'Gas'],
  },
  {
    diagnosisName: 'Inflammatory Bowel Disease',
    icdCode: 'K50.9',
    category: 'Gastrointestinal',
    description: 'Chronic inflammation of the digestive tract',
    commonSymptoms: ['Diarrhea', 'Abdominal pain', 'Blood in stool', 'Weight loss', 'Fatigue'],
  },
  {
    diagnosisName: 'Chronic Constipation',
    icdCode: 'K59.0',
    category: 'Gastrointestinal',
    description: 'Persistent difficulty in bowel movements',
    commonSymptoms: ['Infrequent bowel movements', 'Hard stools', 'Straining', 'Abdominal discomfort', 'Bloating'],
  },
  {
    diagnosisName: 'Hepatitis',
    icdCode: 'K75.9',
    category: 'Gastrointestinal',
    description: 'Inflammation of the liver',
    commonSymptoms: ['Jaundice', 'Fatigue', 'Abdominal pain', 'Loss of appetite', 'Nausea'],
  },
  {
    diagnosisName: 'Gallstones (Cholelithiasis)',
    icdCode: 'K80.2',
    category: 'Gastrointestinal',
    description: 'Hardened deposits in the gallbladder',
    commonSymptoms: ['Right upper abdominal pain', 'Nausea', 'Vomiting', 'Fever', 'Jaundice'],
  },

  // ========== NEUROLOGICAL DISEASES ==========
  {
    diagnosisName: 'Migraine',
    icdCode: 'G43.9',
    category: 'Neurological',
    description: 'Recurrent severe headaches with neurological symptoms',
    commonSymptoms: ['Severe headache', 'Nausea', 'Vomiting', 'Sensitivity to light', 'Visual disturbances'],
  },
  {
    diagnosisName: 'Tension Headache',
    icdCode: 'G44.2',
    category: 'Neurological',
    description: 'Most common type of headache',
    commonSymptoms: ['Bilateral headache', 'Tightness around head', 'Mild to moderate pain', 'Neck pain'],
  },
  {
    diagnosisName: 'Epilepsy',
    icdCode: 'G40.9',
    category: 'Neurological',
    description: 'Neurological disorder causing recurrent seizures',
    commonSymptoms: ['Seizures', 'Temporary confusion', 'Loss of consciousness', 'Muscle jerking', 'Staring spells'],
  },
  {
    diagnosisName: 'Stroke (Cerebrovascular Accident)',
    icdCode: 'I64',
    category: 'Neurological',
    description: 'Interrupted blood supply to brain',
    commonSymptoms: ['Sudden weakness', 'Facial drooping', 'Slurred speech', 'Vision problems', 'Severe headache'],
  },
  {
    diagnosisName: 'Parkinson\'s Disease',
    icdCode: 'G20',
    category: 'Neurological',
    description: 'Progressive nervous system disorder affecting movement',
    commonSymptoms: ['Tremor', 'Slow movement', 'Rigid muscles', 'Impaired balance', 'Speech changes'],
  },
  {
    diagnosisName: 'Peripheral Neuropathy',
    icdCode: 'G62.9',
    category: 'Neurological',
    description: 'Damage to peripheral nerves',
    commonSymptoms: ['Numbness', 'Tingling', 'Burning sensation', 'Weakness', 'Pain in hands or feet'],
  },
  {
    diagnosisName: 'Vertigo (Benign Paroxysmal Positional Vertigo)',
    icdCode: 'H81.1',
    category: 'Neurological',
    description: 'Spinning sensation caused by inner ear problems',
    commonSymptoms: ['Dizziness', 'Loss of balance', 'Nausea', 'Vomiting', 'Abnormal eye movements'],
  },

  // ========== MUSCULOSKELETAL DISEASES ==========
  {
    diagnosisName: 'Osteoarthritis',
    icdCode: 'M19.9',
    category: 'Musculoskeletal',
    description: 'Degenerative joint disease',
    commonSymptoms: ['Joint pain', 'Stiffness', 'Reduced range of motion', 'Swelling', 'Grating sensation'],
  },
  {
    diagnosisName: 'Rheumatoid Arthritis',
    icdCode: 'M06.9',
    category: 'Musculoskeletal',
    description: 'Autoimmune inflammatory arthritis',
    commonSymptoms: ['Joint pain', 'Swelling', 'Morning stiffness', 'Fatigue', 'Fever'],
  },
  {
    diagnosisName: 'Low Back Pain (Lumbago)',
    icdCode: 'M54.5',
    category: 'Musculoskeletal',
    description: 'Pain in the lower back region',
    commonSymptoms: ['Lower back pain', 'Muscle stiffness', 'Limited mobility', 'Pain radiating to leg', 'Muscle spasms'],
  },
  {
    diagnosisName: 'Cervical Spondylosis',
    icdCode: 'M47.812',
    category: 'Musculoskeletal',
    description: 'Age-related wear and tear of cervical spine',
    commonSymptoms: ['Neck pain', 'Stiffness', 'Headache', 'Numbness in arms', 'Weakness'],
  },
  {
    diagnosisName: 'Gout',
    icdCode: 'M10.9',
    category: 'Musculoskeletal',
    description: 'Arthritis caused by uric acid crystal deposition',
    commonSymptoms: ['Severe joint pain', 'Swelling', 'Redness', 'Warmth', 'Limited motion'],
  },
  {
    diagnosisName: 'Osteoporosis',
    icdCode: 'M81.0',
    category: 'Musculoskeletal',
    description: 'Weakening of bones leading to fractures',
    commonSymptoms: ['Back pain', 'Loss of height', 'Stooped posture', 'Bone fractures', 'Fragile bones'],
  },
  {
    diagnosisName: 'Fibromyalgia',
    icdCode: 'M79.7',
    category: 'Musculoskeletal',
    description: 'Widespread musculoskeletal pain with fatigue',
    commonSymptoms: ['Widespread pain', 'Fatigue', 'Sleep problems', 'Cognitive difficulties', 'Tender points'],
  },

  // ========== ENDOCRINE DISEASES ==========
  {
    diagnosisName: 'Type 2 Diabetes Mellitus',
    icdCode: 'E11.9',
    category: 'Endocrine',
    description: 'Chronic condition affecting blood sugar regulation',
    commonSymptoms: ['Increased thirst', 'Frequent urination', 'Fatigue', 'Blurred vision', 'Slow healing wounds'],
  },
  {
    diagnosisName: 'Type 1 Diabetes Mellitus',
    icdCode: 'E10.9',
    category: 'Endocrine',
    description: 'Autoimmune condition with insulin deficiency',
    commonSymptoms: ['Increased thirst', 'Frequent urination', 'Weight loss', 'Fatigue', 'Increased hunger'],
  },
  {
    diagnosisName: 'Hypothyroidism',
    icdCode: 'E03.9',
    category: 'Endocrine',
    description: 'Underactive thyroid gland',
    commonSymptoms: ['Fatigue', 'Weight gain', 'Cold intolerance', 'Dry skin', 'Constipation', 'Hair loss'],
  },
  {
    diagnosisName: 'Hyperthyroidism',
    icdCode: 'E05.9',
    category: 'Endocrine',
    description: 'Overactive thyroid gland',
    commonSymptoms: ['Weight loss', 'Rapid heartbeat', 'Increased appetite', 'Nervousness', 'Tremor', 'Sweating'],
  },
  {
    diagnosisName: 'Polycystic Ovary Syndrome (PCOS)',
    icdCode: 'E28.2',
    category: 'Endocrine',
    description: 'Hormonal disorder in women of reproductive age',
    commonSymptoms: ['Irregular periods', 'Excess hair growth', 'Acne', 'Weight gain', 'Infertility'],
  },
  {
    diagnosisName: 'Obesity',
    icdCode: 'E66.9',
    category: 'Endocrine',
    description: 'Excessive body fat accumulation',
    commonSymptoms: ['Excess weight', 'Fatigue', 'Joint pain', 'Breathing difficulties', 'High cholesterol'],
  },

  // ========== DERMATOLOGICAL DISEASES ==========
  {
    diagnosisName: 'Eczema (Atopic Dermatitis)',
    icdCode: 'L20.9',
    category: 'Dermatological',
    description: 'Chronic inflammatory skin condition',
    commonSymptoms: ['Itchy skin', 'Red rash', 'Dry skin', 'Thickened skin', 'Scaly patches'],
  },
  {
    diagnosisName: 'Psoriasis',
    icdCode: 'L40.9',
    category: 'Dermatological',
    description: 'Autoimmune skin condition with rapid cell turnover',
    commonSymptoms: ['Red patches', 'Silvery scales', 'Dry cracked skin', 'Itching', 'Burning'],
  },
  {
    diagnosisName: 'Acne Vulgaris',
    icdCode: 'L70.0',
    category: 'Dermatological',
    description: 'Common skin condition causing pimples',
    commonSymptoms: ['Pimples', 'Blackheads', 'Whiteheads', 'Oily skin', 'Scarring'],
  },
  {
    diagnosisName: 'Fungal Infection (Dermatophytosis)',
    icdCode: 'B35.9',
    category: 'Dermatological',
    description: 'Fungal infection of skin, hair, or nails',
    commonSymptoms: ['Itchy rash', 'Ring-shaped patches', 'Scaly skin', 'Redness', 'Hair loss'],
  },
  {
    diagnosisName: 'Urticaria (Hives)',
    icdCode: 'L50.9',
    category: 'Dermatological',
    description: 'Allergic skin reaction with raised welts',
    commonSymptoms: ['Raised welts', 'Itching', 'Redness', 'Swelling', 'Burning sensation'],
  },
  {
    diagnosisName: 'Vitiligo',
    icdCode: 'L80',
    category: 'Dermatological',
    description: 'Loss of skin pigmentation',
    commonSymptoms: ['White patches on skin', 'Premature graying of hair', 'Loss of color in mouth'],
  },

  // ========== CHRONIC DISEASES ==========
  {
    diagnosisName: 'Chronic Kidney Disease',
    icdCode: 'N18.9',
    category: 'Chronic',
    description: 'Progressive loss of kidney function',
    commonSymptoms: ['Fatigue', 'Swelling in feet', 'Decreased urine output', 'Nausea', 'Loss of appetite'],
  },
  {
    diagnosisName: 'Chronic Liver Disease',
    icdCode: 'K76.9',
    category: 'Chronic',
    description: 'Progressive deterioration of liver function',
    commonSymptoms: ['Fatigue', 'Jaundice', 'Abdominal pain', 'Swelling', 'Easy bruising'],
  },
  {
    diagnosisName: 'Anemia (Iron Deficiency)',
    icdCode: 'D50.9',
    category: 'Chronic',
    description: 'Reduced red blood cell count or hemoglobin',
    commonSymptoms: ['Fatigue', 'Weakness', 'Pale skin', 'Shortness of breath', 'Dizziness', 'Cold hands'],
  },
  {
    diagnosisName: 'Vitamin D Deficiency',
    icdCode: 'E55.9',
    category: 'Chronic',
    description: 'Inadequate vitamin D levels',
    commonSymptoms: ['Fatigue', 'Bone pain', 'Muscle weakness', 'Mood changes', 'Frequent infections'],
  },
  {
    diagnosisName: 'Anxiety Disorder',
    icdCode: 'F41.9',
    category: 'Chronic',
    description: 'Excessive worry and fear',
    commonSymptoms: ['Restlessness', 'Rapid heartbeat', 'Sweating', 'Difficulty concentrating', 'Sleep problems'],
  },
  {
    diagnosisName: 'Depression (Major Depressive Disorder)',
    icdCode: 'F32.9',
    category: 'Chronic',
    description: 'Persistent feelings of sadness and loss of interest',
    commonSymptoms: ['Persistent sadness', 'Loss of interest', 'Fatigue', 'Sleep changes', 'Appetite changes'],
  },

  // ========== OTHER COMMON CONDITIONS ==========
  {
    diagnosisName: 'Dehydration',
    icdCode: 'E86.0',
    category: 'Other',
    description: 'Excessive loss of body fluids',
    commonSymptoms: ['Thirst', 'Dry mouth', 'Decreased urination', 'Dizziness', 'Fatigue'],
  },
  {
    diagnosisName: 'Heat Stroke',
    icdCode: 'T67.0',
    category: 'Other',
    description: 'Body temperature rises to dangerous levels',
    commonSymptoms: ['High body temperature', 'Confusion', 'Rapid pulse', 'Hot dry skin', 'Headache'],
  },
  {
    diagnosisName: 'Insomnia',
    icdCode: 'G47.0',
    category: 'Other',
    description: 'Difficulty falling or staying asleep',
    commonSymptoms: ['Difficulty falling asleep', 'Waking up often', 'Fatigue', 'Daytime sleepiness', 'Irritability'],
  },
  {
    diagnosisName: 'Conjunctivitis (Pink Eye)',
    icdCode: 'H10.9',
    category: 'Other',
    description: 'Inflammation of the eye conjunctiva',
    commonSymptoms: ['Red eyes', 'Itching', 'Discharge', 'Watery eyes', 'Burning sensation'],
  },
];

async function seedDiagnoses() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const diagnosisModel: Model<Diagnosis> = app.get(getModelToken(Diagnosis.name));

  try {
    console.log('🌱 Starting diagnosis database seeding...');
    console.log(`📊 Total diagnoses to seed: ${commonDiagnoses.length}`);

    // Check if diagnosis database is empty
    const existingCount = await diagnosisModel.countDocuments();
    console.log(`📋 Existing diagnoses in database: ${existingCount}`);

    if (existingCount > 0) {
      console.log('⚠️  Diagnosis database is not empty');
      console.log('🔄 Clearing existing diagnosis data...');
      await diagnosisModel.deleteMany({});
      console.log('✅ Cleared existing diagnosis data');
    }

    // Prepare diagnoses with searchText
    const diagnosesToInsert = commonDiagnoses.map(diagnosis => ({
      ...diagnosis,
      searchText: `${diagnosis.diagnosisName} ${diagnosis.icdCode || ''} ${diagnosis.description || ''} ${diagnosis.commonSymptoms?.join(' ') || ''}`,
      isActive: true,
    }));

    // Insert diagnoses in batches for better performance
    const batchSize = 50;
    let insertedCount = 0;

    for (let i = 0; i < diagnosesToInsert.length; i += batchSize) {
      const batch = diagnosesToInsert.slice(i, i + batchSize);
      await diagnosisModel.insertMany(batch);
      insertedCount += batch.length;
      console.log(`✅ Inserted ${insertedCount}/${diagnosesToInsert.length} diagnoses`);
    }

    console.log('\n🎉 Diagnosis database seeded successfully!');
    console.log(`📊 Total diagnoses: ${insertedCount}`);

    // Display category breakdown
    console.log('\n📋 Category Breakdown:');
    const categories = [
      'Infectious',
      'Respiratory',
      'Cardiovascular',
      'Gastrointestinal',
      'Neurological',
      'Musculoskeletal',
      'Endocrine',
      'Dermatological',
      'Chronic',
      'Other',
    ];

    for (const category of categories) {
      const count = await diagnosisModel.countDocuments({ category });
      if (count > 0) {
        console.log(`   ${category}: ${count} diagnoses`);
      }
    }

    // Display some sample diagnoses
    console.log('\n📝 Sample Diagnoses:');
    const samples = await diagnosisModel.find().limit(5).lean();
    samples.forEach((diagnosis: any) => {
      console.log(`   - ${diagnosis.diagnosisName} (${diagnosis.icdCode}) - ${diagnosis.category}`);
    });

    console.log('\n✨ Diagnosis autocomplete is now ready to use!');

  } catch (error) {
    console.error('❌ Diagnosis seeding failed:', error);
    throw error;
  } finally {
    await app.close();
  }
}

seedDiagnoses();
