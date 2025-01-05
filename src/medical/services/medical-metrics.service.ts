import { Injectable } from '@nestjs/common';
import { LLMProvider } from './llm-orchestration.service';
import { MedicalTerminology } from '../utils/medical-terminology';
import { medicalCategories } from '../interfaces/medical-guidelines.interface';

interface MedicalMetrics {
  terminologyAccuracy: number;
  diagnosticPrecision: number;
  severityAssessment: number;
  recommendationQuality: number;
  urgencyDetection: number;
  guidelineCompliance: number;
  totalCases: number;
}

interface CaseMetrics {
  timestamp: Date;
  provider: LLMProvider;
  response: string;
  metrics: MedicalMetrics;
  validations: {
    termsUsed: string[];
    severityLevel: number;
    urgencyFlag: boolean;
    guidelinesFollowed: boolean;
    recommendationCount: number;
  };
}

interface CategorizedCase extends CaseMetrics {
  category: string;
  subcategories: string[];
  guidelineAdherence: {
    followedGuidelines: string[];
    deviations: string[];
    justifications: string[];
  };
}

interface SeverityTrend {
  category: string;
  timeframe: string;
  trends: {
    overall: number;
    byProvider: Map<LLMProvider, number>;
    distribution: Map<string, number>; // mild, moderate, severe, critical
  };
  patterns: {
    escalations: number;
    deescalations: number;
    consistencyScore: number;
  };
}

interface DiagnosticConfidence {
  overall: number;
  byCategory: Map<string, number>;
  byProvider: Map<LLMProvider, number>;
  factors: {
    evidenceStrength: number;
    termPrecision: number;
    differentialQuality: number;
    contextRelevance: number;
  };
}

interface ConfidenceThresholds {
  minimum: number;
  warning: number;
  optimal: number;
  categorySpecific: Map<string, {
    minimum: number;
    warning: number;
    optimal: number;
  }>;
}

interface ConfidenceAnalysis {
  score: number;
  level: 'low' | 'moderate' | 'high';
  factors: {
    name: string;
    score: number;
    threshold: number;
    status: 'below' | 'meets' | 'exceeds';
  }[];
  recommendations: string[];
}

interface ConfidenceTrend {
  timeframe: string;
  overall: number;
  byCategory: Map<string, number>;
  byProvider: Map<LLMProvider, number>;
  progression: {
    trend: 'improving' | 'stable' | 'declining';
    rate: number;
    volatility: number;
  };
}

interface ConfidenceDataPoint {
  timestamp: Date;
  score: number;
  category: string;
  provider: LLMProvider;
}

interface AnomalyDetection {
  anomalies: {
    timestamp: Date;
    provider: LLMProvider;
    category: string;
    expectedScore: number;
    actualScore: number;
    deviation: number;
    severity: 'minor' | 'moderate' | 'severe';
  }[];
  patterns: {
    frequentCategories: Map<string, number>;
    providerImpact: Map<LLMProvider, number>;
    timeDistribution: Map<string, number>;
  };
}

interface ProviderRanking {
  overall: Map<LLMProvider, {
    rank: number;
    score: number;
    specialties: string[];
    reliability: number;
  }>;
  byCategory: Map<string, Map<LLMProvider, number>>;
  trends: Map<LLMProvider, {
    improvement: number;
    consistency: number;
    adaptability: number;
  }>;
}

interface PerformanceBenchmark {
  overall: {
    score: number;
    percentile: number;
    ranking: 'top' | 'above_average' | 'average' | 'below_average';
  };
  metrics: {
    accuracy: number;
    speed: number;
    consistency: number;
    coverage: number;
  };
  comparisons: {
    industryAverage: number;
    topPerformer: number;
    similarProviders: number[];
  };
}

interface ProviderSpecialization {
  primarySpecialties: {
    category: string;
    confidence: number;
    performance: number;
    caseCount: number;
  }[];
  crossDomainCapabilities: {
    category: string;
    adaptabilityScore: number;
    successRate: number;
  }[];
  recommendations: {
    focusAreas: string[];
    suggestedCategories: string[];
    improvementMetrics: Map<string, number>;
  };
}

@Injectable()
export class MedicalMetricsService {
  private metrics: Map<LLMProvider, MedicalMetrics> = new Map();
  private caseHistory: CaseMetrics[] = [];
  private readonly confidenceThresholds: ConfidenceThresholds = {
    minimum: 0.6,
    warning: 0.75,
    optimal: 0.85,
    categorySpecific: new Map([
      ['cardio', { minimum: 0.7, warning: 0.8, optimal: 0.9 }],
      ['neuro', { minimum: 0.7, warning: 0.8, optimal: 0.9 }],
      ['onco', { minimum: 0.75, warning: 0.85, optimal: 0.95 }],
      ['infectious', { minimum: 0.7, warning: 0.85, optimal: 0.9 }],
      ['immune', { minimum: 0.7, warning: 0.8, optimal: 0.9 }],
      ['respiratory', { minimum: 0.65, warning: 0.8, optimal: 0.9 }],
      ['gastro', { minimum: 0.65, warning: 0.75, optimal: 0.85 }],
      ['endocrine', { minimum: 0.7, warning: 0.8, optimal: 0.9 }],
      ['ortho', { minimum: 0.65, warning: 0.75, optimal: 0.85 }],
      ['nephro', { minimum: 0.7, warning: 0.8, optimal: 0.9 }],
      ['derm', { minimum: 0.65, warning: 0.75, optimal: 0.85 }]
    ])
  };

  async trackMedicalResponse(
    provider: LLMProvider,
    response: string,
    expectedTerms?: Set<string>
  ): Promise<MedicalMetrics> {
    const caseMetrics = await this.analyzeMedicalCase(provider, response, expectedTerms);
    this.updateProviderMetrics(provider, caseMetrics);
    this.caseHistory.push(caseMetrics);

    return this.metrics.get(provider);
  }

