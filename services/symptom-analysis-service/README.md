# Symptom Analysis Service

## Overview

The Symptom Analysis Service is a core component of Doctor AI that provides intelligent analysis of medical symptoms using multiple LLM providers. It offers risk assessment, medical report generation, and multilingual support.

## Features

### 1. Symptom Risk Assessment
- Multi-factor risk analysis
- Age and medical history consideration
- Real-time severity evaluation
- Emergency detection
- Confidence scoring

### 2. Medical Report Generation
- Comprehensive medical documentation
- Evidence-based recommendations
- Follow-up planning
- Integration with medical standards
- PDF report export

### 3. Multi-Language Support
- 20+ languages supported
- Automatic language detection
- Cultural context awareness
- Medical terminology translation
- Region-specific recommendations

## Architecture

### Component Diagram
```plaintext
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│   API Gateway    │─────▶│  Load Balancer   │─────▶│ Symptom Analysis │
└──────────────────┘      └──────────────────┘      └──────────────────┘
                                                            │
                                                            ▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│    LLM Pool      │◀─────│   Orchestrator   │◀─────│  Request Queue   │
└──────────────────┘      └──────────────────┘      └──────────────────┘
        │                                                    │
        ▼                                                    ▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│  Result Cache    │─────▶│    Database      │◀─────│   Event Bus      │
└──────────────────┘      └──────────────────┘      └──────────────────┘
```

## API Reference

### Risk Assessment

\`\`\`typescript
POST /symptom-analysis/assess-risk

// Request
interface SymptomRiskInput {
  symptoms: string[];
  medicalHistory: string;
  severityLevel: number;
  age: number;
  gender?: string;
  existingConditions?: string[];
  medications?: string[];
  vitalSigns?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    oxygenSaturation?: number;
  };
}

// Response
interface RiskAssessmentResponse {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: number;
  recommendations: string[];
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  followUpRequired: boolean;
  timestamp: string;
  details: {
    criticalFactors: string[];
    differentialDiagnosis: string[];
    warningSigns: string[];
  };
}
\`\`\`

### Medical Report Generation

\`\`\`typescript
POST /symptom-analysis/:analysisId/generate-report

// Response
interface MedicalReport {
  reportId: string;
  timestamp: string;
  patientId: string;
  symptoms: SymptomAssessment[];
  vitalSigns: VitalSignsAssessment;
  diagnosis: DiagnosticImpression;
  recommendations: string[];
  followUpPlan: string[];
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  metadata: {
    generatedBy: string;
    version: string;
    confidence: number;
  };
}
\`\`\`

## Configuration

### Environment Variables
\`\`\`bash
# Service Configuration
SYMPTOM_ANALYSIS_PORT=3002
NODE_ENV=development

# LLM Configuration
LLM_DEFAULT_PROVIDER=openai
LLM_API_KEY=your_api_key
LLM_MAX_RETRIES=3
LLM_TIMEOUT=30000

# Database Configuration
DATABASE_URL=your_database_url
REDIS_URL=your_redis_url

# Queue Configuration
RABBITMQ_URL=amqp://localhost:5672
QUEUE_NAME=symptom_analysis
\`\`\`

## Development

### Prerequisites
- Node.js v18+
- Docker
- RabbitMQ
- Redis

### Local Setup
\`\`\`bash
# Install dependencies
npm install

# Start required services
docker-compose up -d redis rabbitmq

# Run migrations
npm run migration:run

# Start development server
npm run start:dev
\`\`\`

### Testing
\`\`\`bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
\`\`\`

## Performance Considerations

### Caching Strategy
- Risk assessment results cached for 5 minutes
- Medical terminology cached indefinitely
- User session data cached for 24 hours

### Rate Limiting
- 100 requests per minute per IP
- 1000 requests per hour per API key
- Burst allowance of 20 requests

### Resource Requirements
- Minimum 2 CPU cores
- 4GB RAM recommended
- 10GB storage space

## Error Handling

### Common Error Codes
- `4001`: Invalid symptom format
- `4002`: Missing required fields
- `4003`: Invalid medical history format
- `5001`: LLM service unavailable
- `5002`: Database connection error

### Retry Strategy
- Automatic retry for LLM failures
- Exponential backoff
- Maximum 3 retries
- Circuit breaker pattern

## Monitoring

### Health Checks
- `/health`: Basic health status
- `/health/live`: Liveness probe
- `/health/ready`: Readiness probe

### Metrics
- Request latency
- Error rates
- Cache hit ratio
- Queue length
- LLM response times

## Security

### Data Protection
- All medical data encrypted at rest
- TLS 1.3 for data in transit
- Regular security audits
- HIPAA compliance measures

### Access Control
- JWT authentication
- Role-based access
- API key management
- Rate limiting

## Support

- GitHub Issues: Bug reports and feature requests
- Email: support@doctor-ai.dev
- Documentation: https://docs.doctor-ai.dev/symptom-analysis
- Status Page: https://status.doctor-ai.dev 