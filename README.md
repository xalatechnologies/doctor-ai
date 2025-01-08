# Doctor AI - Intelligent Medical Analysis System

[![Build Status](https://github.com/your-repo/doctor-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/your-repo/doctor-ai/actions)
[![Coverage Status](https://coveralls.io/repos/github/your-repo/doctor-ai/badge.svg?branch=main)](https://coveralls.io/github/your-repo/doctor-ai?branch=main)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.0-red.svg)](https://nestjs.com/)
[![Docker](https://img.shields.io/badge/Docker-20.10-blue.svg)](https://www.docker.com/)

## Quick Start

Get Doctor AI running in minutes:

```bash
# Clone the repository
git clone https://github.com/your-repo/doctor-ai.git
cd doctor-ai

# Copy environment file and update with your credentials
cp .env.template .env

# Start with Docker (recommended)
docker-compose up -d

# Or start locally
npm install
npm run start:dev
```

Visit http://localhost:3000/api/docs for Swagger documentation.

Try the symptom analysis endpoint:
```bash
curl -X POST http://localhost:3000/symptom-analysis/assess-risk \
  -H "Content-Type: application/json" \
  -d '{
    "symptoms": ["headache", "fever"],
    "medicalHistory": "None",
    "severityLevel": 5,
    "age": 30
  }'
```

For detailed setup instructions, see [Setup Instructions](#setup-instructions).

## Table of Contents

- [Project Overview](#project-overview)
  - [Vision](#vision)
  - [Key Capabilities](#key-capabilities)
  - [Core Benefits](#core-benefits)
  - [Target Impact](#target-impact)
- [Technology Stack](#technology-stack)
- [Core Functionalities](#core-functionalities)
- [Setup Instructions](#setup-instructions)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Security](#security)
- [Development Workflow](#development-workflow)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)
- [License](#license)
- [Architecture and Design](#architecture-and-design)
  - [System Architecture](#system-architecture)
  - [Design Patterns](#design-patterns)
  - [Code Organization](#code-organization)
  - [Performance Considerations](#performance-considerations)

## Project Overview

Doctor AI is a transformative medical analysis system redefining the intersection of healthcare and technology. Built on the foundation of cutting-edge AI, it orchestrates multiple world-class Large Language Models (LLMs) to deliver unparalleled accuracy in diagnostics, emergency response, and real-time monitoring. Designed to be a healthcare professional's trusted partner, Doctor AI empowers faster, smarter, and more confident decision-making.

### Vision

Doctor AI aims to bridge the gap between healthcare challenges and advanced technology by providing a solution that's not just reactive but proactive—ensuring better patient outcomes, operational efficiency, and global accessibility.

### Key Capabilities

- **Intelligent Diagnostics:** Multi-LLM framework (OpenAI, Anthropic, DeepSeek, Cohere) for highly reliable and medically precise insights
- **Emergency-First Design:** Real-time prioritization, escalation, and automated response workflows
- **Actionable Insights:** Live dashboards, comprehensive reports, and predictive analytics
- **Symptom Analysis:** Advanced risk assessment and medical report generation
- **Real-time Monitoring:** Continuous vital signs monitoring and analysis
- **Global Accessibility:** Multi-language support and translation capabilities

### Core Benefits

- **Precision That Saves Lives:** Domain-specific validation and confidence scoring
- **Speed Meets Intelligence:** Handle high data volumes with AI-augmented diagnostics
- **Global Reach, Local Impact:** Multi-language support for diverse healthcare environments
- **Built for Reliability:** Multi-LLM failover mechanisms for consistent performance
- **Designed for Scalability:** Robust architecture for various healthcare organizations

### Target Impact

- **Hospitals & Clinics:** Streamline diagnostic workflows and monitor patient vitals
- **Emergency Services:** Deliver actionable assessments and route critical cases
- **Global Health Initiatives:** Equip underserved areas with scalable solutions
- **Research & Academia:** Leverage AI tools for medical research and studies

## Technology Stack

- **Backend Framework:** NestJS
- **Programming Language:** TypeScript
- **Database:** Supabase
- **Message Queue:** RabbitMQ
- **Cache:** Redis
- **Real-Time Communication:** Socket.io
- **Visualization:** Chart.js, PDFKit
- **Monitoring:** Prometheus, Grafana

## Core Functionalities

### 1. Multi-LLM Orchestration
- Leverages OpenAI, Anthropic, DeepSeek, and Cohere models
- Response validation and medical terminology accuracy
- Failover implementation for reliability

### 2. Emergency Assessment
- Real-time vital signs monitoring and symptom analysis
- Automated escalation for critical conditions
- Priority routing for emergency cases

### 3. Visualization & Reporting
- Interactive dashboards with live metrics
- Automated PDF report generation
- Customizable analytics charts

### 4. Monitoring & Alerting
- System performance tracking
- Configurable alert thresholds
- Operational health metrics

## Setup Instructions

### Prerequisites

- Node.js (v18+)
- Docker and Docker Compose
- Redis
- Supabase account
- API keys for LLM providers

### Installation Steps

1. **Clone Repository:**
   \`\`\`bash
   git clone https://github.com/your-repo/doctor-ai.git
   cd doctor-ai
   \`\`\`

2. **Install Dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

3. **Configure Environment:**
   \`\`\`bash
   cp .env.template .env
   # Edit .env with your configuration
   \`\`\`

4. **Run Database Migrations:**
   \`\`\`bash
   npm run migration:run
   \`\`\`

5. **Start Development Server:**
   \`\`\`bash
   npm run start:dev
   \`\`\`

## API Documentation

### Symptom Analysis Endpoints

#### POST /symptom-analysis/assess-risk
Assess symptom risk levels.

Request:
\`\`\`json
{
  "symptoms": string[],
  "medicalHistory": string,
  "severityLevel": number,
  "age": number
}
\`\`\`

Response:
\`\`\`json
{
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "recommendations": string[],
  "urgencyLevel": "LOW" | "MEDIUM" | "HIGH",
  "followUpRequired": boolean,
  "timestamp": string
}
\`\`\`

#### POST /symptom-analysis/:analysisId/generate-report
Generate medical reports.

Response:
\`\`\`json
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
\`\`\`

### Additional Documentation
- **Swagger Docs:** `/api/docs`
- **WebSocket Events:** `/api/docs/websocket`
- **Integration Guides:** `/docs/integration`

## Testing

### Running Tests

\`\`\`bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
\`\`\`

### Test Structure
- Unit tests: `src/**/*.spec.ts`
- Integration tests: `test/integration/**/*.spec.ts`
- E2E tests: `test/e2e/**/*.spec.ts`

## Deployment

### Docker Deployment

1. **Build Images:**
   \`\`\`bash
   docker-compose build
   \`\`\`

2. **Start Services:**
   \`\`\`bash
   docker-compose up -d
   \`\`\`

### Environment Deployments

\`\`\`bash
# Staging
npm run deploy:staging

# Production
npm run deploy:prod
\`\`\`

### Monitoring Setup

- **Prometheus:** `http://localhost:9090`
- **Grafana:** `http://localhost:3001` (default: admin/admin)
- **Health Check:** `/health`
- **Metrics:** `/metrics`

## Project Structure

\`\`\`plaintext
doctor-ai/
├── src/
│   ├── modules/
│   │   ├── llm-orchestration/
│   │   ├── emergency-assessment/
│   │   ├── visualization/
│   │   └── monitoring/
│   ├── common/
│   │   ├── database/
│   │   ├── metrics/
│   │   ├── auth/
│   │   └── alerting/
│   ├── configs/
│   └── main.ts
├── services/
│   └── symptom-analysis-service/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/
│   ├── api/
│   └── architecture/
└── docker/
\`\`\`

## Security

### Data Protection

- All medical data is encrypted at rest and in transit
- Patient data is anonymized for analytics
- Regular security audits and penetration testing
- HIPAA and GDPR compliance measures

### Authentication & Authorization

- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- API key management for external integrations
- Rate limiting and request throttling

### Infrastructure Security

- Docker containers run as non-root users
- Regular security patches and updates
- Network isolation between services
- Automated vulnerability scanning

### Compliance

- HIPAA compliance for US healthcare regulations
- GDPR compliance for EU data protection
- SOC 2 Type II certified infrastructure
- Regular compliance audits and reporting

### Security Reporting

If you discover a security vulnerability, please DO NOT open an issue. Email security@doctor-ai.dev instead.

## Development Workflow

### Branch Strategy

- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: New features and improvements
- `bugfix/*`: Bug fixes
- `release/*`: Release preparation
- `hotfix/*`: Emergency fixes for production

### Code Quality

- ESLint for code style enforcement
- Prettier for code formatting
- Husky for pre-commit hooks
- Jest for unit and integration testing
- SonarQube for code quality analysis

### Development Process

1. **Feature Development**
   ```bash
   # Create feature branch
   git checkout -b feature/your-feature develop
   
   # Make changes and commit
   git add .
   git commit -m "feat: your feature description"
   
   # Push changes
   git push origin feature/your-feature
   ```

2. **Code Review**
   - Create a Pull Request to `develop`
   - Ensure all tests pass
   - Get approval from at least one reviewer
   - Address review comments

3. **Integration**
   - Merge feature branch into `develop`
   - Verify integration tests pass
   - Check for conflicts

4. **Release**
   - Create release branch from `develop`
   - Version bump and changelog update
   - Final testing and verification
   - Merge into `main` and tag release

### Local Development

1. **Start Dependencies:**
   ```bash
   docker-compose up -d redis rabbitmq
   ```

2. **Run in Watch Mode:**
   ```bash
   npm run start:dev
   ```

3. **Run Tests:**
   ```bash
   # Run all tests
   npm run test:all
   
   # Run specific test file
   npm run test:watch src/path/to/file.spec.ts
   ```

4. **Database Migrations:**
   ```bash
   # Create migration
   npm run migration:create name
   
   # Run migrations
   npm run migration:run
   
   # Revert last migration
   npm run migration:revert
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Versioning and Changelog

### Version Strategy

We follow [Semantic Versioning](https://semver.org/):
- MAJOR version for incompatible API changes
- MINOR version for new functionality in a backward compatible manner
- PATCH version for backward compatible bug fixes

### Latest Versions

- **Production (main):** v1.2.0
- **Development (develop):** v1.3.0-dev

### Recent Changes

#### v1.2.0 (Latest Stable)
- Added multi-language support for medical reports
- Improved symptom analysis accuracy with new LLM models
- Enhanced real-time monitoring capabilities
- Fixed critical security vulnerabilities
- Performance optimizations for large-scale deployments

#### v1.1.0
- Implemented emergency assessment module
- Added support for vital signs monitoring
- Integrated with multiple LLM providers
- Enhanced data encryption for HIPAA compliance
- Improved error handling and logging

#### v1.0.0
- Initial release with core functionalities
- Basic symptom analysis
- Medical report generation
- Basic monitoring and alerting
- Docker deployment support

For full changelog, see [CHANGELOG.md](CHANGELOG.md)

## Troubleshooting

### Common Issues

#### 1. Docker Container Issues
```bash
# Reset Docker environment
docker-compose down -v
docker-compose up -d

# Check container logs
docker-compose logs -f [service-name]

# Rebuild specific service
docker-compose up -d --build [service-name]
```

#### 2. Database Connection Issues
- Verify Supabase credentials in `.env`
- Check network connectivity
- Ensure database migrations are up to date
- Verify IP whitelist settings

#### 3. RabbitMQ Connection
- Check RabbitMQ management console (port 15672)
- Verify credentials and vhost settings
- Check queue bindings and exchanges

#### 4. API Key Issues
- Verify all required API keys are set in `.env`
- Check API key permissions and quotas
- Ensure correct environment selection

#### 5. Performance Issues
- Check system resources (CPU, Memory)
- Review application logs for bottlenecks
- Monitor database query performance
- Check Redis cache hit rates

### Debug Mode

Enable debug logging:
```bash
# Development
DEBUG=doctor-ai:* npm run start:dev

# Production
DEBUG=doctor-ai:* npm run start:prod
```

### Support Channels

- GitHub Issues: Bug reports and feature requests
- Discord: Community support and discussions
- Email: enterprise@doctor-ai.dev for business inquiries
- Documentation: https://docs.doctor-ai.dev

## Architecture and Design

### System Architecture

```plaintext
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Client Apps   │────▶│   API Gateway   │────▶│ Load Balancer   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                         │
                                                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Monitoring   │◀────│  Microservices  │────▶│  Message Queue  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │
                                ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Cache (Redis)  │◀────│    Database     │────▶│   File Store    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Design Patterns

#### 1. Microservices Architecture
- Independent deployment and scaling
- Service isolation and resilience
- Domain-driven design principles
- Inter-service communication via message queue

#### 2. CQRS Pattern
- Command Query Responsibility Segregation
- Separate read and write operations
- Optimized query performance
- Event sourcing for audit trails

#### 3. Repository Pattern
- Data access abstraction
- Centralized data logic
- Easier unit testing
- Consistent data operations

#### 4. Factory Pattern
- Dynamic LLM provider selection
- Configurable service instantiation
- Extensible provider integration
- Runtime strategy selection

#### 5. Observer Pattern
- Real-time monitoring updates
- Event-driven architecture
- Asynchronous processing
- Loose coupling between components

### Code Organization

- **Clean Architecture** principles
- **Domain-Driven Design** concepts
- **SOLID** principles adherence
- **Dependency Injection** pattern

### Performance Considerations

- **Caching Strategy**
  - Redis for high-speed data access
  - Distributed caching for scalability
  - Cache invalidation patterns

- **Database Optimization**
  - Query optimization
  - Index strategy
  - Connection pooling
  - Read replicas for scaling

- **Asynchronous Processing**
  - Background job processing
  - Event-driven updates
  - Non-blocking operations
  - Task queuing and scheduling