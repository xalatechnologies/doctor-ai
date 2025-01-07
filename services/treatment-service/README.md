# Treatment Service

## Overview

The Treatment Service is responsible for managing patient treatment plans, tracking treatment progress, handling medication schedules, and monitoring patient recovery. It ensures proper coordination between different medical services and maintains up-to-date treatment records.

## Features

- Treatment plan management
- Progress tracking
- Medication scheduling
- Recovery monitoring
- Treatment history
- Follow-up coordination
- Treatment effectiveness analysis

## API Endpoints

### Treatment Plans
- `POST /api/v1/treatment-plans`
  - Creates new treatment plans
  - Validates treatment requirements
  - Assigns medical resources

- `GET /api/v1/treatment-plans/:id`
  - Retrieves treatment plan details
  - Includes progress history
  - Shows scheduled activities

- `PATCH /api/v1/treatment-plans/:id`
  - Updates treatment plan status
  - Modifies treatment activities
  - Adjusts schedules

### Progress Updates
- `POST /api/v1/treatment-plans/:id/progress`
  - Records treatment progress
  - Updates recovery metrics
  - Tracks medication adherence

### Health Check
- `GET /health`
  - Returns service health status
  - Verifies database connection
  - Checks message broker status

## Message Queue Events

### Published Events
- `treatment.created` - Emitted when new treatment plan is created
- `treatment.updated` - Emitted when treatment plan is modified
- `treatment.completed` - Emitted when treatment is finished

### Consumed Events
- `emergency.assessed` - Handles emergency assessment results
- `symptom.analyzed` - Processes symptom analysis updates

## Configuration

### Environment Variables
```env
NODE_ENV=development
PORT=3003
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
docker build -t treatment-service .

# Run container
docker run -p 3003:3003 treatment-service
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

Swagger documentation is available at `http://localhost:3003/api` when the service is running.

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
curl http://localhost:3003/health
```

### Metrics
Service metrics are available at `/metrics` endpoint.

## Contributing

Please read the main project's [Contributing Guide](../../CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests. 