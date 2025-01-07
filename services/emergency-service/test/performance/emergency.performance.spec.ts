import { Test, TestingModule } from '@nestjs/testing';
import { EmergencyService } from '@services/emergency.service';
import { performance } from 'perf_hooks';

describe('Emergency Service Performance Tests', () => {
  let service: EmergencyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmergencyService],
    }).compile();

    service = module.get<EmergencyService>(EmergencyService);
  });

  async function measureAverageResponseTime(numberOfRequests: number): Promise<number> {
    const start = performance.now();
    
    await Promise.all(Array(numberOfRequests).fill(null).map(() =>
      service.assessEmergency({
        description: 'test case',
        age: '50',
      })
    ));
    
    const end = performance.now();
    return (end - start) / numberOfRequests;
  }

  describe('Response Time Tests', () => {
    it('should assess emergency within 100ms', async () => {
      const start = performance.now();
      
      await service.assessEmergency({
        description: 'severe chest pain',
        age: '65',
      });
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(100);
    });

    it('should handle complex cases within 200ms', async () => {
      const start = performance.now();
      
      await service.assessEmergency({
        description: 'severe chest pain with difficulty breathing',
        age: '70',
        existingConditions: ['diabetes', 'hypertension', 'heart disease'],
        currentMedications: ['insulin', 'aspirin', 'metformin', 'lisinopril'],
      });
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(200);
    });
  });

  describe('Concurrent Processing Tests', () => {
    it('should handle 100 concurrent requests within 2 seconds', async () => {
      const start = performance.now();
      
      const requests = Array(100).fill(null).map(() =>
        service.assessEmergency({
          description: 'chest pain',
          age: '60',
        })
      );
      
      await Promise.all(requests);
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(2000);
    });

    it('should maintain response time under load', async () => {
      const singleRequestTime = await measureAverageResponseTime(1);
      const loadRequestTime = await measureAverageResponseTime(50);
      
      // Response time under load should not be more than 3x slower
      expect(loadRequestTime).toBeLessThan(singleRequestTime * 3);
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not exceed memory threshold during high load', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Generate high load
      await Promise.all(Array(1000).fill(null).map(() =>
        service.assessEmergency({
          description: 'test case',
          age: '50',
          existingConditions: ['condition1', 'condition2'],
          currentMedications: ['med1', 'med2'],
        })
      ));
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should not exceed 50MB
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });
}); 