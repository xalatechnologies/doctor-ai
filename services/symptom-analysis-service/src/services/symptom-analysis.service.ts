import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AnalyzeSymptomDto } from '@dto/analyze-symptom.dto';
import { GetSymptomSuggestionsDto } from '@dto/get-symptom-suggestions.dto';
import { AdaptiveQuestionnaireInput } from '@dto/adaptive-questionnaire.dto';
import { SymptomTimelineInput } from '@dto/symptom-timeline.dto';
import { SymptomAnalysisInput } from '@dto/symptom-analysis-input.dto';
import { RabbitMQService } from '@rabbitmq/rabbitmq.service';
import { SymptomAnalysis, EmergencyAnalysis } from '@interfaces/symptom.interface';
import { SymptomSuggestionResponse } from '@interfaces/symptom-suggestion.interface';
import { AdaptiveQuestionnaireResponse, QuestionType } from '@interfaces/adaptive-questionnaire.interface';
import { SymptomTimelineResponse } from '@interfaces/symptom-timeline.interface';
import { SymptomHistoryResponse } from '@interfaces/symptom-history.interface';
import { 
  MultiLLMAnalysisResponse, 
  LLMAnalysis, 
  PossibleCondition,
  RiskFactor,
  TreatmentRecommendation,
  ConfidenceLevel,
  UrgencyLevel 
} from '@interfaces/multi-llm-analysis.interface';

type EmergencyAssessmentData = {
  assessment: {
    category: 'CARDIAC' | 'RESPIRATORY' | 'NEUROLOGICAL' | string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    immediateActions: string[];
  };
  patientData: {
    medications?: string[];
  };
};

@Injectable()
export class SymptomAnalysisService {
  private readonly logger = new Logger(SymptomAnalysisService.name);
  private readonly commonSymptoms = new Map<string, { category: string; description: string; commonlyAssociated: string[] }>([
    ['headache', { 
      category: 'Neurological',
      description: 'Pain in the head or upper neck',
      commonlyAssociated: ['nausea', 'sensitivity to light', 'dizziness']
    }],
    ['chest pain', {
      category: 'Cardiovascular',
      description: 'Discomfort or pain in the chest area',
      commonlyAssociated: ['shortness of breath', 'sweating', 'nausea']
    }],
    ['shortness of breath', {
      category: 'Respiratory',
      description: 'Difficulty breathing or catching breath',
      commonlyAssociated: ['chest pain', 'coughing', 'wheezing']
    }],
    // Add more common symptoms as needed
  ]);

  private readonly questionnaireTemplates = new Map<string, { questions: any[]; estimatedTime: number }>([
    ['headache', {
      questions: [
        {
          id: 'Q1',
          text: 'Is the headache localized to one side?',
          type: QuestionType.SINGLE_CHOICE,
          options: [
            { id: 'Q1-A', text: 'Yes, one side only' },
            { id: 'Q1-B', text: 'No, both sides' },
            { id: 'Q1-C', text: 'It varies' }
          ],
          required: true
        },
        {
          id: 'Q2',
          text: 'Rate the intensity of light sensitivity',
          type: QuestionType.SCALE,
          context: '0 means no sensitivity, 10 means extreme sensitivity',
          required: true
        }
      ],
      estimatedTime: 3
    }],
    ['chest pain', {
      questions: [
        {
          id: 'Q1',
          text: 'Does the pain radiate to other areas?',
          type: QuestionType.MULTIPLE_CHOICE,
          options: [
            { id: 'Q1-A', text: 'Left arm' },
            { id: 'Q1-B', text: 'Right arm' },
            { id: 'Q1-C', text: 'Back' },
            { id: 'Q1-D', text: 'Jaw' },
            { id: 'Q1-E', text: 'No radiation' }
          ],
          required: true
        },
        {
          id: 'Q2',
          text: 'Is the pain worse with physical activity?',
          type: QuestionType.SINGLE_CHOICE,
          options: [
            { id: 'Q2-A', text: 'Yes' },
            { id: 'Q2-B', text: 'No' },
            { id: 'Q2-C', text: 'Not sure' }
          ],
          required: true
        }
      ],
      estimatedTime: 4
    }]
  ]);

  private readonly timelineData = new Map<string, {
    events: any[];
    firstRecorded: Date;
    symptomName: string;
  }>();

  private readonly userSymptoms = new Map<string, Set<string>>();

  constructor(private readonly rabbitMQService: RabbitMQService) {}

  async analyzeSymptom(data: AnalyzeSymptomDto): Promise<SymptomAnalysis> {
    try {
      this.logger.log(`Analyzing symptoms for: ${data.description}`);

      const analysis = await this.performSymptomAnalysis(data);

      try {
        await this.rabbitMQService.publishEmergencyAssessment('symptom.analyzed', {
          analysis,
          originalData: data,
        });
      } catch (error) {
        this.logger.error(`Failed to publish analysis result: ${error.message}`);
        // Continue execution as the analysis is still valid
      }

      return analysis;
    } catch (error) {
      this.logger.error(`Error in symptom analysis: ${error.message}`);
      throw error;
    }
  }