  private async analyzeMedicalCase(
    provider: LLMProvider,
    response: string,
    expectedTerms?: Set<string>
  ): Promise<CaseMetrics> {
    const usedTerms = MedicalTerminology.extractTerms(response);
    const severityLevel = this.extractSeverityLevel(response);
    const recommendations = this.extractRecommendations(response);

    const metrics = {
      terminologyAccuracy: expectedTerms ? 
        this.calculateTerminologyAccuracy(usedTerms, expectedTerms) : 0.8,
      diagnosticPrecision: this.assessDiagnosticPrecision(response),
      severityAssessment: this.validateSeverityAssessment(response),
      recommendationQuality: this.evaluateRecommendations(recommendations),
      urgencyDetection: this.assessUrgencyDetection(response),
      guidelineCompliance: this.checkGuidelineCompliance(response),
      totalCases: 1
    };

    return {
      timestamp: new Date(),
      provider,
      response,
      metrics,
      validations: {
        termsUsed: Array.from(usedTerms),
        severityLevel,
        urgencyFlag: this.hasUrgencyFlag(response),
        guidelinesFollowed: this.followsGuidelines(response),
        recommendationCount: recommendations.length
      }
    };
  }

  private updateProviderMetrics(provider: LLMProvider, caseMetrics: CaseMetrics): void {
    const current = this.metrics.get(provider) || this.getEmptyMetrics();
    const { metrics } = caseMetrics;

    this.metrics.set(provider, {
      terminologyAccuracy: this.weightedAverage(
        current.terminologyAccuracy,
        metrics.terminologyAccuracy,
        current.totalCases
      ),
      diagnosticPrecision: this.weightedAverage(
        current.diagnosticPrecision,
        metrics.diagnosticPrecision,
        current.totalCases
      ),
      severityAssessment: this.weightedAverage(
        current.severityAssessment,
        metrics.severityAssessment,
        current.totalCases
      ),
      recommendationQuality: this.weightedAverage(
        current.recommendationQuality,
        metrics.recommendationQuality,
        current.totalCases
      ),
      urgencyDetection: this.weightedAverage(
        current.urgencyDetection,
        metrics.urgencyDetection,
        current.totalCases
      ),
      guidelineCompliance: this.weightedAverage(
        current.guidelineCompliance,
        metrics.guidelineCompliance,
        current.totalCases
      ),
      totalCases: current.totalCases + 1
    });
  }

  private calculateTerminologyAccuracy(used: Set<string>, expected: Set<string>): number {
    const intersection = new Set([...used].filter(term => expected.has(term)));
    return intersection.size / expected.size;
  }

  private assessDiagnosticPrecision(response: string): number {
    // Implement diagnostic precision scoring based on structure and completeness
    const hasStructuredDiagnosis = /diagnosis:.*?(\n|$)/i.test(response);
    const hasDifferential = /differential:.*?(\n|$)/i.test(response);
    const hasSupporting = /supporting evidence:.*?(\n|$)/i.test(response);

    return (hasStructuredDiagnosis ? 0.4 : 0) +
           (hasDifferential ? 0.3 : 0) +
           (hasSupporting ? 0.3 : 0);
  }

  private validateSeverityAssessment(response: string): number {
    const hasSeverityScale = /severity:.*?(mild|moderate|severe|critical)/i.test(response);
    const hasJustification = /severity.*?because|due to/i.test(response);
    const hasNumericScale = /severity:.*?[1-5](?:\/[1-5])?/i.test(response);

    return (hasSeverityScale ? 0.4 : 0) +
           (hasJustification ? 0.4 : 0) +
           (hasNumericScale ? 0.2 : 0);
  }

  private evaluateRecommendations(recommendations: string[]): number {
    if (recommendations.length === 0) return 0;

    const hasActionable = recommendations.some(r => /^(take|seek|consult|monitor|avoid)/i.test(r));
    const hasPrioritization = recommendations.some(r => /^(immediately|urgently|within|when)/i.test(r));
    const hasFollowUp = recommendations.some(r => /follow.?up|monitor|track/i.test(r));

    return (hasActionable ? 0.4 : 0) +
           (hasPrioritization ? 0.3 : 0) +
           (hasFollowUp ? 0.3 : 0);
  }

  private assessUrgencyDetection(response: string): number {
    const hasUrgencyIndicator = /urgent|emergency|immediate|critical/i.test(response);
    const hasTimeframe = /within \d+ (hours?|minutes?|days?)/i.test(response);
    const hasRationale = /(urgent|emergency).*?(due to|because)/i.test(response);

    return (hasUrgencyIndicator ? 0.4 : 0) +
           (hasTimeframe ? 0.3 : 0) +
           (hasRationale ? 0.3 : 0);
  }

  private checkGuidelineCompliance(response: string): number {
    // Implement guideline compliance checking
    return 0.8; // Placeholder
  }

  private extractSeverityLevel(response: string): number {
    const severityMatch = response.match(/severity:?\s*(\d+)/i);
    return severityMatch ? parseInt(severityMatch[1], 10) : 0;
  }

  private extractRecommendations(response: string): string[] {
    const recommendations: string[] = [];
    let inRecommendationsSection = false;

    response.split('\n').forEach(line => {
      if (line.match(/^recommendations?:/i)) {
        inRecommendationsSection = true;
      } else if (inRecommendationsSection && line.trim()) {
        recommendations.push(line.trim());
      }
    });

    return recommendations;
  }

  private hasUrgencyFlag(response: string): boolean {
    return /urgent|emergency|immediate attention required/i.test(response);
  }

  private followsGuidelines(response: string): boolean {
    return true; // Placeholder
  }

  private weightedAverage(current: number, new_value: number, count: number): number {
    return (current * count + new_value) / (count + 1);
  }

  private getEmptyMetrics(): MedicalMetrics {
    return {
      terminologyAccuracy: 0,
      diagnosticPrecision: 0,
      severityAssessment: 0,
      recommendationQuality: 0,
      urgencyDetection: 0,
      guidelineCompliance: 0,
      totalCases: 0
    };
  }

