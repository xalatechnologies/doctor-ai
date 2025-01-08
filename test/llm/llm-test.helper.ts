import { LLMAnalysisResult } from '../../src/common/llm/llm-orchestration.service';

export class LLMTestHelper {
  static getMockResponse(context: string): LLMAnalysisResult {
    switch (context) {
      case 'possible_conditions':
        return {
          differentials: ['Acute Coronary Syndrome', 'Angina', 'Myocardial Infarction'],
          immediateActions: ['Call emergency services', 'Administer aspirin if available'],
          followUp: ['Cardiac evaluation', 'Stress test', 'Lifestyle modifications'],
          risks: ['Heart attack', 'Cardiac arrest', 'Heart failure'],
          isUrgent: true,
          confidence: 0.85,
          primaryDiagnosis: 'Suspected Acute Coronary Syndrome',
          analysis: 'Symptoms strongly suggest cardiac origin with classic presentation of ACS.',
          vitalSignsSummary: 'Patient presents with severe chest pain and associated symptoms.',
          abnormalFindings: ['Radiating chest pain', 'Shortness of breath', 'Diaphoresis'],
        };

      case 'risk_assessment':
        return {
          differentials: ['Viral infection', 'Bacterial infection', 'COVID-19'],
          immediateActions: ['Monitor temperature', 'Rest', 'Hydration'],
          followUp: ['Medical evaluation if symptoms persist', 'COVID-19 testing'],
          risks: ['Dehydration', 'Secondary infection'],
          isUrgent: false,
          confidence: 0.75,
          primaryDiagnosis: 'Viral Syndrome',
          analysis: 'Presentation consistent with viral illness, moderate severity.',
          vitalSignsSummary: 'Fever 39.5°C with constitutional symptoms.',
          abnormalFindings: ['High fever', 'Body aches', 'Fatigue'],
        };

      case 'recommendations':
        return {
          differentials: ['Anaphylaxis', 'Allergic reaction', 'Angioedema'],
          immediateActions: ['Administer epinephrine', 'Call emergency services'],
          followUp: ['Allergy specialist referral', 'Epinephrine auto-injector prescription'],
          risks: ['Respiratory arrest', 'Shock', 'Death if untreated'],
          isUrgent: true,
          confidence: 0.95,
          primaryDiagnosis: 'Anaphylactic Reaction',
          analysis: 'Classic presentation of severe allergic reaction requiring immediate intervention.',
          vitalSignsSummary: 'Acute onset of systemic allergic symptoms after peanut exposure.',
          abnormalFindings: ['Hives', 'Facial swelling', 'Respiratory distress'],
        };

      default:
        return {
          differentials: [],
          immediateActions: [],
          followUp: [],
          risks: [],
          isUrgent: false,
          confidence: 0,
          primaryDiagnosis: '',
          analysis: '',
          vitalSignsSummary: '',
          abnormalFindings: [],
        };
    }
  }

  static getMockErrorResponse(): Error {
    return new Error('Mock LLM error');
  }

  static getMockTokenLimitResponse(): Error {
    return new Error('Token limit exceeded');
  }
} 