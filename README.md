# Doctor AI - Medical Analysis System

A sophisticated medical analysis system that leverages multiple LLM providers to deliver accurate medical insights, recommendations, and emergency assessments with advanced visualization and monitoring capabilities.

## Overview

Doctor AI is an advanced medical analysis system that orchestrates multiple Large Language Models (LLMs) to provide medical insights, symptom analysis, and recommendations. The system employs a microservice architecture with multiple specialized services communicating through RabbitMQ, ensuring scalability, resilience, and maintainability.

### Key Features

- Multi-LLM orchestration (OpenAI, Anthropic, DeepSeek, Cohere)
- Medical terminology validation
- Emergency assessment capabilities
- Real-time monitoring and metrics
- Advanced visualization and reporting
  - Interactive dashboards
  - PDF report generation
  - Real-time performance charts
- Multi-language support
- Push notifications for critical alerts
- Real-time alerting system

## Architecture

### Microservices

The system is composed of the following microservices:

1. **Symptom Analysis Service** (Port: 3002)
   - Analyzes patient symptoms
   - Calculates severity and urgency levels
   - Provides initial medical insights
   - Communicates with LLM providers

2. **Emergency Service** (Port: 3001)
   - Handles emergency assessments
   - Manages triage scoring
   - Coordinates with medical specialists
   - Processes urgent cases

3. **Treatment Service** (Port: 3003)
   - Manages treatment plans
   - Tracks treatment progress
   - Handles medication schedules
   - Monitors patient recovery

### Communication

- **Message Broker**: RabbitMQ
  - Handles asynchronous communication between services
  - Ensures message delivery and persistence
  - Manages service queues and exchanges
  - Provides message routing and filtering

### Technology Stack

- **Backend Framework**: NestJS
- **Language**: TypeScript
- **Message Broker**: RabbitMQ
- **Database**: Supabase
- **Container Platform**: Docker
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest

## Features

### 1. Symptom Analysis
- Multi-provider LLM integration
- Medical domain validation
- Confidence scoring
- Response analysis

### 2. Emergency Assessment
- Real-time urgency evaluation
- Vital signs monitoring
- Automated escalation
- Priority routing

### 3. Treatment Management
- Treatment plan creation
- Progress tracking
- Medication scheduling
- Recovery monitoring

## Setup and Installation

### Prerequisites

Required software:
- Docker and Docker Compose
- Node.js (v18+)
- npm or yarn
- Supabase account

Required environment variables:
```env
# Node Environment
NODE_ENV=development

# Service Ports
EMERGENCY_PORT=3001
SYMPTOM_ANALYSIS_PORT=3002
TREATMENT_PORT=3003

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# RabbitMQ Configuration
RABBITMQ_DEFAULT_USER=guest
RABBITMQ_DEFAULT_PASS=guest
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
```

### Using Docker

```bash
# First time setup
cp .env.example .env    # Configure your environment variables

# Build services
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Clean up volumes
docker-compose down -v
```

### Service-Specific Setup

Each service can be run independently for development:

```bash
# Symptom Analysis Service
cd services/symptom-analysis-service
npm install
npm run start:dev

# Emergency Service
cd services/emergency-service
npm install
npm run start:dev

# Treatment Service
cd services/treatment-service
npm install
npm run start:dev
```

## Testing

Each service has its own test suite:

```bash
# Run all service tests
npm run test:all

# Test specific service
cd services/symptom-analysis-service
npm run test

cd services/emergency-service
npm run test

cd services/treatment-service
npm run test
```

## API Documentation

Each service exposes its own Swagger documentation:

- Symptom Analysis: http://localhost:3002/api
- Emergency Service: http://localhost:3001/api
- Treatment Service: http://localhost:3003/api

## Monitoring

### RabbitMQ Management Console

Access the RabbitMQ management interface at http://localhost:15672
- Default credentials: guest/guest
- Monitor queues, exchanges, and message flow
- View service connections and channel status

### Health Checks

Each service exposes a health endpoint:

```bash
# Check service health
curl http://localhost:3001/health  # Emergency Service
curl http://localhost:3002/health  # Symptom Analysis
curl http://localhost:3003/health  # Treatment Service
```

## Contributing

Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.