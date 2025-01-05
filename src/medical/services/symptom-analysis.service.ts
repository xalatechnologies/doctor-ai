import { Injectable } from '@nestjs/common';
import { PatientContext, MedicalAnalysisResult, SymptomAnalysis, VitalSigns } from '../types/medical.types';
import { ConfigService } from '@nestjs/config';
import { LLMOrchestrationService } from './llm-orchestration.service';

@Injectable()
export class SymptomAnalysisService {
  private readonly symptomSeverityThresholds = {
    high: 8,
    medium: 5,
    low: 3
  };

  constructor(
    private configService: ConfigService,
    private llmOrchestration: LLMOrchestrationService
  ) {}

  async analyzeSymptoms(
    symptoms: SymptomAnalysis,
    patientContext: PatientContext
  ): Promise<MedicalAnalysisResult> {
    try {
      // 1. Initial severity assessment
      const severityScore = this.calculateSeverityScore(symptoms);
      
      // 2. Check for critical combinations
      const hasCriticalCombination = this.checkCriticalCombinations(symptoms);
      
      // 3. Generate AI analysis
      const aiAnalysis = await this.generateAIAnalysis(symptoms, patientContext);
      
      // 4. Combine all analyses
      const finalAnalysis = this.combineDiagnosticResults(
        severityScore,
        hasCriticalCombination,
        aiAnalysis,
        patientContext
      );

      return finalAnalysis;
    } catch (error) {
      throw new Error(`Failed to analyze symptoms: ${error.message}`);
    }
  }

  private calculateSeverityScore(symptoms: SymptomAnalysis): number {
    let totalScore = 0;
    let maxSeverity = 0;

    // Analyze primary symptoms
    symptoms.primarySymptoms.forEach(symptom => {
      totalScore += symptom.severity;
      maxSeverity = Math.max(maxSeverity, symptom.severity);
    });

    // Consider risk factors
    symptoms.riskFactors.forEach(risk => {
      switch (risk.impact) {
        case 'high':
          totalScore += 3;
          break;
        case 'medium':
          totalScore += 2;
          break;
        case 'low':
          totalScore += 1;
          break;
      }
    });

    // Check vital signs if available
    if (symptoms.vitalSigns) {
      const vitalSignsScore = this.analyzeVitalSigns(symptoms.vitalSigns);
      totalScore += vitalSignsScore;
    }

    return totalScore;
  }

  private checkCriticalCombinations(symptoms: SymptomAnalysis): boolean {
    const criticalSymptoms = new Set([
      'chest_pain',
      'difficulty_breathing',
      'severe_headache',
      'loss_of_consciousness'
    ]);

    const hasHighSeveritySymptom = symptoms.primarySymptoms.some(
      s => s.severity >= this.symptomSeverityThresholds.high
    );

    const hasCriticalSymptom = symptoms.primarySymptoms.some(
      s => criticalSymptoms.has(s.symptom)
    );

    return hasHighSeveritySymptom && hasCriticalSymptom;
  }

  private async generateAIAnalysis(
    symptoms: SymptomAnalysis,
    patientContext: PatientContext,
    language: string = 'en'
  ): Promise<any> {
    const prompt = this.buildAnalysisPrompt(symptoms, patientContext);
    
    const analysis = await this.llmOrchestration.orchestrateAnalysis(
      prompt,
      language,
      ['gpt-4', 'claude-3', 'gemini-pro']
    );

    return this.parseAIResponse(analysis.response);
  }

  private buildAnalysisPrompt(symptoms: SymptomAnalysis, patientContext: PatientContext): string {
    return `
      Analyze the following medical symptoms and patient context:

      Primary Symptoms:
      ${symptoms.primarySymptoms.map(s => 
        `- ${s.symptom} (Severity: ${s.severity}/10, Duration: ${s.duration})`
      ).join('\n')}

      Associated Symptoms:
      ${symptoms.associatedSymptoms.map(s =>
        `- ${s.symptom} (Relation: ${s.relation}, Onset: ${s.timeOfOnset})`
      ).join('\n')}

      Patient Context:
      - Age: ${patientContext.age}
      - Gender: ${patientContext.gender}
      - Medical History: ${patientContext.medicalHistory.join(', ')}
      - Current Medications: ${patientContext.currentMedications.join(', ')}
      - Allergies: ${patientContext.allergies.join(', ')}
      - Chronic Conditions: ${patientContext.chronicConditions.join(', ')}

      Provide:
      1. Potential diagnoses with confidence levels
      2. Recommended actions
      3. Urgency level
      4. Additional tests or examinations needed
    `;
  }