  async handleEmergencyAssessment(data: EmergencyAssessmentData): Promise<void> {
    try {
      this.logger.log('Received emergency assessment for further analysis');

      const detailedAnalysis = await this.analyzeEmergencyCase(data);

      await this.rabbitMQService.publishEmergencyAssessment('symptom.emergency.analyzed', {
        emergencyData: data,
        detailedAnalysis,
      });
    } catch (error) {
      this.logger.error(`Error handling emergency assessment: ${error.message}`);
      throw error;
    }
  }

  private async performSymptomAnalysis(data: AnalyzeSymptomDto): Promise<SymptomAnalysis> {
    const symptomId = this.generateSymptomId();
    const severity = this.calculateSeverity(data);
    const possibleConditions = this.analyzePossibleConditions(data);
    const recommendations = this.generateRecommendations(data, severity, possibleConditions);
    const urgencyLevel = this.determineUrgencyLevel(severity.level, data);
    const requiredSpecialties = this.determineRequiredSpecialties(data, possibleConditions);

    return {
      symptomId,
      primarySymptom: data.primarySymptom,
      secondarySymptoms: data.secondarySymptoms || [],
      severity,
      possibleConditions,
      recommendations,
      urgencyLevel,
      requiredSpecialties,
      followUpActions: this.determineFollowUpActions(urgencyLevel, requiredSpecialties),
      timestamp: new Date().toISOString(),
    };
  }

