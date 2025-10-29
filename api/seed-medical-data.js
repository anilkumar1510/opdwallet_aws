const { MongoClient } = require('mongodb');

// MongoDB connection URL
const url = 'mongodb://admin:admin123@localhost:27017';
const dbName = 'opd_wallet';

// Sample Medicines Data
const medicines = [
  { genericName: 'Paracetamol', brandNames: ['Crocin', 'Dolo', 'Calpol'], manufacturer: 'GSK', form: 'Tablet', strength: '500mg', isActive: true },
  { genericName: 'Ibuprofen', brandNames: ['Brufen', 'Combiflam'], manufacturer: 'Abbott', form: 'Tablet', strength: '400mg', isActive: true },
  { genericName: 'Amoxicillin', brandNames: ['Amox', 'Novamox'], manufacturer: 'Cipla', form: 'Capsule', strength: '500mg', isActive: true },
  { genericName: 'Azithromycin', brandNames: ['Azithral', 'Zithromax'], manufacturer: 'Alembic', form: 'Tablet', strength: '500mg', isActive: true },
  { genericName: 'Cetirizine', brandNames: ['Zyrtec', 'Alerid'], manufacturer: 'UCB', form: 'Tablet', strength: '10mg', isActive: true },
  { genericName: 'Omeprazole', brandNames: ['Omez', 'Prilosec'], manufacturer: 'Dr. Reddy', form: 'Capsule', strength: '20mg', isActive: true },
  { genericName: 'Metformin', brandNames: ['Glucophage', 'Glycomet'], manufacturer: 'USV', form: 'Tablet', strength: '500mg', isActive: true },
  { genericName: 'Atorvastatin', brandNames: ['Lipitor', 'Atorva'], manufacturer: 'Pfizer', form: 'Tablet', strength: '10mg', isActive: true },
  { genericName: 'Amlodipine', brandNames: ['Norvasc', 'Amlong'], manufacturer: 'Pfizer', form: 'Tablet', strength: '5mg', isActive: true },
  { genericName: 'Losartan', brandNames: ['Cozaar', 'Losar'], manufacturer: 'MSD', form: 'Tablet', strength: '50mg', isActive: true },
  { genericName: 'Levothyroxine', brandNames: ['Synthroid', 'Thyronorm'], manufacturer: 'Abbott', form: 'Tablet', strength: '50mcg', isActive: true },
  { genericName: 'Salbutamol', brandNames: ['Asthalin', 'Ventolin'], manufacturer: 'Cipla', form: 'Inhaler', strength: '100mcg', isActive: true },
  { genericName: 'Pantoprazole', brandNames: ['Protonix', 'Pan'], manufacturer: 'Sun Pharma', form: 'Tablet', strength: '40mg', isActive: true },
  { genericName: 'Ciprofloxacin', brandNames: ['Cipro', 'Ciplox'], manufacturer: 'Cipla', form: 'Tablet', strength: '500mg', isActive: true },
  { genericName: 'Montelukast', brandNames: ['Singulair', 'Montair'], manufacturer: 'MSD', form: 'Tablet', strength: '10mg', isActive: true },
  { genericName: 'Prednisone', brandNames: ['Deltasone', 'Prednisolone'], manufacturer: 'Pfizer', form: 'Tablet', strength: '5mg', isActive: true },
  { genericName: 'Diclofenac', brandNames: ['Voltaren', 'Voveran'], manufacturer: 'Novartis', form: 'Tablet', strength: '50mg', isActive: true },
  { genericName: 'Ranitidine', brandNames: ['Zantac', 'Aciloc'], manufacturer: 'GSK', form: 'Tablet', strength: '150mg', isActive: true },
  { genericName: 'Clopidogrel', brandNames: ['Plavix', 'Clopivas'], manufacturer: 'Sanofi', form: 'Tablet', strength: '75mg', isActive: true },
  { genericName: 'Aspirin', brandNames: ['Disprin', 'Ecosprin'], manufacturer: 'Reckitt Benckiser', form: 'Tablet', strength: '75mg', isActive: true },
];

// Add searchText to each medicine
medicines.forEach(med => {
  med.searchText = `${med.genericName} ${med.brandNames.join(' ')}`;
});

