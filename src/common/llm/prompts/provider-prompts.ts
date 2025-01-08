import { PromptTemplate } from './prompt-template.interface';

export const OPENAI_MEDICAL_TEMPLATE: PromptTemplate = {
  name: 'openai-medical',
  description: 'OpenAI-specific medical assessment template',
  systemPrompt: `You are an AI medical expert trained to analyze symptoms and provide assessments.
Your responses should be clear, precise, and focused on actionable medical insights.
Always maintain a professional tone and prioritize patient safety.`,
  template: `Based on the provided information, perform a medical assessment:
{{ input }}

Instructions:
1. Analyze all provided symptoms and vital signs
2. Consider potential diagnoses and their likelihood
3. Assess the urgency of medical attention needed
4. Provide clear, actionable recommendations

Response Format:
{
  "assessment": {
    "primary_concerns": string[],
    "differential_diagnoses": Array<{condition: string, likelihood: string}>,
    "urgency_level": string,
    "confidence": number
  },
  "recommendations": {
    "immediate_steps": string[],
    "follow_up": string[],
    "precautions": string[]
  },
  "additional_notes": string
}`,
  variables: [
    {
      name: 'input',
      type: 'object',
      description: 'Medical assessment input data',
      required: true,
    },
  ],
  outputFormat: {
    type: 'json',
    schema: {
      type: 'object',
      properties: {
        assessment: {
          type: 'object',
          properties: {
            primary_concerns: { type: 'array', items: { type: 'string' } },
            differential_diagnoses: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  condition: { type: 'string' },
                  likelihood: { type: 'string' },
                },
              },
            },
            urgency_level: { type: 'string' },
            confidence: { type: 'number' },
          },
        },
        recommendations: {
          type: 'object',
          properties: {
            immediate_steps: { type: 'array', items: { type: 'string' } },
            follow_up: { type: 'array', items: { type: 'string' } },
            precautions: { type: 'array', items: { type: 'string' } },
          },
        },
        additional_notes: { type: 'string' },
      },
      required: ['assessment', 'recommendations'],
    },
  },
  examples: [
    {
      variables: {
        input: {
          symptoms: ['Persistent cough', 'Fever'],
          duration: '5 days',
          severity: 'moderate',
          patient_history: {
            age: 45,
            conditions: ['Asthma'],
          },
        },
      },
      output: `{
        "assessment": {
          "primary_concerns": [
            "Respiratory infection",
            "COVID-19 consideration",
            "Asthma exacerbation"
          ],
          "differential_diagnoses": [
            {"condition": "Upper respiratory infection", "likelihood": "High"},
            {"condition": "COVID-19", "likelihood": "Moderate"},
            {"condition": "Bronchitis", "likelihood": "Moderate"}
          ],
          "urgency_level": "Moderate",
          "confidence": 0.85
        },
        "recommendations": {
          "immediate_steps": [
            "Monitor temperature",
            "Rest and hydration",
            "Use prescribed inhaler as needed"
          ],
          "follow_up": [
            "Schedule telehealth appointment",
            "Consider COVID-19 testing"
          ],
          "precautions": [
            "Self-isolate until assessed",
            "Monitor breathing difficulties"
          ]
        },
        "additional_notes": "Given asthma history, close monitoring of respiratory symptoms is essential"
      }`,
    },
  ],
};

