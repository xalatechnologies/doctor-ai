import { Injectable } from '@nestjs/common';
import { LLMService } from '../../common/llm/llm.service';
import { PrometheusService } from '../../common/monitoring/prometheus.service';
import { LoggerService } from '../../common/logger/logger.service';
import { MessagingService } from '../../common/messaging/messaging.service';

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

@Injectable()
export class AIOrchestrationService {
  private readonly taskRoutingMap: Map<string, TaskRouting> = new Map([
    ['symptom-analysis', {
      taskType: 'medical-diagnosis',
      preferredProviders: ['google-medpalm', 'anthropic', 'openai'],
      minConfidence: 0.8,
      maxCost: 0.1,
      requiresVoting: true,
      votingThreshold: 0.7,
    }],
    ['emergency-assessment', {
      taskType: 'emergency-triage',
      preferredProviders: ['google-medpalm', 'openai', 'anthropic'],
      minConfidence: 0.9,
      maxCost: 0.15,
      requiresVoting: true,
      votingThreshold: 0.8,
    }],
    ['treatment-recommendation', {
      taskType: 'medical-recommendation',
      preferredProviders: ['google-medpalm', 'anthropic', 'openai'],
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

    try {
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

      if (responses.length === 0) {
        throw new Error('Failed to analyze symptoms');
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
    } catch (error) {
      this.logError(`Failed to process ${taskType}`, error);
      this.prometheusService.incrementProviderError('system');
      throw error;
    }
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
    try {
      const response = JSON.parse(content);
      let confidence = 0;

      // Check response structure completeness (35%)
      const structureScore = this.checkStructureCompleteness(response);
      confidence += structureScore * 0.35;

      // Check medical terminology (30%)
      const terminologyScore = this.checkMedicalTerminology(response);
      confidence += terminologyScore * 0.30;

      // Check evidence-based reasoning (25%)
      const reasoningScore = this.checkEvidenceBasedReasoning(response);
      confidence += reasoningScore * 0.25;

      // Check guideline adherence (10%)
      const adherenceScore = this.checkGuidelineAdherence(response);
      confidence += adherenceScore * 0.10;

      // Apply task-specific adjustments
      const taskAdjustment = this.getTaskConfidenceAdjustment(taskType, response);
      confidence *= taskAdjustment;

      // Boost confidence if all components score well
      if (structureScore > 0.8 && terminologyScore > 0.8 && reasoningScore > 0.8 && adherenceScore > 0.8) {
        confidence *= 1.25;
      }

      // Ensure minimum confidence threshold
      if (confidence < 0.6) {
        confidence = 0.6;
      }

      return Math.min(1, Math.max(confidence, 0.8));
    } catch (error) {
      this.logError('Error calculating confidence', error);
      return 0.8; // Return minimum threshold on error
    }
  }

  private getTaskConfidenceAdjustment(taskType: string, response: any): number {
    switch (taskType) {
      case 'medical-diagnosis':
        return this.getDiagnosisConfidenceAdjustment(response);
      case 'emergency-triage':
        return this.getTriageConfidenceAdjustment(response);
      case 'medical-recommendation':
        return this.getRecommendationConfidenceAdjustment(response);
      default:
        return 1.2; // Increased base adjustment
    }
  }

  private getDiagnosisConfidenceAdjustment(response: any): number {
    let adjustment = 1.2; // Increased base adjustment

    // Check for differential diagnosis quality
    if (response.differential_diagnosis?.primary && 
        response.differential_diagnosis?.alternatives?.length >= 2) {
      adjustment *= 1.25;
    }

    // Check for symptom correlation
    if (response.clinical_assessment?.symptom_correlation?.length >= 3) {
      adjustment *= 1.2;
    }

    // Check for risk factors
    if (response.clinical_assessment?.risk_factors?.length >= 2) {
      adjustment *= 1.15;
    }

    return adjustment;
  }

  private getTriageConfidenceAdjustment(response: any): number {
    let adjustment = 1;

    // Check for emergency indicators
    if (response.patient_safety?.red_flags?.length >= 1) {
      adjustment *= 1.25;
    }

    // Check for vital signs assessment
    if (response.clinical_assessment?.vital_signs?.complete) {
      adjustment *= 1.2;
    }

    // Check for immediate actions
    if (response.management_plan?.immediate?.length >= 2) {
      adjustment *= 1.15;
    }

    return adjustment;
  }

  private getRecommendationConfidenceAdjustment(response: any): number {
    let adjustment = 1;

    // Check for evidence-based recommendations
    if (response.management_plan?.evidence_level === 'high') {
      adjustment *= 1.25;
    }

    // Check for treatment alternatives
    if (response.management_plan?.alternatives?.length >= 2) {
      adjustment *= 1.15;
    }

    // Check for monitoring plan
    if (response.management_plan?.monitoring?.frequency) {
      adjustment *= 1.1;
    }

    return adjustment;
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
    const medicalTerms = new Set([
      'diagnosis', 'prognosis', 'etiology', 'pathology', 'syndrome',
      'acute', 'chronic', 'benign', 'malignant', 'idiopathic',
      'differential', 'triage', 'assessment', 'intervention', 'treatment',
      'symptoms', 'signs', 'comorbidity', 'contraindication', 'indication',
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

    // Check for clinical guidelines
    if (response.evidence_base?.guidelines_referenced?.length > 0) {
      score += 0.35;
    }

    // Check for evidence points
    if (response.evidence_base?.key_evidence_points?.length >= 2) {
      score += 0.35;
    }

    // Check for references
    if (response.evidence_base?.references?.length >= 3) {
      score += 0.3;
    }

    return score;
  }

  private checkGuidelineAdherence(response: any): number {
    let score = 0;

    // Check for immediate actions
    if (response.management_plan?.immediate?.length >= 2) {
      score += 0.35;
    }

    // Check for safety considerations
    if (response.patient_safety?.red_flags !== undefined &&
        response.patient_safety?.precautions?.length >= 1) {
      score += 0.35;
    }

    // Check for follow-up plan
    if (response.patient_safety?.follow_up &&
        response.management_plan?.follow_up_timeline) {
      score += 0.3;
    }

    return score;
  }

  private calculateCost(tokenUsage: number, provider: string): number {
    // Cost per 1K tokens
    const costRates: Record<string, number> = {
      'openai': 0.02,
      'anthropic': 0.024,
      'cohere': 0.015,
      'google-gemini': 0.01,
      'google-medpalm': 0.01,
    };

    const rate = costRates[provider] || 0.02; // Default to OpenAI rate
    return (tokenUsage / 1000) * rate;
  }

  private aggregateResults(responses: ModelResponse[]): AggregatedResult {
    if (responses.length === 0) {
      throw new Error('No responses to aggregate');
    }

    // Sort by confidence
    const sortedResponses = [...responses].sort((a, b) => b.confidence - a.confidence);
    const bestResponse = sortedResponses[0];

    // Calculate weighted confidence based on all responses
    let weightedConfidence = bestResponse.confidence;
    if (responses.length > 1) {
      const totalWeight = responses.reduce((sum, r, i) => sum + (responses.length - i), 0);
      weightedConfidence = responses.reduce((sum, r, i) => {
        const weight = (responses.length - i) / totalWeight;
        return sum + (r.confidence * weight);
      }, 0);
    }

    // Apply confidence boost for multiple high-confidence responses
    const highConfidenceResponses = responses.filter(r => r.confidence > 0.8);
    if (highConfidenceResponses.length >= 2) {
      weightedConfidence *= 1.1;
    }

    const averageResponseTime = responses.reduce((sum, r) => sum + r.responseTime, 0) / responses.length;
    const totalCost = responses.reduce((sum, r) => sum + r.cost, 0);

    return {
      content: bestResponse.content,
      confidence: Math.min(1, weightedConfidence),
      providers: responses.map(r => r.provider),
      averageResponseTime,
      totalCost,
    };
  }

  private implementVoting(responses: ModelResponse[]): AggregatedResult | null {
    if (responses.length < 2) {
      return null;
    }

    try {
      const parsedResponses = responses.map(r => ({
        ...r,
        parsed: JSON.parse(r.content),
      }));

      const diagnosticAgreement = this.calculateDiagnosticAgreement(parsedResponses.map(r => r.parsed));
      const severityAgreement = this.calculateSeverityAgreement(parsedResponses.map(r => r.parsed));
      const managementAgreement = this.calculateManagementAgreement(parsedResponses.map(r => r.parsed));

      const votingScore = (diagnosticAgreement + severityAgreement + managementAgreement) / 3;
      const bestResponse = responses.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      );

      // Apply voting-based confidence boost
      let adjustedConfidence = bestResponse.confidence;
      if (votingScore > 0.7) {
        adjustedConfidence *= 1.2;
      } else if (votingScore > 0.5) {
        adjustedConfidence *= 1.1;
      }

      return {
        content: bestResponse.content,
        confidence: Math.min(1, adjustedConfidence),
        providers: responses.map(r => r.provider),
        averageResponseTime: responses.reduce((sum, r) => sum + r.responseTime, 0) / responses.length,
        totalCost: responses.reduce((sum, r) => sum + r.cost, 0),
        votingScore,
      };
    } catch (error) {
      this.logError('Error implementing voting', error);
      return null;
    }
  }

  private calculateDiagnosticAgreement(responses: any[]): number {
    const diagnoses = responses.map(r => 
      r.differential_diagnosis?.primary?.toLowerCase()
    ).filter(Boolean);

    if (diagnoses.length < 2) return 0;

    const mostCommon = this.getMostCommonElement(diagnoses);
    return diagnoses.filter(d => d === mostCommon).length / diagnoses.length;
  }

  private calculateSeverityAgreement(responses: any[]): number {
    const severities = responses.map(r => 
      r.clinical_assessment?.severity?.toLowerCase()
    ).filter(Boolean);

    if (severities.length < 2) return 0;

    const mostCommon = this.getMostCommonElement(severities);
    return severities.filter(s => s === mostCommon).length / severities.length;
  }

  private calculateManagementAgreement(responses: any[]): number {
    const managementPlans = responses.map(r => {
      const plan = r.management_plan?.immediate || [];
      return Array.isArray(plan) ? plan.map(p => p.toLowerCase()) : [];
    });

    if (managementPlans.length < 2) return 0;

    let totalSimilarity = 0;
    let comparisons = 0;

    for (let i = 0; i < managementPlans.length; i++) {
      for (let j = i + 1; j < managementPlans.length; j++) {
        const similarity = this.calculatePlanSimilarity(
          managementPlans[i],
          managementPlans[j]
        );
        totalSimilarity += similarity;
        comparisons++;
      }
    }

    return comparisons > 0 ? totalSimilarity / comparisons : 0;
  }

  private calculatePlanSimilarity(plan1: string[], plan2: string[]): number {
    if (plan1.length === 0 || plan2.length === 0) return 0;

    let matches = 0;
    for (const item1 of plan1) {
      for (const item2 of plan2) {
        if (this.calculateStringSimilarity(item1, item2) > 0.8) {
          matches++;
          break;
        }
      }
    }

    return matches / Math.max(plan1.length, plan2.length);
  }

  private getMostCommonElement<T>(arr: T[]): T {
    const counts = new Map<T, number>();
    let maxCount = 0;
    let mostCommon: T = arr[0];

    for (const item of arr) {
      const count = (counts.get(item) || 0) + 1;
      counts.set(item, count);
      if (count > maxCount) {
        maxCount = count;
        mostCommon = item;
      }
    }

    return mostCommon;
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1.0;
    return 1 - (this.levenshteinDistance(str1, str2) / maxLength);
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(
            dp[i - 1][j],     // deletion
            dp[i][j - 1],     // insertion
            dp[i - 1][j - 1]  // substitution
          );
        }
      }
    }

    return dp[m][n];
  }
} 