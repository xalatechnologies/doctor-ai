import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ReportTemplate } from '../interfaces/report-template.interface';

export interface ArchivedReport {
  id: string;
  timestamp: Date;
  templateId: string;
  timeframe: '24h' | '7d';
  size: number;
  path: string;
  metadata: {
    template: string;
    generator: string;
    metrics: {
      totalRequests: number;
      successRate: number;
      providers: string[];
    };
  };
}

@Injectable()
export class ReportArchiveService {
  private archives: Map<string, ArchivedReport> = new Map();
  private readonly storageBasePath: string;

  constructor(private configService: ConfigService) {
    this.storageBasePath = this.configService.get('REPORT_STORAGE_PATH') || './reports';
  }

  async archiveReport(
    report: Buffer,
    template: ReportTemplate,
    timeframe: '24h' | '7d',
    metadata: any
  ): Promise<string> {
    const id = `report_${Date.now()}`;
    const path = await this.saveReportFile(id, report);

    const archived: ArchivedReport = {
      id,
      timestamp: new Date(),
      templateId: template.id,
      timeframe,
      size: report.length,
      path,
      metadata: {
        template: template.name,
        generator: 'Medical AI System',
        metrics: metadata
      }
    };

    this.archives.set(id, archived);
    await this.saveArchiveMetadata();
    return id;
  }

  async getReport(id: string): Promise<Buffer> {
    const archived = this.archives.get(id);
    if (!archived) {
      throw new Error('Report not found');
    }
    return this.loadReportFile(archived.path);
  }

  async getReportMetadata(id: string): Promise<ArchivedReport | undefined> {
    return this.archives.get(id);
  }

  async listReports(filters?: {
    templateId?: string;
    timeframe?: '24h' | '7d';
    startDate?: Date;
    endDate?: Date;
  }): Promise<ArchivedReport[]> {
    let reports = Array.from(this.archives.values());

    if (filters) {
      reports = reports.filter(report => {
        if (filters.templateId && report.templateId !== filters.templateId) return false;
        if (filters.timeframe && report.timeframe !== filters.timeframe) return false;
        if (filters.startDate && report.timestamp < filters.startDate) return false;
        if (filters.endDate && report.timestamp > filters.endDate) return false;
        return true;
      });
    }

    return reports.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async deleteReport(id: string): Promise<void> {
    const archived = this.archives.get(id);
    if (!archived) return;

    await this.deleteReportFile(archived.path);
    this.archives.delete(id);
    await this.saveArchiveMetadata();
  }

  private async saveReportFile(id: string, content: Buffer): Promise<string> {
    // Implementation depends on your storage solution (filesystem, S3, etc.)
    const path = `${this.storageBasePath}/${id}.pdf`;
    // Save file logic here
    return path;
  }

  private async loadReportFile(path: string): Promise<Buffer> {
    // Implementation depends on your storage solution
    return Buffer.from('');
  }

  private async deleteReportFile(path: string): Promise<void> {
    // Implementation depends on your storage solution
  }

  private async saveArchiveMetadata(): Promise<void> {
    // Save archive metadata to persistent storage
  }
} 