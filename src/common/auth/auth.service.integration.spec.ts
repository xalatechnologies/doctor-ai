import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { MetricsService } from '../metrics/metrics.service';
import { SupabaseService } from '../supabase/supabase.service';
import { createClient } from '@supabase/supabase-js';
import { JwtService } from '@nestjs/jwt';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

describe('AuthService Integration', () => {
  let service: AuthService;
  let configService: ConfigService;
  let metricsService: jest.Mocked<MetricsService>;
  let supabaseService: SupabaseService;
  let mockSupabaseClient: any;

  beforeEach(async () => {
    mockSupabaseClient = {
      auth: {
        getUser: jest.fn(),
        signOut: jest.fn(),
      },
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);

    const mockMetricsService = {
      recordLatency: jest.fn(),
      incrementLogCount: jest.fn(),
      logError: jest.fn(),
      incrementProviderError: jest.fn(),
      recordTaskMetrics: jest.fn(),
      setConnectionStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              switch (key) {
                case 'API_KEY':
                  return 'test-api-key';
                case 'SUPABASE_URL':
                  return 'https://test.supabase.co';
                case 'SUPABASE_KEY':
                  return 'test-key';
                case 'AUTH_TOKEN_EXPIRY':
                  return '1h';
                default:
                  return undefined;
              }
            }),
          },
        },
        {
          provide: MetricsService,
          useValue: mockMetricsService,
        },
        SupabaseService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('test-token'),
            verify: jest.fn().mockReturnValue({ sub: 'test-user' }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    configService = module.get<ConfigService>(ConfigService);
    metricsService = module.get(MetricsService);
    supabaseService = module.get<SupabaseService>(SupabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateApiKey', () => {
    it('should validate a valid API key', async () => {
      const result = await service.validateApiKey('test-api-key');
      expect(result).toBe(true);
      expect(metricsService.recordLatency).toHaveBeenCalledWith('auth', 'validate_api_key', expect.any(Number));
    });

    it('should reject an invalid API key', async () => {
      const result = await service.validateApiKey('invalid-key');
      expect(result).toBe(false);
      expect(metricsService.logError).toHaveBeenCalledWith('auth', 'invalid_api_key');
    });

    it('should handle validation errors', async () => {
      jest.spyOn(configService, 'get').mockImplementationOnce(() => {
        throw new Error('Config error');
      });

      const result = await service.validateApiKey('test-api-key');
      expect(result).toBe(false);
      expect(metricsService.logError).toHaveBeenCalledWith('auth', 'api_key_validation_error');
    });
  });

  describe('validateToken', () => {
    it('should validate a valid token', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        role: 'user',
        permissions: ['read'],
      };

      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({ data: { user: mockUser } });

      const result = await service.validateToken('valid-token');
      expect(result).toBeDefined();
      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
      expect(metricsService.recordLatency).toHaveBeenCalledWith('auth', 'validate_token', expect.any(Number));
    });

    it('should reject an invalid token', async () => {
      mockSupabaseClient.auth.getUser.mockRejectedValueOnce(new Error('Invalid token'));
      await expect(service.validateToken('invalid-token')).rejects.toThrow();
      expect(metricsService.logError).toHaveBeenCalledWith('auth', 'token_validation_error');
    });

    it('should handle token expiry', async () => {
      const tokenExpiry = configService.get('AUTH_TOKEN_EXPIRY');
      expect(tokenExpiry).toBe('1h');

      mockSupabaseClient.auth.getUser.mockRejectedValueOnce(new Error('Token expired'));
      await expect(service.validateToken('expired-token')).rejects.toThrow();
      expect(metricsService.logError).toHaveBeenCalledWith('auth', 'token_validation_error');
    });
  });
});
