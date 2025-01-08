import { Injectable, Logger } from '@nestjs/common';
import {
  RabbitMQService,
  LLMOrchestrationService,
  TranslationService,
  MetricsService,
  SupabaseService,
  MedicalReport,
  MedicalReportInput,
  VitalSignsDto,
} from '@app/common';
import { SymptomAnalysis, SymptomAnalysisStatus } from '../models/symptom-analysis.model';
import { QuestionnaireDto } from '../models/questionnaire.dto';
import { SymptomRiskInput } from '../interfaces/symptom-risk-input.interface';
import { RiskAssessmentResponse } from '../interfaces/risk-assessment-response.interface';

interface IDatabaseQuery {
  readonly field: string;
  readonly operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'is' | 'in' | 'contains' | 'match';
  readonly value: string | number | boolean | null | Array<string | number | boolean>;
}

interface IDatabaseQueryOptions {
  readonly filters?: IDatabaseQuery[];
  readonly orderBy?: {
    readonly column: string;
    readonly ascending: boolean;
  };
  readonly limit?: number;
  readonly offset?: number;
}

interface ISymptomAnalysisResult {
  readonly data: SymptomAnalysis[];
  readonly count: number;
}

/**
 * Service responsible for managing symptom analysis, risk assessment, and medical report generation.
 * Integrates with LLM services for intelligent medical analysis and report generation.
 */
@Injectable()
export class SymptomAnalysisService {
  private readonly logger: Logger = new Logger(SymptomAnalysisService.name);

  public constructor(
    private readonly rabbitMQService: RabbitMQService,
    private readonly llmService: LLMOrchestrationService,
    private readonly translationService: TranslationService,
    private readonly metricsService: MetricsService,
    private readonly supabaseService: SupabaseService,
  ) {}

  /**
   * Assesses the risk level of provided symptoms using LLM-based analysis.
   * 
   * @param input - The symptom risk assessment input containing symptoms and context
   * @returns A promise resolving to risk assessment results including recommendations
   * @throws Error if the LLM service fails to process the assessment
   */
  public async assessRisk(input: SymptomRiskInput): Promise<RiskAssessmentResponse> {
    this.logger.log(`Assessing risk for symptoms: ${input.symptoms.join(', ')}`);
    
    const startTime: number = Date.now();
    const assessment: RiskAssessmentResponse = await this.llmService.assessSymptomRisk(input);
    const duration: number = (Date.now() - startTime) / 1000;
    
    await this.metricsService.recordTaskMetrics('risk_assessment', {
      responseTime: duration * 1000,
      confidence: assessment.confidence ?? 1,
      cost: 0.01, // TODO: Calculate actual cost
    });

    return assessment;
  }

