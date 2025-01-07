import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

export interface JwtPayload {
  sub: string;
  username: string;
  roles: string[];
  [key: string]: any;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly saltRounds = 10;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      this.logger.error('Failed to validate password:', error);
      throw error;
    }
  }

  async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, this.saltRounds);
    } catch (error) {
      this.logger.error('Failed to hash password:', error);
      throw error;
    }
  }

  async generateTokens(payload: JwtPayload): Promise<TokenResponse> {
    try {
      const [accessToken, refreshToken] = await Promise.all([
        this.jwtService.signAsync(payload, {
          expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION') || '15m',
          secret: this.configService.get('JWT_ACCESS_SECRET'),
        }),
        this.jwtService.signAsync(payload, {
          expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION') || '7d',
          secret: this.configService.get('JWT_REFRESH_SECRET'),
        }),
      ]);

      return {
        accessToken,
        refreshToken,
        expiresIn: this.getTokenExpiration(accessToken),
      };
    } catch (error) {
      this.logger.error('Failed to generate tokens:', error);
      throw error;
    }
  }

  async verifyToken(token: string, isRefreshToken = false): Promise<JwtPayload> {
    try {
      const secret = isRefreshToken
        ? this.configService.get('JWT_REFRESH_SECRET')
        : this.configService.get('JWT_ACCESS_SECRET');

      const payload = await this.jwtService.verifyAsync(token, { secret });
      return payload;
    } catch (error) {
      this.logger.error('Failed to verify token:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  async refreshTokens(refreshToken: string): Promise<TokenResponse> {
    try {
      const payload = await this.verifyToken(refreshToken, true);
      delete payload.exp;
      delete payload.iat;
      return this.generateTokens(payload);
    } catch (error) {
      this.logger.error('Failed to refresh tokens:', error);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const validApiKeys = this.configService.get('API_KEYS')?.split(',') || [];
      return validApiKeys.includes(apiKey);
    } catch (error) {
      this.logger.error('Failed to validate API key:', error);
      throw error;
    }
  }

  private getTokenExpiration(token: string): number {
    try {
      const decoded = this.jwtService.decode(token);
      if (typeof decoded === 'object' && decoded.exp) {
        return decoded.exp * 1000 - Date.now();
      }
      return 0;
    } catch {
      return 0;
    }
  }
} 