export const ANTHROPIC_MEDICAL_TEMPLATE: PromptTemplate = {
  name: 'anthropic-medical',
  description: 'Anthropic-specific medical assessment template',
  systemPrompt: `You are Claude, an AI assistant with expertise in medical analysis.
Focus on providing comprehensive yet concise medical assessments.
Maintain a balanced approach between thorough analysis and practical recommendations.`,
  template: `Please analyze the following medical information and provide a detailed assessment:
{{ input }}

Key Areas to Address:
1. Symptom Analysis
2. Risk Assessment
3. Treatment Recommendations
4. Follow-up Requirements

Please structure your response as follows:
{
  "clinical_assessment": {
    "symptoms_analysis": string,
    "risk_factors": string[],
    "severity_rating": number,
    "confidence_level": number
  },
  "action_plan": {
    "immediate_care": string[],
    "monitoring_requirements": string[],
    "referral_recommendations": string[]
  },
  "prognosis": {
    "expected_course": string,
    "warning_signs": string[],
    "follow_up_timeline": string
  }
}`,
  variables: [
    {
      name: 'input',
      type: 'object',
      description: 'Medical case information',
      required: true,
    },
  ],
  outputFormat: {
    type: 'json',
    schema: {
      type: 'object',
      properties: {
        clinical_assessment: {
          type: 'object',
          properties: {
            symptoms_analysis: { type: 'string' },
            risk_factors: { type: 'array', items: { type: 'string' } },
            severity_rating: { type: 'number' },
            confidence_level: { type: 'number' },
          },
        },
        action_plan: {
          type: 'object',
          properties: {
            immediate_care: { type: 'array', items: { type: 'string' } },
            monitoring_requirements: { type: 'array', items: { type: 'string' } },
            referral_recommendations: { type: 'array', items: { type: 'string' } },
          },
        },
        prognosis: {
          type: 'object',
          properties: {
            expected_course: { type: 'string' },
            warning_signs: { type: 'array', items: { type: 'string' } },
            follow_up_timeline: { type: 'string' },
          },
        },
      },
      required: ['clinical_assessment', 'action_plan', 'prognosis'],
    },
  },
  examples: [
    {
      variables: {
        input: {
          presenting_symptoms: 'Migraine with aura',
          duration: '2 days',
          frequency: 'Third episode this month',
          associated_symptoms: ['Visual disturbances', 'Nausea'],
          medical_history: {
            previous_conditions: ['Occasional migraines'],
            medications: ['Sumatriptan as needed'],
          },
        },
      },
      output: `{
        "clinical_assessment": {
          "symptoms_analysis": "Classic migraine with aura presentation, showing increased frequency",
          "risk_factors": [
            "Previous migraine history",
            "Multiple episodes this month",
            "Presence of aura"
          ],
          "severity_rating": 7,
          "confidence_level": 0.9
        },
        "action_plan": {
          "immediate_care": [
            "Continue prescribed medication",
            "Rest in dark, quiet environment",
            "Ensure adequate hydration"
          ],
          "monitoring_requirements": [
            "Track frequency and duration of episodes",
            "Note any trigger factors",
            "Monitor medication effectiveness"
          ],
          "referral_recommendations": [
            "Schedule neurologist consultation",
            "Consider preventive medication evaluation"
          ]
        },
        "prognosis": {
          "expected_course": "Episode likely to resolve within 24-48 hours with treatment",
          "warning_signs": [
            "Unusual aura symptoms",
            "Severe, unrelenting pain",
            "New neurological symptoms"
          ],
          "follow_up_timeline": "Within 2 weeks for frequency assessment"
        }
      }`,
    },
  ],
};