  /**
   * Retrieves a specific symptom analysis by its ID.
   * 
   * @param id - The unique identifier of the symptom analysis
   * @returns A promise resolving to the symptom analysis or null if not found
   */
  public async findSymptomAnalysis(id: string): Promise<SymptomAnalysis | null> {
    const query: IDatabaseQuery = {
      field: 'id',
      operator: 'eq',
      value: id,
    };

    const results: SymptomAnalysis[] = await this.supabaseService.select<SymptomAnalysis>(
      'symptom_analysis',
      { filters: [query] }
    );
    
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Retrieves a paginated list of symptom analyses for a specific user.
   * 
   * @param userId - The ID of the user whose analyses to retrieve
   * @param limit - Maximum number of records to return (default: 10)
   * @param offset - Number of records to skip (default: 0)
   * @returns A promise resolving to paginated symptom analyses with total count
   */
  public async findSymptomAnalyses(
    userId: string,
    limit: number = 10,
    offset: number = 0,
  ): Promise<ISymptomAnalysisResult> {
    const query: IDatabaseQuery = {
      field: 'user_id',
      operator: 'eq',
      value: userId,
    };

    const queryOptions: IDatabaseQueryOptions = {
      filters: [query],
      orderBy: {
        column: 'createdAt',
        ascending: false,
      },
      limit,
      offset,
    };

    const data: SymptomAnalysis[] = await this.supabaseService.select<SymptomAnalysis>(
      'symptom_analysis',
      queryOptions
    );

    return { data, count: data.length };
  }

  /**
   * Creates a new symptom analysis record from questionnaire data.
   * 
   * @param userId - The ID of the user creating the analysis
   * @param questionnaire - The completed symptom questionnaire
   * @returns A promise resolving to the created symptom analysis
   * @throws Error if the creation or notification process fails
   */
  public async createSymptomAnalysis(
    userId: string,
    questionnaire: QuestionnaireDto,
  ): Promise<SymptomAnalysis> {
    const startTime: number = Date.now();
    const analysis: SymptomAnalysis = {
      id: crypto.randomUUID(),
      userId,
      data: questionnaire,
      status: SymptomAnalysisStatus.PENDING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.supabaseService.insert('symptom_analysis', analysis);
    await this.rabbitMQService.publish('symptom.analysis.created', analysis);
    
    const duration: number = (Date.now() - startTime) / 1000;
    await this.metricsService.recordTaskMetrics('symptom_analysis', {
      responseTime: duration * 1000,
      confidence: 1,
      cost: 0.005, // TODO: Calculate actual cost
    });

    return analysis;
  }

  /**
   * Generates a comprehensive medical report for a symptom analysis using LLM processing.
   * 
   * @param analysisId - The ID of the symptom analysis to generate a report for
   * @returns A promise resolving to the generated medical report
   * @throws Error if the analysis is not found or report generation fails
   */
  public async generateReport(analysisId: string): Promise<MedicalReport> {
    const startTime: number = Date.now();
    const analysis: SymptomAnalysis | null = await this.findSymptomAnalysis(analysisId);
    
    if (!analysis) {
      throw new Error(`Symptom analysis not found: ${analysisId}`);
    }

    const input: MedicalReportInput = {
      symptoms: analysis.data.symptoms,
      medicalHistory: analysis.data.medicalHistory ?? '',
      medications: analysis.data.medications ?? [],
      allergies: analysis.data.allergies ?? [],
      vitalSigns: analysis.data.vitalSigns ? {
        heartRate: analysis.data.vitalSigns.heartRate ?? 0,
        temperature: analysis.data.vitalSigns.temperature ?? 0,
        respiratoryRate: analysis.data.vitalSigns.respiratoryRate ?? 0,
        oxygenSaturation: analysis.data.vitalSigns.oxygenSaturation ?? 0,
        bloodPressureSystolic: analysis.data.vitalSigns.systolic ?? 0,
        bloodPressureDiastolic: analysis.data.vitalSigns.diastolic ?? 0,
      } : {},
    };

    const llmReport: MedicalReport = await this.llmService.generateMedicalReport(input);
    const duration: number = (Date.now() - startTime) / 1000;
    
    await this.metricsService.recordTaskMetrics('medical_report', {
      responseTime: duration * 1000,
      confidence: llmReport.confidence ?? 1,
      cost: 0.02, // TODO: Calculate actual cost
    });

    const report: MedicalReport = {
      reportId: crypto.randomUUID(),
      timestamp: new Date(),
      patientId: analysis.userId,
      symptoms: llmReport.symptoms.map(symptom => ({
        ...symptom,
        onset: symptom.onset ?? 'Unknown',
      })),
      vitalSigns: {
        ...llmReport.vitalSigns,
        summary: llmReport.vitalSigns?.summary ?? 'No vital signs recorded',
        findings: llmReport.vitalSigns?.findings ?? [],
        requiresAttention: llmReport.vitalSigns?.requiresAttention ?? false,
      },
      diagnosis: llmReport.diagnosis,
      recommendations: llmReport.recommendations,
      followUpPlan: llmReport.followUpPlan,
      urgencyLevel: llmReport.urgencyLevel,
      riskLevel: llmReport.riskLevel ?? 'low',
      confidence: llmReport.confidence ?? 1,
    };

    const query: IDatabaseQuery = {
      field: 'id',
      operator: 'eq',
      value: analysisId,
    };

    await this.supabaseService.update('symptom_analysis', { filters: [query] }, {
      status: SymptomAnalysisStatus.COMPLETED,
      report,
      updatedAt: new Date().toISOString(),
    });

    return report;
  }

  /**
   * Translates an existing medical report to the specified target language.
   * 
   * @param analysisId - The ID of the symptom analysis containing the report to translate
   * @param targetLanguage - The target language code for translation
   * @returns A promise resolving to the translated medical report
   * @throws Error if the analysis or report is not found
   */
  public async translateReport(
    analysisId: string,
    targetLanguage: string,
  ): Promise<MedicalReport> {
    const startTime: number = Date.now();
    const analysis: SymptomAnalysis | null = await this.findSymptomAnalysis(analysisId);
    
    if (!analysis?.report) {
      throw new Error(`Symptom analysis or report not found: ${analysisId}`);
    }

    const translatedReport: MedicalReport = await this.translationService.translate<MedicalReport>(
      analysis.report,
      targetLanguage,
    );

    const duration: number = (Date.now() - startTime) / 1000;
    await this.metricsService.recordTaskMetrics('report_translation', {
      responseTime: duration * 1000,
      confidence: 1,
      cost: 0.01, // TODO: Calculate actual cost
    });

    return translatedReport;
  }
} 