  private categorizeCase(response: string): { 
    category: string; 
    subcategories: string[]; 
    confidence: number;
  } {
    const terms = MedicalTerminology.extractTerms(response).values();
    const matches = new Map<string, number>();

    medicalCategories.forEach(category => {
      let score = 0;
      for (const term of terms) {
        if (category.keywords.includes(term)) score += 2;
        if (category.relatedConditions.includes(term)) score += 3;
        if (category.commonSymptoms.includes(term)) score += 1;
        if (category.urgencyIndicators.includes(term)) score += 4;
      }
      matches.set(category.id, score);
    });

    const [topCategory] = [...matches.entries()]
      .sort((a, b) => b[1] - a[1]);

    const subcategories = this.identifySubcategories(response, topCategory[0]);
    const confidence = topCategory[1] / (matches.size * 4); // Normalize confidence

    return {
      category: topCategory[0],
      subcategories,
      confidence
    };
  }

  private identifySubcategories(response: string, category: string): string[] {
    const categoryConfig = medicalCategories.find(c => c.id === category);
    if (!categoryConfig?.subcategories) return [];

    return categoryConfig.subcategories.filter(sub => {
      const subTerms = MedicalTerminology.extractTerms(sub);
      return [...subTerms].some(term => response.toLowerCase().includes(term));
    });
  }

  private validateGuidelineAdherence(
    response: string,
    category: string
  ): {
    followedGuidelines: string[];
    deviations: string[];
    justifications: string[];
  } {
    // This would be connected to a medical guidelines database
    // Placeholder implementation
    return {
      followedGuidelines: [],
      deviations: [],
      justifications: []
    };
  }

  async getCasesByCategory(category: string): Promise<CategorizedCase[]> {
    return this.caseHistory
      .filter(caseItem => this.categorizeCase(caseItem.response).category === category)
      .map(caseItem => ({
        ...caseItem,
        ...this.categorizeCase(caseItem.response),
        guidelineAdherence: this.validateGuidelineAdherence(
          caseItem.response,
          category
        )
      }));
  }

  async getCategoryDistribution(): Promise<Map<string, number>> {
    const distribution = new Map<string, number>();
    
    this.caseHistory.forEach(caseItem => {
      const { category } = this.categorizeCase(caseItem.response);
      distribution.set(
        category, 
        (distribution.get(category) || 0) + 1
      );
    });

    return distribution;
  }

  async getGuidelineComplianceByCategory(): Promise<Map<string, number>> {
    const compliance = new Map<string, number>();
    
    for (const category of medicalCategories) {
      const cases = await this.getCasesByCategory(category.id);
      const score = cases.reduce((acc, caseItem) => 
        acc + (caseItem.guidelineAdherence.deviations.length === 0 ? 1 : 0), 
        0
      ) / cases.length;
      
      compliance.set(category.id, score);
    }

    return compliance;
  }

  async analyzeSeverityTrends(
    timeframe: '24h' | '7d' | '30d' = '24h'
  ): Promise<Map<string, SeverityTrend>> {
    const trends = new Map<string, SeverityTrend>();
    const cutoff = this.getTimeframeCutoff(timeframe);

    for (const category of medicalCategories) {
      const categoryTrend = await this.calculateCategoryTrend(
        category.id,
        cutoff
      );
      trends.set(category.id, categoryTrend);
    }

    return trends;
  }

  private async calculateCategoryTrend(
    category: string,
    cutoff: Date
  ): Promise<SeverityTrend> {
    const relevantCases = this.caseHistory.filter(
      caseItem => 
        caseItem.timestamp >= cutoff && 
        this.categorizeCase(caseItem.response).category === category
    );

    const severityLevels = ['mild', 'moderate', 'severe', 'critical'];
    const distribution = new Map<string, number>();
    const providerScores = new Map<LLMProvider, number[]>();

    let escalations = 0;
    let deescalations = 0;
    let lastSeverity: number | null = null;

    relevantCases.forEach(caseItem => {
      const severity = caseItem.validations.severityLevel;
      const severityLabel = severityLevels[Math.min(severity - 1, 3)];

      // Update distribution
      distribution.set(
        severityLabel,
        (distribution.get(severityLabel) || 0) + 1
      );

      // Track provider scores
      if (!providerScores.has(caseItem.provider)) {
        providerScores.set(caseItem.provider, []);
      }
      providerScores.get(caseItem.provider).push(severity);

      // Track severity changes
      if (lastSeverity !== null) {
        if (severity > lastSeverity) escalations++;
        if (severity < lastSeverity) deescalations++;
      }
      lastSeverity = severity;
    });

    // Calculate provider averages
    const byProvider = new Map<LLMProvider, number>();
    providerScores.forEach((scores, provider) => {
      byProvider.set(provider, 
        scores.reduce((a, b) => a + b, 0) / scores.length
      );
    });

    // Calculate consistency score (0-1, higher is more consistent)
    const consistencyScore = this.calculateConsistencyScore(
      Array.from(providerScores.values()).flat()
    );

    return {
      category,
      timeframe: cutoff.toISOString(),
      trends: {
        overall: this.calculateOverallSeverity(relevantCases),
        byProvider,
        distribution
      },
      patterns: {
        escalations,
        deescalations,
        consistencyScore
      }
    };
  }

  private calculateOverallSeverity(cases: CaseMetrics[]): number {
    if (cases.length === 0) return 0;
    
    const weightedSum = cases.reduce((sum, caseItem) => {
      const recency = this.calculateRecencyWeight(caseItem.timestamp);
      return sum + (caseItem.validations.severityLevel * recency);
    }, 0);

    const weightSum = cases.reduce((sum, caseItem) => 
      sum + this.calculateRecencyWeight(caseItem.timestamp), 
      0
    );

    return weightedSum / weightSum;
  }

