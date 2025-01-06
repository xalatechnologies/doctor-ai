import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@app/app.module';
import { AnalyzeSymptomDto } from '@dto/analyze-symptom.dto';
import { RabbitMQService } from '@rabbitmq/rabbitmq.service';

describe('SymptomAnalysis (e2e)', () => {
  let app: INestApplication;
  let rabbitMQService: RabbitMQService;

  const mockRabbitMQService = {
    publishEmergencyAssessment: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RabbitMQService)
      .useValue(mockRabbitMQService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    rabbitMQService = moduleFixture.get<RabbitMQService>(RabbitMQService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/symptom-analysis/analyze (POST)', () => {
    const validSymptomDto: AnalyzeSymptomDto = {
      description: 'severe chest pain',
      primarySymptom: 'chest pain',
      painLevel: 8,
      severityLevel: 7,
      duration: 'acute',
      secondarySymptoms: ['shortness of breath'],
      alleviatingFactors: ['rest'],
      aggravatingFactors: ['movement'],
      currentMedications: ['aspirin'],
      patientHistory: 'hypertension',
    };

    it('should analyze symptoms successfully', () => {
      return request(app.getHttpServer())
        .post('/symptom-analysis/analyze')
        .send(validSymptomDto)
        .expect(201)
        .expect(res => {
          expect(res.body).toMatchObject({
            symptomId: expect.stringMatching(/^SYM-\d+-[a-z0-9]+$/),
            primarySymptom: validSymptomDto.primarySymptom,
            severity: {
              level: expect.any(Number),
              description: expect.stringMatching(/^(Mild|Moderate|Severe)$/),
            },
            urgencyLevel: expect.stringMatching(/^(LOW|MEDIUM|HIGH)$/),
          });
        });
    });

    it('should validate input data', () => {
      const invalidDto = {
        description: '',
        primarySymptom: 123,
        painLevel: 'high',
        severityLevel: 11,
        duration: '',
      };

      return request(app.getHttpServer())
        .post('/symptom-analysis/analyze')
        .send(invalidDto)
        .expect(400)
        .expect(res => {
          expect(res.body.message).toEqual(expect.arrayContaining([
            expect.stringContaining('description should not be empty'),
            expect.stringContaining('primarySymptom must be a string'),
            expect.stringContaining('painLevel must be a number'),
            expect.stringContaining('severityLevel must not be greater than 10'),
            expect.stringContaining('duration should not be empty'),
          ]));
        });
    });

    it('should handle missing optional fields', () => {
      const minimalDto = {
        description: 'headache',
        primarySymptom: 'headache',
        painLevel: 5,
        severityLevel: 4,
        duration: 'acute',
      };

      return request(app.getHttpServer())
        .post('/symptom-analysis/analyze')
        .send(minimalDto)
        .expect(201)
        .expect(res => {
          expect(res.body).toMatchObject({
            primarySymptom: minimalDto.primarySymptom,
            secondarySymptoms: [],
            urgencyLevel: 'LOW',
          });
        });
    });
  });

  describe('/health (GET)', () => {
    it('should return health status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect(res => {
          expect(res.body).toEqual({
            status: 'ok',
            info: {
              api: {
                status: 'up',
              },
            },
            error: undefined,
            details: {
              api: {
                status: 'up',
              },
            },
          });
        });
    });
  });
}); 