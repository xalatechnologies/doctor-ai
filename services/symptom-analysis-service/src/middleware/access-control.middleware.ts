import { Injectable, NestMiddleware, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole, JwtPayload, RoutePermission } from '../interfaces/auth.interface';

@Injectable()
export class AccessControlMiddleware implements NestMiddleware {
  private readonly routePermissions: RoutePermission[] = [
    {
      path: '/symptom-analysis/assess',
      method: 'POST',
      roles: [UserRole.DOCTOR, UserRole.NURSE],
      permissions: ['symptom:assess']
    },
    {
      path: '/symptom-analysis/report',
      method: 'POST',
      roles: [UserRole.DOCTOR],
      permissions: ['report:generate']
    },
    {
      path: '/symptom-analysis/export',
      method: 'POST',
      roles: [UserRole.DOCTOR, UserRole.SYSTEM],
      permissions: ['data:export']
    }
  ];

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Extract token from Authorization header
      const token = this.extractToken(req);
      if (!token) {
        throw new UnauthorizedException('No authorization token provided');
      }

      // Verify and decode token
      const payload = await this.verifyToken(token);
      
      // Attach user to request
      (req as any).user = {
        id: payload.sub,
        roles: payload.roles,
        permissions: payload.permissions
      };

      // Check if user has required roles/permissions for the route
      const hasAccess = await this.verifyUserRole(req);
      if (!hasAccess) {
        throw new ForbiddenException('Insufficient permissions');
      }

      next();
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid authorization token');
    }
  }

  private extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  private async verifyToken(token: string): Promise<JwtPayload> {
    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      return await this.jwtService.verifyAsync(token, { secret });
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private async verifyUserRole(req: Request): Promise<boolean> {
    const user = (req as any).user;
    const route = this.findMatchingRoute(req.path, req.method);

    // If no specific permissions are required for this route
    if (!route) {
      return true;
    }

    // Check roles
    const hasRequiredRole = user.roles.some((role: UserRole) => 
      route.roles.includes(role)
    );

    // Check permissions if specified
    const hasRequiredPermissions = !route.permissions || 
      route.permissions.every(permission => 
        user.permissions?.includes(permission)
      );

    return hasRequiredRole && hasRequiredPermissions;
  }

  private findMatchingRoute(path: string, method: string): RoutePermission | null {
    return this.routePermissions.find(route => 
      route.path === path && route.method === method.toUpperCase()
    ) || null;
  }

  private isSystemOperation(req: Request): boolean {
    const systemEndpoints = ['/health', '/metrics'];
    return systemEndpoints.includes(req.path);
  }
} 