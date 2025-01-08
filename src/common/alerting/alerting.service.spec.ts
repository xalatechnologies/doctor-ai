import { Test, TestingModule } from '@nestjs/testing';
import { AlertingService, AlertSeverity } from './alerting.service';
import { MetricsService } from '../metrics/metrics.service';
import { NotificationService } from '../notification/notification.service';

describe('AlertingService', () => {
  let service: AlertingService;
  let notificationService: NotificationService;
  let metricsService: MetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertingService,
        {
          provide: MetricsService,
          useValue: {
            recordLatency: jest.fn(),
          },
        },
        {
          provide: NotificationService,
          useValue: {
            sendEmail: jest.fn().mockResolvedValue({ success: true }),
          },
        },
      ],
    }).compile();

    service = module.get<AlertingService>(AlertingService);
    notificationService = module.get<NotificationService>(NotificationService);
    metricsService = module.get<MetricsService>(MetricsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAlert', () => {
    it('should create a new alert', async () => {
      const alertData = {
        severity: AlertSeverity.HIGH,
        message: 'Test alert',
        source: 'test-service',
      };

      const alert = await service.createAlert(
        alertData.severity,
        alertData.message,
        alertData.source,
      );

      expect(alert.id).toBeDefined();
      expect(alert.severity).toBe(alertData.severity);
      expect(alert.message).toBe(alertData.message);
      expect(alert.source).toBe(alertData.source);
      expect(alert.status).toBe('active');
      expect(notificationService.sendEmail).toHaveBeenCalled();
    });

    it('should handle duplicate alerts', async () => {
      const alertData = {
        severity: AlertSeverity.HIGH,
        message: 'Test alert',
        source: 'test',
      };

      const firstAlert = await service.createAlert(
        alertData.severity,
        alertData.message,
        alertData.source,
      );

      const secondAlert = await service.createAlert(
        alertData.severity,
        alertData.message,
        alertData.source,
      );

      expect(firstAlert.id).not.toBe(secondAlert.id);
      expect(secondAlert.status).toBe('active');
    });
  });

  describe('acknowledgeAlert', () => {
    it('should acknowledge an alert', async () => {
      const alertData = {
        severity: AlertSeverity.HIGH,
        message: 'Test alert',
        source: 'test',
      };

      const alert = await service.createAlert(
        alertData.severity,
        alertData.message,
        alertData.source,
      );

      const acknowledgedAlert = await service.acknowledgeAlert(alert.id, 'test-user');

      expect(acknowledgedAlert.id).toBe(alert.id);
      expect(acknowledgedAlert.status).toBe('acknowledged');
      expect(acknowledgedAlert.acknowledgedBy).toBe('test-user');
      expect(acknowledgedAlert.acknowledgedAt).toBeDefined();
      expect(notificationService.sendEmail).toHaveBeenCalled();
    });

    it('should throw error for non-existent alert', async () => {
      await expect(service.acknowledgeAlert('non-existent', 'test-user')).rejects.toThrow();
    });
  });

  describe('resolveAlert', () => {
    it('should resolve an alert', async () => {
      const alertData = {
        severity: AlertSeverity.HIGH,
        message: 'Test alert',
        source: 'test',
      };

      const alert = await service.createAlert(
        alertData.severity,
        alertData.message,
        alertData.source,
      );

      const resolvedAlert = await service.resolveAlert(alert.id);

      expect(resolvedAlert.id).toBe(alert.id);
      expect(resolvedAlert.status).toBe('resolved');
      expect(resolvedAlert.resolvedAt).toBeDefined();
      expect(notificationService.sendEmail).toHaveBeenCalled();
    });

    it('should throw error for non-existent alert', async () => {
      await expect(service.resolveAlert('non-existent')).rejects.toThrow();
    });
  });

  describe('getActiveAlerts', () => {
    it('should return only active alerts', async () => {
      const alertData = {
        severity: AlertSeverity.HIGH,
        message: 'Test alert',
        source: 'test',
      };

      const alert = await service.createAlert(
        alertData.severity,
        alertData.message,
        alertData.source,
      );

      await service.resolveAlert(alert.id);

      const activeAlerts = await service.getActiveAlerts();
      expect(activeAlerts).toHaveLength(0);
    });
  });
});
