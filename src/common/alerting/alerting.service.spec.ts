import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AlertingService, AlertSeverity, Alert, AlertRule } from './alerting.service';
import { NotificationService } from '../notification/notification.service';

describe('AlertingService', () => {
  let service: AlertingService;
  let notificationService: NotificationService;

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockNotificationService = {
    sendNotification: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertingService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
      ],
    }).compile();

    service = module.get<AlertingService>(AlertingService);
    notificationService = module.get<NotificationService>(NotificationService);
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
      expect(mockNotificationService.sendNotification).toHaveBeenCalled();
    });

    it('should throw error for non-existent alert', async () => {
      await expect(service.acknowledgeAlert('non-existent', 'user'))
        .rejects.toThrow('Alert not found');
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
      expect(mockNotificationService.sendNotification).toHaveBeenCalled();
    });

    it('should throw error for non-existent alert', async () => {
      await expect(service.resolveAlert('non-existent'))
        .rejects.toThrow('Alert not found');
    });
  });

  describe('alert rules', () => {
    it('should create and manage alert rules', async () => {
      const ruleData: Omit<AlertRule, 'id'> = {
        name: 'Test Rule',
        description: 'Test Description',
        severity: 'warning',
        condition: 'test condition',
        enabled: true,
        notificationChannels: ['email'],
      };

      // Create rule
      const rule = await service.createRule(ruleData);
      expect(rule).toBeDefined();
      expect(rule.name).toBe(ruleData.name);

      // Update rule
      const updatedRule = await service.updateRule(rule.id, { enabled: false });
      expect(updatedRule.enabled).toBe(false);

      // Delete rule
      await service.deleteRule(rule.id);
      await expect(service.updateRule(rule.id, {}))
        .rejects.toThrow('Rule not found');
    });
  });

  describe('getActiveAlerts', () => {
    it('should return only unresolved alerts', async () => {
      // Create multiple alerts
      const alert1 = await service.createAlert('Alert 1', 'Message 1', 'info', 'test');
      const alert2 = await service.createAlert('Alert 2', 'Message 2', 'warning', 'test');
      await service.resolveAlert(alert1.id);

      const activeAlerts = await service.getActiveAlerts();
      expect(activeAlerts.length).toBe(1);
      expect(activeAlerts[0].id).toBe(alert2.id);
    });
  });

  describe('getAlertHistory', () => {
    it('should filter and paginate alerts correctly', async () => {
      // Create test alerts
      await service.createAlert('Alert 1', 'Message 1', 'info', 'test');
      await service.createAlert('Alert 2', 'Message 2', 'warning', 'test');
      await service.createAlert('Alert 3', 'Message 3', 'error', 'other');

      // Test filtering
      const filteredResults = await service.getAlertHistory(
        { severity: 'warning', source: 'test' },
      );
      expect(filteredResults.alerts.length).toBe(1);
      expect(filteredResults.alerts[0].severity).toBe('warning');

      // Test pagination
      const paginatedResults = await service.getAlertHistory(
        undefined,
        { page: 1, limit: 2 },
      );
      expect(paginatedResults.alerts.length).toBe(2);
      expect(paginatedResults.total).toBe(3);
    });
  });
}); 