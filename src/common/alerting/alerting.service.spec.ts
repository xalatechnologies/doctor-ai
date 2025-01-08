import { Test, TestingModule } from '@nestjs/testing';
import { AlertingService, AlertSeverity } from './alerting.service';
import { NotificationService } from '../notification/notification.service';
import { ConfigService } from '@nestjs/config';
import { MetricsService } from '../metrics/metrics.service';

describe('AlertingService', () => {
  let service: AlertingService;
  let notificationService: NotificationService;
  let configService: ConfigService;
  let metricsService: MetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertingService,
        {
          provide: NotificationService,
          useValue: {
            sendNotification: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              switch (key) {
                case 'ALERT_RETENTION_DAYS':
                  return '30';
                case 'ALERT_COOLDOWN_PERIOD':
                  return '300000'; // 5 minutes
                default:
                  return undefined;
              }
            }),
          },
        },
        {
          provide: MetricsService,
          useValue: {
            incrementLogCount: jest.fn(),
            recordLatency: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AlertingService>(AlertingService);
    notificationService = module.get<NotificationService>(NotificationService);
    configService = module.get<ConfigService>(ConfigService);
    metricsService = module.get<MetricsService>(MetricsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAlert', () => {
    it('should create an alert successfully', async () => {
      const alertData = {
        title: 'Test Alert',
        message: 'Test Message',
        severity: 'critical' as AlertSeverity,
        source: 'test',
        metadata: { test: 'data' },
      };

      const alert = await service.createAlert(
        alertData.title,
        alertData.message,
        alertData.severity,
        alertData.source,
        alertData.metadata,
      );

      expect(alert).toBeDefined();
      expect(alert.title).toBe(alertData.title);
      expect(alert.severity).toBe(alertData.severity);
      expect(alert.acknowledged).toBe(false);
      expect(notificationService.sendNotification).toHaveBeenCalled();
      expect(metricsService.incrementLogCount).toHaveBeenCalledWith('alert_created');
      expect(metricsService.recordLatency).toHaveBeenCalled();
    });

    it('should respect alert cooldown period', async () => {
      const cooldownPeriod = parseInt(configService.get('ALERT_COOLDOWN_PERIOD'));
      expect(cooldownPeriod).toBe(300000); // Verify config is loaded

      // Create first alert
      await service.createAlert(
        'Test Alert',
        'Test Message',
        'warning',
        'test',
      );

      // Try to create another alert immediately
      const secondAlert = await service.createAlert(
        'Test Alert',
        'Test Message',
        'warning',
        'test',
      );

      expect(secondAlert.metadata).toHaveProperty('cooldownActive', true);
    });
  });

  describe('acknowledgeAlert', () => {
    it('should acknowledge an alert', async () => {
      const alert = await service.createAlert(
        'Test Alert',
        'Test Message',
        'warning',
        'test',
      );

      const userId = 'test-user';
      const acknowledgedAlert = await service.acknowledgeAlert(alert.id, userId);

      expect(acknowledgedAlert.acknowledged).toBe(true);
      expect(acknowledgedAlert.acknowledgedBy).toBe(userId);
      expect(acknowledgedAlert.acknowledgedAt).toBeDefined();
      expect(notificationService.sendNotification).toHaveBeenCalled();
      expect(metricsService.incrementLogCount).toHaveBeenCalledWith('alert_acknowledged');
    });

    it('should throw error for non-existent alert', async () => {
      await expect(service.acknowledgeAlert('non-existent', 'user')).rejects.toThrow(
        'Alert not found',
      );
      expect(metricsService.incrementLogCount).toHaveBeenCalledWith('alert_error');
    });
  });

  describe('resolveAlert', () => {
    it('should resolve an alert', async () => {
      const alert = await service.createAlert(
        'Test Alert',
        'Test Message',
        'warning',
        'test',
      );

      const resolvedAlert = await service.resolveAlert(alert.id);

      expect(resolvedAlert.resolvedAt).toBeDefined();
      expect(notificationService.sendNotification).toHaveBeenCalled();
      expect(metricsService.incrementLogCount).toHaveBeenCalledWith('alert_resolved');
    });

    it('should throw error for non-existent alert', async () => {
      await expect(service.resolveAlert('non-existent')).rejects.toThrow(
        'Alert not found',
      );
      expect(metricsService.incrementLogCount).toHaveBeenCalledWith('alert_error');
    });
  });

  describe('getActiveAlerts', () => {
    it('should return only unresolved alerts', async () => {
      // Create multiple alerts
      const alert1 = await service.createAlert(
        'Alert 1',
        'Message 1',
        'info',
        'test',
      );
      const alert2 = await service.createAlert(
        'Alert 2',
        'Message 2',
        'warning',
        'test',
      );
      await service.resolveAlert(alert1.id);

      const activeAlerts = await service.getActiveAlerts();
      expect(activeAlerts.length).toBe(1);
      expect(activeAlerts[0].id).toBe(alert2.id);
      expect(metricsService.recordLatency).toHaveBeenCalledWith('get_active_alerts');
    });
  });
});