// Sample Diagnoses Data
const diagnoses = [
  { diagnosisName: 'Upper Respiratory Tract Infection', icdCode: 'J06.9', category: 'Respiratory', description: 'Common cold or flu', commonSymptoms: ['Fever', 'Cough', 'Sore throat', 'Runny nose'], isActive: true },
  { diagnosisName: 'Acute Bronchitis', icdCode: 'J20.9', category: 'Respiratory', description: 'Inflammation of bronchial tubes', commonSymptoms: ['Persistent cough', 'Chest discomfort', 'Fatigue'], isActive: true },
  { diagnosisName: 'Hypertension', icdCode: 'I10', category: 'Cardiovascular', description: 'High blood pressure', commonSymptoms: ['Headache', 'Dizziness', 'Chest pain'], isActive: true },
  { diagnosisName: 'Type 2 Diabetes Mellitus', icdCode: 'E11.9', category: 'Endocrine', description: 'Insulin resistance diabetes', commonSymptoms: ['Increased thirst', 'Frequent urination', 'Fatigue'], isActive: true },
  { diagnosisName: 'Gastroenteritis', icdCode: 'A09', category: 'Gastrointestinal', description: 'Stomach flu', commonSymptoms: ['Diarrhea', 'Vomiting', 'Nausea', 'Abdominal pain'], isActive: true },
  { diagnosisName: 'Migraine', icdCode: 'G43.9', category: 'Neurological', description: 'Severe headache disorder', commonSymptoms: ['Severe headache', 'Nausea', 'Light sensitivity'], isActive: true },
  { diagnosisName: 'Urinary Tract Infection', icdCode: 'N39.0', category: 'Infectious', description: 'Bladder or kidney infection', commonSymptoms: ['Burning urination', 'Frequent urination', 'Lower abdominal pain'], isActive: true },
  { diagnosisName: 'Asthma', icdCode: 'J45.9', category: 'Respiratory', description: 'Chronic respiratory condition', commonSymptoms: ['Wheezing', 'Shortness of breath', 'Chest tightness'], isActive: true },
  { diagnosisName: 'Hyperthyroidism', icdCode: 'E05.9', category: 'Endocrine', description: 'Overactive thyroid', commonSymptoms: ['Weight loss', 'Rapid heartbeat', 'Nervousness'], isActive: true },
  { diagnosisName: 'Hypothyroidism', icdCode: 'E03.9', category: 'Endocrine', description: 'Underactive thyroid', commonSymptoms: ['Fatigue', 'Weight gain', 'Cold sensitivity'], isActive: true },
  { diagnosisName: 'Osteoarthritis', icdCode: 'M19.90', category: 'Musculoskeletal', description: 'Joint degeneration', commonSymptoms: ['Joint pain', 'Stiffness', 'Limited movement'], isActive: true },
  { diagnosisName: 'Eczema', icdCode: 'L30.9', category: 'Dermatological', description: 'Skin inflammation', commonSymptoms: ['Itchy skin', 'Redness', 'Dry patches'], isActive: true },
  { diagnosisName: 'Allergic Rhinitis', icdCode: 'J30.4', category: 'Respiratory', description: 'Hay fever', commonSymptoms: ['Sneezing', 'Runny nose', 'Itchy eyes'], isActive: true },
  { diagnosisName: 'Pneumonia', icdCode: 'J18.9', category: 'Respiratory', description: 'Lung infection', commonSymptoms: ['Cough', 'Fever', 'Difficulty breathing'], isActive: true },
  { diagnosisName: 'Gastroesophageal Reflux Disease', icdCode: 'K21.9', category: 'Gastrointestinal', description: 'Acid reflux', commonSymptoms: ['Heartburn', 'Chest pain', 'Difficulty swallowing'], isActive: true },
];

// Add searchText to each diagnosis
diagnoses.forEach(diag => {
  diag.searchText = `${diag.diagnosisName} ${diag.icdCode} ${diag.description}`;
});

