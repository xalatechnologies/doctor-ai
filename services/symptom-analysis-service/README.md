# Symptom Analysis Service

## Overview
The Symptom Analysis Service is a critical component of the Doctor AI system, responsible for performing detailed analysis of patient symptoms and providing medical recommendations. It works in conjunction with other microservices to provide comprehensive healthcare insights and supports both synchronous HTTP requests and asynchronous message-based communication via RabbitMQ.

## Core Features
- Detailed symptom analysis with severity assessment
- Emergency case evaluation and triage
- Medical specialty recommendations
- Follow-up action planning
- Real-time health monitoring
- Integration with emergency services
- Asynchronous event processing

## Use Cases
1. **Primary Symptom Analysis**
   - Analyze individual symptoms with context
   - Determine severity and urgency levels
   - Generate tailored medical recommendations

2. **Emergency Assessment Processing**
   - Handle emergency case evaluations
   - Provide immediate action recommendations
   - Coordinate with emergency services

3. **Medical Specialty Routing**
   - Determine required medical specialties
   - Generate referral recommendations
   - Coordinate specialist consultations

4. **Follow-up Planning**
   - Create structured follow-up plans
   - Schedule medical appointments
   - Monitor patient progress

## Technical Details

### Architecture
- Built with NestJS framework
- Implements microservices architecture
- Uses RabbitMQ for message queuing
- RESTful API endpoints
- Event-driven communication

### Dependencies
- Node.js (v18+)
- NestJS v10
- RabbitMQ
- TypeScript
- Jest for testing

### API Endpoints
- `POST /symptom-analysis/analyze` - Analyze symptoms
- `GET /health` - Service health check

### Message Patterns
- `analyze_symptom` - Analyze symptoms via message queue
- `emergency.assessed` - Process emergency assessments
- `symptom.analyzed` - Publish analysis results
- `symptom.status` - Get service status

### Configuration
Environment variables:
```env
PORT=3002
NODE_ENV=development
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_QUEUE=symptom_analysis_queue
RABBITMQ_PREFETCH_COUNT=1
MONITORING_ENABLED=true
MONITORING_PORT=9091
LOG_LEVEL=info
```

## Test Cases

### Unit Tests
- Symptom analysis logic
- Severity calculation
- Medical recommendations
- Specialty determination
- Follow-up planning

### Integration Tests
- RabbitMQ message handling
- Emergency service integration
- Configuration management
- Health check system

### E2E Tests
- Complete analysis workflow
- Error handling scenarios
- Performance under load
- API endpoint validation

### Performance Tests
- Concurrent request handling
- Message processing speed
- Response time analysis
- Resource utilization

## Implementation Details

### Code Structure
```
src/
├── controllers/     # HTTP and message controllers
├── services/        # Business logic
├── dto/            # Data transfer objects
├── interfaces/     # TypeScript interfaces
├── exceptions/     # Custom exceptions
├── config/         # Configuration
├── health/         # Health checks
└── rabbitmq/       # RabbitMQ integration
```

### Key Components
1. **SymptomAnalysisController**
   - Handles HTTP requests
   - Processes message patterns
   - Validates input data

2. **SymptomAnalysisService**
   - Implements core analysis logic
   - Manages severity assessment
   - Generates recommendations

3. **RabbitMQService**
   - Manages message queue connections
   - Handles event publishing
   - Ensures reliable message delivery

4. **HealthController**
   - Monitors service health
   - Reports system status
   - Tracks dependencies

## Deployment

### Prerequisites
- Node.js v18 or higher
- RabbitMQ server
- Docker (optional)
- Kubernetes (optional)

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run start:dev

# Run tests
npm test
npm run test:e2e
```

### Docker Deployment
```bash
# Build image
docker build -t symptom-analysis-service .

# Run container
docker run -p 3002:3002 symptom-analysis-service
```

### Production Deployment
1. **Environment Setup**
   - Configure environment variables
   - Set up RabbitMQ credentials
   - Configure monitoring

2. **Deployment Options**
   - Docker containers
   - Kubernetes cluster
   - Cloud services (AWS, GCP, Azure)

3. **Monitoring Setup**
   - Health check endpoints
   - Performance metrics
   - Error tracking

4. **Scaling Considerations**
   - Horizontal scaling
   - Load balancing
   - Message queue clustering

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License
This project is licensed under the UNLICENSED license.

## Contact
Author: Ibrahim Rahmani 