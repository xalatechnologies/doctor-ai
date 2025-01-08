import { Test, TestingModule } from '@nestjs/testing';
import { LLMOrchestrationService } from '../../src/common/llm/llm-orchestration.service';
import { LLMTestModule } from './llm-test.module';
import { MockMetricsService } from './mock-metrics.service';
import { LLMTestHelper } from './llm-test.helper';

describe('LLM Providers (e2e)', () => {
  let app: TestingModule;
  let llmService: LLMOrchestrationService;
  let metricsService: MockMetricsService;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      imports: [LLMTestModule],
    }).compile();

    llmService = app.get<LLMOrchestrationService>(LLMOrchestrationService);
    metricsService = app.get<MockMetricsService>('MetricsService');
  });

  beforeEach(() => {
    metricsService.resetMetrics();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Provider Health Checks', () => {
    it('should list available providers', () => {
      const providers = llmService.getAvailableProviders();
      expect(providers).toBeDefined();
      expect(Array.isArray(providers)).toBe(true);
      expect(providers).toContain('openai');
      expect(providers).toContain('azure');
      expect(providers).toContain('anthropic');
    });

    it('should check provider health', async () => {
      const providers = llmService.getAvailableProviders();
      for (const provider of providers) {
        const isHealthy = await llmService.getProviderHealth(provider);
        expect(isHealthy).toBe(true);
      }
    });
  });

  describe('Rate Limiting', () => {
    it('should respect rate limits for each provider', async () => {
      const providers = llmService.getAvailableProviders();
      const rateLimits = {
        openai: 3,
        azure: 10,
        anthropic: 5,
      };

      for (const provider of providers) {
        const maxRequests = rateLimits[provider];
        const startTime = Date.now();

        // Make requests up to the limit
        const promises = Array(maxRequests + 1).fill(null).map(() => 
          llmService.analyzeText({
            text: 'Test rate limiting',
            context: 'test',
            provider,
          })
        );

        await Promise.all(promises);

        const duration = Date.now() - startTime;
        // The total duration should be at least one interval (1000ms) due to rate limiting
        expect(duration).toBeGreaterThanOrEqual(1000);

        // Check usage metrics
        const usage = llmService.getProviderUsage(provider);
        expect(usage).toBeDefined();
        if (usage) {
          expect(usage.max).toBe(maxRequests);
        }
      }
    });

    it('should handle concurrent requests within rate limits', async () => {
      const provider = 'openai';
      const maxRequests = 3;
      const startTime = Date.now();

      // Make concurrent requests
      const promises = Array(maxRequests * 2).fill(null).map(() => 
        llmService.analyzeText({
          text: 'Test concurrent requests',
          context: 'test',
          provider,
        })
      );

      await Promise.all(promises);

      const duration = Date.now() - startTime;
      // Should take at least 2 intervals due to rate limiting
      expect(duration).toBeGreaterThanOrEqual(2000);

      // Verify metrics
      expect(metricsService.getMetric(`llm_request_${provider}_default`)).toBe(maxRequests * 2);
      expect(metricsService.getMetric(`provider_success_${provider}`)).toBe(maxRequests * 2);
    });

    it('should maintain separate rate limits for each provider', async () => {
      const startTime = Date.now();

      // Make concurrent requests to all providers
      const promises = llmService.getAvailableProviders().flatMap(provider => 
        Array(3).fill(null).map(() => 
          llmService.analyzeText({
            text: 'Test multi-provider rate limiting',
            context: 'test',
            provider,
          })
        )
      );

      await Promise.all(promises);

      const duration = Date.now() - startTime;
      // Should complete within 1 interval since providers have separate limits
      expect(duration).toBeLessThan(2000);

      // Verify metrics for each provider
      for (const provider of llmService.getAvailableProviders()) {
        expect(metricsService.getMetric(`llm_request_${provider}_default`)).toBe(3);
        expect(metricsService.getMetric(`provider_success_${provider}`)).toBe(3);
      }
    });
  });

  describe('Text Analysis', () => {
    const testCases = [
      {
        name: 'should analyze chest pain symptoms',
        input: {
          text: 'Patient presents with severe chest pain radiating to left arm, shortness of breath, and sweating for the past hour.',
          context: 'possible_conditions',
        },
        expectedMetrics: {
          requests: 1,
          tokens: true,
          success: 1,
          errors: 0,
        },
      },
      {
        name: 'should analyze fever symptoms',
        input: {
          text: 'Patient has had high fever (39.5°C), body aches, and fatigue for 3 days. No respiratory symptoms.',
          context: 'risk_assessment',
        },
        expectedMetrics: {
          requests: 1,
          tokens: true,
          success: 1,
          errors: 0,
        },
      },
      {
        name: 'should analyze allergic reaction',
        input: {
          text: 'Patient developed hives, facial swelling, and difficulty breathing 30 minutes after eating peanuts.',
          context: 'recommendations',
        },
        expectedMetrics: {
          requests: 1,
          tokens: true,
          success: 1,
          errors: 0,
        },
      },
    ];

    for (const testCase of testCases) {
      it(testCase.name, async () => {
        const providers = llmService.getAvailableProviders();
        
        for (const provider of providers) {
          const result = await llmService.analyzeText({
            ...testCase.input,
            provider,
          });

          // Verify response structure
          expect(result).toBeDefined();
          expect(result.differentials).toBeDefined();
          expect(Array.isArray(result.differentials)).toBe(true);
          expect(result.immediateActions).toBeDefined();
          expect(Array.isArray(result.immediateActions)).toBe(true);
          expect(result.followUp).toBeDefined();
          expect(Array.isArray(result.followUp)).toBe(true);
          expect(result.risks).toBeDefined();
          expect(Array.isArray(result.risks)).toBe(true);
          expect(typeof result.isUrgent).toBe('boolean');
          expect(typeof result.confidence).toBe('number');
          expect(typeof result.primaryDiagnosis).toBe('string');
          expect(typeof result.analysis).toBe('string');
          expect(typeof result.vitalSignsSummary).toBe('string');
          expect(Array.isArray(result.abnormalFindings)).toBe(true);

          // Verify metrics
          expect(metricsService.getMetric(`llm_request_${provider}_default`)).toBe(testCase.expectedMetrics.requests);
          expect(metricsService.getMetric(`llm_tokens_${provider}_default_prompt`)).toBeGreaterThan(0);
          expect(metricsService.getMetric(`llm_tokens_${provider}_default_completion`)).toBeGreaterThan(0);
          expect(metricsService.getMetric(`provider_success_${provider}`)).toBe(testCase.expectedMetrics.success);
          expect(metricsService.getMetric(`provider_failure_${provider}`)).toBe(testCase.expectedMetrics.errors);
        }
      }, 30000); // Increase timeout for LLM responses
    }

    it('should handle invalid input gracefully', async () => {
      const providers = llmService.getAvailableProviders();
      
      for (const provider of providers) {
        await expect(llmService.analyzeText({
          text: '',
          context: 'invalid_context',
          provider,
        })).rejects.toThrow();

        // Verify error metrics
        expect(metricsService.getMetric(`provider_failure_${provider}`)).toBe(1);
        expect(metricsService.getMetric(`llm_error_${provider}_default_Error`)).toBe(1);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent provider', async () => {
      await expect(llmService.analyzeText({
        text: 'test',
        context: 'test',
        provider: 'non_existent',
      })).rejects.toThrow('Provider non_existent not configured');
    });

    it('should handle provider errors', async () => {
      const providers = llmService.getAvailableProviders();
      
      for (const provider of providers) {
        await expect(llmService.analyzeText({
          text: 'x'.repeat(10000), // Exceed token limit
          context: 'test',
          provider,
        })).rejects.toThrow();

        // Verify error metrics
        expect(metricsService.getMetric(`provider_failure_${provider}`)).toBe(1);
        expect(metricsService.getMetric(`llm_error_${provider}_default_Error`)).toBe(1);
      }
    });
  });
}); 