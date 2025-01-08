# Doctor AI - Symptom Analysis Service

## Project Overview

Doctor AI is an intelligent medical symptom analysis system that leverages Large Language Models (LLMs) to provide risk assessments and generate comprehensive medical reports. The system helps healthcare providers and patients by offering preliminary analysis of symptoms, risk assessments, and multilingual support.

### Key Features

- Symptom risk assessment using advanced LLM processing
- Comprehensive medical report generation
- Multilingual support through automatic translation
- Real-time vital signs monitoring and analysis
- Secure data storage with Supabase
- Event-driven architecture using RabbitMQ
- Metrics tracking for system monitoring

## Setup Instructions

### Prerequisites

- Node.js (v18 or later)
- Docker and Docker Compose
- PostgreSQL (via Supabase)
- RabbitMQ

### Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/your-org/doctor-ai.git
cd doctor-ai
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

Required environment variables:
- `DATABASE_URL`: Supabase connection string
- `RABBITMQ_URL`: RabbitMQ connection string
- `LLM_API_KEY`: API key for the LLM service
- `TRANSLATION_API_KEY`: API key for translation service

### Development

Start the development server:
```bash
npm run start:dev
```

## API Endpoints

### Symptom Analysis

#### POST /symptom-analysis/assess-risk
Assess the risk level of reported symptoms.

Request body:
```json
{
  "symptoms": string[],
  "medicalHistory": string,
  "severityLevel": number,
  "age": number
}
```

Response:
```json
{
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "recommendations": string[],
  "urgencyLevel": "LOW" | "MEDIUM" | "HIGH",
  "followUpRequired": boolean,
  "timestamp": string
}
```

#### POST /symptom-analysis/:analysisId/generate-report
Generate a comprehensive medical report.

Response:
```json
{
  "reportId": string,
  "timestamp": string,
  "patientId": string,
  "symptoms": SymptomAssessment[],
  "vitalSigns": VitalSignsAssessment,
  "diagnosis": DiagnosticImpression,
  "recommendations": string[],
  "followUpPlan": string[],
  "urgencyLevel": "LOW" | "MEDIUM" | "HIGH"
}
```

## Testing

### Running Tests

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Test Structure

- Unit tests: `src/**/*.spec.ts`
- Integration tests: `test/integration/**/*.spec.ts`
- E2E tests: `test/e2e/**/*.spec.ts`

## Deployment

### Docker Deployment

1. Build the Docker images:
```bash
docker-compose build
```

2. Start the services:
```bash
docker-compose up -d
```

### Staging Environment

Deploy to staging:
```bash
npm run deploy:staging
```

### Production Environment

Deploy to production:
```bash
npm run deploy:prod
```

### Monitoring

- Health check endpoint: `/health`
- Metrics endpoint: `/metrics`
- Logs: Available through Docker logs or configured log aggregator

## Architecture

The service follows a modular architecture with the following components:

- **API Layer**: NestJS controllers handling HTTP requests
- **Service Layer**: Business logic and integration with external services
- **Data Layer**: Supabase for persistent storage
- **Message Queue**: RabbitMQ for event-driven operations
- **External Services**: 
  - LLM Service for medical analysis
  - Translation Service for multilingual support
  - Metrics Service for monitoring

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.