export const COHERE_MEDICAL_TEMPLATE: PromptTemplate = {
  name: 'cohere-medical',
  description: 'Cohere-specific medical assessment template',
  systemPrompt: `You are a medical AI assistant trained to provide detailed medical assessments.
Focus on evidence-based analysis and clear communication.
Prioritize accuracy and clinical relevance in your responses.`,
  template: `Analyze the following medical case and provide a structured assessment:
{{ input }}

Analysis Requirements:
1. Clinical Evaluation
2. Risk Stratification
3. Management Plan
4. Patient Education Points

Provide your assessment in the following format:
{
  "clinical_evaluation": {
    "main_findings": string[],
    "risk_level": "HIGH" | "MODERATE" | "LOW",
    "diagnostic_considerations": Array<{
      "condition": string,
      "probability": "HIGH" | "MODERATE" | "LOW",
      "rationale": string
    }>
  },
  "management": {
    "immediate_steps": string[],
    "monitoring_plan": string[],
    "referral_needs": string[]
  },
  "patient_education": {
    "key_points": string[],
    "lifestyle_modifications": string[],
    "warning_signs": string[]
  }
}`,
  variables: [
    {
      name: 'input',
      type: 'object',
      description: 'Clinical case details',
      required: true,
    },
  ],
  outputFormat: {
    type: 'json',
    schema: {
      type: 'object',
      properties: {
        clinical_evaluation: {
          type: 'object',
          properties: {
            main_findings: { type: 'array', items: { type: 'string' } },
            risk_level: { type: 'string', enum: ['HIGH', 'MODERATE', 'LOW'] },
            diagnostic_considerations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  condition: { type: 'string' },
                  probability: { type: 'string', enum: ['HIGH', 'MODERATE', 'LOW'] },
                  rationale: { type: 'string' },
                },
              },
            },
          },
        },
        management: {
          type: 'object',
          properties: {
            immediate_steps: { type: 'array', items: { type: 'string' } },
            monitoring_plan: { type: 'array', items: { type: 'string' } },
            referral_needs: { type: 'array', items: { type: 'string' } },
          },
        },
        patient_education: {
          type: 'object',
          properties: {
            key_points: { type: 'array', items: { type: 'string' } },
            lifestyle_modifications: { type: 'array', items: { type: 'string' } },
            warning_signs: { type: 'array', items: { type: 'string' } },
          },
        },
      },
      required: ['clinical_evaluation', 'management', 'patient_education'],
    },
  },
  examples: [
    {
      variables: {
        input: {
          chief_complaint: 'Lower back pain',
          duration: '2 weeks',
          characteristics: 'Mechanical, worse with movement',
          severity: '7/10',
          associated_symptoms: ['Muscle stiffness', 'Limited range of motion'],
          past_medical_history: 'None significant',
        },
      },
      output: `{
        "clinical_evaluation": {
          "main_findings": [
            "Acute mechanical lower back pain",
            "Moderate to severe intensity",
            "No red flag symptoms"
          ],
          "risk_level": "MODERATE",
          "diagnostic_considerations": [
            {
              "condition": "Muscular strain",
              "probability": "HIGH",
              "rationale": "Mechanical nature, no radiation, normal neurological status"
            },
            {
              "condition": "Disc pathology",
              "probability": "LOW",
              "rationale": "No radicular symptoms or neurological signs"
            }
          ]
        },
        "management": {
          "immediate_steps": [
            "NSAIDs for pain relief",
            "Gentle stretching exercises",
            "Heat/cold therapy"
          ],
          "monitoring_plan": [
            "Daily pain and function assessment",
            "Activity modification tracking",
            "Response to conservative measures"
          ],
          "referral_needs": [
            "Physical therapy evaluation",
            "Primary care follow-up if no improvement"
          ]
        },
        "patient_education": {
          "key_points": [
            "Expected course of recovery",
            "Importance of controlled movement",
            "Pain management strategies"
          ],
          "lifestyle_modifications": [
            "Proper lifting techniques",
            "Ergonomic workspace setup",
            "Regular stretching routine"
          ],
          "warning_signs": [
            "Development of leg weakness",
            "Loss of bladder/bowel control",
            "Severe worsening of pain"
          ]
        }
      }`,
    },
  ],
};

