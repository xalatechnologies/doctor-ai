export interface ClinicalGuideline {
  id: string;
  name: string;
  category: string;
  conditions: string[];
  recommendations: {
    severity: 'mild' | 'moderate' | 'severe' | 'critical';
    actions: string[];
    timeframe?: string;
    contraindications?: string[];
  }[];
  references: string[];
}

export interface MedicalCategory {
  id: string;
  name: string;
  keywords: string[];
  subcategories?: string[];
  relatedConditions: string[];
  commonSymptoms: string[];
  urgencyIndicators: string[];
}

export const medicalCategories: MedicalCategory[] = [
  {
    id: 'cardio',
    name: 'Cardiovascular',
    keywords: ['heart', 'cardiac', 'chest pain', 'arrhythmia'],
    relatedConditions: ['hypertension', 'coronary artery disease'],
    commonSymptoms: ['chest pain', 'shortness of breath', 'palpitations'],
    urgencyIndicators: ['severe chest pain', 'difficulty breathing']
  },
  {
    id: 'neuro',
    name: 'Neurological',
    keywords: ['brain', 'neural', 'headache', 'seizure'],
    relatedConditions: ['migraine', 'epilepsy'],
    commonSymptoms: ['headache', 'dizziness', 'confusion'],
    urgencyIndicators: ['sudden severe headache', 'loss of consciousness']
  },
  {
    id: 'respiratory',
    name: 'Respiratory',
    keywords: ['lung', 'breathing', 'respiratory', 'airway'],
    relatedConditions: ['asthma', 'copd', 'pneumonia', 'bronchitis'],
    commonSymptoms: ['cough', 'shortness of breath', 'wheezing'],
    urgencyIndicators: ['severe breathing difficulty', 'cyanosis', 'respiratory distress']
  },
  {
    id: 'gastro',
    name: 'Gastrointestinal',
    keywords: ['stomach', 'intestinal', 'digestive', 'bowel'],
    relatedConditions: ['ulcer', 'ibd', 'gastritis', 'appendicitis'],
    commonSymptoms: ['abdominal pain', 'nausea', 'vomiting', 'diarrhea'],
    urgencyIndicators: ['severe abdominal pain', 'gastrointestinal bleeding']
  },
  {
    id: 'endocrine',
    name: 'Endocrine',
    keywords: ['hormone', 'thyroid', 'diabetes', 'metabolic'],
    relatedConditions: ['diabetes', 'hypothyroidism', 'hyperthyroidism'],
    commonSymptoms: ['fatigue', 'weight changes', 'thirst', 'sweating'],
    urgencyIndicators: ['diabetic ketoacidosis', 'thyroid storm']
  },
  {
    id: 'immune',
    name: 'Immunology',
    keywords: ['immune', 'allergy', 'autoimmune', 'immunodeficiency'],
    relatedConditions: ['lupus', 'rheumatoid arthritis', 'multiple sclerosis'],
    commonSymptoms: ['joint pain', 'rash', 'fatigue', 'fever'],
    urgencyIndicators: ['anaphylaxis', 'severe allergic reaction']
  },
  {
    id: 'infectious',
    name: 'Infectious Disease',
    keywords: ['infection', 'viral', 'bacterial', 'fungal'],
    relatedConditions: ['sepsis', 'meningitis', 'pneumonia', 'covid'],
    commonSymptoms: ['fever', 'chills', 'fatigue', 'body aches'],
    urgencyIndicators: ['septic shock', 'severe fever', 'meningeal signs']
  },
  {
    id: 'onco',
    name: 'Oncology',
    keywords: ['cancer', 'tumor', 'malignancy', 'neoplasm'],
    relatedConditions: ['leukemia', 'lymphoma', 'carcinoma', 'sarcoma'],
    commonSymptoms: ['weight loss', 'fatigue', 'pain', 'masses'],
    urgencyIndicators: ['neutropenic fever', 'spinal cord compression']
  },
  {
    id: 'ortho',
    name: 'Orthopedics',
    keywords: ['bone', 'joint', 'muscle', 'skeletal', 'fracture'],
    relatedConditions: ['osteoarthritis', 'fracture', 'osteoporosis', 'tendinitis'],
    commonSymptoms: ['joint pain', 'stiffness', 'swelling', 'limited mobility'],
    urgencyIndicators: ['open fracture', 'severe trauma', 'compartment syndrome']
  },
  {
    id: 'nephro',
    name: 'Nephrology',
    keywords: ['kidney', 'renal', 'urinary', 'dialysis'],
    relatedConditions: ['chronic kidney disease', 'glomerulonephritis', 'kidney stones'],
    commonSymptoms: ['flank pain', 'edema', 'urinary changes', 'hypertension'],
    urgencyIndicators: ['acute kidney injury', 'severe electrolyte imbalance']
  },
  {
    id: 'derm',
    name: 'Dermatology',
    keywords: ['skin', 'dermal', 'cutaneous', 'rash'],
    relatedConditions: ['psoriasis', 'melanoma', 'eczema', 'cellulitis'],
    commonSymptoms: ['rash', 'itching', 'skin changes', 'lesions'],
    urgencyIndicators: ['stevens-johnson syndrome', 'necrotizing fasciitis']
  }
  // Add more categories as needed
]; 