import { Test, TestingModule } from '@nestjs/testing';
import { PDFReportService, PDFReportContent, PDFReportSection } from './pdf-report.service';
import { MetricsService } from '../metrics/metrics.service';
import { LoggerService } from '../logger/logger.service';
import { ConfigService } from '@nestjs/config';

describe('PDFReportService', () => {
  let service: PDFReportService;
  let metricsService: jest.Mocked<MetricsService>;
  let loggerService: jest.Mocked<LoggerService>;

  const mockContent: PDFReportContent = {
    title: 'Test Report',
    sections: [
      {
        heading: 'Section 1',
        content: 'Test content',
        style: {
          fontSize: 12,
          fontColor: 'black',
        },
      },
    ],
  };

  beforeEach(async () => {
    const mockMetricsService = {
      recordLatency: jest.fn(),
      logError: jest.fn(),
      incrementProviderError: jest.fn(),
      recordTaskMetrics: jest.fn(),
      setConnectionStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PDFReportService,
        {
          provide: MetricsService,
          useValue: mockMetricsService,
        },
        {
          provide: LoggerService,
          useValue: {
            error: jest.fn(),
            info: jest.fn(),
            log: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              switch (key) {
                case 'PDF_TEMPLATE_PATH':
                  return './test/templates';
                case 'PDF_OUTPUT_PATH':
                  return './test/output';
                default:
                  return undefined;
              }
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PDFReportService>(PDFReportService);
    metricsService = module.get(MetricsService);
    loggerService = module.get(LoggerService);
  });

  describe('generateReport', () => {
    it('should generate a PDF report', async () => {
      const result = await service.generateReport(mockContent);
      expect(result).toBeDefined();
      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(metricsService.recordLatency).toHaveBeenCalledWith(
        'pdf',
        'generate_report',
        expect.any(Number),
      );
    });

    it('should handle invalid content', async () => {
      const invalidContent = null;
      await expect(service.generateReport(invalidContent as any)).rejects.toThrow(
        'Invalid report content',
      );
      expect(metricsService.logError).toHaveBeenCalledWith(
        'pdf',
        'invalid_content',
      );
    });

    it('should handle PDF generation errors', async () => {
      const errorContent: PDFReportContent = {
        title: 'Error Report',
        sections: [],
      };
      await expect(service.generateReport(errorContent)).rejects.toThrow(
        'Invalid section structure',
      );
      expect(metricsService.logError).toHaveBeenCalledWith(
        'pdf',
        'invalid_section',
      );
    });
  });
});
