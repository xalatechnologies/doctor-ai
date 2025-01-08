import { Injectable } from '@nestjs/common';
import { MetricsService } from '../metrics/metrics.service';
import { NotificationService } from '../notification/notification.service';

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface Alert {
  id: string;
  timestamp: Date;
  severity: AlertSeverity;
  message: string;
  source: string;
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
}

@Injectable()
export class AlertingService {
  private alerts: Map<string, Alert>;

  constructor(
    private readonly metricsService: MetricsService,
    private readonly notificationService: NotificationService,
  ) {
    this.alerts = new Map();
  }

  public async createAlert(
    severity: AlertSeverity,
    message: string,
    source: string,
  ): Promise<Alert> {
    const startTime = Date.now();
    const alert: Alert = {
      id: this.generateAlertId(),
      timestamp: new Date(),
      severity,
      message,
      source,
      status: 'active',
    };

    this.alerts.set(alert.id, alert);
    await this.notifyAlert(alert);

    const duration = (Date.now() - startTime) / 1000;
    this.metricsService.recordLatency('alerting', 'create_alert', duration);

    return alert;
  }

  public async acknowledgeAlert(alertId: string, userId: string): Promise<Alert> {
    const startTime = Date.now();
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert with ID ${alertId} not found`);
    }

    alert.status = 'acknowledged';
    alert.acknowledgedBy = userId;
    alert.acknowledgedAt = new Date();

    await this.notifyAlert(alert);

    const duration = (Date.now() - startTime) / 1000;
    this.metricsService.recordLatency('alerting', 'acknowledge_alert', duration);

    return alert;
  }

  public async resolveAlert(alertId: string): Promise<Alert> {
    const startTime = Date.now();
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert with ID ${alertId} not found`);
    }

    alert.status = 'resolved';
    alert.resolvedAt = new Date();

    await this.notifyAlert(alert);

    const duration = (Date.now() - startTime) / 1000;
    this.metricsService.recordLatency('alerting', 'resolve_alert', duration);

    return alert;
  }

  public async getActiveAlerts(): Promise<Alert[]> {
    const startTime = Date.now();
    const activeAlerts = Array.from(this.alerts.values()).filter(
      (alert) => alert.status === 'active',
    );

    const duration = (Date.now() - startTime) / 1000;
    this.metricsService.recordLatency('alerting', 'get_active_alerts', duration);

    return activeAlerts;
  }

  private generateAlertId(): string {
    return `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async notifyAlert(alert: Alert): Promise<void> {
    await this.notificationService.sendEmail({
      userId: 'admin',
      title: `Alert: ${alert.severity.toUpperCase()} - ${alert.source}`,
      message: `
      Alert Details:
      Severity: ${alert.severity}
      Message: ${alert.message}
      Source: ${alert.source}
      Status: ${alert.status}
      ${alert.acknowledgedBy ? `Acknowledged by: ${alert.acknowledgedBy}` : ''}
      ${alert.resolvedAt ? `Resolved at: ${alert.resolvedAt}` : ''}
    `,
      type: 'email',
      priority: 'high'
    });
  }
}
