# Emergency Service

## Overview

The Emergency Service is responsible for handling emergency medical situations, managing triage scoring, and coordinating with medical specialists. It processes urgent cases and ensures proper escalation of critical medical conditions.

## Features

- Emergency assessment processing
- Triage score calculation
- Medical specialist coordination
- Urgent case management
- Real-time status updates
- Priority-based routing
- Automated escalation

## API Endpoints

### Emergency Assessment
- `POST /api/v1/assess`
  - Processes emergency assessments
  - Calculates triage scores
  - Determines required specialists

### Treatment Plan
- `POST /api/v1/treatment-plan`
  - Handles emergency treatment plans
  - Updates treatment status
  - Coordinates with specialists

### Health Check
- `GET /health`
  - Returns service health status
  - Verifies dependencies
  - Checks message broker connection

## Message Queue Events

### Published Events
- `emergency.assessed` - Emitted when emergency assessment is complete
- `emergency.escalated` - Emitted when case requires escalation
- `treatment.required` - Emitted when treatment plan is needed

### Consumed Events
- `symptom.urgent` - Handles urgent symptom notifications
- `treatment.updated` - Processes treatment plan updates

## Configuration

### Environment Variables
```env
NODE_ENV=development
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
```

## Development

### Prerequisites
- Node.js v18+
- npm or yarn
- RabbitMQ
- Supabase account

### Setup
```bash
# Install dependencies
npm install

# Run in development mode
npm run start:dev

# Run tests
npm run test

# Run linting
npm run lint

# Build for production
npm run build
```

### Docker
```bash
# Build image
docker build -t emergency-service .

# Run container
docker run -p 3001:3001 emergency-service
```

## Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:cov
```

## API Documentation

Swagger documentation is available at `http://localhost:3001/api` when the service is running.

## Error Handling

The service implements standardized error responses:

```typescript
{
  statusCode: number;
  message: string;
  error: string;
  details?: any;
}
```

Common error codes:
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Monitoring

### Health Check
```bash
curl http://localhost:3001/health
```

### Metrics
Service metrics are available at `/metrics` endpoint.

## Contributing

Please read the main project's [Contributing Guide](../../CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests. 