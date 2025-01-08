import { Injectable } from '@nestjs/common';
import { LLMService } from '@app/common/llm/llm.service';
import { PrometheusService } from '@app/common/monitoring/prometheus.service';
import { LoggerService } from '@app/common/logger/logger.service';
import { MessagingService } from '@app/common/messaging/messaging.service';

export interface TaskRouting {
  taskType: string;
  preferredProviders: string[];
  minConfidence: number;
  maxCost: number;
  requiresVoting: boolean;
  votingThreshold: number;
}

export interface ModelResponse {
  content: string;
  confidence: number;
  provider: string;
  responseTime: number;
  cost: number;
}

export interface AggregatedResult {
  content: string;
  confidence: number;
  providers: string[];
  averageResponseTime: number;
  totalCost: number;
  votingScore?: number;
}

export interface TaskInput {
  prompt?: string;
  symptoms?: string[];
  duration?: string;
  [key: string]: any;
}

export interface ModelStructure {
  sections: string[];
  requiredFields: string[];
  validations: Record<string, unknown>;
}

@Injectable()
export class AIOrchestrationService {
  private readonly taskRoutingMap: Map<string, TaskRouting> = new Map([
    ['symptom-analysis', {
      taskType: 'medical-diagnosis',
      preferredProviders: ['medpalm', 'anthropic', 'openai'],
      minConfidence: 0.8,
      maxCost: 0.1,
      requiresVoting: true,
      votingThreshold: 0.7,
    }],
    ['emergency-assessment', {
      taskType: 'emergency-triage',
      preferredProviders: ['medpalm', 'openai', 'anthropic'],
      minConfidence: 0.9,
      maxCost: 0.15,
      requiresVoting: true,
      votingThreshold: 0.8,
    }],
    ['treatment-recommendation', {
      taskType: 'medical-recommendation',
      preferredProviders: ['medpalm', 'anthropic', 'openai'],
      minConfidence: 0.85,
      maxCost: 0.12,
      requiresVoting: true,
      votingThreshold: 0.75,
    }],
  ]);

  constructor(
    private readonly llmService: LLMService,
    private readonly prometheusService: PrometheusService,
    private readonly logger: LoggerService,
    private readonly messagingService: MessagingService,
  ) {}