// Sample Symptoms Data
const symptoms = [
  { symptomName: 'Fever', category: 'General', severityLevels: ['Mild', 'Moderate', 'Severe'], relatedConditions: ['Upper Respiratory Tract Infection', 'Pneumonia'], isActive: true },
  { symptomName: 'Cough', category: 'Respiratory', severityLevels: ['Mild', 'Moderate', 'Severe'], relatedConditions: ['Bronchitis', 'Pneumonia'], isActive: true },
  { symptomName: 'Headache', category: 'Neurological', severityLevels: ['Mild', 'Moderate', 'Severe'], relatedConditions: ['Migraine', 'Hypertension'], isActive: true },
  { symptomName: 'Nausea', category: 'Gastrointestinal', severityLevels: ['Mild', 'Moderate', 'Severe'], relatedConditions: ['Gastroenteritis', 'Migraine'], isActive: true },
  { symptomName: 'Fatigue', category: 'General', severityLevels: ['Mild', 'Moderate', 'Severe'], relatedConditions: ['Hypothyroidism', 'Diabetes'], isActive: true },
  { symptomName: 'Chest Pain', category: 'Cardiovascular', severityLevels: ['Mild', 'Moderate', 'Severe'], relatedConditions: ['Hypertension', 'GERD'], isActive: true },
  { symptomName: 'Shortness of Breath', category: 'Respiratory', severityLevels: ['Mild', 'Moderate', 'Severe'], relatedConditions: ['Asthma', 'Pneumonia'], isActive: true },
  { symptomName: 'Dizziness', category: 'Neurological', severityLevels: ['Mild', 'Moderate', 'Severe'], relatedConditions: ['Hypertension', 'Anemia'], isActive: true },
  { symptomName: 'Abdominal Pain', category: 'Gastrointestinal', severityLevels: ['Mild', 'Moderate', 'Severe'], relatedConditions: ['Gastroenteritis', 'UTI'], isActive: true },
  { symptomName: 'Sore Throat', category: 'Respiratory', severityLevels: ['Mild', 'Moderate', 'Severe'], relatedConditions: ['Upper Respiratory Tract Infection'], isActive: true },
  { symptomName: 'Runny Nose', category: 'Respiratory', severityLevels: ['Mild', 'Moderate'], relatedConditions: ['Allergic Rhinitis', 'Common Cold'], isActive: true },
  { symptomName: 'Sneezing', category: 'Respiratory', severityLevels: ['Mild', 'Moderate'], relatedConditions: ['Allergic Rhinitis'], isActive: true },
  { symptomName: 'Vomiting', category: 'Gastrointestinal', severityLevels: ['Mild', 'Moderate', 'Severe'], relatedConditions: ['Gastroenteritis'], isActive: true },
  { symptomName: 'Diarrhea', category: 'Gastrointestinal', severityLevels: ['Mild', 'Moderate', 'Severe'], relatedConditions: ['Gastroenteritis'], isActive: true },
  { symptomName: 'Joint Pain', category: 'Musculoskeletal', severityLevels: ['Mild', 'Moderate', 'Severe'], relatedConditions: ['Osteoarthritis'], isActive: true },
  { symptomName: 'Skin Rash', category: 'Dermatological', severityLevels: ['Mild', 'Moderate', 'Severe'], relatedConditions: ['Eczema', 'Allergic Reaction'], isActive: true },
  { symptomName: 'Back Pain', category: 'Musculoskeletal', severityLevels: ['Mild', 'Moderate', 'Severe'], relatedConditions: ['Muscle Strain'], isActive: true },
  { symptomName: 'Insomnia', category: 'Psychological', severityLevels: ['Mild', 'Moderate', 'Severe'], relatedConditions: ['Anxiety', 'Depression'], isActive: true },
  { symptomName: 'Anxiety', category: 'Psychological', severityLevels: ['Mild', 'Moderate', 'Severe'], relatedConditions: ['Anxiety Disorder'], isActive: true },
  { symptomName: 'Weight Loss', category: 'General', severityLevels: ['Mild', 'Moderate', 'Severe'], relatedConditions: ['Hyperthyroidism', 'Diabetes'], isActive: true },
];

// Add searchText to each symptom
symptoms.forEach(symp => {
  symp.searchText = `${symp.symptomName} ${symp.category}`;
});

async function seedData() {
  const client = new MongoClient(url);

  try {
    console.log('🔄 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB successfully');

    const db = client.db(dbName);

    // Seed Medicines
    console.log('\n🔄 Seeding medicines...');
    const medicineCollection = db.collection('medicine_database');
    const medicineResult = await medicineCollection.insertMany(medicines);
    console.log(`✅ Inserted ${medicineResult.insertedCount} medicines`);

    // Seed Diagnoses
    console.log('\n🔄 Seeding diagnoses...');
    const diagnosisCollection = db.collection('diagnosis_database');
    const diagnosisResult = await diagnosisCollection.insertMany(diagnoses);
    console.log(`✅ Inserted ${diagnosisResult.insertedCount} diagnoses`);

    // Seed Symptoms
    console.log('\n🔄 Seeding symptoms...');
    const symptomCollection = db.collection('symptom_database');
    const symptomResult = await symptomCollection.insertMany(symptoms);
    console.log(`✅ Inserted ${symptomResult.insertedCount} symptoms`);

    // Create indexes
    console.log('\n🔄 Creating text indexes...');
    await medicineCollection.createIndex({ genericName: 'text', brandNames: 'text', searchText: 'text' });
    await diagnosisCollection.createIndex({ diagnosisName: 'text', searchText: 'text', icdCode: 'text' });
    await symptomCollection.createIndex({ symptomName: 'text', searchText: 'text' });
    console.log('✅ Text indexes created successfully');

    console.log('\n🎉 All data seeded successfully!');
    console.log(`   - ${medicineResult.insertedCount} medicines`);
    console.log(`   - ${diagnosisResult.insertedCount} diagnoses`);
    console.log(`   - ${symptomResult.insertedCount} symptoms`);

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    await client.close();
    console.log('\n✅ MongoDB connection closed');
  }
}

// Run the seed function
seedData().catch(console.error);
