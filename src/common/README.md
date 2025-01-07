# Common Services

This directory contains shared services and utilities that can be used across the application. Each service is designed to be modular, reusable, and follows NestJS best practices.

## Services Overview

### Authentication Service (`auth/`)
A comprehensive authentication and authorization service that handles user authentication, JWT tokens, and API key validation.

#### Features:
- JWT token generation and validation
- Password hashing and verification using bcrypt
- API key validation
- Token refresh mechanism
- Role-based authorization

#### Usage:
```typescript
// Import the module
import { AuthModule } from '@common/auth/auth.module';

// Use guards in controllers
@UseGuards(JwtAuthGuard)
@Controller('protected')
export class ProtectedController {}

// Role-based authorization
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Get('admin-only')
adminRoute() {}

// API key authentication
@UseGuards(ApiKeyGuard)
@Get('api')
apiRoute() {}
```

#### Environment Variables:
```env
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
API_KEYS=key1,key2,key3
```

### PDF Report Service (`pdf-report/`)
Generates PDF reports with support for cultural context adaptation and customizable styling.

#### Features:
- Dynamic PDF generation
- Cultural context adaptation
- Customizable layouts and styles
- Header and footer support
- Page numbering
- Image embedding

#### Usage:
```typescript
const content: ReportContent = {
  title: 'Medical Report',
  sections: [
    {
      heading: 'Patient Information',
      content: 'Patient details...',
      style: {
        fontSize: 12,
        alignment: 'left'
      }
    }
  ],
  footer: {
    text: 'Confidential',
    pageNumbers: true
  }
};

const pdf = await pdfReportService.generateReport(content);
```

### Visualization Service (`visualization/`)
Generates charts and visualizations for data representation.

#### Features:
- Multiple chart types (line, bar, pie, etc.)
- Customizable styling
- Dashboard layouts
- Responsive design
- Cultural context adaptation

#### Usage:
```typescript
const chartData = {
  type: 'line',
  data: {
    labels: ['Jan', 'Feb', 'Mar'],
    datasets: [...]
  },
  options: {
    width: 800,
    height: 400
  }
};

const chart = await visualizationService.generateChart(chartData);
```

### RabbitMQ Service (`messaging/`)
Handles message queue operations for asynchronous communication.

#### Features:
- Message publishing and consumption
- Event emission
- Request-response patterns
- Automatic reconnection
- Error handling

#### Usage:
```typescript
// Emit an event
await rabbitmqService.emit('user.created', userData);

// Send and receive messages
const response = await rabbitmqService.send('calculate.bmi', patientData);
```

#### Environment Variables:
```env
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_QUEUE=default_queue
```

### Alerting Service (`alerting/`)
Manages system alerts and notifications with severity levels and rules.

#### Features:
- Multiple severity levels (info, warning, error, critical)
- Alert rules and conditions
- Notification channels
- Alert acknowledgment
- Alert history

#### Usage:
```typescript
// Create an alert
await alertingService.createAlert(
  'System Overload',
  'CPU usage exceeds 90%',
  'critical',
  'system-monitor'
);

// Create an alert rule
await alertingService.createRule({
  name: 'High CPU Usage',
  severity: 'critical',
  condition: 'cpu > 90',
  notificationChannels: ['email', 'slack']
});
```

### Cultural Context Service (`cultural-context/`)
Adapts content based on cultural preferences and settings.

#### Features:
- Language adaptation
- Date/time format localization
- Measurement unit conversion
- Cultural sensitivity checks
- Regional preferences

#### Usage:
```typescript
const context = {
  locale: 'fr-FR',
  region: 'France',
  preferences: {
    dateFormat: 'DD/MM/YYYY',
    measurementSystem: 'metric'
  }
};

const adaptedContent = await culturalContextService.adaptContent(
  content,
  context
);
```

## Best Practices

1. **Error Handling**
   - All services implement comprehensive error handling
   - Errors are logged with appropriate context
   - Custom exceptions are used where appropriate

2. **Configuration**
   - Services use ConfigService for environment-based configuration
   - Sensible defaults are provided
   - Configuration is validated at startup

3. **Logging**
   - Consistent logging patterns across services
   - Different log levels (debug, info, warn, error)
   - Contextual information in logs

4. **Testing**
   - Unit tests for all services
   - Integration tests for complex workflows
   - E2E tests for critical paths

## Contributing

When adding new services or modifying existing ones:

1. Follow the established patterns and naming conventions
2. Add comprehensive documentation
3. Include unit tests
4. Update this README with new service details

## Dependencies

Core dependencies for common services:
- @nestjs/common
- @nestjs/config
- @nestjs/jwt
- @nestjs/passport
- bcrypt
- pdfkit
- chart.js
- canvas
- amqplib 