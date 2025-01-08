import { PromptTemplate } from './prompt-template.interface';

export const EMERGENCY_ASSESSMENT_TEMPLATE: PromptTemplate = {
  name: 'emergency-assessment',
  description: 'Assesses emergency situations and provides immediate guidance',
  systemPrompt: 'You are an emergency medical expert assessing urgent medical situations and providing critical guidance.',
  template: `Assess the following emergency situation and provide immediate guidance:
{{ emergency_details }}

Consider:
1. Immediate life threats
2. Critical symptoms
3. Required emergency response
4. Time sensitivity
5. Pre-hospital care needs

Provide an emergency assessment in JSON format with the following structure:
{
  "emergencyLevel": "CRITICAL" | "SEVERE" | "MODERATE" | "MILD",
  "timeToAction": number (minutes),
  "requiredResponse": {
    "immediate_actions": string[],
    "emergency_services": boolean,
    "specialized_care": string[]
  },
  "stabilizationSteps": string[],
  "warningSignsToMonitor": string[],
  "transportationMode": "AMBULANCE" | "PERSONAL" | "NONE"
}`,
  variables: [
    {
      name: 'emergency_details',
      type: 'object',
      description: 'Object containing emergency situation details',
      required: true,
    },
  ],
  outputFormat: {
    type: 'json',
    schema: {
      type: 'object',
      properties: {
        emergencyLevel: { type: 'string', enum: ['CRITICAL', 'SEVERE', 'MODERATE', 'MILD'] },
        timeToAction: { type: 'number', minimum: 0 },
        requiredResponse: {
          type: 'object',
          properties: {
            immediate_actions: { type: 'array', items: { type: 'string' } },
            emergency_services: { type: 'boolean' },
            specialized_care: { type: 'array', items: { type: 'string' } },
          },
        },
        stabilizationSteps: { type: 'array', items: { type: 'string' } },
        warningSignsToMonitor: { type: 'array', items: { type: 'string' } },
        transportationMode: { type: 'string', enum: ['AMBULANCE', 'PERSONAL', 'NONE'] },
      },
      required: ['emergencyLevel', 'timeToAction', 'requiredResponse', 'stabilizationSteps', 'warningSignsToMonitor', 'transportationMode'],
    },
  },
  examples: [
    {
      variables: {
        emergency_details: {
          primary_symptom: 'Severe chest pain',
          onset: 'Sudden',
          duration: '30 minutes',
          associated_symptoms: ['Shortness of breath', 'Sweating'],
          vital_signs: {
            blood_pressure: '160/95',
            heart_rate: 110,
            oxygen_saturation: 94,
          },
        },
      },
      output: `{
        "emergencyLevel": "CRITICAL",
        "timeToAction": 0,
        "requiredResponse": {
          "immediate_actions": ["Call emergency services", "Administer aspirin if available"],
          "emergency_services": true,
          "specialized_care": ["Cardiac unit"]
        },
        "stabilizationSteps": [
          "Keep patient still and calm",
          "Loosen tight clothing",
          "Monitor vital signs"
        ],
        "warningSignsToMonitor": [
          "Loss of consciousness",
          "Changes in breathing",
          "Increased pain"
        ],
        "transportationMode": "AMBULANCE"
      }`,
    },
  ],
}; 