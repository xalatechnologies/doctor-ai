import { Test, TestingModule } from '@nestjs/testing';
import { EmergencyService } from '@services/emergency.service';
import { AssessEmergencyDto } from '@dto/assess-emergency.dto';
import { RabbitMQService } from '@app/common/messaging';
import { LoggerService } from '@app/common/logger';
import { LLMService } from '@app/common/llm';
import { MetricsService } from '@app/common/metrics';

describe('EmergencyService', () => {
  let service: EmergencyService;
  let rabbitMQService: RabbitMQService;
  let loggerService: LoggerService;
  let llmService: LLMService;
  let metricsService: MetricsService;

  const mockRabbitMQService = {
    emit: jest.fn(),
  };

  const mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
    startTimer: jest.fn().mockReturnValue({ end: jest.fn() }),
  };

  const mockLLMService = {
    generateResponse: jest.fn().mockResolvedValue('Analysis: High severity'),
  };

  const mockMetricsService = {
    incrementLogCount: jest.fn(),
    observeLogDuration: jest.fn(),
  };

  const validInput: AssessEmergencyDto = {
    description: 'severe chest pain and shortness of breath',
    primarySymptom: 'chest pain',
    secondarySymptoms: ['shortness of breath'],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmergencyService,
        { provide: RabbitMQService, useValue: mockRabbitMQService },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: LLMService, useValue: mockLLMService },
        { provide: MetricsService, useValue: mockMetricsService },
      ],
    }).compile();

    service = module.get<EmergencyService>(EmergencyService);
    rabbitMQService = module.get<RabbitMQService>(RabbitMQService);
    loggerService = module.get<LoggerService>(LoggerService);
    llmService = module.get<LLMService>(LLMService);
    metricsService = module.get<MetricsService>(MetricsService);

    jest.clearAllMocks();
  });

  describe('Emergency Assessment', () => {
    it('should assess emergency correctly', async () => {
      const result = await service.assessEmergency(validInput);
      expect(result.description).toBe(validInput.description);
      expect(result.primarySymptom).toBe(validInput.primarySymptom);
      expect(result.analysis).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    it('should emit assessment event', async () => {
      const result = await service.assessEmergency(validInput);
      expect(rabbitMQService.emit).toHaveBeenCalledWith(
        'emergency.assessed',
        expect.objectContaining({
          description: validInput.description,
          primarySymptom: validInput.primarySymptom,
          analysis: expect.any(String),
          timestamp: expect.any(String),
        }),
      );
    });

    it('should handle empty secondary symptoms', async () => {
      const input = { ...validInput, secondarySymptoms: [] };
      const result = await service.assessEmergency(input);
      expect(result.secondarySymptoms).toEqual([]);
    });

    it('should use LLM for analysis', async () => {
      await service.assessEmergency(validInput);
      expect(llmService.generateResponse).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should throw error for missing required data', async () => {
      const invalidInput = {
        description: '',
        primarySymptom: '',
      } as AssessEmergencyDto;

      await expect(service.assessEmergency(invalidInput))
        .rejects.toThrow();
    });

    it('should handle messaging errors gracefully', async () => {
      mockRabbitMQService.emit.mockRejectedValueOnce(new Error('Messaging failed'));
      const result = await service.assessEmergency(validInput);
      expect(result).toBeDefined();
      expect(loggerService.error).toHaveBeenCalled();
    });
  });

  describe('Treatment Plan Handling', () => {
    const treatmentData = {
      treatmentPlan: { id: '123', priority: 'HIGH' },
      patientData: { id: '456' },
    };

    it('should process treatment plan', async () => {
      await service.handleTreatmentPlan(treatmentData);
      expect(rabbitMQService.emit).toHaveBeenCalledWith(
        'emergency.treatment.updated',
        expect.objectContaining({
          patientId: '456',
          treatmentPlanId: '123',
        }),
      );
    });

    it('should handle treatment plan errors', async () => {
      mockRabbitMQService.emit.mockRejectedValueOnce(new Error('Processing failed'));
      await expect(service.handleTreatmentPlan(treatmentData))
        .rejects.toThrow();
      expect(loggerService.error).toHaveBeenCalled();
    });
  });
}); 