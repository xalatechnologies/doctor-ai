import { Injectable, Logger } from '@nestjs/common';
import {
  RabbitMQService,
  LLMOrchestrationService,
  TranslationService,
  MetricsService,
  SupabaseService,
  QueryFilter,
  MedicalReport,
  MedicalReportInput,
  SymptomRiskInput,
  RiskAssessmentResponse,
} from '@app/common';
import { SymptomAnalysis } from '../models/symptom-analysis.model';
import { QuestionnaireDto } from '../models/questionnaire.dto';

/**
 * Service responsible for managing symptom analysis, risk assessment, and medical report generation.
 * Integrates with LLM services for intelligent medical analysis and report generation.
 */
@Injectable()
export class SymptomAnalysisService {
  private readonly logger = new Logger(SymptomAnalysisService.name);

  constructor(
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
  async assessRisk(input: SymptomRiskInput): Promise<RiskAssessmentResponse> {
    this.logger.log(`Assessing risk for symptoms: ${input.symptoms.join(', ')}`);
    
    const assessment = await this.llmService.assessSymptomRisk(input);
    await this.metricsService.incrementCounter('symptom_risk_assessed');

    return assessment;
  }

  /**
   * Retrieves a specific symptom analysis by its ID.
   * 
   * @param id - The unique identifier of the symptom analysis
   * @returns A promise resolving to the symptom analysis or null if not found
   */
  async findSymptomAnalysis(id: string): Promise<SymptomAnalysis | null> {
    const filter: QueryFilter = {
      field: 'id',
      operator: 'eq',
      value: id,
    };

    return this.supabaseService.findOne<SymptomAnalysis>('symptom_analysis', filter);
  }

  /**
   * Retrieves a paginated list of symptom analyses for a specific user.
   * 
   * @param userId - The ID of the user whose analyses to retrieve
   * @param limit - Maximum number of records to return (default: 10)
   * @param offset - Number of records to skip (default: 0)
   * @returns A promise resolving to paginated symptom analyses with total count
   */
  async findSymptomAnalyses(
    userId: string,
    limit = 10,
    offset = 0,
  ): Promise<{ data: SymptomAnalysis[]; count: number }> {
    const filter: QueryFilter = {
      field: 'user_id',
      operator: 'eq',
      value: userId,
    };

    return this.supabaseService.find<SymptomAnalysis>('symptom_analysis', {
      filters: [filter],
      orderBy: {
        column: 'createdAt',
        ascending: false,
      },
      limit,
      offset,
    });
  }

  /**
   * Creates a new symptom analysis record from questionnaire data.
   * 
   * @param userId - The ID of the user creating the analysis
   * @param questionnaire - The completed symptom questionnaire
   * @returns A promise resolving to the created symptom analysis
   * @throws Error if the creation or notification process fails
   */
  async createSymptomAnalysis(
    userId: string,
    questionnaire: QuestionnaireDto,
  ): Promise<SymptomAnalysis> {
    const analysis: SymptomAnalysis = {
      id: crypto.randomUUID(),
      userId,
      data: questionnaire,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.supabaseService.create('symptom_analysis', analysis);
    await this.rabbitMQService.publish('symptom.analysis.created', analysis);
    await this.metricsService.incrementCounter('symptom_analysis_created');

    return analysis;
  }

  /**
   * Generates a comprehensive medical report for a symptom analysis using LLM processing.
   * 
   * @param analysisId - The ID of the symptom analysis to generate a report for
   * @returns A promise resolving to the generated medical report
   * @throws Error if the analysis is not found or report generation fails
   */
  async generateReport(analysisId: string): Promise<MedicalReport> {
    const analysis = await this.findSymptomAnalysis(analysisId);
    if (!analysis) {
      throw new Error(`Symptom analysis not found: ${analysisId}`);
    }

    const input: MedicalReportInput = {
      symptoms: analysis.data.symptoms,
      medicalHistory: analysis.data.medicalHistory,
      medications: analysis.data.medications || [],
      allergies: analysis.data.allergies || [],
      vitalSigns: analysis.data.vitalSigns,
    };

    const llmReport = await this.llmService.generateMedicalReport(input);
    await this.metricsService.incrementCounter('medical_report_generated');

    const report: MedicalReport = {
      reportId: crypto.randomUUID(),
      timestamp: new Date(),
      patientId: analysis.userId,
      symptoms: llmReport.symptoms.map(symptom => ({
        ...symptom,
        onset: symptom.onset || 'Unknown',
      })),
      vitalSigns: {
        ...llmReport.vitalSigns,
        summary: llmReport.vitalSigns?.summary || 'No vital signs recorded',
        findings: llmReport.vitalSigns?.findings || [],
        requiresAttention: llmReport.vitalSigns?.requiresAttention || false,
      },
      diagnosis: llmReport.diagnosis,
      recommendations: llmReport.recommendations,
      followUpPlan: llmReport.followUpPlan,
      urgencyLevel: llmReport.urgencyLevel,
    };

    const filter: QueryFilter = {
      field: 'id',
      operator: 'eq',
      value: analysisId,
    };

    await this.supabaseService.update('symptom_analysis', filter, {
      status: 'completed',
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
  async translateReport(
    analysisId: string,
    targetLanguage: string,
  ): Promise<MedicalReport> {
    const analysis = await this.findSymptomAnalysis(analysisId);
    if (!analysis || !analysis.report) {
      throw new Error(`Symptom analysis or report not found: ${analysisId}`);
    }

    const translatedReport = await this.translationService.translate(
      analysis.report,
      targetLanguage,
    );

    const report: MedicalReport = {
      reportId: analysis.report.reportId,
      timestamp: analysis.report.timestamp,
      patientId: analysis.report.patientId,
      symptoms: translatedReport.symptoms.map(symptom => ({
        ...symptom,
        onset: symptom.onset || 'Unknown',
      })),
      vitalSigns: {
        ...translatedReport.vitalSigns,
        summary: translatedReport.vitalSigns?.summary || 'No vital signs recorded',
        findings: translatedReport.vitalSigns?.findings || [],
        requiresAttention: translatedReport.vitalSigns?.requiresAttention || false,
      },
      diagnosis: translatedReport.diagnosis,
      recommendations: translatedReport.recommendations,
      followUpPlan: translatedReport.followUpPlan,
      urgencyLevel: translatedReport.urgencyLevel,
    };

    await this.metricsService.incrementCounter('medical_report_translated');

    return report;
  }
} 