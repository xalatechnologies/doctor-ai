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
} from '@app/common';
import { SymptomAnalysis } from '@/models/symptom-analysis.model';
import { QuestionnaireDto } from '@/models/questionnaire.dto';

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

  async findSymptomAnalysis(id: string): Promise<SymptomAnalysis | null> {
    const filter: QueryFilter = {
      field: 'id',
      operator: 'eq',
      value: id,
    };

    return this.supabaseService.findOne<SymptomAnalysis>('symptom_analysis', filter);
  }

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

  async generateReport(analysisId: string): Promise<MedicalReport> {
    const analysis = await this.findSymptomAnalysis(analysisId);
    if (!analysis) {
      throw new Error(`Symptom analysis not found: ${analysisId}`);
    }

    const input: MedicalReportInput = {
      symptoms: analysis.data.symptoms,
      medicalHistory: analysis.data.medicalHistory,
      medications: analysis.data.medications,
      allergies: analysis.data.allergies,
    };

    const report = await this.llmService.generateMedicalReport(input);
    await this.metricsService.incrementCounter('medical_report_generated');

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

    await this.metricsService.incrementCounter('medical_report_translated');

    return translatedReport;
  }
} 