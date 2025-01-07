import { Test, TestingModule } from '@nestjs/testing';
import { SymptomAnalysisService } from '@services/symptom-analysis.service';
import { RabbitMQService } from '@app/common/messaging';
import { AnalyzeSymptomDto } from '@dto/analyze-symptom.dto';
import { SymptomAnalysis, EmergencyAnalysis } from '@interfaces/symptom.interface';

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

// Add custom matcher type declaration
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeBetween(floor: number, ceiling: number): R;
    }
  }
}

describe('SymptomAnalysisService', () => {
  let service: SymptomAnalysisService;
  let rabbitMQService: RabbitMQService;

  const mockRabbitMQService = {
    emit: jest.fn().mockReturnValue({ toPromise: () => Promise.resolve() }),
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

    it('should analyze symptoms and return valid analysis', async () => {
      const result = await service.analyzeSymptom(mockSymptomDto);

      expect(result).toMatchObject({
        symptomId: expect.stringMatching(/^SYM-\d+-[a-z0-9]+$/),
        primarySymptom: mockSymptomDto.primarySymptom,
        secondarySymptoms: mockSymptomDto.secondarySymptoms,
        severity: {
          level: expect.any(Number),
          description: expect.stringMatching(/^(Mild|Moderate|Severe)$/),
        },
        possibleConditions: expect.arrayContaining([
          expect.stringMatching(/chest pain/i),
        ]),
        recommendations: expect.arrayContaining([
          expect.any(String),
        ]),
        urgencyLevel: expect.stringMatching(/^(LOW|MEDIUM|HIGH)$/),
        requiredSpecialties: expect.arrayContaining([
          expect.any(String),
        ]),
        followUpActions: expect.arrayContaining([
          expect.any(String),
        ]),
        timestamp: expect.any(String),
      });
    });

    it('should publish analysis result to RabbitMQ with correct data', async () => {
      const result = await service.analyzeSymptom(mockSymptomDto);

      expect(rabbitMQService.emit).toHaveBeenCalledWith(
        'symptom.analyzed',
        {
          analysis: result,
          originalData: mockSymptomDto,
        }
      );
    });

    it('should handle RabbitMQ publishing errors gracefully', async () => {
      mockRabbitMQService.emit.mockRejectedValueOnce(
        new Error('Failed to publish')
      );

      const result = await service.analyzeSymptom(mockSymptomDto);
      expect(result).toBeDefined();
      expect(result.primarySymptom).toBe(mockSymptomDto.primarySymptom);
    });

    it('should handle missing optional fields', async () => {
      const minimalDto: AnalyzeSymptomDto = {
        description: 'headache',
        primarySymptom: 'headache',
        painLevel: 5,
        severityLevel: 4,
        duration: 'acute',
      };

      const result = await service.analyzeSymptom(minimalDto);
      expect(result).toBeDefined();
      expect(result.secondarySymptoms).toEqual([]);
      expect(result.recommendations).toBeDefined();
      expect(result.urgencyLevel).toBe('LOW');
    });
  });

  describe('handleEmergencyAssessment', () => {
    const mockEmergencyData: EmergencyAssessmentData = {
      assessment: {
        category: 'CARDIAC',
        severity: 'HIGH',
        immediateActions: ['Call emergency services']
      },
      patientData: {
        medications: ['aspirin']
      }
    };

    it('should process emergency assessment and publish detailed analysis', async () => {
      await service.handleEmergencyAssessment(mockEmergencyData);

      expect(rabbitMQService.emit).toHaveBeenCalledWith(
        'emergency.assessment.completed',
        expect.objectContaining({
          analysis: expect.any(Object),
          patientData: mockEmergencyData.patientData
        })
      );
    });

    it('should handle publishing errors gracefully', async () => {
      mockRabbitMQService.emit.mockRejectedValueOnce(
        new Error('Failed to publish')
      );

      await expect(service.handleEmergencyAssessment(mockEmergencyData))
        .rejects
        .toThrow('Failed to process emergency assessment');
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

    it('should adjust severity based on chronic duration', async () => {
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
    it('should generate appropriate recommendations based on severity', async () => {
      const severityLevels = [
        { severity: 9, expectedRecommendation: 'Seek immediate medical attention' },
        { severity: 6, expectedRecommendation: 'Schedule an appointment' },
        { severity: 3, expectedRecommendation: 'Monitor symptoms' },
      ];

      for (const { severity, expectedRecommendation } of severityLevels) {
        const result = await service.analyzeSymptom({
          description: 'test symptom',
          primarySymptom: 'test',
          painLevel: severity,
          severityLevel: severity,
          duration: 'acute',
        });

        expect(result.recommendations).toEqual(
          expect.arrayContaining([
            expect.stringContaining(expectedRecommendation),
          ]),
        );
      }
    });

    it('should include medication-related recommendations when medications are present', async () => {
      const result = await service.analyzeSymptom({
        description: 'moderate pain',
        primarySymptom: 'pain',
        painLevel: 5,
        severityLevel: 5,
        duration: 'few days',
        currentMedications: ['ibuprofen'],
      });

      expect(result.recommendations).toEqual(
        expect.arrayContaining([
          'Continue prescribed medications as directed',
          'Keep a record of medication effectiveness',
        ]),
      );
    });

    it('should include alleviating factors in recommendations', async () => {
      const result = await service.analyzeSymptom({
        description: 'back pain',
        primarySymptom: 'back pain',
        painLevel: 6,
        severityLevel: 5,
        duration: 'few days',
        alleviatingFactors: ['rest', 'ice pack'],
      });

      expect(result.recommendations).toEqual(
        expect.arrayContaining([
          'Continue with rest as it helps alleviate symptoms',
          'Continue with ice pack as it helps alleviate symptoms',
        ]),
      );
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