import { Test, TestingModule } from '@nestjs/testing';
import { SymptomAnalysisService } from './symptom-analysis.service';
import {
  RabbitMQService,
  LLMOrchestrationService,
  TranslationService,
  MetricsService,
  SupabaseService,
  MedicalReport,
  VitalSignsDto as CommonVitalSignsDto,
  MedicalReportInput,
} from '@app/common';
import { QuestionnaireDto, VitalSignsDto } from '../models/questionnaire.dto';
import { SymptomAnalysis, SymptomAnalysisStatus } from '../models/symptom-analysis.model';
import { DatabaseQuery, DatabaseQueryOptions } from '../interfaces/database.interface';
import { ConfidenceLevel } from '../interfaces/risk-levels.interface';
import { RiskLevel, UrgencyLevel, RiskAssessmentResponse } from '../interfaces/risk-assessment-response.interface';
import { SymptomRiskInput } from '../interfaces/symptom-risk-input.interface';

describe('SymptomAnalysisService', () => {
  let service: SymptomAnalysisService;
  let rabbitMQService: jest.Mocked<Pick<RabbitMQService, 'publish'>>;
  let llmService: jest.Mocked<Pick<LLMOrchestrationService, 'assessSymptomRisk' | 'generateMedicalReport'>>;
  let translationService: jest.Mocked<Pick<TranslationService, 'translate'>>;
  let metricsService: jest.Mocked<Pick<MetricsService, 'recordTaskMetrics'>>;
  let supabaseService: jest.Mocked<Pick<SupabaseService, 'select' | 'insert' | 'update'>>;

  const mockVitalSignsDto: VitalSignsDto = {
    systolic: 120,
    diastolic: 80,
    heartRate: 75,
    temperature: 37,
    respiratoryRate: 16,
    oxygenSaturation: 98,
  };

  const mockCommonVitalSignsDto: CommonVitalSignsDto = {
    heartRate: 75,
    temperature: 37,
    respiratoryRate: 16,
    oxygenSaturation: 98,
    bloodPressureSystolic: 120,
    bloodPressureDiastolic: 80,
    summary: 'Normal vital signs',
    findings: [0],
    requiresAttention: false,
  };

  const mockRiskAssessment: RiskAssessmentResponse = {
    riskLevel: RiskLevel.MEDIUM,
    confidence: 0.85,
    explanation: 'Moderate risk based on symptoms',
    recommendations: ['Seek medical attention'],
    urgencyLevel: UrgencyLevel.SOON,
    followUpRequired: true,
  };

  const mockMedicalReport: MedicalReport = {
    reportId: '123',
    timestamp: new Date(),
    patientId: 'user123',
    symptoms: [{
      onset: 'Gradual',
      name: 'Headache',
      description: 'Throbbing pain in temples',
      severity: 7,
      duration: '2 days',
      location: 'Temples',
      characteristics: ['Throbbing', 'Bilateral'],
    }],
    diagnosis: 'Tension Headache',
    recommendations: ['Rest', 'Hydration', 'OTC pain medication'],
    vitalSigns: mockCommonVitalSignsDto,
    riskLevel: RiskLevel.LOW,
    urgencyLevel: UrgencyLevel.ROUTINE,
    confidence: 0.85,
    followUpPlan: {
      timing: '3 days',
      instructions: ['Monitor symptoms', 'Return if worsening'],
      requiredTests: [],
    },
  };

  const mockQuestionnaire: QuestionnaireDto = {
    symptoms: ['Headache with throbbing pain'],
    medicalHistory: 'No significant medical history',
    medications: [],
    allergies: [],
    vitalSigns: mockVitalSignsDto,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SymptomAnalysisService,
        {
          provide: RabbitMQService,
          useValue: {
            publish: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: LLMOrchestrationService,
          useValue: {
            assessSymptomRisk: jest.fn().mockResolvedValue(mockRiskAssessment),
            generateMedicalReport: jest.fn().mockResolvedValue(mockMedicalReport),
          },
        },
        {
          provide: TranslationService,
          useValue: {
            translate: jest.fn().mockImplementation((report: MedicalReport, language: string) => Promise.resolve(report)),
          },
        },
        {
          provide: MetricsService,
          useValue: {
            recordTaskMetrics: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: SupabaseService,
          useValue: {
            select: jest.fn(),
            insert: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SymptomAnalysisService>(SymptomAnalysisService);
    rabbitMQService = module.get(RabbitMQService);
    llmService = module.get(LLMOrchestrationService);
    translationService = module.get(TranslationService);
    metricsService = module.get(MetricsService);
    supabaseService = module.get(SupabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('assessRisk', () => {
    const mockInput: SymptomRiskInput = {
      symptoms: ['Headache with throbbing pain'],
      age: 30,
      gender: 'female',
      medicalHistory: 'None',
      currentMedications: [],
      allergies: [],
      vitalSigns: {
        heartRate: 75,
        temperature: 37,
        respiratoryRate: 16,
        oxygenSaturation: 98,
        bloodPressureSystolic: 120,
        bloodPressureDiastolic: 80,
      },
    };

    it('should assess risk and return assessment', async () => {
      const result = await service.assessRisk(mockInput);

      expect(result).toEqual(mockRiskAssessment);
      expect(llmService.assessSymptomRisk).toHaveBeenCalledWith(mockInput);
      expect(metricsService.recordTaskMetrics).toHaveBeenCalledWith('risk_assessment', {
        responseTime: expect.any(Number),
        confidence: mockRiskAssessment.confidence,
        cost: expect.any(Number),
      });
    });

    it('should handle LLM service errors', async () => {
      llmService.assessSymptomRisk.mockRejectedValue(new Error('LLM error'));

      await expect(service.assessRisk(mockInput)).rejects.toThrow('LLM error');
      expect(metricsService.recordTaskMetrics).not.toHaveBeenCalled();
    });
  });

  describe('findSymptomAnalysis', () => {
    const mockId = '123';

    it('should find and return analysis by ID', async () => {
      const mockAnalysis: SymptomAnalysis = {
        id: mockId,
        userId: 'user123',
        data: mockQuestionnaire,
        status: SymptomAnalysisStatus.COMPLETED,
        report: mockMedicalReport,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      supabaseService.select.mockResolvedValue([mockAnalysis]);

      const result = await service.findSymptomAnalysis(mockId);

      expect(result).toEqual(mockAnalysis);
      expect(supabaseService.select).toHaveBeenCalledWith('symptom_analysis', {
        filters: [{
          field: 'id',
          operator: 'eq',
          value: mockId,
        }] as DatabaseQuery[],
      } as DatabaseQueryOptions);
    });

    it('should return null if analysis not found', async () => {
      supabaseService.select.mockResolvedValue([]);

      const result = await service.findSymptomAnalysis(mockId);

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      supabaseService.select.mockRejectedValue(new Error('Database error'));

      await expect(service.findSymptomAnalysis(mockId)).rejects.toThrow('Database error');
    });
  });

  describe('findSymptomAnalyses', () => {
    const mockUserId = 'user123';
    const mockLimit = 10;
    const mockOffset = 0;

    it('should return paginated analyses for user', async () => {
      const mockAnalyses: SymptomAnalysis[] = [
        {
          id: '1',
          userId: mockUserId,
          data: mockQuestionnaire,
          status: SymptomAnalysisStatus.COMPLETED,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          userId: mockUserId,
          data: mockQuestionnaire,
          status: SymptomAnalysisStatus.COMPLETED,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      
      supabaseService.select.mockResolvedValue(mockAnalyses);

      const result = await service.findSymptomAnalyses(mockUserId, mockLimit, mockOffset);

      expect(result).toEqual({
        data: mockAnalyses,
        count: mockAnalyses.length,
      });
      expect(supabaseService.select).toHaveBeenCalledWith('symptom_analysis', {
        filters: [{
          field: 'user_id',
          operator: 'eq',
          value: mockUserId,
        }] as DatabaseQuery[],
        orderBy: {
          column: 'createdAt',
          ascending: false,
        },
        limit: mockLimit,
        offset: mockOffset,
      } as DatabaseQueryOptions);
    });

    it('should handle empty results', async () => {
      supabaseService.select.mockResolvedValue([]);

      const result = await service.findSymptomAnalyses(mockUserId);

      expect(result).toEqual({
        data: [],
        count: 0,
      });
    });
  });

  describe('createSymptomAnalysis', () => {
    const mockUserId = 'user123';

    it('should create and return analysis', async () => {
      const result = await service.createSymptomAnalysis(mockUserId, mockQuestionnaire);

      expect(result).toMatchObject({
        id: expect.any(String),
        userId: mockUserId,
        data: mockQuestionnaire,
        status: SymptomAnalysisStatus.PENDING,
      });
      expect(supabaseService.insert).toHaveBeenCalled();
      expect(rabbitMQService.publish).toHaveBeenCalled();
      expect(metricsService.recordTaskMetrics).toHaveBeenCalledWith('symptom_analysis', {
        responseTime: expect.any(Number),
        confidence: 1,
        cost: expect.any(Number),
      });
    });

    it('should handle database errors', async () => {
      supabaseService.insert.mockRejectedValue(new Error('Database error'));

      await expect(service.createSymptomAnalysis(mockUserId, mockQuestionnaire))
        .rejects.toThrow('Database error');
    });
  });

  describe('generateReport', () => {
    const mockAnalysisId = '123';
    const mockAnalysis: SymptomAnalysis = {
      id: mockAnalysisId,
      userId: 'user123',
      data: mockQuestionnaire,
      status: SymptomAnalysisStatus.PENDING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it('should generate and return medical report', async () => {
      supabaseService.select.mockResolvedValue([mockAnalysis]);

      const result = await service.generateReport(mockAnalysisId);

      expect(result).toEqual(expect.objectContaining({
        reportId: expect.any(String),
        patientId: mockAnalysis.userId,
      }));
      expect(llmService.generateMedicalReport).toHaveBeenCalled();
      expect(metricsService.recordTaskMetrics).toHaveBeenCalledWith('medical_report', {
        responseTime: expect.any(Number),
        confidence: mockMedicalReport.confidence,
        cost: expect.any(Number),
      });
      expect(supabaseService.update).toHaveBeenCalledWith('symptom_analysis', 
        { filters: [{ field: 'id', operator: 'eq', value: mockAnalysisId }] as DatabaseQuery[] },
        {
          status: SymptomAnalysisStatus.COMPLETED,
          report: expect.any(Object),
          updatedAt: expect.any(String),
        }
      );
    });

    it('should throw error if analysis not found', async () => {
      supabaseService.select.mockResolvedValue([]);

      await expect(service.generateReport(mockAnalysisId))
        .rejects
        .toThrow(`Symptom analysis not found: ${mockAnalysisId}`);
    });

    it('should handle LLM service errors', async () => {
      supabaseService.select.mockResolvedValue([mockAnalysis]);
      llmService.generateMedicalReport.mockRejectedValue(new Error('LLM error'));

      await expect(service.generateReport(mockAnalysisId)).rejects.toThrow('LLM error');
    });
  });

  describe('translateReport', () => {
    const mockAnalysisId = '123';
    const mockAnalysis: SymptomAnalysis = {
      id: mockAnalysisId,
      userId: 'user123',
      data: mockQuestionnaire,
      status: SymptomAnalysisStatus.COMPLETED,
      report: mockMedicalReport,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it('should translate and return medical report', async () => {
      supabaseService.select.mockResolvedValue([mockAnalysis]);

      const result = await service.translateReport(mockAnalysisId, 'es');

      expect(result).toEqual(expect.objectContaining({
        reportId: mockAnalysis.report?.reportId,
        patientId: mockAnalysis.report?.patientId,
      }));
      expect(translationService.translate).toHaveBeenCalledWith(mockAnalysis.report, 'es');
      expect(metricsService.recordTaskMetrics).toHaveBeenCalledWith('report_translation', {
        responseTime: expect.any(Number),
        confidence: 1,
        cost: expect.any(Number),
      });
    });

    it('should throw error if analysis or report not found', async () => {
      supabaseService.select.mockResolvedValue([]);

      await expect(service.translateReport(mockAnalysisId, 'es'))
        .rejects
        .toThrow(`Symptom analysis or report not found: ${mockAnalysisId}`);
    });

    it('should handle translation service errors', async () => {
      supabaseService.select.mockResolvedValue([mockAnalysis]);
      translationService.translate.mockRejectedValue(new Error('Translation error'));

      await expect(service.translateReport(mockAnalysisId, 'es')).rejects.toThrow('Translation error');
    });
  });
}); 