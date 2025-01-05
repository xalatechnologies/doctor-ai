# Doctor AI - Medical Analysis System

A sophisticated medical analysis system that leverages multiple LLM providers to deliver accurate medical insights, recommendations, and emergency assessments with advanced visualization and monitoring capabilities.

## Overview

Doctor AI is an advanced medical analysis system that orchestrates multiple Large Language Models (LLMs) to provide medical insights, symptom analysis, and recommendations. The system employs a multi-provider approach with built-in failover, validation, medical domain-specific confidence scoring, real-time monitoring, and comprehensive visualization tools.

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

### Technology Stack

- **Backend Framework**: NestJS
- **Language**: TypeScript
- **LLM Providers**:
  - OpenAI (GPT-4 Turbo)
  - Anthropic (Claude 3 Opus)
  - DeepSeek
  - Cohere (Command)
- **Database**: Supabase
- **Caching**: Redis
- **Monitoring**: Custom metrics system
- **Visualization**: 
  - Chart.js for real-time charts
  - PDFKit for report generation
- **WebSocket**: Socket.io for real-time updates
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest

## Features

### 1. LLM Orchestration
- Multi-provider failover
- Medical domain validation
- Confidence scoring
- Response analysis

### 2. Emergency Assessment
- Real-time urgency evaluation
- Vital signs monitoring
- Automated escalation
- Priority routing

### 3. Visualization & Reporting
- Real-time performance dashboards
- PDF report generation
- Custom chart configurations
- Provider comparison analytics

### 4. Monitoring & Alerting
- Real-time metrics tracking
- Configurable alert thresholds
- Push notifications
- Performance analytics

## Setup and Installation

### Using Docker

Docker setup includes both development and production configurations:

#### Development Setup

```bash
# First time setup
cp .env.example .env    # Configure your environment variables

# Build and start services
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down

# Clean up volumes
npm run docker:clean
```

#### Production Setup

Production deployment includes optimized builds and health monitoring:

```bash
# Build and run production services
docker-compose -f docker-compose.prod.yml up -d

# Monitor health status
curl http://localhost:3000/health

# View production logs
docker-compose -f docker-compose.prod.yml logs -f

# Scale API service
docker-compose -f docker-compose.prod.yml up -d --scale api=3

# Monitoring Setup

The application includes Prometheus and Grafana for monitoring:

- **Prometheus**: http://localhost:9090
  - Metrics collection
  - Alert rules
  - Service discovery

- **Grafana**: http://localhost:3001
  - Dashboards
  - Alerts visualization
  - Metrics exploration

```bash
# Access Grafana
open http://localhost:3001
# Default credentials: admin/admin

# View Prometheus metrics
curl http://localhost:3000/metrics
```
```

#### Docker Compose Services

The application runs with the following services:

- **API Service**
  - NestJS application
  - Exposed on port 3000
  - Hot-reload enabled in development

- **Redis Service**
  - Used for caching and real-time features
  - Exposed on port 6379
  - Persistent volume for data storage

#### Docker Commands

```bash
# Build services
npm run docker:build

# Start in detached mode
docker-compose up -d

# View specific service logs
docker-compose logs api
docker-compose logs redis

# SSH into containers
docker-compose exec api sh
docker-compose exec redis sh

# Monitor Redis
docker-compose exec redis redis-cli monitor
```

#### Health Checks

```bash
# Check API health
curl http://localhost:3000/health

# Check Redis connection
docker-compose exec redis redis-cli ping
```

### Prerequisites

Required software:
- Node.js (v18+)
- npm or yarn
- Redis
- Supabase account

Required API keys:
- OpenAI
- Anthropic
- DeepSeek
- Cohere

### Environment Setup

1. Clone the repository:

Required environment variables:
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
DEEPSEEK_API_KEY=your_deepseek_key
COHERE_API_KEY=your_cohere_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
REDIS_URL=your_redis_url

### Database Setup

```bash
# Run migrations
npm run migration:run

# Create new migration
npm run migration:create name_of_migration
```

## Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Running Tests with Docker

```bash
# Run all tests
npm run docker:test

# Run unit tests only
npm run docker:test:unit

# Run E2E tests only
npm run docker:test:e2e

# Run tests in watch mode
npm run docker:test:watch
```

### Test Coverage

The tests cover:
- Health checks
- Metrics collection
- Redis connectivity
- Database connectivity
- API endpoints

## Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "run", "start:prod"]
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: doctor-ai
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: doctor-ai
        image: doctor-ai:latest
        env:
          - name: NODE_ENV
            value: "production"
```

## Documentation

- API documentation: `/api/docs`
- WebSocket events: `/api/docs/websocket`
- Integration guides: `/docs/integration`

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## License

This project is licensed under the MIT License - see [LICENSE.md](LICENSE.md) for details.

### Next.js Dashboard Setup
/ API Route
import { createProxyMiddleware } from 'http-proxy-middleware';
export default createProxyMiddleware({
target: process.env.DOCTOR_AI_API_URL,
changeOrigin: true
});
// Dashboard Component
import { useVisualizationData } from '@/hooks/useVisualizationData';
export const Dashboard = () => {
const { data } = useVisualizationData();
return <PerformanceCharts data={data} />;
};

## Frontend Integration

### React Native Setup
import { DoctorAIClient } from '@doctor-ai/api-client';
const client = new DoctorAIClient({
baseURL: 'your_api_url',
apiKey: 'your_api_key'
});
// Real-time updates
const socket = new DoctorAISocket(config);
socket.subscribeToAlerts((alert) => {
// Handle alerts
});

# ### Health Monitoring

The application includes comprehensive health checks:

- **API Health Check**
  - Endpoint: `/health`
  - Checks: Service status, metrics, dependencies
  - Interval: 30s

- **Redis Health Check**
  - Command: `redis-cli ping`
  - Interval: 10s
  - Retries: 3

```bash
# Monitor all services health
docker-compose -f docker-compose.prod.yml ps

# View health check logs
docker-compose -f docker-compose.prod.yml events --json
```

# ### Production Best Practices

- Uses multi-stage builds for smaller images
- Runs as non-root user
- Includes only production dependencies
- Implements graceful shutdown
- Monitors application health