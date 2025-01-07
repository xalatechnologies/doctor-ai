export enum UserRole {
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR',
  NURSE = 'NURSE',
  PATIENT = 'PATIENT',
  SYSTEM = 'SYSTEM'
}

export interface User {
  id: string;
  roles: UserRole[];
  permissions?: string[];
}

export interface JwtPayload {
  sub: string;
  roles: UserRole[];
  permissions?: string[];
  iat?: number;
  exp?: number;
}

export interface RoutePermission {
  path: string;
  method: string;
  roles: UserRole[];
  permissions?: string[];
} 