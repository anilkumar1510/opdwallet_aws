import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { Symptom } from '../modules/doctors/schemas/symptom.schema';

/**
 * Symptom Database Seeding Script
 *
 * This script seeds the symptom_database collection with commonly reported
 * medical symptoms across various body systems and categories.
 *
 * Data includes:
 * - Symptom names
 * - Categories (General, Respiratory, Gastrointestinal, etc.)
 * - Severity levels (Mild, Moderate, Severe)
 * - Related conditions
 * - Descriptions
 *
 * Usage:
 * npm run seed:symptoms
 */

const commonSymptoms = [
  // ========== GENERAL SYMPTOMS ==========
  {
    symptomName: 'Fever',
    category: 'General',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Infection', 'Inflammation', 'Immune response'],
    description: 'Elevated body temperature above normal range',
  },
  {
    symptomName: 'Fatigue',
    category: 'General',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Anemia', 'Thyroid disorders', 'Chronic diseases', 'Sleep disorders'],
    description: 'Persistent tiredness and lack of energy',
  },
  {
    symptomName: 'Weakness',
    category: 'General',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Muscle disorders', 'Neurological conditions', 'Nutritional deficiencies'],
    description: 'Reduced strength or energy in muscles',
  },
  {
    symptomName: 'Weight Loss (Unintentional)',
    category: 'General',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Diabetes', 'Hyperthyroidism', 'Cancer', 'Malabsorption'],
    description: 'Loss of body weight without trying',
  },
  {
    symptomName: 'Weight Gain',
    category: 'General',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Hypothyroidism', 'Hormonal imbalances', 'Fluid retention'],
    description: 'Increase in body weight',
  },
  {
    symptomName: 'Chills',
    category: 'General',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Fever', 'Infection', 'Hypothermia'],
    description: 'Feeling of coldness with shivering',
  },
  {
    symptomName: 'Night Sweats',
    category: 'General',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Tuberculosis', 'Lymphoma', 'Menopause', 'Infections'],
    description: 'Excessive sweating during sleep',
  },
  {
    symptomName: 'Loss of Appetite',
    category: 'General',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Depression', 'Infections', 'Gastrointestinal disorders'],
    description: 'Reduced desire to eat',
  },
  {
    symptomName: 'Malaise',
    category: 'General',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Viral infections', 'Chronic fatigue syndrome'],
    description: 'General feeling of discomfort or uneasiness',
  },
  {
    symptomName: 'Swelling (Edema)',
    category: 'General',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Heart failure', 'Kidney disease', 'Liver disease'],
    description: 'Abnormal accumulation of fluid in tissues',
  },

  // ========== RESPIRATORY SYMPTOMS ==========
  {
    symptomName: 'Cough',
    category: 'Respiratory',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['URTI', 'Pneumonia', 'Asthma', 'COPD', 'Tuberculosis'],
    description: 'Forceful expulsion of air from lungs',
  },
  {
    symptomName: 'Cough with Phlegm',
    category: 'Respiratory',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Bronchitis', 'Pneumonia', 'COPD'],
    description: 'Productive cough with mucus expectoration',
  },
  {
    symptomName: 'Dry Cough',
    category: 'Respiratory',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Viral infections', 'Asthma', 'GERD', 'COVID-19'],
    description: 'Non-productive cough without mucus',
  },
  {
    symptomName: 'Shortness of Breath (Dyspnea)',
    category: 'Respiratory',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Asthma', 'COPD', 'Heart failure', 'Pneumonia'],
    description: 'Difficulty breathing or feeling breathless',
  },
  {
    symptomName: 'Wheezing',
    category: 'Respiratory',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Asthma', 'COPD', 'Bronchitis'],
    description: 'High-pitched whistling sound during breathing',
  },
  {
    symptomName: 'Chest Pain (Respiratory)',
    category: 'Respiratory',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Pneumonia', 'Pleurisy', 'Pulmonary embolism'],
    description: 'Pain in chest area related to breathing',
  },
  {
    symptomName: 'Runny Nose (Rhinorrhea)',
    category: 'Respiratory',
    severityLevels: ['Mild', 'Moderate'],
    relatedConditions: ['Common cold', 'Allergic rhinitis', 'Sinusitis'],
    description: 'Excessive nasal discharge',
  },
  {
    symptomName: 'Nasal Congestion',
    category: 'Respiratory',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['URTI', 'Sinusitis', 'Allergic rhinitis'],
    description: 'Blocked or stuffy nose',
  },
  {
    symptomName: 'Sore Throat',
    category: 'Respiratory',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Pharyngitis', 'Tonsillitis', 'URTI'],
    description: 'Pain or irritation in throat',
  },
  {
    symptomName: 'Sneezing',
    category: 'Respiratory',
    severityLevels: ['Mild', 'Moderate'],
    relatedConditions: ['Allergic rhinitis', 'Common cold'],
    description: 'Sudden involuntary expulsion of air through nose',
  },
  {
    symptomName: 'Hoarseness',
    category: 'Respiratory',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Laryngitis', 'Vocal cord disorders'],
    description: 'Abnormal voice changes or roughness',
  },
  {
    symptomName: 'Hemoptysis (Coughing Blood)',
    category: 'Respiratory',
    severityLevels: ['Severe'],
    relatedConditions: ['Tuberculosis', 'Lung cancer', 'Bronchiectasis'],
    description: 'Coughing up blood or blood-tinged sputum',
  },

  // ========== GASTROINTESTINAL SYMPTOMS ==========
  {
    symptomName: 'Nausea',
    category: 'Gastrointestinal',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Gastroenteritis', 'Pregnancy', 'Motion sickness', 'GERD'],
    description: 'Feeling of wanting to vomit',
  },
  {
    symptomName: 'Vomiting',
    category: 'Gastrointestinal',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Gastroenteritis', 'Food poisoning', 'Pregnancy'],
    description: 'Forceful expulsion of stomach contents',
  },
  {
    symptomName: 'Diarrhea',
    category: 'Gastrointestinal',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Gastroenteritis', 'IBS', 'Food intolerance', 'IBD'],
    description: 'Loose or watery bowel movements',
  },
  {
    symptomName: 'Constipation',
    category: 'Gastrointestinal',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['IBS', 'Dietary factors', 'Medications'],
    description: 'Difficulty passing stools or infrequent bowel movements',
  },
  {
    symptomName: 'Abdominal Pain',
    category: 'Gastrointestinal',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Gastritis', 'Peptic ulcer', 'Appendicitis', 'IBS'],
    description: 'Pain or discomfort in the abdominal region',
  },
  {
    symptomName: 'Bloating',
    category: 'Gastrointestinal',
    severityLevels: ['Mild', 'Moderate'],
    relatedConditions: ['IBS', 'Food intolerance', 'Constipation'],
    description: 'Feeling of fullness or tightness in abdomen',
  },
  {
    symptomName: 'Heartburn',
    category: 'Gastrointestinal',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['GERD', 'Hiatal hernia', 'Peptic ulcer'],
    description: 'Burning sensation in chest behind breastbone',
  },
  {
    symptomName: 'Indigestion (Dyspepsia)',
    category: 'Gastrointestinal',
    severityLevels: ['Mild', 'Moderate'],
    relatedConditions: ['Gastritis', 'GERD', 'Peptic ulcer'],
    description: 'Discomfort in upper abdomen after eating',
  },
  {
    symptomName: 'Blood in Stool (Hematochezia)',
    category: 'Gastrointestinal',
    severityLevels: ['Moderate', 'Severe'],
    relatedConditions: ['Hemorrhoids', 'IBD', 'Colorectal cancer'],
    description: 'Presence of blood in feces',
  },
  {
    symptomName: 'Dark Stools (Melena)',
    category: 'Gastrointestinal',
    severityLevels: ['Moderate', 'Severe'],
    relatedConditions: ['Peptic ulcer', 'Upper GI bleeding'],
    description: 'Black, tarry stools indicating upper GI bleeding',
  },
  {
    symptomName: 'Difficulty Swallowing (Dysphagia)',
    category: 'Gastrointestinal',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['GERD', 'Esophageal stricture', 'Stroke'],
    description: 'Difficulty or pain when swallowing',
  },
  {
    symptomName: 'Jaundice',
    category: 'Gastrointestinal',
    severityLevels: ['Moderate', 'Severe'],
    relatedConditions: ['Hepatitis', 'Cirrhosis', 'Gallstones', 'Hemolysis'],
    description: 'Yellowing of skin and eyes',
  },

  // ========== CARDIOVASCULAR SYMPTOMS ==========
  {
    symptomName: 'Chest Pain (Cardiac)',
    category: 'Cardiovascular',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Angina', 'Myocardial infarction', 'Pericarditis'],
    description: 'Pain or pressure in chest area',
  },
  {
    symptomName: 'Palpitations',
    category: 'Cardiovascular',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Arrhythmia', 'Anxiety', 'Hyperthyroidism'],
    description: 'Sensation of rapid or irregular heartbeat',
  },
  {
    symptomName: 'Rapid Heartbeat (Tachycardia)',
    category: 'Cardiovascular',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Arrhythmia', 'Fever', 'Hyperthyroidism', 'Anxiety'],
    description: 'Heart rate faster than normal',
  },
  {
    symptomName: 'Slow Heartbeat (Bradycardia)',
    category: 'Cardiovascular',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Heart block', 'Hypothyroidism', 'Medications'],
    description: 'Heart rate slower than normal',
  },
  {
    symptomName: 'Irregular Heartbeat',
    category: 'Cardiovascular',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Atrial fibrillation', 'Arrhythmia'],
    description: 'Abnormal heart rhythm',
  },
  {
    symptomName: 'Leg Swelling',
    category: 'Cardiovascular',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Heart failure', 'Venous insufficiency', 'DVT'],
    description: 'Swelling in lower legs and ankles',
  },
  {
    symptomName: 'Cold Hands and Feet',
    category: 'Cardiovascular',
    severityLevels: ['Mild', 'Moderate'],
    relatedConditions: ['Poor circulation', 'Anemia', 'Hypothyroidism'],
    description: 'Persistent coldness in extremities',
  },

  // ========== NEUROLOGICAL SYMPTOMS ==========
  {
    symptomName: 'Headache',
    category: 'Neurological',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Tension headache', 'Migraine', 'Sinusitis', 'Hypertension'],
    description: 'Pain in head or upper neck',
  },
  {
    symptomName: 'Dizziness',
    category: 'Neurological',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Vertigo', 'Dehydration', 'Low blood pressure', 'Anemia'],
    description: 'Feeling of lightheadedness or unsteadiness',
  },
  {
    symptomName: 'Vertigo',
    category: 'Neurological',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['BPPV', 'Meniere\'s disease', 'Vestibular neuritis'],
    description: 'Spinning sensation or loss of balance',
  },
  {
    symptomName: 'Numbness',
    category: 'Neurological',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Peripheral neuropathy', 'Stroke', 'Diabetes'],
    description: 'Loss of sensation or tingling',
  },
  {
    symptomName: 'Tingling (Paresthesia)',
    category: 'Neurological',
    severityLevels: ['Mild', 'Moderate'],
    relatedConditions: ['Peripheral neuropathy', 'Carpal tunnel syndrome', 'Vitamin deficiency'],
    description: 'Pins and needles sensation',
  },
  {
    symptomName: 'Tremor',
    category: 'Neurological',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Parkinson\'s disease', 'Essential tremor', 'Hyperthyroidism'],
    description: 'Involuntary shaking or trembling',
  },
  {
    symptomName: 'Seizure',
    category: 'Neurological',
    severityLevels: ['Severe'],
    relatedConditions: ['Epilepsy', 'Brain tumor', 'Stroke', 'Infection'],
    description: 'Sudden uncontrolled electrical disturbance in brain',
  },
  {
    symptomName: 'Memory Loss',
    category: 'Neurological',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Alzheimer\'s disease', 'Dementia', 'Depression'],
    description: 'Difficulty remembering information',
  },
  {
    symptomName: 'Confusion',
    category: 'Neurological',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Delirium', 'Dementia', 'Infections', 'Metabolic disorders'],
    description: 'Disorientation or difficulty thinking clearly',
  },
  {
    symptomName: 'Loss of Consciousness (Syncope)',
    category: 'Neurological',
    severityLevels: ['Severe'],
    relatedConditions: ['Vasovagal syncope', 'Cardiac arrhythmia', 'Hypoglycemia'],
    description: 'Temporary loss of consciousness',
  },
  {
    symptomName: 'Blurred Vision',
    category: 'Neurological',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Refractive error', 'Diabetes', 'Stroke', 'Migraine'],
    description: 'Unclear or unfocused vision',
  },
  {
    symptomName: 'Double Vision (Diplopia)',
    category: 'Neurological',
    severityLevels: ['Moderate', 'Severe'],
    relatedConditions: ['Stroke', 'Multiple sclerosis', 'Myasthenia gravis'],
    description: 'Seeing two images of a single object',
  },
  {
    symptomName: 'Slurred Speech',
    category: 'Neurological',
    severityLevels: ['Moderate', 'Severe'],
    relatedConditions: ['Stroke', 'Intoxication', 'Neurological disorders'],
    description: 'Difficulty speaking clearly',
  },

  // ========== MUSCULOSKELETAL SYMPTOMS ==========
  {
    symptomName: 'Joint Pain (Arthralgia)',
    category: 'Musculoskeletal',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Arthritis', 'Gout', 'Lupus', 'Injury'],
    description: 'Pain in one or more joints',
  },
  {
    symptomName: 'Muscle Pain (Myalgia)',
    category: 'Musculoskeletal',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Viral infections', 'Fibromyalgia', 'Polymyalgia'],
    description: 'Aching or soreness in muscles',
  },
  {
    symptomName: 'Back Pain',
    category: 'Musculoskeletal',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Muscle strain', 'Disc herniation', 'Osteoarthritis'],
    description: 'Pain in the back area',
  },
  {
    symptomName: 'Neck Pain',
    category: 'Musculoskeletal',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Cervical spondylosis', 'Muscle strain', 'Whiplash'],
    description: 'Pain or stiffness in neck',
  },
  {
    symptomName: 'Joint Stiffness',
    category: 'Musculoskeletal',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Osteoarthritis', 'Rheumatoid arthritis'],
    description: 'Reduced flexibility and movement in joints',
  },
  {
    symptomName: 'Joint Swelling',
    category: 'Musculoskeletal',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Arthritis', 'Gout', 'Injury', 'Infection'],
    description: 'Enlargement and inflammation of joints',
  },
  {
    symptomName: 'Muscle Weakness',
    category: 'Musculoskeletal',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Muscular dystrophy', 'Myasthenia gravis', 'Neurological disorders'],
    description: 'Reduced strength in muscles',
  },
  {
    symptomName: 'Muscle Cramps',
    category: 'Musculoskeletal',
    severityLevels: ['Mild', 'Moderate'],
    relatedConditions: ['Dehydration', 'Electrolyte imbalance', 'Overuse'],
    description: 'Sudden involuntary muscle contractions',
  },
  {
    symptomName: 'Limited Range of Motion',
    category: 'Musculoskeletal',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Arthritis', 'Frozen shoulder', 'Injury'],
    description: 'Difficulty moving joints through full range',
  },

  // ========== DERMATOLOGICAL SYMPTOMS ==========
  {
    symptomName: 'Skin Rash',
    category: 'Dermatological',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Allergic reaction', 'Eczema', 'Psoriasis', 'Infections'],
    description: 'Abnormal change in skin color or texture',
  },
  {
    symptomName: 'Itching (Pruritus)',
    category: 'Dermatological',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Eczema', 'Dry skin', 'Allergies', 'Liver disease'],
    description: 'Uncomfortable sensation causing desire to scratch',
  },
  {
    symptomName: 'Dry Skin',
    category: 'Dermatological',
    severityLevels: ['Mild', 'Moderate'],
    relatedConditions: ['Eczema', 'Hypothyroidism', 'Dehydration'],
    description: 'Lack of moisture in skin',
  },
  {
    symptomName: 'Skin Lesions',
    category: 'Dermatological',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Infections', 'Psoriasis', 'Skin cancer'],
    description: 'Abnormal areas on skin',
  },
  {
    symptomName: 'Hives (Urticaria)',
    category: 'Dermatological',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Allergic reaction', 'Stress', 'Infections'],
    description: 'Raised, itchy welts on skin',
  },
  {
    symptomName: 'Hair Loss',
    category: 'Dermatological',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Alopecia', 'Thyroid disorders', 'Nutritional deficiencies'],
    description: 'Loss of hair from scalp or body',
  },
  {
    symptomName: 'Nail Changes',
    category: 'Dermatological',
    severityLevels: ['Mild', 'Moderate'],
    relatedConditions: ['Fungal infection', 'Psoriasis', 'Nutritional deficiencies'],
    description: 'Abnormal appearance or texture of nails',
  },

  // ========== PSYCHOLOGICAL SYMPTOMS ==========
  {
    symptomName: 'Anxiety',
    category: 'Psychological',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Anxiety disorders', 'Panic disorder', 'PTSD'],
    description: 'Excessive worry, nervousness, or fear',
  },
  {
    symptomName: 'Depression',
    category: 'Psychological',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Major depressive disorder', 'Bipolar disorder'],
    description: 'Persistent sadness and loss of interest',
  },
  {
    symptomName: 'Insomnia',
    category: 'Psychological',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Sleep disorders', 'Anxiety', 'Depression'],
    description: 'Difficulty falling or staying asleep',
  },
  {
    symptomName: 'Irritability',
    category: 'Psychological',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Mood disorders', 'Stress', 'Hormonal changes'],
    description: 'Easily annoyed or angered',
  },
  {
    symptomName: 'Restlessness',
    category: 'Psychological',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Anxiety', 'ADHD', 'Hyperthyroidism'],
    description: 'Inability to relax or stay still',
  },
  {
    symptomName: 'Difficulty Concentrating',
    category: 'Psychological',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['ADHD', 'Depression', 'Anxiety', 'Dementia'],
    description: 'Trouble focusing or paying attention',
  },
  {
    symptomName: 'Mood Swings',
    category: 'Psychological',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Bipolar disorder', 'Hormonal changes', 'Borderline personality disorder'],
    description: 'Rapid changes in emotional state',
  },

  // ========== OTHER COMMON SYMPTOMS ==========
  {
    symptomName: 'Thirst (Polydipsia)',
    category: 'Other',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Diabetes', 'Dehydration', 'Hypercalcemia'],
    description: 'Excessive thirst',
  },
  {
    symptomName: 'Frequent Urination (Polyuria)',
    category: 'Other',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Diabetes', 'UTI', 'Prostate problems'],
    description: 'Urinating more often than usual',
  },
  {
    symptomName: 'Burning Urination (Dysuria)',
    category: 'Other',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['UTI', 'Kidney stones', 'Sexually transmitted infections'],
    description: 'Pain or burning sensation during urination',
  },
  {
    symptomName: 'Blood in Urine (Hematuria)',
    category: 'Other',
    severityLevels: ['Moderate', 'Severe'],
    relatedConditions: ['UTI', 'Kidney stones', 'Bladder cancer'],
    description: 'Presence of blood in urine',
  },
  {
    symptomName: 'Eye Redness',
    category: 'Other',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Conjunctivitis', 'Dry eyes', 'Glaucoma'],
    description: 'Red or bloodshot eyes',
  },
  {
    symptomName: 'Eye Pain',
    category: 'Other',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Glaucoma', 'Eye injury', 'Corneal ulcer'],
    description: 'Pain or discomfort in or around eye',
  },
  {
    symptomName: 'Ear Pain',
    category: 'Other',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Ear infection', 'TMJ disorder', 'Dental problems'],
    description: 'Pain in or around ear',
  },
  {
    symptomName: 'Hearing Loss',
    category: 'Other',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Age-related', 'Ear infection', 'Earwax blockage'],
    description: 'Reduced ability to hear',
  },
  {
    symptomName: 'Ringing in Ears (Tinnitus)',
    category: 'Other',
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    relatedConditions: ['Hearing loss', 'Ear infection', 'Meniere\'s disease'],
    description: 'Perception of noise or ringing in ears',
  },
];

