import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PDFReportService } from '../pdf-report/pdf-report.service';
import { NotificationService } from '../notification/notification.service';
import { CronJob } from 'cron';
import { DateTime } from 'luxon';

export interface ReportSchedule {
  id: string;
  name: string;
  description?: string;
  cronExpression: string;
  reportType: string;
  recipients: string[];
  parameters: Record<string, any>;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  createdAt: Date;
  createdBy: string;
  metadata?: Record<string, unknown>;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  type: string;
  template: any;
  parameters: {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'date';
    required: boolean;
    default?: any;
  }[];
}

@Injectable()
export class ReportSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(ReportSchedulerService.name);
  private readonly templates: Map<string, any> = new Map();
  private readonly schedules: Map<string, ReportSchedule> = new Map();
  private readonly jobs: Map<string, CronJob> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly pdfReportService: PDFReportService,
    private readonly notificationService: NotificationService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.loadTemplates();
      await this.loadSchedules();
      this.startScheduledJobs();
      this.logger.log('Report scheduler initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize report scheduler:', error);
      throw error;
    }
  }

  private async loadTemplates(): Promise<void> {
    try {
      // Load report templates from database or configuration
      // This is a placeholder implementation
      this.templates.set('daily-summary', {
        id: 'daily-summary',
        name: 'Daily Summary Report',
        type: 'summary',
        template: {
          title: 'Daily Summary Report',
          sections: [
            {
              heading: 'Overview',
              content: 'Daily summary of medical activities',
            },
          ],
        },
        parameters: [
          {
            name: 'date',
            type: 'date',
            required: true,
            default: new Date(),
          },
        ],
      });
    } catch (error) {
      this.logger.error('Failed to load report templates:', error);
      throw error;
    }
  }

  private async loadSchedules(): Promise<void> {
    try {
      // Load schedules from database or configuration
      // This is a placeholder implementation
      this.schedules.set('daily-summary', {
        id: 'daily-summary',
        name: 'Daily Summary',
        cronExpression: '0 0 * * *', // Every day at midnight
        reportType: 'daily-summary',
        recipients: ['admin@example.com'],
        parameters: {},
        enabled: true,
        createdAt: new Date(),
        createdBy: 'admin',
      });
    } catch (error) {
      this.logger.error('Failed to load schedules:', error);
      throw error;
    }
  }

  private startScheduledJobs(): void {
    for (const [id, schedule] of this.schedules.entries()) {
      if (schedule.enabled) {
        this.createJob(schedule);
      }
    }
  }

  private createJob(schedule: ReportSchedule): void {
    const job = new CronJob(schedule.cronExpression, async () => {
      try {
        await this.executeSchedule(schedule);
      } catch (error) {
        this.logger.error(`Failed to execute schedule ${schedule.id}:`, error);
      }
    });

    this.jobs.set(schedule.id, job);
    schedule.nextRun = job.nextDate().toJSDate();
  }

  private async executeSchedule(schedule: ReportSchedule): Promise<void> {
    try {
      const template = this.templates.get(schedule.reportType);
      if (!template) {
        throw new Error(`Template not found for type: ${schedule.reportType}`);
      }

      // Update schedule metadata
      schedule.lastRun = new Date();
      schedule.nextRun = this.jobs.get(schedule.id)?.nextDate().toJSDate();

      // Save schedule updates
      await this.saveSchedule(schedule);
    } catch (error) {
      this.logger.error(`Failed to execute schedule ${schedule.id}:`, error);
      throw error;
    }
  }

  async createSchedule(schedule: Omit<ReportSchedule, 'id'>): Promise<ReportSchedule> {
    try {
      const id = this.generateId();
      const newSchedule: ReportSchedule = {
        ...schedule,
        id,
        createdAt: new Date(),
        createdBy: 'admin',
      };

      // Validate schedule
      await this.validateSchedule(newSchedule);

      // Save schedule
      this.schedules.set(id, newSchedule);
      await this.saveSchedule(newSchedule);

      // Create job if enabled
      if (newSchedule.enabled) {
        this.createJob(newSchedule);
      }

      return newSchedule;
    } catch (error) {
      this.logger.error('Failed to create schedule:', error);
      throw error;
    }
  }

  async updateSchedule(id: string, updates: Partial<ReportSchedule>): Promise<ReportSchedule> {
    try {
      const schedule = this.schedules.get(id);
      if (!schedule) {
        throw new Error(`Schedule not found: ${id}`);
      }

      const updatedSchedule: ReportSchedule = {
        ...schedule,
        ...updates,
      };

      // Validate updated schedule
      await this.validateSchedule(updatedSchedule);

      // Update job if cron expression or enabled status changed
      if (
        updates.cronExpression !== schedule.cronExpression ||
        updates.enabled !== schedule.enabled
      ) {
        const job = this.jobs.get(id);
        if (job) {
          job.stop();
          this.jobs.delete(id);
        }

        if (updatedSchedule.enabled) {
          this.createJob(updatedSchedule);
        }
      }

      // Save updated schedule
      this.schedules.set(id, updatedSchedule);
      await this.saveSchedule(updatedSchedule);

      return updatedSchedule;
    } catch (error) {
      this.logger.error(`Failed to update schedule ${id}:`, error);
      throw error;
    }
  }

  async deleteSchedule(id: string): Promise<void> {
    try {
      const schedule = this.schedules.get(id);
      if (!schedule) {
        throw new Error(`Schedule not found: ${id}`);
      }

      // Stop and remove job
      const job = this.jobs.get(id);
      if (job) {
        job.stop();
        this.jobs.delete(id);
      }

      // Remove schedule
      this.schedules.delete(id);
      await this.deleteScheduleFromStorage(id);
    } catch (error) {
      this.logger.error(`Failed to delete schedule ${id}:`, error);
      throw error;
    }
  }

  private async validateSchedule(schedule: ReportSchedule): Promise<void> {
    try {
      if (!this.templates.has(schedule.reportType)) {
        throw new Error(`Invalid report type: ${schedule.reportType}`);
      }

      try {
        // Validate cron expression by attempting to create a job
        const job = new CronJob(schedule.cronExpression, () => {});
        
        // If we got here, the cron expression is valid
        job.stop();
      } catch (error) {
        throw new Error(`Invalid cron expression: ${schedule.cronExpression}`);
      }
    } catch (error) {
      this.logger.error('Failed to validate schedule:', error);
      throw error;
    }
  }

  private generateId(): string {
    return `schedule_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private async saveSchedule(schedule: ReportSchedule): Promise<void> {
    try {
      // TODO: Implement actual storage logic
      this.logger.debug(`Saving schedule ${schedule.id}`);
      await Promise.resolve(); // Placeholder for actual implementation
    } catch (error) {
      this.logger.error(`Failed to save schedule ${schedule.id}:`, error);
      throw error;
    }
  }

  private async deleteScheduleFromStorage(id: string): Promise<void> {
    try {
      // TODO: Implement actual storage logic
      this.logger.debug(`Deleting schedule ${id}`);
      await Promise.resolve(); // Placeholder for actual implementation
    } catch (error) {
      this.logger.error(`Failed to delete schedule ${id}:`, error);
      throw error;
    }
  }
} 