  private calculateRecencyWeight(timestamp: Date): number {
    const hoursAgo = (Date.now() - timestamp.getTime()) / (1000 * 60 * 60);
    return Math.exp(-hoursAgo / 24); // Exponential decay with 24-hour half-life
  }

  private calculateConsistencyScore(severities: number[]): number {
    if (severities.length <= 1) return 1;

    const mean = severities.reduce((a, b) => a + b, 0) / severities.length;
    const variance = severities.reduce(
      (sum, severity) => sum + Math.pow(severity - mean, 2),
      0
    ) / severities.length;

    return 1 / (1 + variance); // Normalize to 0-1 range
  }

  private getTimeframeCutoff(timeframe: '24h' | '7d' | '30d'): Date {
    const now = new Date();
    switch (timeframe) {
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  async analyzeDiagnosticConfidence(
    response: string,
    provider: LLMProvider
  ): Promise<DiagnosticConfidence> {
    const category = this.categorizeCase(response).category;
    const evidenceStrength = this.assessEvidenceStrength(response);
    const termPrecision = this.assessTerminologyPrecision(response);
    const differentialQuality = this.assessDifferentialDiagnosis(response);
    const contextRelevance = this.assessContextRelevance(response, category);

    const overall = (
      evidenceStrength * 0.3 +
      termPrecision * 0.25 +
      differentialQuality * 0.25 +
      contextRelevance * 0.2
    );

    return {
      overall,
      byCategory: await this.getConfidenceByCategory(response),
      byProvider: await this.getConfidenceByProvider(provider),
      factors: {
        evidenceStrength,
        termPrecision,
        differentialQuality,
        contextRelevance
      }
    };
  }

  private assessEvidenceStrength(response: string): number {
    const hasObjectiveFindings = /objective findings:|physical exam:|lab results:/i.test(response);
    const hasQuantitativeData = /\d+(\.\d+)?\s*(mg|mm?Hg|°[CF]|%)/g.test(response);
    const hasTemporalInfo = /((started|began|onset)\s+\d+|duration|timeline)/.test(response);
    const hasReferenceRanges = /(normal range|reference range|elevated|decreased)/.test(response);

    return [
      hasObjectiveFindings ? 0.3 : 0,
      hasQuantitativeData ? 0.3 : 0,
      hasTemporalInfo ? 0.2 : 0,
      hasReferenceRanges ? 0.2 : 0
    ].reduce((a, b) => a + b, 0);
  }

  private assessTerminologyPrecision(response: string): number {
    const terms = MedicalTerminology.extractTerms(response);
    const specificTerms = new Set([...terms].filter(term => 
      /^[a-z]+(?:itis|emia|oma|osis|pathy|plasty|ectomy|otomy)$/i.test(term)
    ));

    return Math.min(specificTerms.size / 3, 1); // Normalize to 0-1
  }

  private assessDifferentialDiagnosis(response: string): number {
    const hasDifferential = /differential diagnosis:|ddx:|considering:/i.test(response);
    const hasMultipleOptions = (response.match(/\b(versus|vs\.|or|possibly|likely|suspected)\b/g) || []).length;
    const hasRankingLanguage = /(most likely|less likely|unlikely|probable|possible)/i.test(response);
    const hasExclusions = /(ruled out|excluded|negative for|absence of)/i.test(response);

    return [
      hasDifferential ? 0.3 : 0,
      Math.min(hasMultipleOptions * 0.1, 0.3),
      hasRankingLanguage ? 0.2 : 0,
      hasExclusions ? 0.2 : 0
    ].reduce((a, b) => a + b, 0);
  }

  private assessContextRelevance(response: string, category: string): number {
    const categoryConfig = medicalCategories.find(c => c.id === category);
    if (!categoryConfig) return 0;

    const text = response.toLowerCase();
    const keywordMatches = categoryConfig.keywords.filter(k => text.includes(k)).length;
    const symptomMatches = categoryConfig.commonSymptoms.filter(s => text.includes(s)).length;
    const conditionMatches = categoryConfig.relatedConditions.filter(c => text.includes(c)).length;

    return (
      (keywordMatches / categoryConfig.keywords.length * 0.4) +
      (symptomMatches / categoryConfig.commonSymptoms.length * 0.3) +
      (conditionMatches / categoryConfig.relatedConditions.length * 0.3)
    );
  }

  private async getConfidenceByCategory(response: string): Promise<Map<string, number>> {
    const confidences = new Map<string, number>();
    const terms = MedicalTerminology.extractTerms(response);

    medicalCategories.forEach(category => {
      const relevantTerms = new Set([
        ...category.keywords,
        ...category.commonSymptoms,
        ...category.relatedConditions
      ]);
      const overlap = [...terms].filter(term => relevantTerms.has(term)).length;
      confidences.set(category.id, overlap / relevantTerms.size);
    });

    return confidences;
  }

  private async getConfidenceByProvider(provider: LLMProvider): Promise<Map<LLMProvider, number>> {
    const providerConfidences = new Map<LLMProvider, number>();
    const recentCases = this.caseHistory
      .filter(caseItem => caseItem.provider === provider)
      .slice(-10); // Last 10 cases

    if (recentCases.length > 0) {
      const avgConfidence = recentCases.reduce(
        (sum, caseItem) => sum + caseItem.metrics.diagnosticPrecision,
        0
      ) / recentCases.length;
      providerConfidences.set(provider, avgConfidence);
    }

    return providerConfidences;
  }

  async analyzeConfidence(
    response: string,
    provider: LLMProvider
  ): Promise<ConfidenceAnalysis> {
    const confidence = await this.analyzeDiagnosticConfidence(response, provider);
    const category = this.categorizeCase(response).category;
    const thresholds = this.getThresholdsForCategory(category);

    const factors = this.analyzeConfidenceFactors(confidence, thresholds);
    const level = this.determineConfidenceLevel(confidence.overall, thresholds);
    const recommendations = this.generateConfidenceRecommendations(factors);

    return {
      score: confidence.overall,
      level,
      factors,
      recommendations
    };
  }

  private getThresholdsForCategory(category: string): {
    minimum: number;
    warning: number;
    optimal: number;
  } {
    return this.confidenceThresholds.categorySpecific.get(category) || {
      minimum: this.confidenceThresholds.minimum,
      warning: this.confidenceThresholds.warning,
      optimal: this.confidenceThresholds.optimal
    };
  }

  private analyzeConfidenceFactors(
    confidence: DiagnosticConfidence,
    thresholds: { minimum: number; warning: number; optimal: number; }
  ): { name: string; score: number; threshold: number; status: 'below' | 'meets' | 'exceeds'; }[] {
    return [
      {
        name: 'Evidence Strength',
        score: confidence.factors.evidenceStrength,
        threshold: thresholds.warning,
        status: this.getThresholdStatus(confidence.factors.evidenceStrength, thresholds)
      },
      {
        name: 'Terminology Precision',
        score: confidence.factors.termPrecision,
        threshold: thresholds.warning,
        status: this.getThresholdStatus(confidence.factors.termPrecision, thresholds)
      },
      {
        name: 'Differential Quality',
        score: confidence.factors.differentialQuality,
        threshold: thresholds.warning,
        status: this.getThresholdStatus(confidence.factors.differentialQuality, thresholds)
      },
      {
        name: 'Context Relevance',
        score: confidence.factors.contextRelevance,
        threshold: thresholds.warning,
        status: this.getThresholdStatus(confidence.factors.contextRelevance, thresholds)
      }
    ];
  }

  private determineConfidenceLevel(
    score: number,
    thresholds: { minimum: number; warning: number; optimal: number; }
  ): 'low' | 'moderate' | 'high' {
    if (score < thresholds.minimum) return 'low';
    if (score < thresholds.warning) return 'moderate';
    return 'high';
  }

  private getThresholdStatus(
    score: number,
    thresholds: { minimum: number; warning: number; optimal: number; }
  ): 'below' | 'meets' | 'exceeds' {
    if (score < thresholds.minimum) return 'below';
    if (score >= thresholds.optimal) return 'exceeds';
    return 'meets';
  }

  private generateConfidenceRecommendations(
    factors: { name: string; score: number; threshold: number; status: string; }[]
  ): string[] {
    const recommendations: string[] = [];

    factors.forEach(factor => {
      if (factor.status === 'below') {
        switch (factor.name) {
          case 'Evidence Strength':
            recommendations.push('Include more objective findings and quantitative data');
            break;
          case 'Terminology Precision':
            recommendations.push('Use more specific medical terminology');
            break;
          case 'Differential Quality':
            recommendations.push('Provide more detailed differential diagnosis');
            break;
          case 'Context Relevance':
            recommendations.push('Improve alignment with medical context');
            break;
        }
      }
    });

    return recommendations;
  }

  async trackConfidenceTrend(
    timeframe: '24h' | '7d' | '30d' = '24h'
  ): Promise<ConfidenceTrend> {
    const cutoff = this.getTimeframeCutoff(timeframe);
    const dataPoints = await this.getConfidenceDataPoints(cutoff);
    
    const overall = this.calculateAverageConfidence(dataPoints);
    const byCategory = this.aggregateConfidenceByCategory(dataPoints);
    const byProvider = this.aggregateConfidenceByProvider(dataPoints);
    const progression = this.analyzeConfidenceProgression(dataPoints);

    return {
      timeframe,
      overall,
      byCategory,
      byProvider,
      progression
    };
  }

  private async getConfidenceDataPoints(cutoff: Date): Promise<ConfidenceDataPoint[]> {
    return this.caseHistory
      .filter(caseItem => caseItem.timestamp >= cutoff)
      .map(caseItem => ({
        timestamp: caseItem.timestamp,
        score: caseItem.metrics.diagnosticPrecision,
        category: this.categorizeCase(caseItem.response).category,
        provider: caseItem.provider
      }));
  }

  private calculateAverageConfidence(dataPoints: ConfidenceDataPoint[]): number {
    if (dataPoints.length === 0) return 0;
    return dataPoints.reduce((sum, point) => sum + point.score, 0) / dataPoints.length;
  }

  private aggregateConfidenceByCategory(
    dataPoints: ConfidenceDataPoint[]
  ): Map<string, number> {
    const byCategory = new Map<string, { sum: number; count: number }>();

    dataPoints.forEach(point => {
      if (!byCategory.has(point.category)) {
        byCategory.set(point.category, { sum: 0, count: 0 });
      }
      const current = byCategory.get(point.category);
      current.sum += point.score;
      current.count++;
    });

    return new Map(
      Array.from(byCategory.entries()).map(([category, { sum, count }]) => [
        category,
        sum / count
      ])
    );
  }

  private aggregateConfidenceByProvider(
    dataPoints: ConfidenceDataPoint[]
  ): Map<LLMProvider, number> {
    const byProvider = new Map<LLMProvider, { sum: number; count: number }>();

    dataPoints.forEach(point => {
      if (!byProvider.has(point.provider)) {
        byProvider.set(point.provider, { sum: 0, count: 0 });
      }
      const current = byProvider.get(point.provider);
      current.sum += point.score;
      current.count++;
    });

    return new Map(
      Array.from(byProvider.entries()).map(([provider, { sum, count }]) => [
        provider,
        sum / count
      ])
    );
  }

  private analyzeConfidenceProgression(
    dataPoints: ConfidenceDataPoint[]
  ): { trend: 'improving' | 'stable' | 'declining'; rate: number; volatility: number; } {
    if (dataPoints.length < 2) {
      return { trend: 'stable', rate: 0, volatility: 0 };
    }

    // Sort by timestamp
    const sorted = [...dataPoints].sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    );

    // Calculate linear regression
    const xValues = sorted.map(p => p.timestamp.getTime());
    const yValues = sorted.map(p => p.score);
    const slope = this.calculateSlope(xValues, yValues);

    // Calculate volatility (standard deviation)
    const volatility = this.calculateVolatility(yValues);

    return {
      trend: slope > 0.001 ? 'improving' : slope < -0.001 ? 'declining' : 'stable',
      rate: slope,
      volatility
    };
  }

  private calculateSlope(x: number[], y: number[]): number {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  private calculateVolatility(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
  }

  async detectConfidenceAnomalies(
    timeframe: '24h' | '7d' | '30d' = '24h'
  ): Promise<AnomalyDetection> {
    const cutoff = this.getTimeframeCutoff(timeframe);
    const dataPoints = await this.getConfidenceDataPoints(cutoff);
    const anomalies = [];

    // Calculate baseline metrics
    const baselineByCategory = this.calculateBaselineMetrics(dataPoints);
    const stdDevByCategory = this.calculateStandardDeviations(dataPoints);

    // Detect anomalies
    for (const point of dataPoints) {
      const baseline = baselineByCategory.get(point.category) || 0;
      const stdDev = stdDevByCategory.get(point.category) || 0;
      const deviation = Math.abs(point.score - baseline) / stdDev;

      if (deviation > 2) { // More than 2 standard deviations
        anomalies.push({
          timestamp: point.timestamp,
          provider: point.provider,
          category: point.category,
          expectedScore: baseline,
          actualScore: point.score,
          deviation,
          severity: this.getAnomalySeverity(deviation)
        });
      }
    }

    return {
      anomalies,
      patterns: this.analyzeAnomalyPatterns(anomalies)
    };
  }

  private calculateBaselineMetrics(
    dataPoints: ConfidenceDataPoint[]
  ): Map<string, number> {
    const byCategory = new Map<string, number[]>();
    
    dataPoints.forEach(point => {
      if (!byCategory.has(point.category)) {
        byCategory.set(point.category, []);
      }
      byCategory.get(point.category).push(point.score);
    });

    return new Map(
      Array.from(byCategory.entries()).map(([category, scores]) => [
        category,
        scores.reduce((a, b) => a + b, 0) / scores.length
      ])
    );
  }

  private calculateStandardDeviations(
    dataPoints: ConfidenceDataPoint[]
  ): Map<string, number> {
    const byCategory = new Map<string, number[]>();
    
    dataPoints.forEach(point => {
      if (!byCategory.has(point.category)) {
        byCategory.set(point.category, []);
      }
      byCategory.get(point.category).push(point.score);
    });

    return new Map(
      Array.from(byCategory.entries()).map(([category, scores]) => [
        category,
        this.calculateVolatility(scores)
      ])
    );
  }

  private getAnomalySeverity(deviation: number): 'minor' | 'moderate' | 'severe' {
    if (deviation > 4) return 'severe';
    if (deviation > 3) return 'moderate';
    return 'minor';
  }

  private analyzeAnomalyPatterns(
    anomalies: any[]
  ): {
    frequentCategories: Map<string, number>;
    providerImpact: Map<LLMProvider, number>;
    timeDistribution: Map<string, number>;
  } {
    const frequentCategories = new Map<string, number>();
    const providerImpact = new Map<LLMProvider, number>();
    const timeDistribution = new Map<string, number>();

    anomalies.forEach(anomaly => {
      frequentCategories.set(
        anomaly.category,
        (frequentCategories.get(anomaly.category) || 0) + 1
      );
      providerImpact.set(
        anomaly.provider,
        (providerImpact.get(anomaly.provider) || 0) + anomaly.deviation
      );
      const hour = new Date(anomaly.timestamp).getHours();
      timeDistribution.set(
        `${hour}:00`,
        (timeDistribution.get(`${hour}:00`) || 0) + 1
      );
    });

    return {
      frequentCategories,
      providerImpact,
      timeDistribution
    };
  }

  async rankProviders(timeframe: '24h' | '7d' | '30d' = '7d'): Promise<ProviderRanking> {
    const cutoff = this.getTimeframeCutoff(timeframe);
    const dataPoints = await this.getConfidenceDataPoints(cutoff);
    
    const overallScores = this.calculateOverallScores(dataPoints);
    const categoryScores = this.calculateCategoryScores(dataPoints);
    const trends = this.calculateProviderTrends(dataPoints);

    // Create rankings
    const overall = new Map(
      Array.from(overallScores.entries())
        .sort((a, b) => b[1].score - a[1].score)
        .map((entry, index) => [
          entry[0],
          { ...entry[1], rank: index + 1 }
        ])
    );

    return {
      overall,
      byCategory: categoryScores,
      trends
    };
  }

  private calculateOverallScores(
    dataPoints: ConfidenceDataPoint[]
  ): Map<LLMProvider, {
    score: number;
    specialties: string[];
    reliability: number;
  }> {
    const scores = new Map<LLMProvider, {
      totalScore: number;
      count: number;
      categories: Set<string>;
      deviations: number[];
    }>();

    dataPoints.forEach(point => {
      if (!scores.has(point.provider)) {
        scores.set(point.provider, {
          totalScore: 0,
          count: 0,
          categories: new Set(),
          deviations: []
        });
      }

      const providerStats = scores.get(point.provider);
      providerStats.totalScore += point.score;
      providerStats.count++;
      providerStats.categories.add(point.category);
      providerStats.deviations.push(point.score);
    });

    return new Map(
      Array.from(scores.entries()).map(([provider, stats]) => [
        provider,
        {
          score: stats.totalScore / stats.count,
          specialties: Array.from(stats.categories),
          reliability: 1 - this.calculateVolatility(stats.deviations)
        }
      ])
    );
  }

  private calculateCategoryScores(
    dataPoints: ConfidenceDataPoint[]
  ): Map<string, Map<LLMProvider, number>> {
    const scores = new Map<string, Map<LLMProvider, { sum: number; count: number }>>();

    dataPoints.forEach(point => {
      if (!scores.has(point.category)) {
        scores.set(point.category, new Map());
      }
      const categoryMap = scores.get(point.category);
      
      if (!categoryMap.has(point.provider)) {
        categoryMap.set(point.provider, { sum: 0, count: 0 });
      }
      const stats = categoryMap.get(point.provider);
      stats.sum += point.score;
      stats.count++;
    });

    return new Map(
      Array.from(scores.entries()).map(([category, providerMap]) => [
        category,
        new Map(
          Array.from(providerMap.entries()).map(([provider, stats]) => [
            provider,
            stats.sum / stats.count
          ])
        )
      ])
    );
  }

  private calculateProviderTrends(
    dataPoints: ConfidenceDataPoint[]
  ): Map<LLMProvider, {
    improvement: number;
    consistency: number;
    adaptability: number;
  }> {
    const trends = new Map<LLMProvider, {
      improvement: number;
      consistency: number;
      adaptability: number;
    }>();

    const providerPoints = new Map<LLMProvider, ConfidenceDataPoint[]>();
    dataPoints.forEach(point => {
      if (!providerPoints.has(point.provider)) {
        providerPoints.set(point.provider, []);
      }
      providerPoints.get(point.provider).push(point);
    });

    providerPoints.forEach((points, provider) => {
      const improvement = this.calculateImprovement(points);
      const consistency = this.calculateConsistency(points);
      const adaptability = this.calculateAdaptability(points);

      trends.set(provider, { improvement, consistency, adaptability });
    });

    return trends;
  }

  async benchmarkPerformance(
    provider: LLMProvider,
    timeframe: '24h' | '7d' | '30d' = '7d'
  ): Promise<PerformanceBenchmark> {
    const cutoff = this.getTimeframeCutoff(timeframe);
    const providerMetrics = await this.getProviderMetrics(provider, cutoff);
    const industryMetrics = await this.getIndustryMetrics(cutoff);

    const score = this.calculateBenchmarkScore(providerMetrics);
    const percentile = this.calculatePercentile(score, industryMetrics);

    return {
      overall: {
        score,
        percentile,
        ranking: this.determineRanking(percentile)
      },
      metrics: {
        accuracy: providerMetrics.diagnosticPrecision,
        speed: providerMetrics.responseTime || 0,
        consistency: providerMetrics.reliability || 0,
        coverage: providerMetrics.categoryCoverage || 0
      },
      comparisons: {
        industryAverage: industryMetrics.average,
        topPerformer: industryMetrics.topScore,
        similarProviders: industryMetrics.similarScores
      }
    };
  }

  async analyzeSpecialization(
    provider: LLMProvider,
    timeframe: '24h' | '7d' | '30d' = '7d'
  ): Promise<ProviderSpecialization> {
    const cutoff = this.getTimeframeCutoff(timeframe);
    const cases = this.caseHistory.filter(
      caseItem => caseItem.timestamp >= cutoff && caseItem.provider === provider
    );

    const categoryPerformance = this.analyzeCategoryPerformance(cases);
    const adaptabilityScores = this.calculateAdaptabilityScores(cases);
    const recommendations = this.generateSpecializationRecommendations(
      categoryPerformance,
      adaptabilityScores
    );

    return {
      primarySpecialties: this.identifyPrimarySpecialties(categoryPerformance),
      crossDomainCapabilities: this.assessCrossDomainCapabilities(adaptabilityScores),
      recommendations
    };
  }

  private analyzeCategoryPerformance(cases: CaseMetrics[]): Map<string, {
    confidence: number;
    performance: number;
    caseCount: number;
  }> {
    const performance = new Map();

    medicalCategories.forEach(category => {
      const categoryCases = cases.filter(
        caseItem => this.categorizeCase(caseItem.response).category === category.id
      );

      if (categoryCases.length > 0) {
        performance.set(category.id, {
          confidence: this.calculateCategoryConfidence(categoryCases),
          performance: this.calculateCategoryPerformance(categoryCases),
          caseCount: categoryCases.length
        });
      }
    });

    return performance;
  }

  private calculateAdaptabilityScores(cases: CaseMetrics[]): Map<string, {
    adaptabilityScore: number;
    successRate: number;
  }> {
    const scores = new Map();

    medicalCategories.forEach(category => {
      const categoryCases = cases.filter(
        caseItem => this.categorizeCase(caseItem.response).category === category.id
      );

      if (categoryCases.length > 0) {
        scores.set(category.id, {
          adaptabilityScore: this.calculateCategoryAdaptability(categoryCases),
          successRate: this.calculateSuccessRate(categoryCases)
        });
      }
    });

    return scores;
  }

  private identifyPrimarySpecialties(
    performance: Map<string, { confidence: number; performance: number; caseCount: number; }>
  ): { category: string; confidence: number; performance: number; caseCount: number; }[] {
    return Array.from(performance.entries())
      .map(([category, metrics]) => ({
        category,
        ...metrics
      }))
      .sort((a, b) => {
        // Weight by performance (50%), confidence (30%), and case count (20%)
        const scoreA = (a.performance * 0.5) + (a.confidence * 0.3) + 
          (Math.min(a.caseCount / 100, 1) * 0.2);
        const scoreB = (b.performance * 0.5) + (b.confidence * 0.3) + 
          (Math.min(b.caseCount / 100, 1) * 0.2);
        return scoreB - scoreA;
      })
      .slice(0, 3); // Top 3 specialties
  }

  private assessCrossDomainCapabilities(
    scores: Map<string, { adaptabilityScore: number; successRate: number; }>
  ): { category: string; adaptabilityScore: number; successRate: number; }[] {
    return Array.from(scores.entries())
      .map(([category, metrics]) => ({
        category,
        ...metrics
      }))
      .sort((a, b) => b.adaptabilityScore - a.adaptabilityScore);
  }

  private generateSpecializationRecommendations(
    performance: Map<string, any>,
    adaptability: Map<string, any>
  ): {
    focusAreas: string[];
    suggestedCategories: string[];
    improvementMetrics: Map<string, number>;
  } {
    const focusAreas = this.identifyFocusAreas(performance);
    const suggestedCategories = this.suggestNewCategories(performance, adaptability);
    const improvementMetrics = this.calculateImprovementMetrics(performance);

    return {
      focusAreas,
      suggestedCategories,
      improvementMetrics
    };
  }

  private identifyFocusAreas(performance: Map<string, any>): string[] {
    return Array.from(performance.entries())
      .filter(([_, metrics]) => metrics.performance < 0.7 && metrics.caseCount > 10)
      .map(([category]) => category);
  }

  private suggestNewCategories(
    performance: Map<string, any>,
    adaptability: Map<string, any>
  ): string[] {
    const currentCategories = new Set(performance.keys());
    
    return medicalCategories
      .filter(category => !currentCategories.has(category.id))
      .map(category => ({
        category: category.id,
        score: this.calculateCategorySuitability(category, performance, adaptability)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(suggestion => suggestion.category);
  }

  private calculateCategorySuitability(
    category: any,
    performance: Map<string, any>,
    adaptability: Map<string, any>
  ): number {
    // Implementation depends on your specific criteria
    return 0.8; // Placeholder
  }

  private calculateCategoryConfidence(cases: CaseMetrics[]): number {
    return cases.reduce((sum, caseItem) => sum + caseItem.metrics.diagnosticPrecision, 0) / cases.length;
  }

  private calculateCategoryPerformance(cases: CaseMetrics[]): number {
    return cases.reduce((sum, caseItem) => sum + caseItem.metrics.guidelineCompliance, 0) / cases.length;
  }

  private calculateCategoryAdaptability(cases: CaseMetrics[]): number {
    const uniqueConditions = new Set(cases.map(caseItem => this.extractCondition(caseItem.response)));
    return Math.min(uniqueConditions.size / 10, 1); // Normalize to 0-1
  }

  private calculateSuccessRate(cases: CaseMetrics[]): number {
    const successful = cases.filter(caseItem => caseItem.metrics.diagnosticPrecision > 0.7).length;
    return successful / cases.length;
  }

  private calculateImprovement(points: ConfidenceDataPoint[]): number {
    if (points.length < 2) return 0;
    const sorted = [...points].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    return (sorted[sorted.length - 1].score - sorted[0].score) / sorted[0].score;
  }

  private calculateConsistency(points: ConfidenceDataPoint[]): number {
    return 1 - this.calculateVolatility(points.map(p => p.score));
  }

  private calculateAdaptability(points: ConfidenceDataPoint[]): number {
    const categoryChanges = points.reduce((changes, point, i) => {
      if (i === 0) return changes;
      return changes + (point.category !== points[i - 1].category ? 1 : 0);
    }, 0);
    return Math.min(categoryChanges / points.length, 1);
  }

  private async getProviderMetrics(
    provider: LLMProvider,
    cutoff: Date
  ): Promise<{
    diagnosticPrecision: number;
    responseTime?: number;
    reliability?: number;
    categoryCoverage?: number;
  }> {
    const cases = this.caseHistory.filter(
      caseItem => caseItem.provider === provider && caseItem.timestamp >= cutoff
    );

    return {
      diagnosticPrecision: this.calculateAverageMetric(cases, 'diagnosticPrecision'),
      responseTime: 0, // Implement actual response time calculation
      reliability: this.calculateReliability(cases),
      categoryCoverage: this.calculateCategoryCoverage(cases)
    };
  }

  private async getIndustryMetrics(cutoff: Date): Promise<{
    average: number;
    topScore: number;
    similarScores: number[];
  }> {
    const allCases = this.caseHistory.filter(caseItem => caseItem.timestamp >= cutoff);
    const scores = allCases.map(caseItem => caseItem.metrics.diagnosticPrecision);

    return {
      average: scores.reduce((a, b) => a + b, 0) / scores.length,
      topScore: Math.max(...scores),
      similarScores: scores.filter(s => s > 0.8) // Example threshold
    };
  }

  private calculateBenchmarkScore(metrics: any): number {
    return metrics.diagnosticPrecision || 0;
  }

  private calculatePercentile(score: number, industryMetrics: any): number {
    const allScores = [...industryMetrics.similarScores, score].sort((a, b) => a - b);
    const index = allScores.indexOf(score);
    return (index / allScores.length) * 100;
  }

  private determineRanking(
    percentile: number
  ): 'top' | 'above_average' | 'average' | 'below_average' {
    if (percentile >= 90) return 'top';
    if (percentile >= 75) return 'above_average';
    if (percentile >= 40) return 'average';
    return 'below_average';
  }

  private calculateReliability(cases: CaseMetrics[]): number {
    return 1 - this.calculateVolatility(cases.map(caseItem => caseItem.metrics.diagnosticPrecision));
  }

  private calculateCategoryCoverage(cases: CaseMetrics[]): number {
    const coveredCategories = new Set(
      cases.map(caseItem => this.categorizeCase(caseItem.response).category)
    );
    return coveredCategories.size / medicalCategories.length;
  }

  private calculateAverageMetric(cases: CaseMetrics[], metric: keyof MedicalMetrics): number {
    if (cases.length === 0) return 0;
    return cases.reduce((sum, caseItem) => sum + caseItem.metrics[metric], 0) / cases.length;
  }

  private extractCondition(response: string): string {
    const match = response.match(/diagnosis:?\s*([^\n.]+)/i);
    return match ? match[1].trim() : '';
  }

  private calculateImprovementMetrics(
    performance: Map<string, any>
  ): Map<string, number> {
    const metrics = new Map<string, number>();
    performance.forEach((value, category) => {
      metrics.set(category, 1 - value.performance);
    });
    return metrics;
  }
} 