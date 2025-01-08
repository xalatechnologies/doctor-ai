import { Test, TestingModule } from '@nestjs/testing';
import { SymptomAnalysisService } from './symptom-analysis.service';
import {
  RabbitMQService,
  LLMOrchestrationService,
  TranslationService,
  MetricsService,
  SupabaseService,
  SymptomRiskInput,
  RiskAssessmentResponse,
  MedicalReport,
} from '@app/common';
import { QuestionnaireDto } from '../models/questionnaire.dto';

describe('SymptomAnalysisService', () => {
  let service: SymptomAnalysisService;
  let rabbitMQService: jest.Mocked<RabbitMQService>;
  let llmService: jest.Mocked<LLMOrchestrationService>;
  let translationService: jest.Mocked<TranslationService>;
  let metricsService: jest.Mocked<MetricsService>;
  let supabaseService: jest.Mocked<SupabaseService>;

  const mockRiskAssessment: RiskAssessmentResponse = {
    riskLevel: 'MEDIUM',
    recommendations: ['Seek medical attention'],
    urgencyLevel: 'MEDIUM',
    followUpRequired: true,
    timestamp: new Date().toISOString(),
  };

  const mockMedicalReport: MedicalReport = {
    reportId: '123',
    timestamp: new Date(),
    patientId: 'user123',
    symptoms: [{
      description: 'Headache',
      severity: 7,
      duration: '2 days',
      onset: 'Gradual',
      interpretation: 'Moderate tension headache',
      riskFactors: ['Stress', 'Dehydration'],
    }],
    vitalSigns: {
      bloodPressure: '120/80',
      heartRate: 75,
      temperature: 37,
      respiratoryRate: 16,
      oxygenSaturation: 98,
      summary: 'Normal vital signs',
      findings: ['All vitals within normal range'],
      requiresAttention: false,
    },
    diagnosis: {
      primaryDiagnosis: 'Tension Headache',
      differentialDiagnoses: ['Migraine', 'Cluster Headache'],
      confidence: 0.85,
    },
    recommendations: ['Rest', 'Hydration', 'OTC pain medication'],
    followUpPlan: ['Monitor symptoms', 'Return if worsening'],
    urgencyLevel: 'LOW',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SymptomAnalysisService,
        {
          provide: RabbitMQService,
          useValue: {
            publish: jest.fn(),
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
            translate: jest.fn().mockImplementation((report) => Promise.resolve(report)),
          },
        },
        {
          provide: MetricsService,
          useValue: {
            incrementCounter: jest.fn(),
          },
        },
        {
          provide: SupabaseService,
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
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
      symptoms: ['headache', 'nausea'],
      medicalHistory: 'None',
      severityLevel: 7,
      age: 30,
    };

    it('should assess risk and return assessment', async () => {
      const result = await service.assessRisk(mockInput);

      expect(result).toEqual(mockRiskAssessment);
      expect(llmService.assessSymptomRisk).toHaveBeenCalledWith(mockInput);
      expect(metricsService.incrementCounter).toHaveBeenCalledWith('symptom_risk_assessed');
    });
  });

  describe('findSymptomAnalysis', () => {
    const mockId = '123';

    it('should find and return analysis by ID', async () => {
      const mockAnalysis = { id: mockId };
      supabaseService.findOne.mockResolvedValue(mockAnalysis);

      const result = await service.findSymptomAnalysis(mockId);

      expect(result).toEqual(mockAnalysis);
      expect(supabaseService.findOne).toHaveBeenCalledWith('symptom_analysis', {
        field: 'id',
        operator: 'eq',
        value: mockId,
      });
    });
  });

  describe('createSymptomAnalysis', () => {
    const mockUserId = 'user123';
    const mockQuestionnaire: QuestionnaireDto = {
      symptoms: ['headache'],
      medicalHistory: 'None',
      medications: [],
      allergies: [],
    };

    it('should create and return analysis', async () => {
      const result = await service.createSymptomAnalysis(mockUserId, mockQuestionnaire);

      expect(result).toMatchObject({
        id: expect.any(String),
        userId: mockUserId,
        data: mockQuestionnaire,
        status: 'pending',
      });
      expect(supabaseService.create).toHaveBeenCalled();
      expect(rabbitMQService.publish).toHaveBeenCalled();
      expect(metricsService.incrementCounter).toHaveBeenCalledWith('symptom_analysis_created');
    });
  });

  describe('generateReport', () => {
    const mockAnalysisId = '123';
    const mockAnalysis = {
      id: mockAnalysisId,
      userId: 'user123',
      data: {
        symptoms: ['headache'],
        medicalHistory: 'None',
        medications: [],
        allergies: [],
      },
    };

    it('should generate and return medical report', async () => {
      supabaseService.findOne.mockResolvedValue(mockAnalysis);

      const result = await service.generateReport(mockAnalysisId);

      expect(result).toEqual(expect.objectContaining({
        reportId: expect.any(String),
        patientId: mockAnalysis.userId,
      }));
      expect(llmService.generateMedicalReport).toHaveBeenCalled();
      expect(metricsService.incrementCounter).toHaveBeenCalledWith('medical_report_generated');
      expect(supabaseService.update).toHaveBeenCalled();
    });

    it('should throw error if analysis not found', async () => {
      supabaseService.findOne.mockResolvedValue(null);

      await expect(service.generateReport(mockAnalysisId))
        .rejects
        .toThrow(`Symptom analysis not found: ${mockAnalysisId}`);
    });
  });

  describe('translateReport', () => {
    const mockAnalysisId = '123';
    const mockAnalysis = {
      id: mockAnalysisId,
      report: mockMedicalReport,
    };

    it('should translate and return medical report', async () => {
      supabaseService.findOne.mockResolvedValue(mockAnalysis);

      const result = await service.translateReport(mockAnalysisId, 'es');

      expect(result).toEqual(expect.objectContaining({
        reportId: mockAnalysis.report.reportId,
        patientId: mockAnalysis.report.patientId,
      }));
      expect(translationService.translate).toHaveBeenCalledWith(mockAnalysis.report, 'es');
      expect(metricsService.incrementCounter).toHaveBeenCalledWith('medical_report_translated');
    });

    it('should throw error if analysis or report not found', async () => {
      supabaseService.findOne.mockResolvedValue(null);

      await expect(service.translateReport(mockAnalysisId, 'es'))
        .rejects
        .toThrow(`Symptom analysis or report not found: ${mockAnalysisId}`);
    });
  });
}); 