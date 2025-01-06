import { Test, TestingModule } from '@nestjs/testing';
import { SymptomAnalysisService } from '@services/symptom-analysis.service';
import { RabbitMQService } from '@rabbitmq/rabbitmq.service';
import { AnalyzeSymptomDto } from '@dto/analyze-symptom.dto';
import { SymptomAnalysis, EmergencyAnalysis } from '@interfaces/symptom.interface';

describe('SymptomAnalysisService', () => {
  let service: SymptomAnalysisService;
  let rabbitMQService: RabbitMQService;

  const mockRabbitMQService = {
    publishEmergencyAssessment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SymptomAnalysisService,
        {
          provide: RabbitMQService,
          useValue: mockRabbitMQService,
        },
      ],
    }).compile();

    service = module.get<SymptomAnalysisService>(SymptomAnalysisService);
    rabbitMQService = module.get<RabbitMQService>(RabbitMQService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Setup', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have RabbitMQ service injected', () => {
      expect(rabbitMQService).toBeDefined();
    });
  });

  describe('analyzeSymptom', () => {
    const mockSymptomDto: AnalyzeSymptomDto = {
      description: 'severe chest pain',
      primarySymptom: 'chest pain',
      painLevel: 8,
      severityLevel: 7,
      duration: 'acute',
      secondarySymptoms: ['shortness of breath'],
      alleviatingFactors: ['rest'],
      aggravatingFactors: ['movement'],
      currentMedications: ['aspirin'],
      patientHistory: 'hypertension',
    };

    it('should analyze symptoms and return analysis', async () => {
      const result = await service.analyzeSymptom(mockSymptomDto);

      expect(result).toBeDefined();
      expect(result.primarySymptom).toBe(mockSymptomDto.primarySymptom);
      expect(result.severity.level).toBeGreaterThanOrEqual(mockSymptomDto.severityLevel);
      expect(result.urgencyLevel).toBe('HIGH');
      expect(result.recommendations).toContain('Seek immediate medical attention');
    });

    it('should publish analysis result to RabbitMQ', async () => {
      const result = await service.analyzeSymptom(mockSymptomDto);

      expect(rabbitMQService.publishEmergencyAssessment).toHaveBeenCalledWith(
        'symptom.analyzed',
        expect.objectContaining({
          analysis: result,
          originalData: mockSymptomDto,
        }),
      );
    });

    it('should handle errors gracefully', async () => {
      mockRabbitMQService.publishEmergencyAssessment.mockRejectedValueOnce(new Error('Failed to publish'));

      const result = await service.analyzeSymptom(mockSymptomDto);

      expect(result).toBeDefined();
      expect(result.primarySymptom).toBe(mockSymptomDto.primarySymptom);
    });
  });

  describe('handleEmergencyAssessment', () => {
    const mockEmergencyData = {
      assessment: {
        category: 'CARDIAC',
        severity: 'HIGH',
        immediateActions: ['Call emergency services'],
      },
      patientData: {
        medications: ['aspirin'],
      },
    };

    it('should process emergency assessment and publish analysis', async () => {
      await service.handleEmergencyAssessment(mockEmergencyData);

      expect(rabbitMQService.publishEmergencyAssessment).toHaveBeenCalledWith(
        'symptom.emergency.analyzed',
        expect.objectContaining({
          emergencyData: mockEmergencyData,
          detailedAnalysis: expect.any(Object),
        }),
      );
    });

    it('should generate appropriate specialist referrals', async () => {
      await service.handleEmergencyAssessment(mockEmergencyData);

      expect(rabbitMQService.publishEmergencyAssessment).toHaveBeenCalledWith(
        'symptom.emergency.analyzed',
        expect.objectContaining({
          detailedAnalysis: expect.objectContaining({
            specialistReferrals: expect.arrayContaining(['Cardiologist']),
          }),
        }),
      );
    });

    it('should handle errors gracefully', async () => {
      mockRabbitMQService.publishEmergencyAssessment.mockRejectedValueOnce(new Error('Failed to publish'));

      await expect(service.handleEmergencyAssessment(mockEmergencyData)).rejects.toThrow();
    });
  });

  describe('Severity Calculation', () => {
    it('should calculate HIGH severity for severe symptoms', async () => {
      const result = await service.analyzeSymptom({
        description: 'severe chest pain',
        primarySymptom: 'chest pain',
        painLevel: 9,
        severityLevel: 8,
        duration: 'acute',
      });

      expect(result.severity.level).toBeGreaterThanOrEqual(8);
      expect(result.severity.description).toBe('Severe');
      expect(result.urgencyLevel).toBe('HIGH');
    });

    it('should calculate MEDIUM severity for moderate symptoms', async () => {
      const result = await service.analyzeSymptom({
        description: 'moderate headache',
        primarySymptom: 'headache',
        painLevel: 6,
        severityLevel: 5,
        duration: 'few hours',
      });

      expect(result.severity.level).toBeBetween(5, 7);
      expect(result.severity.description).toBe('Moderate');
      expect(result.urgencyLevel).toBe('MEDIUM');
    });

    it('should adjust severity based on duration', async () => {
      const result = await service.analyzeSymptom({
        description: 'persistent cough',
        primarySymptom: 'cough',
        painLevel: 3,
        severityLevel: 4,
        duration: 'chronic',
      });

      expect(result.severity.level).toBeGreaterThan(4);
    });
  });

  describe('Recommendations Generation', () => {
    it('should generate immediate action recommendations for high severity', async () => {
      const result = await service.analyzeSymptom({
        description: 'severe allergic reaction',
        primarySymptom: 'allergic reaction',
        painLevel: 8,
        severityLevel: 9,
        duration: 'acute',
      });

      expect(result.recommendations).toContain('Seek immediate medical attention');
      expect(result.followUpActions).toContain('Immediate medical evaluation required');
    });

    it('should include medication-related recommendations', async () => {
      const result = await service.analyzeSymptom({
        description: 'moderate pain',
        primarySymptom: 'pain',
        painLevel: 5,
        severityLevel: 5,
        duration: 'few days',
        currentMedications: ['ibuprofen'],
      });

      expect(result.recommendations).toContain('Continue prescribed medications as directed');
    });

    it('should consider alleviating factors in recommendations', async () => {
      const result = await service.analyzeSymptom({
        description: 'back pain',
        primarySymptom: 'back pain',
        painLevel: 6,
        severityLevel: 5,
        duration: 'few days',
        alleviatingFactors: ['rest', 'ice pack'],
      });

      expect(result.recommendations).toContain('Continue with rest as it helps alleviate symptoms');
      expect(result.recommendations).toContain('Continue with ice pack as it helps alleviate symptoms');
    });
  });

  describe('Specialty Determination', () => {
    it('should determine appropriate specialties based on symptoms', async () => {
      const result = await service.analyzeSymptom({
        description: 'severe chest pain with heart palpitations',
        primarySymptom: 'chest pain',
        painLevel: 8,
        severityLevel: 8,
        duration: 'acute',
        secondarySymptoms: ['palpitations', 'shortness of breath'],
      });

      expect(result.requiredSpecialties).toContain('General Practice');
      expect(result.requiredSpecialties.length).toBeGreaterThanOrEqual(1);
    });
  });
});

// Add custom matcher for number range
expect.extend({
  toBeBetween(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be between ${floor} and ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be between ${floor} and ${ceiling}`,
        pass: false,
      };
    }
  },
}); 