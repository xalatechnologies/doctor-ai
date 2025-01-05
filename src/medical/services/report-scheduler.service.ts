import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PDFReportService } from './pdf-report.service';
import { NotificationService } from './notification.service';
import { ReportTemplate } from '../interfaces/report-template.interface';

interface ScheduledReport {
  id: string;
  templateId: string;
  schedule: string;
  recipients: string[];
  timeframe: '24h' | '7d';
  enabled: boolean;
  lastRun?: Date;
}

@Injectable()
export class ReportSchedulerService implements OnModuleInit {
  private schedules: Map<string, ScheduledReport> = new Map();
  private templates: Map<string, ReportTemplate> = new Map();

  constructor(
    private configService: ConfigService,
    private pdfReportService: PDFReportService,
    private notificationService: NotificationService
  ) {}

  async onModuleInit() {
    await this.loadTemplates();
    await this.loadSchedules();
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleScheduledReports() {
    const now = new Date();
    
    for (const [id, schedule] of this.schedules.entries()) {
      if (!schedule.enabled) continue;

      if (this.shouldRunReport(schedule, now)) {
        try {
          await this.generateAndSendReport(schedule);
          schedule.lastRun = now;
        } catch (error) {
          console.error(`Failed to generate report ${id}:`, error);
        }
      }
    }
  }

  async createSchedule(schedule: Omit<ScheduledReport, 'id'>): Promise<string> {
    const id = `schedule_${Date.now()}`;
    this.schedules.set(id, { ...schedule, id });
    await this.saveSchedules();
    return id;
  }

  async updateSchedule(id: string, updates: Partial<ScheduledReport>): Promise<void> {
    const schedule = this.schedules.get(id);
    if (!schedule) throw new Error('Schedule not found');

    this.schedules.set(id, { ...schedule, ...updates });
    await this.saveSchedules();
  }

  async deleteSchedule(id: string): Promise<void> {
    this.schedules.delete(id);
    await this.saveSchedules();
  }

  async createTemplate(template: Omit<ReportTemplate, 'id'>): Promise<string> {
    const id = `template_${Date.now()}`;
    this.templates.set(id, { ...template, id });
    await this.saveTemplates();
    return id;
  }

  getTemplate(id: string): ReportTemplate | undefined {
    return this.templates.get(id);
  }

  getAllTemplates(): ReportTemplate[] {
    return Array.from(this.templates.values());
  }

  private async generateAndSendReport(schedule: ScheduledReport): Promise<void> {
    const template = this.templates.get(schedule.templateId);
    if (!template) throw new Error('Template not found');

    const report = await this.pdfReportService.generateReport(
      schedule.timeframe,
      template
    );

    // Send report to recipients
    await Promise.all(schedule.recipients.map(recipient =>
      this.notificationService.sendNotification(
        'Report Generated',
        'info',
        {
          type: 'report',
          template: template.name,
          timeframe: schedule.timeframe,
          attachment: report
        }
      )
    ));
  }

  private shouldRunReport(schedule: ScheduledReport, now: Date): boolean {
    if (!schedule.lastRun) return true;

    // Parse cron schedule and check if it's time to run
    // This is a simplified check - you might want to use a cron parser library
    const hoursSinceLastRun = (now.getTime() - schedule.lastRun.getTime()) / (1000 * 60 * 60);
    return hoursSinceLastRun >= 24; // Run daily for this example
  }

  private async loadTemplates(): Promise<void> {
    // Load templates from database or config
    const defaultTemplate: ReportTemplate = {
      id: 'default',
      name: 'Default Report',
      description: 'Standard performance report',
      sections: [
        {
          id: 'summary',
          title: 'Summary',
          type: 'summary',
          enabled: true,
          order: 1
        },
        {
          id: 'metrics',
          title: 'Performance Metrics',
          type: 'metrics',
          enabled: true,
          order: 2
        },
        {
          id: 'charts',
          title: 'Performance Charts',
          type: 'chart',
          enabled: true,
          order: 3,
          options: {
            charts: ['latency', 'confidence', 'timeseries']
          }
        }
      ],
      style: {
        theme: 'light',
        fontFamily: 'Helvetica'
      }
    };

    this.templates.set('default', defaultTemplate);
  }

  private async loadSchedules(): Promise<void> {
    // Load schedules from database or config
  }

  private async saveTemplates(): Promise<void> {
    // Save templates to database
  }

  private async saveSchedules(): Promise<void> {
    // Save schedules to database
  }
} 