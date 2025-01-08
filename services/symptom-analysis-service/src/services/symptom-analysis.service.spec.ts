import { Test, TestingModule } from '@nestjs/testing';
import { SymptomAnalysisService } from './symptom-analysis.service';
import {
  RabbitMQService,
  LLMOrchestrationService,
  TranslationService,
  MetricsService,
  SupabaseService,
} from '@app/common';
import { QuestionnaireDto } from '@/models/questionnaire.dto';
import { SymptomAnalysis } from '@/models/symptom-analysis.model';
import { MedicalReport } from '@/models/medical-report.model';

describe('SymptomAnalysisService', () => {
  let service: SymptomAnalysisService;
  let rabbitMQService: RabbitMQService;
  let llmService: LLMOrchestrationService;
  let translationService: TranslationService;
  let metricsService: MetricsService;
  let supabaseService: SupabaseService;

  const mockQuestionnaire: QuestionnaireDto = {
    symptoms: ['chest pain'],
    medicalHistory: ['hypertension'],
    medications: ['aspirin'],
    allergies: [],
  };

  const mockAnalysis: SymptomAnalysis = {
    id: 'test-id',
    userId: 'test-user',
    data: mockQuestionnaire,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockReport: MedicalReport = {
    id: 'test-report',
    patientId: 'test-patient',
    symptoms: [{
      description: 'chest pain',
      severity: 7,
      duration: 'acute',
      interpretation: 'Severe chest pain',
      riskFactors: ['hypertension'],
    }],
    diagnosis: {
      primaryDiagnosis: 'Angina',
      differentialDiagnoses: ['Heart Attack', 'GERD'],
      confidence: 0.8,
    },
    recommendations: ['Seek immediate medical attention'],
    followUpPlan: ['Schedule cardiology appointment'],
    urgencyLevel: 'HIGH',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
            generateMedicalReport: jest.fn().mockResolvedValue(mockReport),
          },
        },
        {
          provide: TranslationService,
          useValue: {
            translate: jest.fn().mockImplementation((content) => Promise.resolve(content)),
          },
        },
        {
          provide: MetricsService,
          useValue: {
            incrementCounter: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: SupabaseService,
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockAnalysis),
            find: jest.fn().mockResolvedValue({ data: [mockAnalysis], count: 1 }),
            create: jest.fn().mockResolvedValue(mockAnalysis),
            update: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<SymptomAnalysisService>(SymptomAnalysisService);
    rabbitMQService = module.get<RabbitMQService>(RabbitMQService);
    llmService = module.get<LLMOrchestrationService>(LLMOrchestrationService);
    translationService = module.get<TranslationService>(TranslationService);
    metricsService = module.get<MetricsService>(MetricsService);
    supabaseService = module.get<SupabaseService>(SupabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Setup', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have required services injected', () => {
      expect(rabbitMQService).toBeDefined();
      expect(llmService).toBeDefined();
      expect(translationService).toBeDefined();
      expect(metricsService).toBeDefined();
      expect(supabaseService).toBeDefined();
    });
  });

  describe('findSymptomAnalysis', () => {
    it('should find symptom analysis by id', async () => {
      const result = await service.findSymptomAnalysis('test-id');
      expect(result).toEqual(mockAnalysis);
      expect(supabaseService.findOne).toHaveBeenCalledWith('symptom_analysis', {
        field: 'id',
        operator: 'eq',
        value: 'test-id',
      });
    });
  });

  describe('findSymptomAnalyses', () => {
    it('should find symptom analyses by user id', async () => {
      const result = await service.findSymptomAnalyses('test-user');
      expect(result).toEqual({ data: [mockAnalysis], count: 1 });
      expect(supabaseService.find).toHaveBeenCalledWith('symptom_analysis', {
        filters: [{
          field: 'user_id',
          operator: 'eq',
          value: 'test-user',
        }],
        orderBy: {
          column: 'createdAt',
          ascending: false,
        },
        limit: 10,
        offset: 0,
      });
    });
  });

  describe('createSymptomAnalysis', () => {
    it('should create symptom analysis', async () => {
      const result = await service.createSymptomAnalysis('test-user', mockQuestionnaire);
      expect(result).toEqual(mockAnalysis);
      expect(supabaseService.create).toHaveBeenCalled();
      expect(rabbitMQService.publish).toHaveBeenCalledWith('symptom.analysis.created', expect.any(Object));
      expect(metricsService.incrementCounter).toHaveBeenCalledWith('symptom_analysis_created');
    });
  });

  describe('generateReport', () => {
    it('should generate medical report', async () => {
      const result = await service.generateReport('test-id');
      expect(result).toEqual(mockReport);
      expect(llmService.generateMedicalReport).toHaveBeenCalled();
      expect(metricsService.incrementCounter).toHaveBeenCalledWith('medical_report_generated');
      expect(supabaseService.update).toHaveBeenCalled();
    });

    it('should throw error if analysis not found', async () => {
      jest.spyOn(supabaseService, 'findOne').mockResolvedValueOnce(null);
      await expect(service.generateReport('test-id')).rejects.toThrow('Symptom analysis not found');
    });
  });

  describe('translateReport', () => {
    it('should translate medical report', async () => {
      const result = await service.translateReport('test-id', 'es');
      expect(result).toBeDefined();
      expect(translationService.translate).toHaveBeenCalled();
      expect(metricsService.incrementCounter).toHaveBeenCalledWith('medical_report_translated');
    });

    it('should throw error if analysis or report not found', async () => {
      jest.spyOn(supabaseService, 'findOne').mockResolvedValueOnce({ ...mockAnalysis, report: undefined });
      await expect(service.translateReport('test-id', 'es')).rejects.toThrow('Symptom analysis or report not found');
    });
  });
}); 