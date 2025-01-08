import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { MetricsService } from '../metrics/metrics.service';
import { JwtService } from '@nestjs/jwt';

export interface UserRole {
  id: string;
  userId: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
    private readonly metricsService: MetricsService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Validates user credentials and returns a JWT token if valid.
   * 
   * @param email - User's email
   * @param password - User's password
   * @returns JWT token if credentials are valid
   * @throws Error if credentials are invalid
   */
  public async validateUser(email: string, password: string): Promise<string> {
    const startTime = Date.now();
    try {
      const { data: user, error } = await this.supabaseService.client.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !user) {
        throw new Error('Invalid credentials');
      }

      const roles = await this.getUserRoles(user.user.id);
      const token = await this.generateToken({
        sub: user.user.id,
        email: user.user.email!,
        roles: roles.map(r => r.role),
      });

      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('auth', 'validate_user', duration);

      return token;
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('auth', 'validate_user_error', duration);
      throw error;
    }
  }

  /**
   * Gets all roles assigned to a user.
   * 
   * @param userId - The ID of the user
   * @returns Array of user roles
   */
  public async getUserRoles(userId: string): Promise<UserRole[]> {
    const startTime = Date.now();
    try {
      const roles = await this.supabaseService.select<UserRole>('user_roles', {
        filters: [{ field: 'user_id', operator: 'eq', value: userId }],
      });

      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('auth', 'get_user_roles', duration);

      return roles;
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('auth', 'get_user_roles_error', duration);
      throw error;
    }
  }

  /**
   * Assigns a role to a user.
   * 
   * @param userId - The ID of the user
   * @param role - The role to assign
   * @returns The created user role
   */
  public async assignRole(userId: string, role: string): Promise<UserRole> {
    const startTime = Date.now();
    try {
      const userRole: Partial<UserRole> = {
        userId,
        role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const existingRoles = await this.supabaseService.select<UserRole>('user_roles', {
        filters: [
          { field: 'user_id', operator: 'eq', value: userId },
          { field: 'role', operator: 'eq', value: role },
        ],
      });

      if (existingRoles.length > 0) {
        throw new Error('Role already assigned to user');
      }

      const result = await this.supabaseService.insert('user_roles', userRole);

      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('auth', 'assign_role', duration);

      return result;
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('auth', 'assign_role_error', duration);
      throw error;
    }
  }

  /**
   * Removes a role from a user.
   * 
   * @param userId - The ID of the user
   * @param role - The role to remove
   */
  public async removeRole(userId: string, role: string): Promise<void> {
    const startTime = Date.now();
    try {
      const existingRoles = await this.supabaseService.select<UserRole>('user_roles', {
        filters: [
          { field: 'user_id', operator: 'eq', value: userId },
          { field: 'role', operator: 'eq', value: role },
        ],
      });

      if (existingRoles.length === 0) {
        throw new Error('Role not assigned to user');
      }

      await this.supabaseService.delete('user_roles', {
        field: 'id',
        operator: 'eq',
        value: existingRoles[0].id,
      });

      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('auth', 'remove_role', duration);
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('auth', 'remove_role_error', duration);
      throw error;
    }
  }

  /**
   * Generates a JWT token with the provided payload.
   * 
   * @param payload - The JWT payload
   * @returns The generated JWT token
   */
  private async generateToken(payload: JwtPayload): Promise<string> {
    const startTime = Date.now();
    try {
      const token = await this.jwtService.signAsync(payload);
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('auth', 'generate_token', duration);
      return token;
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('auth', 'generate_token_error', duration);
      throw error;
    }
  }

  /**
   * Verifies a JWT token and returns its payload.
   * 
   * @param token - The JWT token to verify
   * @returns The decoded token payload
   * @throws Error if the token is invalid
   */
  public async verifyToken(token: string): Promise<JwtPayload> {
    const startTime = Date.now();
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('auth', 'verify_token', duration);
      return payload;
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('auth', 'verify_token_error', duration);
      throw error;
    }
  }

  /**
   * Validates an API key.
   * 
   * @param apiKey - The API key to validate
   * @returns True if the API key is valid, false otherwise
   */
  public async validateApiKey(apiKey: string): Promise<boolean> {
    const startTime = Date.now();
    try {
      const validApiKey = this.configService.get<string>('API_KEY');
      const isValid = apiKey === validApiKey;
      
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('auth', 'validate_api_key', duration);
      
      if (!isValid) {
        this.metricsService.logError('auth', 'invalid_api_key');
        return false;
      }
      
      return true;
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('auth', 'validate_api_key_error', duration);
      this.metricsService.logError('auth', 'api_key_validation_error');
      return false;
    }
  }

  public async validateToken(token: string): Promise<any> {
    const startTime = Date.now();
    try {
      const { data: { user }, error } = await this.supabaseService.client.auth.getUser(token);
      
      if (error || !user) {
        this.metricsService.logError('auth', 'token_validation_error');
        throw error || new Error('Invalid token');
      }

      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('auth', 'validate_token', duration);
      
      return user;
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('auth', 'validate_token_error', duration);
      this.metricsService.logError('auth', 'token_validation_error');
      throw error;
    }
  }
}
