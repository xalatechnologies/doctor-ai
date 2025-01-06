import { Test, TestingModule } from '@nestjs/testing';
import { EmergencyService } from '@services/emergency.service';
import { EmergencyCategory, EmergencySeverity } from '@interfaces/emergency.interface';
import { EmergencyAssessmentException, InvalidEmergencyDataException } from '@exceptions/emergency.exception';
import { AssessEmergencyDto } from '@dto/assess-emergency.dto';
import { RabbitMQService } from '@rabbitmq/rabbitmq.service';

describe('EmergencyService', () => {
  let service: EmergencyService;
  let rabbitMQService: RabbitMQService;

  const mockRabbitMQService = {
    publishEmergencyAssessment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmergencyService,
        {
          provide: RabbitMQService,
          useValue: mockRabbitMQService,
        },
      ],
    }).compile();

    service = module.get<EmergencyService>(EmergencyService);
    rabbitMQService = module.get<RabbitMQService>(RabbitMQService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Setup', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have required methods', () => {
      expect(service.assessEmergency).toBeDefined();
      expect(typeof service.assessEmergency).toBe('function');
    });
  });

  describe('Emergency Assessment', () => {
    const testCases = [
      {
        input: {
          description: 'severe chest pain and shortness of breath',
          category: EmergencyCategory.CARDIAC,
          primarySymptom: 'chest pain',
          severityLevel: 9,
          distressLevel: 8,
          onset: 'sudden',
        },
        expectedCategory: EmergencyCategory.CARDIAC,
        expectedSeverity: EmergencySeverity.HIGH,
        label: 'cardiac emergency',
      },
      {
        input: {
          description: 'difficulty breathing and wheezing',
          category: EmergencyCategory.RESPIRATORY,
          primarySymptom: 'difficulty breathing',
          severityLevel: 8,
          distressLevel: 7,
          onset: 'rapid',
        },
        expectedCategory: EmergencyCategory.RESPIRATORY,
        expectedSeverity: EmergencySeverity.HIGH,
        label: 'respiratory emergency',
      },
      {
        input: {
          description: 'mild fever and cough',
          category: EmergencyCategory.RESPIRATORY,
          primarySymptom: 'fever',
          severityLevel: 4,
          distressLevel: 3,
          onset: 'gradual',
        },
        expectedCategory: EmergencyCategory.RESPIRATORY,
        expectedSeverity: EmergencySeverity.LOW,
        label: 'mild symptoms',
      },
    ];

    testCases.forEach(({ input, expectedCategory, expectedSeverity, label }) => {
      it(`should correctly assess ${label}`, async () => {
        const result = await service.assessEmergency(input as AssessEmergencyDto);
        expect(result.category).toBe(expectedCategory);
        expect(result.severity).toBe(expectedSeverity);
        expect(result.emergencyId).toBeDefined();
        expect(result.timestamp).toBeDefined();
      });
    });

    it('should include appropriate recommendations for high severity cases', async () => {
      const input = {
        description: 'severe chest pain with radiation to left arm',
        category: EmergencyCategory.CARDIAC,
        primarySymptom: 'chest pain',
        severityLevel: 9,
        distressLevel: 9,
        onset: 'sudden',
        currentMedications: ['aspirin', 'metoprolol'],
      };

      const result = await service.assessEmergency(input as AssessEmergencyDto);
      expect(result.recommendations).toContain('Call emergency services (911) immediately');
      expect(result.immediateActions).toContain('Monitor vital signs');
      expect(result.requiresAmbulance).toBe(true);
    });

    it('should handle medication information appropriately', async () => {
      const input = {
        description: 'chest discomfort',
        category: EmergencyCategory.CARDIAC,
        primarySymptom: 'chest discomfort',
        severityLevel: 6,
        distressLevel: 5,
        onset: 'gradual',
        currentMedications: ['warfarin', 'aspirin'],
      };

      const result = await service.assessEmergency(input as AssessEmergencyDto);
      expect(result.recommendations).toContain('Alert medical staff about blood thinners');
      expect(result.triageScore).toBeGreaterThan(5);
    });
  });

  describe('Error Handling', () => {
    it('should throw InvalidEmergencyDataException for missing required data', async () => {
      const invalidInput = {
        description: '',
        category: EmergencyCategory.CARDIAC,
        primarySymptom: '',
        severityLevel: 5,
        distressLevel: 5,
        onset: 'sudden',
      };

      await expect(service.assessEmergency(invalidInput as AssessEmergencyDto))
        .rejects.toThrow(InvalidEmergencyDataException);
    });

    it('should handle empty arrays for optional fields', async () => {
      const input = {
        description: 'feeling dizzy',
        category: EmergencyCategory.NEUROLOGICAL,
        primarySymptom: 'dizziness',
        severityLevel: 4,
        distressLevel: 3,
        onset: 'gradual',
        secondarySymptoms: [],
        currentMedications: [],
      };

      const result = await service.assessEmergency(input as AssessEmergencyDto);
      expect(result).toBeDefined();
      expect(result.severity).toBe(EmergencySeverity.LOW);
    });
  });

  describe('RabbitMQ Integration', () => {
    it('should publish assessment results to RabbitMQ', async () => {
      const input = {
        description: 'severe headache',
        category: EmergencyCategory.NEUROLOGICAL,
        primarySymptom: 'headache',
        severityLevel: 7,
        distressLevel: 6,
        onset: 'sudden',
      };

      const result = await service.assessEmergency(input as AssessEmergencyDto);
      expect(rabbitMQService.publishEmergencyAssessment).toHaveBeenCalledWith(
        'emergency.assessed',
        expect.objectContaining({
          assessment: result,
          originalData: input,
        }),
      );
    });

    it('should continue execution if publishing fails', async () => {
      mockRabbitMQService.publishEmergencyAssessment.mockRejectedValueOnce(new Error('Publishing failed'));

      const input = {
        description: 'mild pain',
        category: EmergencyCategory.TRAUMA,
        primarySymptom: 'pain',
        severityLevel: 3,
        distressLevel: 2,
        onset: 'gradual',
      };

      const result = await service.assessEmergency(input as AssessEmergencyDto);
      expect(result).toBeDefined();
      expect(result.severity).toBe(EmergencySeverity.LOW);
    });
  });
}); 