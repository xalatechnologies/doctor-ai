import { Test, TestingModule } from '@nestjs/testing';
import { SymptomAnalysisService } from '../../src/services/symptom-analysis.service';
import { RabbitMQService } from '@app/common/messaging';
import { ConfigModule } from '@nestjs/config';
import { LLMOrchestrationService } from '../../src/services/llm-orchestration.service';
import { MetricsService } from '../../src/services/metrics.service';
import { TranslationService } from '../../src/services/translation.service';

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

describe('Symptom Analysis Integration', () => {
  let symptomAnalysisService: SymptomAnalysisService;
  let rabbitMQService: RabbitMQService;

  const mockRabbitMQService = {
    emit: jest.fn().mockReturnValue({ toPromise: () => Promise.resolve() }),
  };

  const mockLLMService = {
    analyzeText: jest.fn().mockResolvedValue({
      differentials: ['condition1', 'condition2'],
      referrals: ['specialist1', 'specialist2'],
      followUp: ['action1', 'action2'],
      immediateActions: ['action3', 'action4'],
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
      ],
      providers: [
        SymptomAnalysisService,
        {
          provide: RabbitMQService,
          useValue: mockRabbitMQService,
        },
        {
          provide: LLMOrchestrationService,
          useValue: mockLLMService,
        },
        {
          provide: MetricsService,
          useValue: { logError: jest.fn() },
        },
        {
          provide: TranslationService,
          useValue: { translate: jest.fn() },
        },
        {
          provide: 'MEDICAL_TERMINOLOGY',
          useValue: { validateTerm: jest.fn() },
        },
        {
          provide: 'RABBITMQ_SERVICE',
          useValue: mockRabbitMQService,
        },
      ],
    }).compile();

    symptomAnalysisService = module.get<SymptomAnalysisService>(SymptomAnalysisService);
    rabbitMQService = module.get<RabbitMQService>(RabbitMQService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Emergency Assessment Integration', () => {
    it('should process and publish emergency assessment', async () => {
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

      await symptomAnalysisService.handleEmergencyAssessment(mockEmergencyData);

      expect(mockRabbitMQService.emit).toHaveBeenCalledWith(
        'emergency.assessment.completed',
        expect.objectContaining({
          analysis: expect.any(Object),
          patientData: mockEmergencyData.patientData
        })
      );
    });

    it('should handle multiple emergency assessments concurrently', async () => {
      const emergencyData: EmergencyAssessmentData[] = [
        {
          assessment: {
            category: 'CARDIAC',
            severity: 'HIGH',
            immediateActions: ['Call emergency services']
          },
          patientData: { medications: ['aspirin'] }
        },
        {
          assessment: {
            category: 'RESPIRATORY',
            severity: 'HIGH',
            immediateActions: ['Administer oxygen']
          },
          patientData: { medications: ['albuterol'] }
        }
      ];

      await Promise.all(emergencyData.map(data => 
        symptomAnalysisService.handleEmergencyAssessment(data)
      ));

      expect(mockRabbitMQService.emit).toHaveBeenCalledTimes(2);
      emergencyData.forEach(data => {
        expect(mockRabbitMQService.emit).toHaveBeenCalledWith(
          'emergency.assessment.completed',
          expect.objectContaining({
            analysis: expect.any(Object),
            patientData: data.patientData
          })
        );
      });
    });

    it('should handle messaging service errors', async () => {
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

      mockRabbitMQService.emit.mockRejectedValueOnce(
        new Error('Failed to publish')
      );

      await expect(symptomAnalysisService.handleEmergencyAssessment(mockEmergencyData))
        .rejects
        .toThrow('Failed to process emergency assessment');
    });
  });
}); 