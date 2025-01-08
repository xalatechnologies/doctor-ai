# Doctor AI Platform

## Project Structure

```
doctor-ai/
├── src/
│   ├── common/                    # Shared modules and utilities
│   │   ├── database/             # Database module
│   │   │   ├── migrations/       # Database migrations
│   │   │   ├── database.module.ts
│   │   │   └── database.service.ts
│   │   ├── monitoring/           # Monitoring module
│   │   │   ├── config/          # Monitoring configurations
│   │   │   └── monitoring.module.ts
│   │   └── ...
│   ├── modules/                  # Feature modules
│   │   ├── symptom-analysis/    # Symptom analysis module
│   │   ├── emergency-assessment/ # Emergency assessment module
│   │   └── ...
│   └── main.ts                  # Application entry point
├── services/                    # Microservices
│   └── symptom-analysis-service/
├── frontend/                    # Frontend application
├── test/                       # Test files
├── docker-compose.yml          # Docker compose configuration
├── Dockerfile                  # Main service Dockerfile
├── .env.template              # Environment variables template
├── package.json               # Project dependencies
└── tsconfig.json              # TypeScript configuration
```

## Database Management

### Migrations

Database migrations are managed using TypeORM and are located in `src/common/database/migrations/`. The following commands are available for managing migrations:

```bash
# Generate a new migration
npm run migration:generate -- -n MigrationName

# Run pending migrations
npm run migration:run

# Revert the last migration
npm run migration:revert
```

### Database Configuration

Database configuration is handled through environment variables and the TypeORM configuration in `src/common/database/database.module.ts`. Required environment variables:

```bash
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=doctor_ai
```

### Schema Overview

The database schema includes the following main tables:

1. **users**
   - User authentication and profile information
   - Role-based access control
   - Timestamps for auditing

2. **medical_histories**
   - Patient medical history records
   - JSON storage for flexible data structure
   - Linked to users via foreign key

3. **symptom_analyses**
   - Symptom analysis results
   - Risk assessment data
   - Linked to users via foreign key

4. **follow_up_questions**
   - Dynamic questionnaire management
   - Response tracking
   - Linked to symptom analyses

### Monitoring Configuration

The monitoring system is configured in `src/common/monitoring/config/` and includes:

1. **Prometheus Configuration**
   - Scrape intervals
   - Target endpoints
   - Metric paths

2. **Metrics Collection**
   - System health metrics
   - Performance metrics
   - Business metrics

## Development Setup

1. Clone the repository:
```bash
git clone https://github.com/your-username/doctor-ai.git
cd doctor-ai
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment template:
```bash
cp .env.template .env
```

4. Configure environment variables in `.env`

5. Run database migrations:
```bash
npm run migration:run
```

6. Start the development server:
```bash
npm run start:dev
```

## Testing

Run the test suite:

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Docker Deployment

Build and run the application using Docker:

```bash
# Build the images
docker-compose build

# Start the services
docker-compose up -d
```

The application will be available at `http://localhost:3000`.