  private generateSymptomId(): string {
    return `SYM-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private calculateSeverity(data: AnalyzeSymptomDto): { level: number; description: string } {
    let severityScore = Math.max(data.severityLevel, data.painLevel);

    // Adjust score based on chronicity
    if (this.isChronicDuration(data.duration)) {
      severityScore = Math.min(severityScore + 2, 10);
    }

    // Adjust severity based on secondary symptoms
    if (data.secondarySymptoms && data.secondarySymptoms.length > 0) {
      severityScore = Math.min(severityScore + 1, 10);
    }

    return {
      level: severityScore,
      description: this.getSeverityDescription(severityScore),
    };
  }

  private isChronicDuration(duration: string): boolean {
    const chronicKeywords = ['chronic', 'weeks', 'months', 'years', 'persistent'];
    return chronicKeywords.some(keyword => duration.toLowerCase().includes(keyword));
  }

  private getSeverityDescription(level: number): string {
    if (level >= 8) return 'Severe';
    if (level >= 6) return 'Moderate';
    return 'Mild';
  }

  private analyzePossibleConditions(data: AnalyzeSymptomDto): string[] {
    const conditions: string[] = [];

    // Add primary condition
    conditions.push(`Possible ${data.primarySymptom} related condition`);

    // Add conditions based on secondary symptoms
    if (data.secondarySymptoms && data.secondarySymptoms.length > 0) {
      conditions.push(...data.secondarySymptoms.map(symptom => `Condition related to ${symptom}`));
    }

    // Consider patient history
    if (data.patientHistory) {
      conditions.push(`Condition influenced by ${data.patientHistory}`);
    }

    return conditions;
  }

  private generateRecommendations(
    data: AnalyzeSymptomDto,
    severity: { level: number; description: string },
    conditions: string[],
  ): string[] {
    const recommendations: string[] = [];

    // Add severity-based recommendations
    recommendations.push(this.getSeverityBasedRecommendation(severity.level));

    // Add alleviating factors recommendations
    if (data.alleviatingFactors && data.alleviatingFactors.length > 0) {
      recommendations.push(
        ...data.alleviatingFactors.map(
          factor => `Continue with ${factor} as it helps alleviate symptoms`,
        ),
      );
    }

    // Add medication recommendations
    if (data.currentMedications && data.currentMedications.length > 0) {
      recommendations.push(
        'Continue prescribed medications as directed',
        'Keep a record of medication effectiveness',
      );
    }

    return recommendations;
  }

  private getSeverityBasedRecommendation(severityLevel: number): string {
    if (severityLevel >= 8) return 'Seek immediate medical attention';
    if (severityLevel >= 5) return 'Schedule an appointment with a healthcare provider';
    return 'Monitor symptoms and maintain a symptom diary';
  }

  private determineUrgencyLevel(severityLevel: number, data: AnalyzeSymptomDto): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (severityLevel >= 8) return 'HIGH';
    if (severityLevel >= 6) return 'MEDIUM';
    return 'LOW';
  }

  private determineRequiredSpecialties(data: AnalyzeSymptomDto, conditions: string[]): string[] {
    const specialties = new Set<string>(['General Practice']);

    // Add specialties based on symptoms
    const specialtyMap: Record<string, string[]> = {
      'chest pain': ['Cardiology'],
      'shortness of breath': ['Pulmonology'],
      'headache': ['Neurology'],
      'joint pain': ['Rheumatology'],
      'skin': ['Dermatology'],
    };

    // Check primary symptom
    Object.entries(specialtyMap).forEach(([symptom, relatedSpecialties]) => {
      if (data.primarySymptom.toLowerCase().includes(symptom)) {
        relatedSpecialties.forEach(specialty => specialties.add(specialty));
      }
    });

    // Check secondary symptoms
    data.secondarySymptoms?.forEach(symptom => {
      Object.entries(specialtyMap).forEach(([key, relatedSpecialties]) => {
        if (symptom.toLowerCase().includes(key)) {
          relatedSpecialties.forEach(specialty => specialties.add(specialty));
        }
      });
    });

    return Array.from(specialties);
  }

  private determineFollowUpActions(
    urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH',
    specialties: string[],
  ): string[] {
    const actions: string[] = [];

    switch (urgencyLevel) {
      case 'HIGH':
        actions.push(
          'Immediate medical evaluation required',
          'Consider emergency services if symptoms worsen',
        );
        break;
      case 'MEDIUM':
        actions.push(
          'Schedule medical appointment within 48 hours',
          'Monitor symptoms closely',
        );
        break;
      case 'LOW':
        actions.push(
          'Schedule routine follow-up if symptoms persist',
          'Implement recommended lifestyle changes',
        );
        break;
    }

    // Add specialty-specific actions
    specialties.forEach(specialty => {
      if (specialty !== 'General Practice') {
        actions.push(`Schedule consultation with ${specialty}`);
      }
    });

    return actions;
  }

  private async analyzeEmergencyCase(data: EmergencyAssessmentData): Promise<EmergencyAnalysis> {
    return {
      timestamp: new Date().toISOString(),
      emergencyCategory: data.assessment.category,
      detailedRecommendations: this.generateDetailedRecommendations(data),
      specialistReferrals: this.determineSpecialistReferrals(data),
      followUpPlan: this.createFollowUpPlan(data),
    };
  }

  private generateDetailedRecommendations(data: EmergencyAssessmentData): string[] {
    const recommendations: string[] = [];

    // Add severity-based recommendations
    if (data.assessment.severity === 'HIGH') {
      recommendations.push(
        'Continue monitoring vital signs',
        'Prepare detailed medical history for emergency team',
      );
    }

    // Add medication-specific recommendations
    if (data.patientData.medications && data.patientData.medications.length > 0) {
      recommendations.push(
        'Provide complete medication list to healthcare providers',
        'Note any recent changes in medication',
      );
    }

    return recommendations;
  }

  private determineSpecialistReferrals(data: EmergencyAssessmentData): string[] {
    const specialistMap: Record<string, string> = {
      CARDIAC: 'Cardiologist',
      RESPIRATORY: 'Pulmonologist',
      NEUROLOGICAL: 'Neurologist',
    };

    return [specialistMap[data.assessment.category] || 'General Practitioner'];
  }

  private createFollowUpPlan(data: EmergencyAssessmentData): {
    immediateActions: string[];
    shortTermFollowUp: string;
    longTermMonitoring: string;
  } {
    return {
      immediateActions: data.assessment.immediateActions,
      shortTermFollowUp: 'Schedule follow-up within 48 hours of emergency',
      longTermMonitoring: 'Regular check-ups based on specialist recommendations',
    };
  }

  async getSuggestions(data: GetSymptomSuggestionsDto): Promise<SymptomSuggestionResponse> {
    try {
      this.logger.log(`Getting symptom suggestions for query: ${data.query}`);
      
      const query = data.query.toLowerCase();
      const suggestions = Array.from(this.commonSymptoms.entries())
        .filter(([symptom]) => symptom.toLowerCase().includes(query))
        .map(([symptom, details]) => ({
          id: this.generateSymptomId(),
          name: symptom,
          category: details.category,
          description: details.description,
          commonlyAssociated: details.commonlyAssociated
        }));

      return {
        suggestions,
        totalCount: suggestions.length,
        query: data.query
      };
    } catch (error) {
      this.logger.error(`Error getting symptom suggestions: ${error.message}`);
      throw error;
    }
  }

  async generateQuestions(data: AdaptiveQuestionnaireInput): Promise<AdaptiveQuestionnaireResponse> {
    try {
      this.logger.log(`Generating adaptive questions for symptom: ${data.primarySymptom.name}`);

      const sessionId = `QUEST-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const category = this.determineSymptomCategory(data.primarySymptom.name);
      
      // Get base questions from template or generate dynamic ones
      const questions = await this.getQuestionsForSymptom(data);
      
      // Calculate progress based on previous answers
      const progress = this.calculateProgress(data.previousAnswers);

      return {
        sessionId,
        questions,
        category,
        estimatedTimeMinutes: this.estimateCompletionTime(questions),
        progress
      };
    } catch (error) {
      this.logger.error(`Error generating adaptive questions: ${error.message}`);
      throw error;
    }
  }

  private determineSymptomCategory(symptomName: string): string {
    const categoryMap: Record<string, string> = {
      headache: 'Neurological',
      'chest pain': 'Cardiovascular',
      'shortness of breath': 'Respiratory',
      'joint pain': 'Musculoskeletal',
      'skin rash': 'Dermatological'
    };

    return categoryMap[symptomName.toLowerCase()] || 'General';
  }

  private async getQuestionsForSymptom(data: AdaptiveQuestionnaireInput): Promise<any[]> {
    const template = this.questionnaireTemplates.get(data.primarySymptom.name.toLowerCase());
    
    if (template) {
      // Use template questions and adapt based on severity and previous answers
      return this.adaptQuestionsBasedOnContext(template.questions, data);
    }

    // Generate dynamic questions if no template exists
    return this.generateDynamicQuestions(data);
  }

  private adaptQuestionsBasedOnContext(baseQuestions: any[], data: AdaptiveQuestionnaireInput): any[] {
    const adaptedQuestions = [...baseQuestions];

    // Add severity-specific questions
    if (data.primarySymptom.severity === 'SEVERE') {
      adaptedQuestions.push({
        id: `Q${adaptedQuestions.length + 1}`,
        text: 'Are you experiencing any of these emergency symptoms?',
        type: QuestionType.MULTIPLE_CHOICE,
        options: [
          { id: 'E1', text: 'Loss of consciousness' },
          { id: 'E2', text: 'Severe difficulty breathing' },
          { id: 'E3', text: 'Chest pressure or squeezing' }
        ],
        required: true
      });
    }

    return adaptedQuestions;
  }

  private generateDynamicQuestions(data: AdaptiveQuestionnaireInput): any[] {
    const questions = [
      {
        id: 'DQ1',
        text: `When did your ${data.primarySymptom.name} first start?`,
        type: QuestionType.TEXT,
        required: true
      },
      {
        id: 'DQ2',
        text: 'Have you experienced this before?',
        type: QuestionType.SINGLE_CHOICE,
        options: [
          { id: 'DQ2-A', text: 'Yes, frequently' },
          { id: 'DQ2-B', text: 'Yes, but rarely' },
          { id: 'DQ2-C', text: 'No, first time' }
        ],
        required: true
      }
    ];

    return questions;
  }

  private calculateProgress(previousAnswers?: string[]): number {
    if (!previousAnswers || previousAnswers.length === 0) {
      return 0;
    }

    // Assume average questionnaire has 5 questions
    const progress = Math.min((previousAnswers.length / 5) * 100, 100);
    return Math.round(progress);
  }

  private estimateCompletionTime(questions: any[]): number {
    // Estimate 30 seconds per question on average
    return Math.ceil((questions.length * 30) / 60);
  }

  async updateTimeline(data: SymptomTimelineInput): Promise<SymptomTimelineResponse> {
    try {
      this.logger.log(`Updating timeline for symptom: ${data.symptomId}`);

      // Get or initialize timeline data
      let timelineInfo = this.timelineData.get(data.symptomId);
      if (!timelineInfo) {
        timelineInfo = {
          events: [],
          firstRecorded: data.event.timestamp,
          symptomName: data.symptomName
        };
        this.timelineData.set(data.symptomId, timelineInfo);
      }

      // Add new event
      timelineInfo.events.push(data.event);

      // Analyze trends
      const trend = this.analyzeSymptomTrend(timelineInfo.events);
      
      // Generate recommendations
      const recommendations = this.generateTimelineRecommendations(trend, data.event);

      // Check if immediate attention is needed
      const requiresAttention = this.checkRequiresAttention(data.event, trend);

      // Publish event for other services if needed
      try {
        await this.rabbitMQService.publishEmergencyAssessment('symptom.timeline.updated', {
          symptomId: data.symptomId,
          event: data.event,
          requiresAttention
        });
      } catch (error) {
        this.logger.error(`Failed to publish timeline update: ${error.message}`);
        // Continue execution as the update is still valid
      }

      return {
        symptomId: data.symptomId,
        symptomName: data.symptomName,
        firstRecorded: timelineInfo.firstRecorded,
        latestEvent: data.event,
        trend,
        totalEvents: timelineInfo.events.length,
        requiresAttention,
        recommendations
      };
    } catch (error) {
      this.logger.error(`Error updating symptom timeline: ${error.message}`);
      throw error;
    }
  }

  private analyzeSymptomTrend(events: any[]): any {
    if (events.length < 2) {
      return {
        trend: 'STABLE',
        averagePainLevel: events[0].painLevel,
        commonTriggers: events[0].triggers || [],
        effectiveRelief: events[0].alleviatingFactors || [],
        peakTimes: []
      };
    }

    const recentEvents = events.slice(-5); // Analyze last 5 events
    const painLevels = recentEvents.map(e => e.painLevel);
    const averagePain = painLevels.reduce((a, b) => a + b, 0) / painLevels.length;

    // Determine trend
    const trend = this.determineTrend(painLevels);

    // Analyze triggers
    const triggers = this.aggregateFactors(recentEvents.flatMap(e => e.triggers || []));
    const relief = this.aggregateFactors(recentEvents.flatMap(e => e.alleviatingFactors || []));

    // Analyze peak times
    const peakTimes = this.analyzePeakTimes(recentEvents);

    return {
      trend,
      averagePainLevel: Number(averagePain.toFixed(1)),
      commonTriggers: triggers,
      effectiveRelief: relief,
      peakTimes
    };
  }

  private determineTrend(painLevels: number[]): 'IMPROVING' | 'WORSENING' | 'STABLE' | 'FLUCTUATING' {
    if (painLevels.length < 2) return 'STABLE';

    const changes = painLevels.slice(1).map((val, i) => val - painLevels[i]);
    const totalChange = changes.reduce((a, b) => a + b, 0);
    const variance = changes.reduce((a, b) => a + Math.abs(b), 0) / changes.length;

    if (variance > 2) return 'FLUCTUATING';
    if (totalChange > 1) return 'WORSENING';
    if (totalChange < -1) return 'IMPROVING';
    return 'STABLE';
  }

  private aggregateFactors(factors: string[]): string[] {
    const counts = new Map<string, number>();
    factors.forEach(factor => {
      counts.set(factor, (counts.get(factor) || 0) + 1);
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([factor]) => factor);
  }

  private analyzePeakTimes(events: any[]): string[] {
    const peakEvents = events.filter(e => e.painLevel >= 7);
    const times = peakEvents.map(e => {
      const hour = new Date(e.timestamp).getHours();
      if (hour < 12) return 'morning';
      if (hour < 17) return 'afternoon';
      if (hour < 21) return 'evening';
      return 'night';
    });

    return Array.from(new Set(times));
  }

  private generateTimelineRecommendations(trend: any, latestEvent: any): string[] {
    const recommendations: string[] = [];

    // Add trend-based recommendations
    if (trend.trend === 'WORSENING') {
      recommendations.push('Consider consulting a healthcare provider');
    }

    // Add trigger-based recommendations
    if (trend.commonTriggers.length > 0) {
      recommendations.push(`Try to avoid identified triggers: ${trend.commonTriggers.join(', ')}`);
    }

    // Add relief-based recommendations
    if (trend.effectiveRelief.length > 0) {
      recommendations.push(`Continue with effective relief methods: ${trend.effectiveRelief.join(', ')}`);
    }

    // Add medication-based recommendations
    if (latestEvent.medicationTaken && latestEvent.medications) {
      recommendations.push('Keep track of medication effectiveness');
    }

    // Add timing-based recommendations
    if (trend.peakTimes.length > 0) {
      recommendations.push(`Be prepared for potential symptom increases during: ${trend.peakTimes.join(', ')}`);
    }

    return recommendations;
  }

  private checkRequiresAttention(event: any, trend: any): boolean {
    return (
      event.painLevel >= 9 ||
      (trend.trend === 'WORSENING' && event.painLevel >= 7) ||
      (event.severity === 'SEVERE' && trend.trend !== 'IMPROVING')
    );
  }

  async getHistory(userId: string): Promise<SymptomHistoryResponse> {
    try {
      this.logger.log(`Fetching symptom history for user: ${userId}`);

      // Get all symptom IDs for the user
      const userSymptomIds = this.userSymptoms.get(userId) || new Set<string>();
      
      if (userSymptomIds.size === 0) {
        throw new NotFoundException(`No symptoms found for user: ${userId}`);
      }

      // Get detailed information for each symptom
      const symptoms = await Promise.all(
        Array.from(userSymptomIds).map(async symptomId => {
          const timelineInfo = this.timelineData.get(symptomId);
          if (!timelineInfo) return null;

          const trend = this.analyzeSymptomTrend(timelineInfo.events);
          const requiresAttention = this.checkRequiresAttention(
            timelineInfo.events[timelineInfo.events.length - 1],
            trend
          );

          return {
            symptomId,
            symptomName: timelineInfo.symptomName,
            firstRecorded: timelineInfo.firstRecorded,
            lastUpdated: timelineInfo.events[timelineInfo.events.length - 1].timestamp,
            status: this.determineSymptomStatus(timelineInfo.events, trend),
            events: timelineInfo.events,
            trend,
            totalEvents: timelineInfo.events.length,
            requiresAttention
          };
        })
      );

      // Filter out null entries and analyze overall patterns
      const validSymptoms = symptoms.filter(s => s !== null);
      const activeSymptoms = validSymptoms.filter(s => s.status === 'ACTIVE');
      const symptomsNeedingAttention = validSymptoms.filter(s => s.requiresAttention);

      // Analyze common patterns across all symptoms
      const commonPatterns = this.analyzeCommonPatterns(validSymptoms);

      return {
        userId,
        symptoms: validSymptoms,
        totalSymptoms: validSymptoms.length,
        activeSymptoms: activeSymptoms.length,
        symptomsNeedingAttention: symptomsNeedingAttention.length,
        ...commonPatterns
      };
    } catch (error) {
      this.logger.error(`Error fetching symptom history: ${error.message}`);
      throw error;
    }
  }

  private determineSymptomStatus(
    events: any[],
    trend: any
  ): 'ACTIVE' | 'RESOLVED' | 'CHRONIC' {
    const latestEvent = events[events.length - 1];
    const duration = this.calculateDuration(events[0].timestamp, latestEvent.timestamp);
    
    if (duration > 90) { // More than 90 days
      return 'CHRONIC';
    }
    
    if (latestEvent.painLevel <= 2 && trend.trend === 'IMPROVING') {
      return 'RESOLVED';
    }
    
    return 'ACTIVE';
  }

  private calculateDuration(start: Date, end: Date): number {
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  private analyzeCommonPatterns(symptoms: any[]): {
    commonSymptoms: string[];
    commonTriggers: string[];
    effectiveReliefMethods: string[];
  } {
    // Collect all symptom names
    const symptomNames = symptoms.map(s => s.symptomName);
    const commonSymptoms = this.getMostFrequent(symptomNames, 5);

    // Collect all triggers and relief methods
    const allTriggers = symptoms.flatMap(s => 
      s.events.flatMap((e: { triggers?: string[] }) => e.triggers || [])
    );
    const allReliefMethods = symptoms.flatMap(s => 
      s.events.flatMap((e: { alleviatingFactors?: string[] }) => e.alleviatingFactors || [])
    );

    return {
      commonSymptoms,
      commonTriggers: this.getMostFrequent(allTriggers, 5),
      effectiveReliefMethods: this.getMostFrequent(allReliefMethods, 5)
    };
  }

  private getMostFrequent(items: string[], limit: number): string[] {
    const counts = new Map<string, number>();
    items.forEach(item => {
      counts.set(item, (counts.get(item) || 0) + 1);
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([item]) => item);
  }

  async analyzeSymptoms(data: SymptomAnalysisInput): Promise<MultiLLMAnalysisResponse> {
    try {
      this.logger.log(`Analyzing symptoms with multi-LLM orchestration for: ${data.primarySymptom.name}`);

      // Generate analysis ID
      const analysisId = `ANALYSIS-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // Perform parallel LLM analyses
      const llmAnalyses = await this.performParallelAnalyses(data);

      // Consolidate findings
      const consolidatedAnalysis = this.consolidateFindings(llmAnalyses, data);

      // Determine urgency and emergency status
      const { urgencyLevel, requiresEmergencyCare } = this.determineUrgency(
        consolidatedAnalysis.consolidatedConditions,
        data
      );

      // Generate follow-up recommendations
      const followUpTimeframe = this.determineFollowUpTimeframe(urgencyLevel, data);

      // Identify warning signs
      const warningSigns = this.identifyWarningSigns(
        consolidatedAnalysis.consolidatedConditions,
        data
      );

      // Publish analysis results if needed
      try {
        await this.rabbitMQService.publishEmergencyAssessment('symptom.analyzed.llm', {
          analysisId,
          requiresEmergencyCare,
          urgencyLevel
        });
      } catch (error) {
        this.logger.error(`Failed to publish LLM analysis result: ${error.message}`);
        // Continue execution as the analysis is still valid
      }

      return {
        analysisId,
        timestamp: new Date(),
        llmAnalyses,
        ...consolidatedAnalysis,
        urgencyLevel,
        requiresEmergencyCare,
        followUpTimeframe,
        warningSigns,
        overallConfidence: this.calculateOverallConfidence(llmAnalyses)
      };
    } catch (error) {
      this.logger.error(`Error in multi-LLM symptom analysis: ${error.message}`);
      throw error;
    }
  }

  private async performParallelAnalyses(data: SymptomAnalysisInput): Promise<LLMAnalysis[]> {
    // Simulate parallel LLM analyses with different specialties
    const specialties = this.determineRelevantSpecialties(data);
    
    const analyses = await Promise.all(
      specialties.map(async specialty => this.performSpecialtyAnalysis(data, specialty))
    );

    return analyses;
  }

  private determineRelevantSpecialties(data: SymptomAnalysisInput): string[] {
    const specialties = new Set<string>();
    
    // Add specialties based on primary symptom
    const primarySpecialties = this.getSpecialtiesForSymptom(data.primarySymptom.name);
    primarySpecialties.forEach(s => specialties.add(s));

    // Add specialties based on secondary symptoms
    data.secondarySymptoms?.forEach(symptom => {
      const secondarySpecialties = this.getSpecialtiesForSymptom(symptom.name);
      secondarySpecialties.forEach(s => specialties.add(s));
    });

    // Always include general medicine
    specialties.add('General Medicine');

    return Array.from(specialties);
  }

  private getSpecialtiesForSymptom(symptomName: string): string[] {
    const specialtyMap: Record<string, string[]> = {
      'chest pain': ['Cardiology', 'Emergency Medicine', 'Pulmonology'],
      'shortness of breath': ['Pulmonology', 'Cardiology', 'Emergency Medicine'],
      'headache': ['Neurology', 'Emergency Medicine'],
      'abdominal pain': ['Gastroenterology', 'Emergency Medicine'],
      'joint pain': ['Rheumatology', 'Orthopedics']
    };

    return specialtyMap[symptomName.toLowerCase()] || [];
  }

  private async performSpecialtyAnalysis(
    data: SymptomAnalysisInput,
    specialty: string
  ): Promise<LLMAnalysis> {
    // Simulate LLM analysis for specific specialty
    const possibleConditions = this.analyzeConditionsForSpecialty(data, specialty);
    
    return {
      modelName: `Clinical ${specialty} Model v1`,
      specialty,
      possibleConditions,
      confidence: this.calculateConfidence(possibleConditions),
      keyFindings: this.extractKeyFindings(possibleConditions, data)
    };
  }

  private analyzeConditionsForSpecialty(
    data: SymptomAnalysisInput,
    specialty: string
  ): PossibleCondition[] {
    // Simulate condition analysis based on specialty
    const conditions: PossibleCondition[] = [];
    
    // Add specialty-specific conditions based on symptoms and vital signs
    const specialtyConditions = this.getSpecialtyConditions(specialty, data);
    conditions.push(...specialtyConditions);

    return conditions;
  }

  private getSpecialtyConditions(
    specialty: string,
    data: SymptomAnalysisInput
  ): PossibleCondition[] {
    // Example implementation for cardiology
    if (specialty === 'Cardiology' && data.primarySymptom.name.toLowerCase() === 'chest pain') {
      return [
        {
          name: 'Acute Coronary Syndrome',
          confidence: this.isHighRiskCardiac(data) ? ConfidenceLevel.HIGH : ConfidenceLevel.MEDIUM,
          supportingEvidence: this.getCardiacEvidence(data),
          contradictingEvidence: this.getContradictingCardiacEvidence(data)
        }
      ];
    }

    // Add more specialty-specific condition analysis
    return [];
  }

  private isHighRiskCardiac(data: SymptomAnalysisInput): boolean {
    return (
      data.vitalSigns.bloodPressureSystolic > 180 ||
      data.vitalSigns.heartRate > 120 ||
      data.medicalContext.chronicConditions?.includes('coronary artery disease') ||
      data.isEmergency
    );
  }

  private getCardiacEvidence(data: SymptomAnalysisInput): string[] {
    const evidence: string[] = [];
    
    if (data.primarySymptom.aggravatingFactors?.includes('physical activity')) {
      evidence.push('Pain worse with exertion');
    }
    if (data.vitalSigns.bloodPressureSystolic > 140) {
      evidence.push('Elevated blood pressure');
    }
    if (data.medicalContext.chronicConditions?.includes('hypertension')) {
      evidence.push('History of hypertension');
    }

    return evidence;
  }

  private getContradictingCardiacEvidence(data: SymptomAnalysisInput): string[] {
    const evidence: string[] = [];
    
    if (data.primarySymptom.relievingFactors?.includes('position change')) {
      evidence.push('Pain improves with position change');
    }
    if (data.vitalSigns.heartRate < 60) {
      evidence.push('Normal to low heart rate');
    }

    return evidence;
  }

  private consolidateFindings(
    llmAnalyses: LLMAnalysis[],
    data: SymptomAnalysisInput
  ): {
    consolidatedConditions: PossibleCondition[];
    riskFactors: RiskFactor[];
    recommendations: TreatmentRecommendation[];
  } {
    // Consolidate conditions from all analyses
    const conditions = this.consolidateConditions(llmAnalyses);
    
    // Identify risk factors
    const riskFactors = this.identifyRiskFactors(data, conditions);
    
    // Generate treatment recommendations
    const recommendations = this.generateTreatmentRecommendations(
      conditions,
      riskFactors,
      data
    );

    return {
      consolidatedConditions: conditions,
      riskFactors,
      recommendations
    };
  }

  private consolidateConditions(llmAnalyses: LLMAnalysis[]): PossibleCondition[] {
    const conditionMap = new Map<string, PossibleCondition>();

    llmAnalyses.forEach(analysis => {
      analysis.possibleConditions.forEach(condition => {
        const existing = conditionMap.get(condition.name);
        if (!existing || condition.confidence > existing.confidence) {
          conditionMap.set(condition.name, condition);
        }
      });
    });

    return Array.from(conditionMap.values());
  }

  private identifyRiskFactors(
    data: SymptomAnalysisInput,
    conditions: PossibleCondition[]
  ): RiskFactor[] {
    const riskFactors: RiskFactor[] = [];

    // Add risk factors from medical context
    data.medicalContext.chronicConditions?.forEach(condition => {
      riskFactors.push({
        name: condition,
        impact: `May complicate ${conditions.map(c => c.name).join(' or ')}`,
        recommendations: [
          'Continue prescribed medications',
          'Regular monitoring',
          'Inform healthcare providers'
        ]
      });
    });

    // Add risk factors from vital signs
    if (data.vitalSigns.bloodPressureSystolic > 140) {
      riskFactors.push({
        name: 'Elevated Blood Pressure',
        impact: 'Increases cardiovascular risk',
        recommendations: [
          'Blood pressure monitoring',
          'Medication compliance',
          'Lifestyle modifications'
        ]
      });
    }

    return riskFactors;
  }

  private generateTreatmentRecommendations(
    conditions: PossibleCondition[],
    riskFactors: RiskFactor[],
    data: SymptomAnalysisInput
  ): TreatmentRecommendation[] {
    const recommendations: TreatmentRecommendation[] = [];

    // Add immediate care recommendations
    if (data.isEmergency) {
      recommendations.push({
        type: 'Emergency Care',
        recommendation: 'Seek immediate emergency medical attention',
        rationale: 'Symptoms and vital signs suggest possible emergency condition',
        precautions: ['Do not drive yourself', 'Call emergency services']
      });
    }

    // Add condition-specific recommendations
    conditions.forEach(condition => {
      const recommendation = this.getConditionRecommendation(condition, data);
      if (recommendation) {
        recommendations.push(recommendation);
      }
    });

    return recommendations;
  }

  private getConditionRecommendation(
    condition: PossibleCondition,
    data: SymptomAnalysisInput
  ): TreatmentRecommendation | null {
    // Example for cardiac conditions
    if (condition.name === 'Acute Coronary Syndrome') {
      return {
        type: 'Medication',
        recommendation: 'Consider aspirin 325mg if no contraindications',
        rationale: 'May help if cardiac origin confirmed',
        precautions: [
          'Do not take if allergic to aspirin',
          'Check for other medication interactions'
        ]
      };
    }

    return null;
  }

  private determineUrgency(
    conditions: PossibleCondition[],
    data: SymptomAnalysisInput
  ): { urgencyLevel: UrgencyLevel; requiresEmergencyCare: boolean } {
    if (data.isEmergency || this.hasEmergencyConditions(conditions)) {
      return { urgencyLevel: UrgencyLevel.EMERGENCY, requiresEmergencyCare: true };
    }

    if (this.hasUrgentConditions(conditions, data)) {
      return { urgencyLevel: UrgencyLevel.URGENT, requiresEmergencyCare: false };
    }

    if (this.needsRoutineFollowUp(conditions, data)) {
      return { urgencyLevel: UrgencyLevel.ROUTINE, requiresEmergencyCare: false };
    }

    return { urgencyLevel: UrgencyLevel.SELF_CARE, requiresEmergencyCare: false };
  }

  private hasEmergencyConditions(conditions: PossibleCondition[]): boolean {
    const emergencyConditions = ['Acute Coronary Syndrome', 'Pulmonary Embolism', 'Stroke'];
    return conditions.some(c => 
      emergencyConditions.includes(c.name) && c.confidence === ConfidenceLevel.HIGH
    );
  }

  private hasUrgentConditions(conditions: PossibleCondition[], data: SymptomAnalysisInput): boolean {
    return (
      conditions.some(c => c.confidence === ConfidenceLevel.HIGH) ||
      data.primarySymptom.severity === 'SEVERE' ||
      this.hasAbnormalVitalSigns(data.vitalSigns)
    );
  }

  private hasAbnormalVitalSigns(vitalSigns: any): boolean {
    return (
      vitalSigns.bloodPressureSystolic > 180 ||
      vitalSigns.bloodPressureSystolic < 90 ||
      vitalSigns.heartRate > 120 ||
      vitalSigns.heartRate < 50 ||
      vitalSigns.oxygenSaturation < 92
    );
  }

  private needsRoutineFollowUp(conditions: PossibleCondition[], data: SymptomAnalysisInput): boolean {
    return (
      conditions.length > 0 ||
      data.primarySymptom.severity === 'MODERATE' ||
      (data.medicalContext.chronicConditions?.length ?? 0) > 0
    );
  }

  private determineFollowUpTimeframe(urgencyLevel: UrgencyLevel, data: SymptomAnalysisInput): string {
    switch (urgencyLevel) {
      case UrgencyLevel.EMERGENCY:
        return 'Immediate emergency care needed';
      case UrgencyLevel.URGENT:
        return 'Within 24 hours';
      case UrgencyLevel.ROUTINE:
        return 'Within 1 week';
      default:
        return 'Follow up if symptoms persist or worsen';
    }
  }

  private identifyWarningSigns(conditions: PossibleCondition[], data: SymptomAnalysisInput): string[] {
    const warningSigns = new Set<string>();

    // Add condition-specific warning signs
    conditions.forEach(condition => {
      const signs = this.getConditionWarningSigns(condition);
      signs.forEach(sign => warningSigns.add(sign));
    });

    // Add general warning signs based on primary symptom
    const generalSigns = this.getGeneralWarningSigns(data.primarySymptom);
    generalSigns.forEach(sign => warningSigns.add(sign));

    return Array.from(warningSigns);
  }

  private getConditionWarningSigns(condition: PossibleCondition): string[] {
    // Example for cardiac conditions
    if (condition.name === 'Acute Coronary Syndrome') {
      return [
        'Severe chest pain lasting > 10 minutes',
        'Pain radiating to arm, jaw, or back',
        'Shortness of breath',
        'Sweating with pain',
        'Lightheadedness or fainting'
      ];
    }

    return [];
  }

  private getGeneralWarningSigns(symptom: any): string[] {
    return [
      'Severe pain not responding to treatment',
      'New or worsening symptoms',
      'Difficulty breathing',
      'Loss of consciousness',
      'High fever'
    ];
  }

  private calculateOverallConfidence(llmAnalyses: LLMAnalysis[]): ConfidenceLevel {
    const confidenceCounts = {
      [ConfidenceLevel.HIGH]: 0,
      [ConfidenceLevel.MEDIUM]: 0,
      [ConfidenceLevel.LOW]: 0
    };

    llmAnalyses.forEach(analysis => {
      confidenceCounts[analysis.confidence]++;
    });

    if (confidenceCounts[ConfidenceLevel.HIGH] > llmAnalyses.length / 2) {
      return ConfidenceLevel.HIGH;
    }
    if (confidenceCounts[ConfidenceLevel.LOW] > llmAnalyses.length / 2) {
      return ConfidenceLevel.LOW;
    }
    return ConfidenceLevel.MEDIUM;
  }

  private extractKeyFindings(conditions: PossibleCondition[], data: SymptomAnalysisInput): string[] {
    const findings = new Set<string>();

    // Add findings from conditions
    conditions.forEach(condition => {
      condition.supportingEvidence.forEach(evidence => findings.add(evidence));
    });

    // Add findings from vital signs
    if (this.hasAbnormalVitalSigns(data.vitalSigns)) {
      findings.add('Abnormal vital signs detected');
    }

    // Add findings from medical context
    if ((data.medicalContext.chronicConditions?.length ?? 0) > 0) {
      findings.add('Relevant chronic conditions present');
    }

    return Array.from(findings);
  }

  private calculateConfidence(conditions: PossibleCondition[]): ConfidenceLevel {
    if (conditions.length === 0) return ConfidenceLevel.LOW;
    
    const highConfidence = conditions.filter(c => c.confidence === ConfidenceLevel.HIGH).length;
    const lowConfidence = conditions.filter(c => c.confidence === ConfidenceLevel.LOW).length;
    
    if (highConfidence > conditions.length / 2) return ConfidenceLevel.HIGH;
    if (lowConfidence > conditions.length / 2) return ConfidenceLevel.LOW;
    return ConfidenceLevel.MEDIUM;
  }
} 