import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService, JwtPayload, TokenResponse } from './auth.service';
import * as bcrypt from 'bcrypt';

describe('AuthService Integration', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const testConfig: Record<string, string> = {
    JWT_ACCESS_SECRET: 'test-access-secret',
    JWT_REFRESH_SECRET: 'test-refresh-secret',
    JWT_ACCESS_EXPIRATION: '15m',
    JWT_REFRESH_EXPIRATION: '7d',
    API_KEYS: 'test-api-key-1,test-api-key-2',
  };

  const testPayload: JwtPayload = {
    sub: '123',
    username: 'testuser',
    roles: ['user'],
    customField: 'test',
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => testConfig[key]),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('Password Management', () => {
    const testPassword = 'TestPassword123!';

    it('should hash and validate password correctly', async () => {
      // Hash password
      const hashedPassword = await service.hashPassword(testPassword);
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(testPassword);

      // Validate correct password
      const isValid = await service.validatePassword(testPassword, hashedPassword);
      expect(isValid).toBe(true);

      // Validate incorrect password
      const isInvalidValid = await service.validatePassword('WrongPassword', hashedPassword);
      expect(isInvalidValid).toBe(false);
    });

    it('should use proper bcrypt configuration', async () => {
      const hashedPassword = await service.hashPassword(testPassword);
      const rounds = bcrypt.getRounds(hashedPassword);
      expect(rounds).toBe(10); // Default saltRounds in service
    });
  });

  describe('Token Management', () => {
    it('should generate valid access and refresh tokens', async () => {
      const tokens = await service.generateTokens(testPayload);

      expect(tokens).toBeDefined();
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(tokens.expiresIn).toBeGreaterThan(0);

      // Verify access token
      const decodedAccess = await service.verifyToken(tokens.accessToken, false);
      expect(decodedAccess.sub).toBe(testPayload.sub);
      expect(decodedAccess.username).toBe(testPayload.username);
      expect(decodedAccess.roles).toEqual(testPayload.roles);

      // Verify refresh token
      const decodedRefresh = await service.verifyToken(tokens.refreshToken, true);
      expect(decodedRefresh.sub).toBe(testPayload.sub);
    });

    it('should refresh tokens successfully', async () => {
      // Generate initial tokens
      const initialTokens = await service.generateTokens(testPayload);

      // Wait a bit to ensure new tokens have different timestamps
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Refresh tokens
      const newTokens = await service.refreshTokens(initialTokens.refreshToken);

      expect(newTokens.accessToken).not.toBe(initialTokens.accessToken);
      expect(newTokens.refreshToken).not.toBe(initialTokens.refreshToken);

      // Verify new tokens
      const decodedAccess = await service.verifyToken(newTokens.accessToken, false);
      expect(decodedAccess.sub).toBe(testPayload.sub);
    });

    it('should handle invalid tokens appropriately', async () => {
      // Test invalid access token
      await expect(service.verifyToken('invalid-token', false))
        .rejects.toThrow('Invalid token');

      // Test invalid refresh token
      await expect(service.refreshTokens('invalid-refresh-token'))
        .rejects.toThrow('Invalid refresh token');
    });

    it('should handle token expiration correctly', async () => {
      // Generate token with very short expiration
      const shortLivedToken = await jwtService.signAsync(testPayload, {
        expiresIn: '1s',
        secret: testConfig.JWT_ACCESS_SECRET,
      });

      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Verify expired token
      await expect(service.verifyToken(shortLivedToken, false))
        .rejects.toThrow('Invalid token');
    });
  });

  describe('API Key Validation', () => {
    it('should validate correct API keys', async () => {
      const isValid = await service.validateApiKey('test-api-key-1');
      expect(isValid).toBe(true);
    });

    it('should reject invalid API keys', async () => {
      const isValid = await service.validateApiKey('invalid-api-key');
      expect(isValid).toBe(false);
    });

    it('should handle multiple API keys', async () => {
      const results = await Promise.all([
        service.validateApiKey('test-api-key-1'),
        service.validateApiKey('test-api-key-2'),
        service.validateApiKey('invalid-key'),
      ]);

      expect(results).toEqual([true, true, false]);
    });
  });

  describe('Error Handling', () => {
    it('should handle bcrypt errors gracefully', async () => {
      // Test with invalid hash format
      await expect(service.validatePassword('test', 'invalid-hash'))
        .rejects.toThrow();
    });

    it('should handle JWT signing errors gracefully', async () => {
      // Mock JWT service to throw error
      jest.spyOn(jwtService, 'signAsync').mockRejectedValueOnce(new Error('Signing error'));

      await expect(service.generateTokens(testPayload))
        .rejects.toThrow('Signing error');
    });

    it('should handle configuration errors gracefully', async () => {
      // Mock config service to return undefined
      jest.spyOn(configService, 'get').mockReturnValueOnce(undefined);

      // Should still work with default values
      const tokens = await service.generateTokens(testPayload);
      expect(tokens).toBeDefined();
    });
  });
}); 