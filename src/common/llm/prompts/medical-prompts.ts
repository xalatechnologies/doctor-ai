import { PromptTemplate } from './prompt-template.interface';

export const SYMPTOM_ANALYSIS_TEMPLATE: PromptTemplate = {
  name: 'symptom-analysis',
  description: 'Analyzes patient symptoms and provides medical assessment',
  systemPrompt: 'You are a medical expert analyzing symptoms to identify possible conditions, assess risks, and provide recommendations.',
  template: `Analyze the following symptoms and provide a medical assessment:
{{ symptoms }}

Consider:
1. Severity of each symptom
2. Duration and progression
3. Potential interactions between symptoms
4. Risk factors and complications
5. Urgency of medical attention

Provide a detailed analysis in JSON format with the following structure:
{
  "severity": number (1-10),
  "confidence": number (0-1),
  "analysis": string,
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "recommendations": {
    "immediate_actions": string[],
    "follow_up": string[],
    "lifestyle_changes": string[]
  },
  "followUpRequired": boolean
}`,
  variables: [
    {
      name: 'symptoms',
      type: 'object',
      description: 'Object containing symptom descriptions and details',
      required: true,
    },
  ],
  outputFormat: {
    type: 'json',
    schema: {
      type: 'object',
      properties: {
        severity: { type: 'number', minimum: 1, maximum: 10 },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        analysis: { type: 'string' },
        riskLevel: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
        recommendations: {
          type: 'object',
          properties: {
            immediate_actions: { type: 'array', items: { type: 'string' } },
            follow_up: { type: 'array', items: { type: 'string' } },
            lifestyle_changes: { type: 'array', items: { type: 'string' } },
          },
        },
        followUpRequired: { type: 'boolean' },
      },
      required: ['severity', 'confidence', 'analysis', 'riskLevel', 'recommendations', 'followUpRequired'],
    },
  },
  examples: [
    {
      variables: {
        symptoms: {
          headache: {
            severity: 7,
            duration: '3 days',
            description: 'Throbbing pain in temples',
          },
          nausea: {
            severity: 5,
            duration: '1 day',
            description: 'Mild nausea with occasional vomiting',
          },
        },
      },
      output: `{
        "severity": 6,
        "confidence": 0.85,
        "analysis": "Symptoms suggest a possible migraine headache with associated nausea...",
        "riskLevel": "MEDIUM",
        "recommendations": {
          "immediate_actions": ["Rest in dark room", "Stay hydrated"],
          "follow_up": ["Schedule appointment if persists"],
          "lifestyle_changes": ["Track triggers", "Maintain sleep schedule"]
        },
        "followUpRequired": true
      }`,
    },
  ],
};

export const TEMPLATE_FINDING_TEMPLATE: PromptTemplate = {
  name: 'template-finding',
  description: 'Suggests appropriate assessment template based on symptoms',
  systemPrompt: 'You are a medical expert selecting the most appropriate assessment template based on patient symptoms.',
  template: `Based on the following symptoms, suggest the most appropriate assessment template:
{{ symptoms }}

Consider:
1. Primary symptoms and their categories
2. Potential medical conditions
3. Required assessment depth
4. Risk factors to evaluate

Provide a template in JSON format with the following structure:
{
  "id": string,
  "name": string,
  "description": string,
  "questionnaire": object,
  "scoring_logic": object
}`,
  variables: [
    {
      name: 'symptoms',
      type: 'object',
      description: 'Object containing symptom descriptions',
      required: true,
    },
  ],
  outputFormat: {
    type: 'json',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        questionnaire: { type: 'object' },
        scoring_logic: { type: 'object' },
      },
      required: ['id', 'name', 'description', 'questionnaire', 'scoring_logic'],
    },
  },
  examples: [
    {
      variables: {
        symptoms: {
          chest_pain: {
            severity: 8,
            duration: '1 hour',
            description: 'Sharp pain with shortness of breath',
          },
        },
      },
      output: `{
        "id": "cardiac-assessment",
        "name": "Cardiac Assessment Template",
        "description": "Comprehensive assessment for potential cardiac conditions",
        "questionnaire": {
          "sections": [
            {
              "title": "Pain Characteristics",
              "questions": [...]
            }
          ]
        },
        "scoring_logic": {
          "risk_factors": [...],
          "severity_calculation": {...}
        }
      }`,
    },
  ],
}; 