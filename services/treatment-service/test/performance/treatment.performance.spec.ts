import { Test, TestingModule } from '@nestjs/testing';
import { TreatmentService } from '@services/treatment.service';
import { RabbitMQService } from '@rabbitmq/rabbitmq.service';
import { TreatmentType, TreatmentPriority, TreatmentStatus } from '@interfaces/treatment.interface';
import { MedicationDto } from '@dto/medication.dto';
import { FollowUpScheduleDto } from '@dto/follow-up-schedule.dto';
import { performance } from 'perf_hooks';

describe('Treatment Service Performance Tests', () => {
  let service: TreatmentService;

  const mockMedication: MedicationDto = {
    name: 'Amoxicillin',
    dosage: '500mg',
    frequency: 'Three times daily',
    duration: 7,
    instructions: ['Take with food'],
    sideEffects: ['Nausea', 'Diarrhea'],
  };

  const mockFollowUp: FollowUpScheduleDto = {
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    type: 'Check-up',
    provider: 'Dr. Smith',
    notes: 'Review progress',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TreatmentService,
        {
          provide: RabbitMQService,
          useValue: {
            publishTreatmentEvent: jest.fn().mockResolvedValue(undefined),
            publishEmergencyTreatment: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<TreatmentService>(TreatmentService);
  });

  describe('Treatment Plan Creation Performance', () => {
    it('should create a treatment plan within 100ms', async () => {
      const start = performance.now();

      await service.createTreatment({
        patientId: 'PAT-123',
        type: TreatmentType.MEDICATION,
        description: 'Antibiotic treatment',
        priority: TreatmentPriority.HIGH,
        medications: [mockMedication],
        instructions: ['Complete full course'],
        duration: 7,
        frequency: 'Daily',
        startDate: new Date().toISOString(),
        followUpSchedule: [mockFollowUp],
      });

      const end = performance.now();
      const duration = end - start;
      expect(duration).toBeLessThan(100);
    });

    it('should handle concurrent treatment creation efficiently', async () => {
      const numConcurrent = 50;
      const start = performance.now();

      const requests = Array(numConcurrent).fill(null).map((_, index) =>
        service.createTreatment({
          patientId: `PAT-${index}`,
          type: TreatmentType.MEDICATION,
          description: 'Concurrent test treatment',
          priority: TreatmentPriority.MEDIUM,
          medications: [mockMedication],
          instructions: ['Test instructions'],
          duration: 7,
          frequency: 'Daily',
          startDate: new Date().toISOString(),
          followUpSchedule: [mockFollowUp],
        })
      );

      await Promise.all(requests);

      const end = performance.now();
      const duration = end - start;
      const avgTimePerRequest = duration / numConcurrent;

      expect(avgTimePerRequest).toBeLessThan(50);
    });
  });

  describe('Treatment Progress Update Performance', () => {
    it('should update treatment progress within 50ms', async () => {
      // First create a treatment
      const treatment = await service.createTreatment({
        patientId: 'PAT-123',
        type: TreatmentType.MEDICATION,
        description: 'Performance test treatment',
        priority: TreatmentPriority.HIGH,
        medications: [mockMedication],
        instructions: ['Test instructions'],
        duration: 7,
        frequency: 'Daily',
        startDate: new Date().toISOString(),
      });

      const start = performance.now();

      await service.updateTreatmentProgress(treatment.id, {
        status: TreatmentStatus.IN_PROGRESS,
        notes: 'Performance test progress update',
        observations: ['Test observation'],
        complications: [],
        adjustments: [],
        nextCheckupDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const end = performance.now();
      const duration = end - start;
      expect(duration).toBeLessThan(50);
    });
  });

  describe('Memory Usage Tests', () => {
    it('should maintain stable memory usage under load', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Create multiple treatments
      await Promise.all(
        Array(100).fill(null).map((_, index) =>
          service.createTreatment({
            patientId: `PAT-${index}`,
            type: TreatmentType.MEDICATION,
            description: 'Memory test treatment',
            priority: TreatmentPriority.MEDIUM,
            medications: [mockMedication],
            instructions: ['Memory test instructions'],
            duration: 7,
            frequency: 'Daily',
            startDate: new Date().toISOString(),
            followUpSchedule: [mockFollowUp],
          })
        )
      );

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });
}); 