export const GEMINI_MEDICAL_TEMPLATE: PromptTemplate = {
  name: 'gemini-medical',
  description: 'Google Gemini-specific medical assessment template',
  systemPrompt: `You are a medical AI assistant powered by Google Gemini.
Provide comprehensive medical assessments with a focus on structured analysis and clear recommendations.
Ensure responses are evidence-based and clinically relevant.`,
  template: `Perform a detailed medical assessment of the following case:
{{ input }}

Please address:
1. Symptom Analysis and Pattern Recognition
2. Risk Assessment and Triage
3. Treatment Planning
4. Monitoring Requirements

Structure your response as follows:
{
  "assessment": {
    "symptom_pattern": {
      "primary_symptoms": string[],
      "associated_features": string[],
      "temporal_pattern": string
    },
    "risk_evaluation": {
      "risk_category": "EMERGENT" | "URGENT" | "NON_URGENT",
      "key_risk_factors": string[],
      "clinical_reasoning": string
    }
  },
  "care_plan": {
    "immediate_interventions": string[],
    "diagnostic_needs": string[],
    "treatment_approach": {
      "primary_measures": string[],
      "alternative_options": string[]
    }
  },
  "monitoring": {
    "vital_parameters": string[],
    "follow_up_schedule": string,
    "escalation_criteria": string[]
  }
}`,
  variables: [
    {
      name: 'input',
      type: 'object',
      description: 'Patient case information',
      required: true,
    },
  ],
  outputFormat: {
    type: 'json',
    schema: {
      type: 'object',
      properties: {
        assessment: {
          type: 'object',
          properties: {
            symptom_pattern: {
              type: 'object',
              properties: {
                primary_symptoms: { type: 'array', items: { type: 'string' } },
                associated_features: { type: 'array', items: { type: 'string' } },
                temporal_pattern: { type: 'string' },
              },
            },
            risk_evaluation: {
              type: 'object',
              properties: {
                risk_category: { type: 'string', enum: ['EMERGENT', 'URGENT', 'NON_URGENT'] },
                key_risk_factors: { type: 'array', items: { type: 'string' } },
                clinical_reasoning: { type: 'string' },
              },
            },
          },
        },
        care_plan: {
          type: 'object',
          properties: {
            immediate_interventions: { type: 'array', items: { type: 'string' } },
            diagnostic_needs: { type: 'array', items: { type: 'string' } },
            treatment_approach: {
              type: 'object',
              properties: {
                primary_measures: { type: 'array', items: { type: 'string' } },
                alternative_options: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
        monitoring: {
          type: 'object',
          properties: {
            vital_parameters: { type: 'array', items: { type: 'string' } },
            follow_up_schedule: { type: 'string' },
            escalation_criteria: { type: 'array', items: { type: 'string' } },
          },
        },
      },
      required: ['assessment', 'care_plan', 'monitoring'],
    },
  },
  examples: [
    {
      variables: {
        input: {
          presenting_problem: 'Acute allergic reaction',
          symptoms: ['Skin rash', 'Facial swelling', 'Itching'],
          onset: 'Within last hour',
          exposure_history: 'New medication started today',
          vitals: {
            blood_pressure: '125/80',
            heart_rate: 95,
            respiratory_rate: 18,
            oxygen_saturation: 98,
          },
        },
      },
      output: `{
        "assessment": {
          "symptom_pattern": {
            "primary_symptoms": [
              "Acute urticarial rash",
              "Angioedema of face",
              "Generalized pruritus"
            ],
            "associated_features": [
              "Temporal association with new medication",
              "Rapid onset",
              "Multiple system involvement"
            ],
            "temporal_pattern": "Acute onset within one hour of medication exposure"
          },
          "risk_evaluation": {
            "risk_category": "URGENT",
            "key_risk_factors": [
              "Facial swelling with potential airway involvement",
              "Rapid progression",
              "Drug-induced etiology"
            ],
            "clinical_reasoning": "Presentation consistent with significant allergic reaction requiring prompt intervention"
          }
        },
        "care_plan": {
          "immediate_interventions": [
            "Discontinue offending medication",
            "Administer antihistamines",
            "Consider epinephrine if progression"
          ],
          "diagnostic_needs": [
            "Continuous vital sign monitoring",
            "Peak flow measurement",
            "Focused respiratory examination"
          ],
          "treatment_approach": {
            "primary_measures": [
              "H1 antihistamine administration",
              "Corticosteroids if severe",
              "Close observation"
            ],
            "alternative_options": [
              "H2 blockers as adjunct therapy",
              "Beta-agonists if bronchospasm develops"
            ]
          }
        },
        "monitoring": {
          "vital_parameters": [
            "Airway patency",
            "Respiratory rate and effort",
            "Blood pressure trending",
            "Pulse oximetry"
          ],
          "follow_up_schedule": "Observe for minimum 4-6 hours, then daily follow-up for 3 days",
          "escalation_criteria": [
            "Development of breathing difficulty",
            "Hypotension",
            "Worsening angioedema",
            "Mental status changes"
          ]
        }
      }`,
    },
  ],
};

export const MEDPALM_MEDICAL_TEMPLATE: PromptTemplate = {
  name: 'medpalm-medical',
  description: 'Med-PaLM 2 specific medical assessment template optimized for clinical analysis',
  systemPrompt: `You are a medical AI assistant powered by Med-PaLM 2, specifically trained for clinical analysis and medical assessments.
Focus on evidence-based medicine and clinical guidelines.
Provide detailed medical insights while maintaining clinical accuracy and relevance.
Consider differential diagnoses, risk factors, and appropriate clinical pathways.`,
  template: `Perform a comprehensive clinical assessment of the following case:
{{ input }}

Clinical Assessment Requirements:
1. Chief Complaint and History
2. Clinical Findings Analysis
3. Differential Diagnosis
4. Risk Stratification
5. Evidence-Based Management Plan

Provide your assessment in the following structured format:
{
  "clinical_assessment": {
    "presenting_complaint": string,
    "key_findings": string[],
    "clinical_interpretation": string,
    "severity_assessment": {
      "level": "CRITICAL" | "HIGH" | "MODERATE" | "LOW",
      "reasoning": string,
      "confidence": number
    }
  },
  "differential_diagnosis": {
    "primary_diagnosis": {
      "condition": string,
      "likelihood": number,
      "supporting_evidence": string[],
      "clinical_pearls": string[]
    },
    "alternative_diagnoses": Array<{
      "condition": string,
      "likelihood": number,
      "key_distinguishers": string[]
    }>
  },
  "management_plan": {
    "immediate_actions": string[],
    "investigations": {
      "required": string[],
      "optional": string[],
      "rationale": string
    },
    "treatment_recommendations": {
      "first_line": string[],
      "alternatives": string[],
      "monitoring_parameters": string[]
    },
    "referral_recommendations": {
      "urgency": "IMMEDIATE" | "URGENT" | "ROUTINE" | "NONE",
      "specialty": string,
      "rationale": string
    }
  },
  "patient_safety": {
    "red_flags": string[],
    "warning_signs": string[],
    "follow_up_plan": {
      "timing": string,
      "key_review_points": string[]
    }
  },
  "evidence_base": {
    "guidelines_referenced": string[],
    "key_evidence_points": string[],
    "certainty_level": "HIGH" | "MODERATE" | "LOW"
  }
}`,
  variables: [
    {
      name: 'input',
      type: 'object',
      description: 'Comprehensive clinical case information',
      required: true,
    },
  ],
  outputFormat: {
    type: 'json',
    schema: {
      type: 'object',
      properties: {
        clinical_assessment: {
          type: 'object',
          properties: {
            presenting_complaint: { type: 'string' },
            key_findings: { type: 'array', items: { type: 'string' } },
            clinical_interpretation: { type: 'string' },
            severity_assessment: {
              type: 'object',
              properties: {
                level: { type: 'string', enum: ['CRITICAL', 'HIGH', 'MODERATE', 'LOW'] },
                reasoning: { type: 'string' },
                confidence: { type: 'number', minimum: 0, maximum: 1 },
              },
            },
          },
        },
        differential_diagnosis: {
          type: 'object',
          properties: {
            primary_diagnosis: {
              type: 'object',
              properties: {
                condition: { type: 'string' },
                likelihood: { type: 'number', minimum: 0, maximum: 1 },
                supporting_evidence: { type: 'array', items: { type: 'string' } },
                clinical_pearls: { type: 'array', items: { type: 'string' } },
              },
            },
            alternative_diagnoses: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  condition: { type: 'string' },
                  likelihood: { type: 'number', minimum: 0, maximum: 1 },
                  key_distinguishers: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        management_plan: {
          type: 'object',
          properties: {
            immediate_actions: { type: 'array', items: { type: 'string' } },
            investigations: {
              type: 'object',
              properties: {
                required: { type: 'array', items: { type: 'string' } },
                optional: { type: 'array', items: { type: 'string' } },
                rationale: { type: 'string' },
              },
            },
            treatment_recommendations: {
              type: 'object',
              properties: {
                first_line: { type: 'array', items: { type: 'string' } },
                alternatives: { type: 'array', items: { type: 'string' } },
                monitoring_parameters: { type: 'array', items: { type: 'string' } },
              },
            },
            referral_recommendations: {
              type: 'object',
              properties: {
                urgency: { type: 'string', enum: ['IMMEDIATE', 'URGENT', 'ROUTINE', 'NONE'] },
                specialty: { type: 'string' },
                rationale: { type: 'string' },
              },
            },
          },
        },
        patient_safety: {
          type: 'object',
          properties: {
            red_flags: { type: 'array', items: { type: 'string' } },
            warning_signs: { type: 'array', items: { type: 'string' } },
            follow_up_plan: {
              type: 'object',
              properties: {
                timing: { type: 'string' },
                key_review_points: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
        evidence_base: {
          type: 'object',
          properties: {
            guidelines_referenced: { type: 'array', items: { type: 'string' } },
            key_evidence_points: { type: 'array', items: { type: 'string' } },
            certainty_level: { type: 'string', enum: ['HIGH', 'MODERATE', 'LOW'] },
          },
        },
      },
      required: [
        'clinical_assessment',
        'differential_diagnosis',
        'management_plan',
        'patient_safety',
        'evidence_base',
      ],
    },
  },
  examples: [
    {
      variables: {
        input: {
          presenting_symptoms: {
            primary: 'Acute chest pain',
            onset: 'Sudden, 2 hours ago',
            character: 'Crushing, central',
            severity: '8/10',
            radiation: 'Left arm and jaw',
          },
          associated_symptoms: [
            'Shortness of breath',
            'Sweating',
            'Nausea',
          ],
          vital_signs: {
            blood_pressure: '165/95 mmHg',
            heart_rate: '98 bpm',
            respiratory_rate: '22/min',
            oxygen_saturation: '95% on room air',
            temperature: '36.8°C',
          },
          medical_history: {
            conditions: ['Hypertension', 'Type 2 Diabetes'],
            medications: ['Metformin', 'Amlodipine'],
            risk_factors: ['Smoker', 'Family history of CAD'],
          },
        },
      },
      output: `{
        "clinical_assessment": {
          "presenting_complaint": "Acute chest pain with typical anginal features",
          "key_findings": [
            "Typical anginal characteristics",
            "Multiple cardiovascular risk factors",
            "Abnormal vital signs with tachycardia and hypertension",
            "Associated autonomic symptoms"
          ],
          "clinical_interpretation": "Presentation highly suggestive of acute coronary syndrome",
          "severity_assessment": {
            "level": "CRITICAL",
            "reasoning": "High-risk features including typical symptoms, multiple risk factors, and abnormal vitals",
            "confidence": 0.9
          }
        },
        "differential_diagnosis": {
          "primary_diagnosis": {
            "condition": "Acute Coronary Syndrome",
            "likelihood": 0.85,
            "supporting_evidence": [
              "Typical anginal pain characteristics",
              "Multiple cardiovascular risk factors",
              "Associated autonomic symptoms",
              "Vital sign abnormalities"
            ],
            "clinical_pearls": [
              "Diabetic patients may have atypical presentations",
              "Time is myocardium - early intervention crucial",
              "Consider dual antiplatelet therapy if ACS confirmed"
            ]
          },
          "alternative_diagnoses": [
            {
              "condition": "Aortic Dissection",
              "likelihood": 0.1,
              "key_distinguishers": [
                "Sudden onset",
                "Hypertension as risk factor",
                "But lacking tearing pain or unequal pulses"
              ]
            },
            {
              "condition": "Pulmonary Embolism",
              "likelihood": 0.05,
              "key_distinguishers": [
                "Presence of dyspnea",
                "But lacking pleuritic pain",
                "Less typical pain characteristics"
              ]
            }
          ]
        },
        "management_plan": {
          "immediate_actions": [
            "Activate acute coronary syndrome pathway",
            "Administer aspirin 300mg",
            "Obtain 12-lead ECG within 10 minutes",
            "Establish IV access",
            "Give sublingual nitroglycerine if BP permits"
          ],
          "investigations": {
            "required": [
              "12-lead ECG",
              "Cardiac troponin",
              "Basic metabolic panel",
              "Complete blood count",
              "Chest X-ray"
            ],
            "optional": [
              "D-dimer if PE suspected",
              "Point-of-care cardiac ultrasound"
            ],
            "rationale": "To confirm ACS, assess complications, and rule out alternatives"
          },
          "treatment_recommendations": {
            "first_line": [
              "Aspirin 300mg loading dose",
              "Sublingual nitroglycerine",
              "Consider second antiplatelet based on ECG",
              "Pain management"
            ],
            "alternatives": [
              "Consider morphine if severe pain",
              "Beta-blockers if no contraindications"
            ],
            "monitoring_parameters": [
              "Continuous cardiac monitoring",
              "Vital signs every 15 minutes",
              "Repeat ECGs if changes in symptoms",
              "Serial troponin measurements"
            ]
          },
          "referral_recommendations": {
            "urgency": "IMMEDIATE",
            "specialty": "Cardiology",
            "rationale": "High-risk ACS requiring urgent coronary intervention consideration"
          }
        },
        "patient_safety": {
          "red_flags": [
            "Development of cardiogenic shock",
            "Cardiac arrest",
            "ST-elevation on ECG",
            "Refractory chest pain"
          ],
          "warning_signs": [
            "Worsening pain despite treatment",
            "Hemodynamic instability",
            "New arrhythmias",
            "Acute heart failure signs"
          ],
          "follow_up_plan": {
            "timing": "Immediate cardiology follow-up required",
            "key_review_points": [
              "ECG changes",
              "Troponin trends",
              "Response to initial treatment",
              "Hemodynamic stability"
            ]
          }
        },
        "evidence_base": {
          "guidelines_referenced": [
            "ESC 2020 NSTE-ACS Guidelines",
            "AHA/ACC STEMI Guidelines 2013 (Updated 2015)",
            "NICE ACS Guidelines"
          ],
          "key_evidence_points": [
            "Early invasive strategy improves outcomes in high-risk NSTE-ACS",
            "Dual antiplatelet therapy reduces major adverse cardiac events",
            "Early risk stratification guides management decisions"
          ],
          "certainty_level": "HIGH"
        }
      }`,
    },
  ],
}; 