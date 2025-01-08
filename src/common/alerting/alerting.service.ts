import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationService, NotificationChannel } from '../notification/notification.service';

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  source: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  acknowledged?: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  notificationSent?: boolean;
}

export interface AlertRule {
  id: string;
  name: string;
  description?: string;
  severity: AlertSeverity;
  condition: string;
  enabled: boolean;
  notificationChannels: NotificationChannel[];
  cooldownPeriod?: number; // in milliseconds
  metadata?: Record<string, any>;
}

@Injectable()
export class AlertingService {
  private readonly logger = new Logger(AlertingService.name);
  private readonly alerts: Map<string, Alert> = new Map();
  private readonly rules: Map<string, AlertRule> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly notificationService: NotificationService,
  ) {}

  async createAlert(
    title: string,
    message: string,
    severity: AlertSeverity,
    source: string,
    metadata?: Record<string, any>,
  ): Promise<Alert> {
    try {
      const alert: Alert = {
        id: this.generateId(),
        title,
        message,
        severity,
        source,
        timestamp: new Date(),
        metadata,
        acknowledged: false,
      };

      this.alerts.set(alert.id, alert);
      await this.processAlert(alert);

      return alert;
    } catch (error) {
      this.logger.error('Failed to create alert:', error);
      throw error;
    }
  }

  async acknowledgeAlert(alertId: string, userId: string): Promise<Alert> {
    try {
      const alert = this.alerts.get(alertId);
      if (!alert) {
        throw new Error(`Alert not found: ${alertId}`);
      }

      if (alert.acknowledged) {
        throw new Error(`Alert already acknowledged: ${alertId}`);
      }

      alert.acknowledged = true;
      alert.acknowledgedBy = userId;
      alert.acknowledgedAt = new Date();

      await this.notificationService.sendNotification(
        `Alert ${alert.title} acknowledged by ${userId}`,
        'info',
        {
          alertId: alert.id,
          userId,
          timestamp: alert.acknowledgedAt.toISOString(),
        },
        NotificationChannel.EMAIL,
      );

      return alert;
    } catch (error) {
      this.logger.error(`Failed to acknowledge alert ${alertId}:`, error);
      throw error;
    }
  }

  async resolveAlert(alertId: string): Promise<Alert> {
    try {
      const alert = this.alerts.get(alertId);
      if (!alert) {
        throw new Error(`Alert not found: ${alertId}`);
      }

      alert.resolvedAt = new Date();

      await this.notificationService.sendNotification(
        `Alert ${alert.title} resolved`,
        'info',
        {
          alertId: alert.id,
          timestamp: alert.resolvedAt.toISOString(),
        },
        NotificationChannel.EMAIL,
      );

      return alert;
    } catch (error) {
      this.logger.error(`Failed to resolve alert ${alertId}:`, error);
      throw error;
    }
  }

  async createRule(rule: Omit<AlertRule, 'id'>): Promise<AlertRule> {
    try {
      const newRule: AlertRule = {
        ...rule,
        id: this.generateId(),
      };

      this.rules.set(newRule.id, newRule);
      return newRule;
    } catch (error) {
      this.logger.error('Failed to create alert rule:', error);
      throw error;
    }
  }

  async updateRule(
    ruleId: string,
    updates: Partial<AlertRule>,
  ): Promise<AlertRule> {
    try {
      const rule = this.rules.get(ruleId);
      if (!rule) {
        throw new Error(`Rule not found: ${ruleId}`);
      }

      const updatedRule: AlertRule = {
        ...rule,
        ...updates,
      };

      this.rules.set(ruleId, updatedRule);
      return updatedRule;
    } catch (error) {
      this.logger.error(`Failed to update rule ${ruleId}:`, error);
      throw error;
    }
  }

  async deleteRule(ruleId: string): Promise<void> {
    try {
      if (!this.rules.has(ruleId)) {
        throw new Error(`Rule not found: ${ruleId}`);
      }

      this.rules.delete(ruleId);
    } catch (error) {
      this.logger.error(`Failed to delete rule ${ruleId}:`, error);
      throw error;
    }
  }

  async getActiveAlerts(): Promise<Alert[]> {
    return Array.from(this.alerts.values()).filter(
      (alert) => !alert.resolvedAt,
    );
  }

  async getAlertHistory(
    filters?: {
      severity?: AlertSeverity;
      source?: string;
      startDate?: Date;
      endDate?: Date;
      acknowledged?: boolean;
    },
    pagination?: {
      page: number;
      limit: number;
    },
  ): Promise<{ alerts: Alert[]; total: number }> {
    try {
      let alerts = Array.from(this.alerts.values());

      // Apply filters
      if (filters) {
        if (filters.severity) {
          alerts = alerts.filter(
            (alert) => alert.severity === filters.severity,
          );
        }
        if (filters.source) {
          alerts = alerts.filter((alert) => alert.source === filters.source);
        }
        if (filters.startDate instanceof Date) {
          alerts = alerts.filter(
            (alert) => alert.timestamp >= filters.startDate!,
          );
        }
        if (filters.endDate instanceof Date) {
          alerts = alerts.filter(
            (alert) => alert.timestamp <= filters.endDate!,
          );
        }
        if (typeof filters.acknowledged === 'boolean') {
          alerts = alerts.filter(
            (alert) => alert.acknowledged === filters.acknowledged,
          );
        }
      }

      // Sort by timestamp descending
      alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Apply pagination
      const total = alerts.length;
      if (pagination) {
        const start = (pagination.page - 1) * pagination.limit;
        alerts = alerts.slice(start, start + pagination.limit);
      }

      return { alerts, total };
    } catch (error) {
      this.logger.error('Failed to get alert history:', error);
      throw error;
    }
  }

  private async processAlert(alert: Alert): Promise<void> {
    try {
      const matchingRules = Array.from(this.rules.values()).filter(
        (rule) => rule.enabled && this.evaluateRule(alert, rule),
      );
      if (matchingRules.length === 0) {
        return;
      }
      const highestSeverityRule = matchingRules.reduce((prev, current) =>
        this.getSeverityLevel(current.severity) >
        this.getSeverityLevel(prev.severity)
          ? current
          : prev,
      );
      await Promise.all(
        highestSeverityRule.notificationChannels.map((channel) =>
          this.notificationService.sendNotification(
            `[${alert.severity.toUpperCase()}] ${alert.title}`,
            this.mapAlertSeverityToNotificationSeverity(alert.severity),
            {
              alertId: alert.id,
              message: alert.message,
              source: alert.source,
              timestamp: alert.timestamp.toISOString(),
              metadata: alert.metadata,
            },
            channel,
          ),
        ),
      );
      alert.notificationSent = true;
    } catch (error) {
      this.logger.error(`Failed to process alert ${alert.id}:`, error);
      throw error;
    }
  }

  private evaluateRule(alert: Alert, rule: AlertRule): boolean {
    return alert.severity === rule.severity;
  }

  private getSeverityLevel(severity: AlertSeverity): number {
    const levels: Record<AlertSeverity, number> = {
      info: 0,
      warning: 1,
      error: 2,
      critical: 3,
    };
    return levels[severity];
  }

  private generateId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private mapAlertSeverityToNotificationSeverity(
    severity: AlertSeverity,
  ): 'info' | 'warning' | 'critical' {
    switch (severity) {
      case 'error':
      case 'critical':
        return 'critical';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'info';
    }
  }
}
