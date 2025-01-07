import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotificationService } from './notification.service';
import { EmailProvider } from './providers/email.provider';
import { SmsProvider } from './providers/sms.provider';

describe('NotificationService Integration', () => {
  let service: NotificationService;
  let emailProvider: EmailProvider;
  let smsProvider: SmsProvider;
  let configService: ConfigService;

  const TEST_EMAIL = 'test@example.com';
  const TEST_PHONE = '+1234567890';

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        EmailProvider,
        SmsProvider,
        {
          provide: ConfigService,
          useValue: new ConfigService(),
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    emailProvider = module.get<EmailProvider>(EmailProvider);
    smsProvider = module.get<SmsProvider>(SmsProvider);
    configService = module.get<ConfigService>(ConfigService);

    // Initialize providers
    await emailProvider.onModuleInit();
    await smsProvider.onModuleInit();
  });

  afterAll(async () => {
    // Clean up any test data or connections
    await emailProvider.onModuleDestroy();
    await smsProvider.onModuleDestroy();
  });

  describe('Email Notifications', () => {
    it('should send a simple email', async () => {
      const notification = {
        to: TEST_EMAIL,
        subject: 'Test Email',
        body: 'This is a test email.',
      };

      const result = await service.sendEmail(notification);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should send an HTML email', async () => {
      const notification = {
        to: TEST_EMAIL,
        subject: 'HTML Test Email',
        body: '<h1>Test</h1><p>This is a test HTML email.</p>',
        isHtml: true,
      };

      const result = await service.sendEmail(notification);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should send an email with attachments', async () => {
      const notification = {
        to: TEST_EMAIL,
        subject: 'Email with Attachment',
        body: 'This email has an attachment.',
        attachments: [
          {
            filename: 'test.txt',
            content: 'Test attachment content',
          },
        ],
      };

      const result = await service.sendEmail(notification);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should handle email delivery failures', async () => {
      const notification = {
        to: 'invalid-email',
        subject: 'Test Email',
        body: 'This should fail.',
      };

      await expect(service.sendEmail(notification))
        .rejects
        .toThrow();
    });
  });

  describe('SMS Notifications', () => {
    it('should send a simple SMS', async () => {
      const notification = {
        to: TEST_PHONE,
        message: 'This is a test SMS.',
      };

      const result = await service.sendSms(notification);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should send an SMS with unicode characters', async () => {
      const notification = {
        to: TEST_PHONE,
        message: 'Test SMS with emoji 👋',
      };

      const result = await service.sendSms(notification);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should handle SMS delivery failures', async () => {
      const notification = {
        to: 'invalid-phone',
        message: 'This should fail.',
      };

      await expect(service.sendSms(notification))
        .rejects
        .toThrow();
    });
  });

  describe('Bulk Notifications', () => {
    it('should send bulk emails', async () => {
      const notifications = [
        {
          to: TEST_EMAIL,
          subject: 'Bulk Test 1',
          body: 'Bulk test email 1',
        },
        {
          to: TEST_EMAIL,
          subject: 'Bulk Test 2',
          body: 'Bulk test email 2',
        },
      ];

      const results = await service.sendBulkEmail(notifications);

      expect(results).toHaveLength(notifications.length);
      expect(results.every(r => r.success)).toBe(true);
    });

    it('should send bulk SMS', async () => {
      const notifications = [
        {
          to: TEST_PHONE,
          message: 'Bulk test SMS 1',
        },
        {
          to: TEST_PHONE,
          message: 'Bulk test SMS 2',
        },
      ];

      const results = await service.sendBulkSms(notifications);

      expect(results).toHaveLength(notifications.length);
      expect(results.every(r => r.success)).toBe(true);
    });

    it('should handle partial failures in bulk operations', async () => {
      const notifications = [
        {
          to: TEST_EMAIL,
          subject: 'Valid Email',
          body: 'This should succeed',
        },
        {
          to: 'invalid-email',
          subject: 'Invalid Email',
          body: 'This should fail',
        },
      ];

      const results = await service.sendBulkEmail(notifications);

      expect(results).toHaveLength(notifications.length);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
    });
  });

  describe('Template Notifications', () => {
    it('should send an email using a template', async () => {
      const notification = {
        to: TEST_EMAIL,
        templateId: 'test-template',
        templateData: {
          name: 'Test User',
          action: 'verify email',
        },
      };

      const result = await service.sendTemplateEmail(notification);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should send an SMS using a template', async () => {
      const notification = {
        to: TEST_PHONE,
        templateId: 'test-sms-template',
        templateData: {
          name: 'Test User',
          code: '123456',
        },
      };

      const result = await service.sendTemplateSms(notification);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle provider connection errors', async () => {
      // Force provider error by disconnecting
      await emailProvider.disconnect();

      await expect(service.sendEmail({
        to: TEST_EMAIL,
        subject: 'Test',
        body: 'Test',
      })).rejects.toThrow();

      // Reconnect for other tests
      await emailProvider.connect();
    });

    it('should handle rate limiting', async () => {
      const notifications = Array.from({ length: 100 }, (_, i) => ({
        to: TEST_EMAIL,
        subject: `Test ${i}`,
        body: `Test body ${i}`,
      }));

      const results = await service.sendBulkEmail(notifications);
      
      // Some should succeed, some should be rate limited
      expect(results.some(r => r.success)).toBe(true);
      expect(results.some(r => !r.success && r.error?.includes('rate limit'))).toBe(true);
    });

    it('should handle template rendering errors', async () => {
      const notification = {
        to: TEST_EMAIL,
        templateId: 'test-template',
        templateData: {
          // Missing required data
        },
      };

      await expect(service.sendTemplateEmail(notification))
        .rejects
        .toThrow();
    });
  });

  describe('Performance', () => {
    it('should handle concurrent notifications efficiently', async () => {
      const notifications = Array.from({ length: 10 }, (_, i) => ({
        to: TEST_EMAIL,
        subject: `Concurrent Test ${i}`,
        body: `Concurrent test email ${i}`,
      }));

      const startTime = Date.now();
      
      const results = await Promise.all(
        notifications.map(n => service.sendEmail(n))
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (adjust as needed)
      expect(duration).toBeLessThan(5000);
      expect(results).toHaveLength(notifications.length);
      expect(results.every(r => r.success)).toBe(true);
    });
  });
}); 