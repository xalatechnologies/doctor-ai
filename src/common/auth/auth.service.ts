import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MetricsService } from '../metrics/metrics.service';
import { SupabaseService } from '../supabase/supabase.service';

export interface UserRole {
  user_id: string;
  role: string;
  permissions: string[];
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  permissions: string[];
}

export interface AuthResult {
  user: AuthUser;
  session: any;
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
    private readonly metricsService: MetricsService,
  ) {}

  async validateApiKey(apiKey: string): Promise<boolean> {
    const startTime = Date.now();
    try {
      const validApiKey = this.configService.get<string>('API_KEY');
      const isValid = apiKey === validApiKey;

      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('auth', 'validate_api_key', duration);

      if (!isValid) {
        this.metricsService.logError('auth', 'invalid_api_key');
        this.logger.warn('Invalid API key attempt');
      }

      return isValid;
    } catch (error) {
      this.metricsService.logError('auth', 'api_key_validation_error');
      this.logger.error(`Error validating API key: ${error.message}`);
      return false;
    }
  }

  async validateToken(token: string): Promise<AuthUser> {
    const startTime = Date.now();
    try {
      const {
        data: { user },
        error,
      } = await this.supabaseService.client.auth.getUser(token);

      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('auth', 'validate_token', duration);

      if (error) {
        this.metricsService.logError('auth', 'invalid_token');
        throw new UnauthorizedException('Invalid token');
      }

      if (!user) {
        this.metricsService.logError('auth', 'user_not_found');
        throw new UnauthorizedException('User not found');
      }

      const { data: roles } = await this.supabaseService.find<UserRole>('user_roles', {
        filters: [{ field: 'user_id', operator: 'eq', value: user.id }],
      });

      return {
        id: user.id,
        email: user.email!,
        role: roles?.[0]?.role || 'user',
        permissions: roles?.[0]?.permissions || [],
      };
    } catch (error) {
      this.metricsService.logError('auth', 'token_validation_error');
      this.logger.error(`Error validating token: ${error.message}`);
      throw new UnauthorizedException('Invalid token');
    }
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const startTime = Date.now();
    try {
      const {
        data: { user, session },
        error,
      } = await this.supabaseService.client.auth.signInWithPassword({
        email,
        password,
      });

      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('auth', 'login', duration);

      if (error) {
        this.metricsService.logError('auth', 'login_failed');
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!user || !session) {
        this.metricsService.logError('auth', 'login_no_session');
        throw new UnauthorizedException('Login failed');
      }

      const { data: roles } = await this.supabaseService.find<UserRole>('user_roles', {
        filters: [{ field: 'user_id', operator: 'eq', value: user.id }],
      });

      return {
        user: {
          id: user.id,
          email: user.email!,
          role: roles?.[0]?.role || 'user',
          permissions: roles?.[0]?.permissions || [],
        },
        session,
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
      };
    } catch (error) {
      this.metricsService.logError('auth', 'login_error');
      this.logger.error(`Error during login: ${error.message}`);
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthResult> {
    const startTime = Date.now();
    try {
      const {
        data: { user, session },
        error,
      } = await this.supabaseService.client.auth.refreshSession({
        refresh_token: refreshToken,
      });

      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('auth', 'refresh_token', duration);

      if (error) {
        this.metricsService.logError('auth', 'refresh_failed');
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (!user || !session) {
        this.metricsService.logError('auth', 'refresh_no_session');
        throw new UnauthorizedException('Session refresh failed');
      }

      const { data: roles } = await this.supabaseService.find<UserRole>('user_roles', {
        filters: [{ field: 'user_id', operator: 'eq', value: user.id }],
      });

      return {
        user: {
          id: user.id,
          email: user.email!,
          role: roles?.[0]?.role || 'user',
          permissions: roles?.[0]?.permissions || [],
        },
        session,
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
      };
    } catch (error) {
      this.metricsService.logError('auth', 'refresh_error');
      this.logger.error(`Error refreshing token: ${error.message}`);
      throw error;
    }
  }

  async logout(token: string): Promise<void> {
    const startTime = Date.now();
    try {
      const { error } = await this.supabaseService.client.auth.signOut();

      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('auth', 'logout', duration);

      if (error) {
        this.metricsService.logError('auth', 'logout_failed');
        throw error;
      }
    } catch (error) {
      this.metricsService.logError('auth', 'logout_error');
      this.logger.error(`Error during logout: ${error.message}`);
      throw error;
    }
  }
}