  private logError(message: string, error: Error | unknown): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    this.logger.error(`${message}: ${errorMessage}`);
  }

  private logInfo(message: string, metadata?: Record<string, unknown>): void {
    this.logger.log(message, metadata ? JSON.stringify(metadata) : undefined);
  }

  private recordMetrics(taskType: string, metrics: { responseTime: number; confidence: number; cost: number }): void {
    this.prometheusService.recordTaskMetrics(taskType, metrics);
  }

  private recordModelMetrics(provider: string, metrics: { responseTime: number; confidence: number; cost: number }): void {
    this.prometheusService.recordModelMetrics(provider, metrics);
  }

  async routeTask(taskType: string, input: TaskInput): Promise<AggregatedResult> {
    const routing = this.taskRoutingMap.get(taskType);
    if (!routing) {
      throw new Error(`No routing configuration found for task type: ${taskType}`);
    }

    const startTime = Date.now();
    this.logInfo(`Starting task routing for ${taskType}`, { routing });

    const responses: ModelResponse[] = [];
    let totalCost = 0;

    for (const provider of routing.preferredProviders) {
      try {
        const response = await this.queryModel(taskType, input, provider);
        responses.push(response);
        totalCost += response.cost;

        if (totalCost > routing.maxCost) {
          this.logInfo(`Cost threshold exceeded for ${taskType}`, { totalCost, maxCost: routing.maxCost });
          break;
        }
      } catch (error) {
        this.logError(`Error querying provider ${provider}`, error);
        this.prometheusService.incrementProviderError(provider);
      }
    }

    let result: AggregatedResult;
    if (routing.requiresVoting && responses.length >= 2) {
      result = this.implementVoting(responses) || this.aggregateResults(responses);
    } else {
      result = this.aggregateResults(responses);
    }

    const endTime = Date.now();
    this.recordMetrics(taskType, {
      responseTime: endTime - startTime,
      confidence: result.confidence,
      cost: result.totalCost,
    });

    return result;
  }

  private async queryModel(taskType: string, input: TaskInput, provider: string): Promise<ModelResponse> {
    try {
      if (!input.prompt) {
        throw new Error('Prompt is required for model query');
      }
      const startTime = Date.now();
      const response = await this.llmService.generateResponse(input.prompt, provider);
      const endTime = Date.now();
      const responseTime = (endTime - startTime) / 1000; // Convert to seconds
      const confidence = this.calculateConfidence(response.content, taskType);
      const cost = this.calculateCost(response.tokenUsage, provider);

      this.recordModelMetrics(provider, {
        responseTime,
        confidence,
        cost,
      });

      return {
        content: response.content,
        confidence,
        provider,
        responseTime,
        cost,
      };
    } catch (error) {
      this.logError(`Error in model query`, error);
      throw error;
    }
  }

  private calculateConfidence(content: string, taskType: string): number {
    // Implement confidence calculation based on:
    // 1. Response structure completeness
    // 2. Medical terminology usage
    // 3. Evidence-based reasoning
    // 4. Guideline adherence
    try {
      const response = JSON.parse(content);
      let confidence = 0;

      // Check response structure completeness
      confidence += this.checkStructureCompleteness(response) * 0.3;

      // Check medical terminology
      confidence += this.checkMedicalTerminology(response) * 0.2;

      // Check evidence-based reasoning
      confidence += this.checkEvidenceBasedReasoning(response) * 0.3;

      // Check guideline adherence
      confidence += this.checkGuidelineAdherence(response) * 0.2;

      return Math.min(1, confidence);
    } catch (error) {
      this.logError('Error calculating confidence', error);
      return 0;
    }
  }

  private checkStructureCompleteness(response: any): number {
    const requiredFields = [
      'clinical_assessment',
      'differential_diagnosis',
      'management_plan',
      'patient_safety',
      'evidence_base',
    ];

    const presentFields = requiredFields.filter(field => 
      response[field] && Object.keys(response[field]).length > 0
    );

    return presentFields.length / requiredFields.length;
  }

  private checkMedicalTerminology(response: any): number {
    // Implement medical terminology check
    // This is a simplified version - in production, use a medical terminology database
    const medicalTerms = new Set([
      'diagnosis', 'prognosis', 'etiology', 'pathology', 'syndrome',
      'acute', 'chronic', 'benign', 'malignant', 'idiopathic',
    ]);

    let termCount = 0;
    const responseStr = JSON.stringify(response).toLowerCase();
    
    medicalTerms.forEach(term => {
      if (responseStr.includes(term.toLowerCase())) {
        termCount++;
      }
    });

    return termCount / medicalTerms.size;
  }

  private checkEvidenceBasedReasoning(response: any): number {
    let score = 0;

    if (response.evidence_base?.guidelines_referenced?.length > 0) {
      score += 0.4;
    }

    if (response.evidence_base?.key_evidence_points?.length > 0) {
      score += 0.3;
    }

    if (response.clinical_assessment?.clinical_interpretation) {
      score += 0.3;
    }

    return score;
  }

  private checkGuidelineAdherence(response: any): number {
    let score = 0;

    if (response.management_plan?.treatment_recommendations?.first_line) {
      score += 0.4;
    }

    if (response.patient_safety?.red_flags) {
      score += 0.3;
    }

    if (response.management_plan?.referral_recommendations?.urgency) {
      score += 0.3;
    }

    return score;
  }

  private calculateCost(tokenUsage: number, provider: string): number {
    const costPerToken: Record<string, number> = {
      'openai': 0.00002,
      'anthropic': 0.000015,
      'medpalm': 0.000025,
      'cohere': 0.00001,
      'gemini': 0.000012,
    };

    return tokenUsage * (costPerToken[provider] || 0.00002);
  }

  private aggregateResults(responses: ModelResponse[]): AggregatedResult {
    if (responses.length === 0) {
      throw new Error('No responses to aggregate');
    }

    // Sort by confidence
    responses.sort((a, b) => b.confidence - a.confidence);

    // If we have multiple responses, implement voting
    if (responses.length > 1) {
      const votingResult = this.implementVoting(responses);
      if (votingResult) {
        return votingResult;
      }
    }

    // If voting doesn't produce a result or we only have one response,
    // use the highest confidence response
    const bestResponse = responses[0];
    return {
      content: bestResponse.content,
      confidence: bestResponse.confidence,
      providers: [bestResponse.provider],
      averageResponseTime: bestResponse.responseTime,
      totalCost: bestResponse.cost,
    };
  }

  private implementVoting(responses: ModelResponse[]): AggregatedResult | null {
    try {
      const parsedResponses = responses.map(r => ({
        ...r,
        parsed: JSON.parse(r.content),
      }));

      // Compare key diagnostic elements
      const diagnosticAgreement = this.calculateDiagnosticAgreement(parsedResponses);
      const severityAgreement = this.calculateSeverityAgreement(parsedResponses);
      const managementAgreement = this.calculateManagementAgreement(parsedResponses);

      const votingScore = (diagnosticAgreement + severityAgreement + managementAgreement) / 3;

      // If voting score is high enough, use the highest confidence response
      if (votingScore >= 0.7) {
        const bestResponse = responses[0];
        return {
          content: bestResponse.content,
          confidence: bestResponse.confidence * votingScore, // Adjust confidence based on voting
          providers: responses.map(r => r.provider),
          averageResponseTime: responses.reduce((sum, r) => sum + r.responseTime, 0) / responses.length,
          totalCost: responses.reduce((sum, r) => sum + r.cost, 0),
          votingScore,
        };
      }
    } catch (error) {
      this.logError('Error in voting implementation', error);
    }

    return null;
  }

  private calculateDiagnosticAgreement(responses: any[]): number {
    const diagnoses = responses.map(r => 
      r.parsed.differential_diagnosis?.primary_diagnosis?.condition?.toLowerCase()
    );

    const uniqueDiagnoses = new Set(diagnoses);
    const mostCommonDiagnosis = this.getMostCommonElement(diagnoses);

    return diagnoses.filter(d => d === mostCommonDiagnosis).length / diagnoses.length;
  }

  private calculateSeverityAgreement(responses: any[]): number {
    const severityLevels = responses.map(r =>
      r.parsed.clinical_assessment?.severity_assessment?.level
    );

    const mostCommonSeverity = this.getMostCommonElement(severityLevels);
    return severityLevels.filter(s => s === mostCommonSeverity).length / severityLevels.length;
  }

  private calculateManagementAgreement(responses: any[]): number {
    const managementActions = responses.map(r =>
      r.parsed.management_plan?.immediate_actions?.map(a => a.toLowerCase())
    );

    let agreementScore = 0;
    const allActions = new Set(managementActions.flat());

    allActions.forEach(action => {
      const actionAgreement = managementActions.filter(actions => 
        actions.some(a => this.calculateStringSimilarity(a, action) > 0.8)
      ).length / managementActions.length;
      agreementScore += actionAgreement;
    });

    return agreementScore / allActions.size;
  }

  private getMostCommonElement<T>(arr: T[]): T {
    const counts = new Map<T, number>();
    arr.forEach(item => counts.set(item, (counts.get(item) || 0) + 1));
    return [...counts.entries()].reduce((a: [T, number], b: [T, number]) => a[1] > b[1] ? a : b)[0];
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) {
      return 1.0;
    }

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => 
      Array(str1.length + 1).fill(null)
    );

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + substitutionCost
        );
      }
    }

    return matrix[str2.length][str1.length];
  }
} 