# Authentication Module

## Overview

The Authentication module provides secure user authentication, authorization, and identity management for the Doctor AI platform. It ensures secure access control, role-based permissions, and compliance with healthcare security standards.

## Features

### 1. User Authentication
- Multi-factor authentication
- OAuth 2.0 integration
- JWT token management
- Session handling
- Password policies

### 2. Authorization
- Role-based access control
- Permission management
- Resource authorization
- Scope validation
- Policy enforcement

### 3. Identity Management
- User provisioning
- Profile management
- Account recovery
- Audit logging
- Device management

## Architecture

### Component Diagram
```plaintext
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│ Auth Controller  │─────▶│ Token Manager    │─────▶│ Session Store    │
└──────────────────┘      └──────────────────┘      └──────────────────┘
                                                            │
                                                            ▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│ Policy Manager   │◀─────│ Auth Core        │◀─────│ User Store       │
└──────────────────┘      └──────────────────┘      └──────────────────┘
        │                                                    │
        ▼                                                    ▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│ Role Manager     │─────▶│ Audit Logger     │◀─────│ MFA Provider     │
└──────────────────┘      └──────────────────┘      └──────────────────┘
```

## API Reference

### Authentication

\`\`\`typescript
POST /auth/login

// Request
interface LoginRequest {
  username: string;
  password: string;
  mfaCode?: string;
  deviceInfo?: {
    id: string;
    type: string;
    platform: string;
  };
  options?: {
    rememberMe: boolean;
    sessionDuration?: number;
  };
}

// Response
interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    roles: string[];
    permissions: string[];
  };
  session: {
    id: string;
    expiresAt: string;
    mfaRequired: boolean;
  };
}
\`\`\`

### Authorization

\`\`\`typescript
POST /auth/authorize

// Request
interface AuthorizationRequest {
  resource: string;
  action: 'read' | 'write' | 'delete' | 'execute';
  context?: {
    tenant?: string;
    department?: string;
    patientId?: string;
  };
  metadata?: Record<string, any>;
}

// Response
interface AuthorizationResponse {
  allowed: boolean;
  reason?: string;
  conditions?: {
    timeRestriction?: string;
    locationRestriction?: string[];
    dataFilters?: Record<string, any>;
  };
  audit: {
    decision: string;
    timestamp: string;
    evaluatedPolicies: string[];
  };
}
\`\`\`

## Configuration

### Environment Variables
\`\`\`bash
# Service Configuration
AUTH_PORT=3007
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRY=3600
REFRESH_TOKEN_EXPIRY=604800

# Password Policy
MIN_PASSWORD_LENGTH=12
REQUIRE_SPECIAL_CHARS=true
PASSWORD_HISTORY=5
MAX_LOGIN_ATTEMPTS=5

# MFA Configuration
MFA_ENABLED=true
MFA_ISSUER=DoctorAI
MFA_ALGORITHM=SHA1
MFA_DIGITS=6

# OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret

# Session Configuration
SESSION_STORE_URL=redis://localhost:6379
SESSION_TTL=86400
\`\`\`

## Implementation

### Authentication Service
\`\`\`typescript
interface AuthenticationService {
  login(credentials: LoginRequest): Promise<LoginResponse>;
  validateToken(token: string): Promise<TokenValidation>;
  refreshToken(token: string): Promise<TokenResponse>;
  logout(sessionId: string): Promise<void>;
}

class JWTAuthService implements AuthenticationService {
  private readonly tokenManager: TokenManager;
  private readonly userStore: UserStore;
  private readonly mfaProvider: MFAProvider;
  
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    // Validate credentials
    const user = await this.validateCredentials(credentials);
    
    // Check MFA requirement
    if (user.mfaEnabled) {
      await this.validateMFACode(credentials.mfaCode);
    }
    
    // Generate tokens
    const tokens = await this.tokenManager.generateTokens(user);
    
    // Create session
    const session = await this.createSession(user, credentials.deviceInfo);
    
    return {
      ...tokens,
      user: this.sanitizeUser(user),
      session,
    };
  }
}
\`\`\`

## Role-Based Access Control

### User Roles
- Administrator
- Doctor
- Nurse
- Patient
- Support Staff
- System

### Permission Sets
- Clinical Access
- Patient Data
- Administrative
- Emergency Access
- Audit Access
- System Configuration

## Security Features

### Password Security
- Secure hashing (Argon2)
- Salt generation
- Password validation
- History tracking
- Expiry management

### Session Management
- Secure session tokens
- Session monitoring
- Concurrent sessions
- Session termination
- Activity tracking

## Multi-Factor Authentication

### MFA Methods
- TOTP (Google Authenticator)
- SMS verification
- Email verification
- Hardware tokens
- Biometric (where available)

### Recovery Options
- Backup codes
- Recovery email
- Security questions
- Admin recovery
- Device verification

## Audit Logging

### Logged Events
- Authentication attempts
- Authorization decisions
- Password changes
- Role modifications
- Session activities

### Log Format
- Timestamp
- Event type
- User identifier
- IP address
- Device information

## Performance Optimization

### Token Management
- Token caching
- Blacklist optimization
- Refresh token rotation
- Batch validation
- Rate limiting

### Session Handling
- Session pooling
- Cache optimization
- Lazy loading
- Batch operations
- Connection management

## Security Compliance

### Standards
- HIPAA compliance
- GDPR requirements
- HITECH Act
- SOC 2
- ISO 27001

### Security Measures
- Data encryption
- Access controls
- Audit trails
- Incident response
- Regular assessments

## Support

- Documentation: https://docs.doctor-ai.dev/authentication
- Security Guide: https://security.doctor-ai.dev
- Status: https://status.doctor-ai.dev/auth
- Support: auth-support@doctor-ai.dev 