  private parseAIResponse(response: string): {
    diagnoses: Array<{
      condition: string;
      probability: number;
      severity: number;
      supportingEvidence: string[];
      differentialDiagnoses: string[];
    }>;
    confidence: number;
    recommendations: string[];
    urgencyLevel: 'immediate' | 'urgent' | 'semi-urgent' | 'non-urgent';
  } {
    try {
      // First, try to parse as JSON if the response is already structured
      try {
        return JSON.parse(response);
      } catch {
        // If not JSON, parse the text response
        const sections = response.split('\n\n');
        const diagnoses = [];
        let confidence = 0;
        let recommendations = [];
        let urgencyLevel: 'immediate' | 'urgent' | 'semi-urgent' | 'non-urgent' = 'non-urgent';

        sections.forEach(section => {
          if (section.includes('Potential diagnoses:')) {
            const diagnosisLines = section.split('\n').slice(1);
            diagnosisLines.forEach(line => {
              if (line.trim()) {
                const [condition, ...details] = line.split(':');
                const detailText = details.join(':').trim();
                const probability = parseFloat(detailText.match(/(\d+)%/)?.[1] || '0') / 100;
                
                diagnoses.push({
                  condition: condition.trim(),
                  probability,
                  severity: this.extractSeverity(detailText),
                  supportingEvidence: this.extractEvidence(detailText),
                  differentialDiagnoses: []
                });
              }
            });
          } else if (section.includes('Recommended actions:')) {
            recommendations = section
              .split('\n')
              .slice(1)
              .map(line => line.trim())
              .filter(line => line);
          } else if (section.includes('Urgency level:')) {
            const urgencyText = section.toLowerCase();
            if (urgencyText.includes('immediate')) urgencyLevel = 'immediate';
            else if (urgencyText.includes('urgent')) urgencyLevel = 'urgent';
            else if (urgencyText.includes('semi-urgent')) urgencyLevel = 'semi-urgent';
            else urgencyLevel = 'non-urgent';
          }
        });

        // Calculate overall confidence based on diagnosis probabilities
        confidence = diagnoses.reduce((acc, curr) => acc + curr.probability, 0) / diagnoses.length;

        return {
          diagnoses,
          confidence,
          recommendations,
          urgencyLevel
        };
      }
    } catch (error) {
      console.error('Error parsing AI response:', error);
      throw new Error('Failed to parse AI response');
    }
  }

  private extractSeverity(text: string): number {
    const severityMatch = text.match(/severity:?\s*(\d+)/i);
    return severityMatch ? parseInt(severityMatch[1], 10) : 3;
  }

  private extractEvidence(text: string): string[] {
    const evidenceMatch = text.match(/evidence:?\s*\[(.*?)\]/i);
    if (!evidenceMatch) return [];
    return evidenceMatch[1]
      .split(',')
      .map(e => e.trim())
      .filter(e => e);
  }

  private combineDiagnosticResults(
    severityScore: number,
    hasCriticalCombination: boolean,
    aiAnalysis: any,
    patientContext: PatientContext
  ): MedicalAnalysisResult {
    // Combine all analyses into a final result
    // This is a simplified version
    return {
      diagnosis: aiAnalysis.diagnoses,
      confidence: aiAnalysis.confidence,
      recommendations: aiAnalysis.recommendations,
      urgencyLevel: hasCriticalCombination ? 'immediate' : 
                   severityScore > 15 ? 'urgent' :
                   severityScore > 10 ? 'semi-urgent' : 'non-urgent',
      followUpRequired: severityScore > 5
    };
  }

  private analyzeVitalSigns(vitalSigns: VitalSigns): number {
    let score = 0;

    if (vitalSigns.bloodPressure) {
      const [systolic, diastolic] = vitalSigns.bloodPressure.split('/').map(Number);
      
      // Check systolic pressure
      if (systolic >= 180 || systolic <= 90) {
        score += 8; // Severe
      } else if (systolic >= 160 || systolic <= 100) {
        score += 5; // Moderate
      } else if (systolic >= 140 || systolic <= 110) {
        score += 3; // Mild
      }

      // Check diastolic pressure
      if (diastolic >= 120 || diastolic <= 60) {
        score += 8;
      } else if (diastolic >= 100 || diastolic <= 65) {
        score += 5;
      } else if (diastolic >= 90 || diastolic <= 70) {
        score += 3;
      }
    }

    // Check heart rate
    if (vitalSigns.heartRate) {
      if (vitalSigns.heartRate >= 120 || vitalSigns.heartRate <= 50) {
        score += 8;
      } else if (vitalSigns.heartRate >= 100 || vitalSigns.heartRate <= 55) {
        score += 5;
      } else if (vitalSigns.heartRate >= 90 || vitalSigns.heartRate <= 60) {
        score += 3;
      }
    }

    // Check temperature (in Celsius)
    if (vitalSigns.temperature) {
      if (vitalSigns.temperature >= 39.5 || vitalSigns.temperature <= 35) {
        score += 8;
      } else if (vitalSigns.temperature >= 38.5 || vitalSigns.temperature <= 35.5) {
        score += 5;
      } else if (vitalSigns.temperature >= 38 || vitalSigns.temperature <= 36) {
        score += 3;
      }
    }

    // Check oxygen saturation
    if (vitalSigns.oxygenSaturation) {
      if (vitalSigns.oxygenSaturation <= 92) {
        score += 8;
      } else if (vitalSigns.oxygenSaturation <= 94) {
        score += 5;
      } else if (vitalSigns.oxygenSaturation <= 96) {
        score += 3;
      }
    }

    // Check respiratory rate
    if (vitalSigns.respiratoryRate) {
      if (vitalSigns.respiratoryRate >= 24 || vitalSigns.respiratoryRate <= 8) {
        score += 8;
      } else if (vitalSigns.respiratoryRate >= 20 || vitalSigns.respiratoryRate <= 10) {
        score += 5;
      } else if (vitalSigns.respiratoryRate >= 18 || vitalSigns.respiratoryRate <= 12) {
        score += 3;
      }
    }

    return score;
  }
} 