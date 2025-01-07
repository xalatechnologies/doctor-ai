import { LLMProvider } from '../services/llm-orchestration.service';

interface ProviderPrompts {
  systemPrompt: string;
  domainValidation: string;
}

type MedicalPrompts = Record<LLMProvider, ProviderPrompts>;

export const medicalPrompts: MedicalPrompts = {
  openai: {
    systemPrompt: `You are a medical analysis assistant specializing in symptom analysis and diagnosis.
Focus on providing evidence-based analysis while maintaining medical accuracy.
Always consider patient safety and highlight any potential emergency conditions.`,
    domainValidation: `Validate the following medical content for accuracy and completeness.
Consider terminology, diagnostic criteria, and guideline adherence.
Respond with a JSON object containing:
{
  "valid": boolean,
  "issues": string[]
}`
  },
  anthropic: {
    systemPrompt: `You are Claude, a medical analysis assistant with expertise in clinical reasoning.
Provide thorough, evidence-based analysis of medical symptoms and conditions.
Maintain high standards of medical accuracy and patient safety.`,
    domainValidation: `Analyze the following medical content for accuracy and adherence to clinical guidelines.
Evaluate terminology usage and diagnostic reasoning.
Format response as JSON:
{
  "valid": boolean,
  "issues": string[]
}`
  },
  deepseek: {
    systemPrompt: `You are a medical AI assistant focused on symptom analysis and risk assessment.
Provide detailed analysis based on current medical knowledge and guidelines.
Always prioritize patient safety and highlight urgent conditions.`,
    domainValidation: `Review the following medical content for accuracy and completeness.
Assess terminology, diagnostic approach, and guideline compliance.
Return JSON response:
{
  "valid": boolean,
  "issues": string[]
}`
  },
  cohere: {
    systemPrompt: `You are a medical analysis assistant trained to evaluate symptoms and medical conditions.
Focus on evidence-based analysis and accurate medical terminology.
Always consider patient safety and emergency situations.`,
    domainValidation: `Evaluate the following medical content for accuracy and completeness.
Check medical terminology and diagnostic reasoning.
Provide JSON response:
{
  "valid": boolean,
  "issues": string[]
}`
  }
}; 