async function seedSymptoms() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const symptomModel: Model<Symptom> = app.get(getModelToken(Symptom.name));

  try {
    console.log('🌱 Starting symptom database seeding...');
    console.log(`📊 Total symptoms to seed: ${commonSymptoms.length}`);

    // Check if symptom database is empty
    const existingCount = await symptomModel.countDocuments();
    console.log(`📋 Existing symptoms in database: ${existingCount}`);

    if (existingCount > 0) {
      console.log('⚠️  Symptom database is not empty');
      console.log('🔄 Clearing existing symptom data...');
      await symptomModel.deleteMany({});
      console.log('✅ Cleared existing symptom data');
    }

    // Prepare symptoms with searchText
    const symptomsToInsert = commonSymptoms.map(symptom => ({
      ...symptom,
      searchText: `${symptom.symptomName} ${symptom.description || ''} ${symptom.relatedConditions?.join(' ') || ''}`,
      isActive: true,
    }));

    // Insert symptoms in batches for better performance
    const batchSize = 50;
    let insertedCount = 0;

    for (let i = 0; i < symptomsToInsert.length; i += batchSize) {
      const batch = symptomsToInsert.slice(i, i + batchSize);
      await symptomModel.insertMany(batch);
      insertedCount += batch.length;
      console.log(`✅ Inserted ${insertedCount}/${symptomsToInsert.length} symptoms`);
    }

    console.log('\n🎉 Symptom database seeded successfully!');
    console.log(`📊 Total symptoms: ${insertedCount}`);

    // Display category breakdown
    console.log('\n📋 Category Breakdown:');
    const categories = [
      'General',
      'Respiratory',
      'Gastrointestinal',
      'Cardiovascular',
      'Neurological',
      'Musculoskeletal',
      'Dermatological',
      'Psychological',
      'Other',
    ];

    for (const category of categories) {
      const count = await symptomModel.countDocuments({ category });
      if (count > 0) {
        console.log(`   ${category}: ${count} symptoms`);
      }
    }

    // Display some sample symptoms
    console.log('\n📝 Sample Symptoms:');
    const samples = await symptomModel.find().limit(5).lean();
    samples.forEach((symptom: any) => {
      console.log(`   - ${symptom.symptomName} (${symptom.category}) - Severity: ${symptom.severityLevels?.join(', ')}`);
    });

    console.log('\n✨ Symptom autocomplete is now ready to use!');

  } catch (error) {
    console.error('❌ Symptom seeding failed:', error);
    throw error;
  } finally {
    await app.close();
  }
}

seedSymptoms();
