import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { VisualizationService, ChartData } from './visualization.service';
import { MetricsService } from './metrics.service';
import { ReportTemplate, ReportSection } from '../interfaces/report-template.interface';
import { LLMProvider } from './llm-orchestration.service';

@Injectable()
export class PDFReportService {
  constructor(
    private visualizationService: VisualizationService,
    private metricsService: MetricsService
  ) {}

  async generateReport(timeframe: '24h' | '7d' = '24h', template?: ReportTemplate): Promise<Buffer> {
    const doc = new PDFDocument({ 
      margin: 50,
      ...this.getTemplateSettings(template)
    });
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      try {
        this.generateReportContent(doc, timeframe, template);
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private getTemplateSettings(template?: ReportTemplate): any {
    if (!template) return {};

    return {
      font: template.style.fontFamily,
      size: 'A4',
      info: {
        Title: template.name,
        Author: 'Medical AI System',
        Subject: template.description
      }
    };
  }

  private generateReportContent(
    doc: PDFKit.PDFDocument, 
    timeframe: '24h' | '7d',
    template?: ReportTemplate
  ): void {
    const sections = template?.sections || this.getDefaultSections();

    sections
      .sort((a, b) => a.order - b.order)
      .filter(section => section.enabled)
      .forEach(section => {
        this.generateSection(doc, section, timeframe);
      });
  }

  private generateSection(
    doc: PDFKit.PDFDocument,
    section: ReportSection,
    timeframe: '24h' | '7d'
  ): void {
    switch (section.type) {
      case 'summary':
        this.addSummarySection(doc);
        break;
      case 'metrics':
        this.addPerformanceSection(doc);
        break;
      case 'chart':
        this.addChartSection(doc, timeframe, section.options?.charts);
        break;
      case 'comparison':
        this.addProviderComparisonSection(doc);
        break;
      case 'analysis':
        this.addAnalysisSection(doc, section.options);
        break;
    }
  }

  private addHeader(doc: PDFKit.PDFDocument): void {
    doc
      .fontSize(24)
      .text('LLM Performance Report', { align: 'center' })
      .fontSize(12)
      .text(`Generated on ${new Date().toLocaleString()}`, { align: 'center' })
      .moveDown(2);
  }

  private addSummarySection(doc: PDFKit.PDFDocument): void {
    const metrics = this.metricsService.getAggregateMetrics();

    doc
      .fontSize(16)
      .text('Summary', { underline: true })
      .moveDown(1)
      .fontSize(12);

    const summaryTable = {
      headers: ['Metric', 'Value'],
      rows: [
        ['Total Requests', metrics.totalRequests.toString()],
        ['Success Rate', `${(metrics.successRate * 100).toFixed(2)}%`],
        ['Average Latency', `${metrics.averageLatency.toFixed(2)}ms`],
        ['Average Confidence', `${(metrics.averageConfidence * 100).toFixed(2)}%`]
      ]
    };

    this.drawTable(doc, summaryTable);
    doc.moveDown(2);
  }

  private addPerformanceSection(doc: PDFKit.PDFDocument): void {
    const metrics = this.metricsService.getAllMetrics();

    doc
      .fontSize(16)
      .text('Provider Performance', { underline: true })
      .moveDown(1)
      .fontSize(12);

    const performanceTable = {
      headers: ['Provider', 'Requests', 'Success Rate', 'Avg. Latency', 'Avg. Confidence'],
      rows: Array.from(metrics.entries()).map(([provider, data]) => [
        provider.toString(),
        data.total.totalCalls.toString(),
        `${(data.total.successRate * 100).toFixed(2)}%`,
        `${data.total.averageLatency.toFixed(2)}ms`,
        `${(data.total.averageConfidence * 100).toFixed(2)}%`
      ])
    };

    this.drawTable(doc, performanceTable);
    doc.moveDown(2);
  }

  private async addChartSection(doc: PDFKit.PDFDocument, timeframe: '24h' | '7d', charts?: string[]): Promise<void> {
    doc
      .fontSize(16)
      .text('Performance Charts', { underline: true })
      .moveDown(1);

    // Add charts as images
    const chartTypes = charts || ['latency', 'confidence', 'timeseries'];
    const chartData = {
      latency: this.visualizationService.getLatencyDistribution(),
      confidence: this.visualizationService.getConfidenceDistribution(),
      timeseries: this.visualizationService.getTimeSeriesData(timeframe)
    };

    for (const chartType of chartTypes) {
      const chart = chartData[chartType];
      doc
        .fontSize(14)
        .text(chartType)
        .moveDown(0.5);

      const chartImage = await this.renderChartToImage(chart);
      doc.image(chartImage, { fit: [500, 300] });
      doc.moveDown(2);
    }
  }

  private addProviderComparisonSection(doc: PDFKit.PDFDocument): void {
    const comparison = this.visualizationService.getProviderComparison();
    
    doc
      .fontSize(16)
      .text('Provider Comparison', { underline: true })
      .moveDown(1)
      .fontSize(12);

    // Add comparison analysis
    const metrics = this.metricsService.getAllMetrics();
    this.addComparisonAnalysis(doc, metrics);
    doc.moveDown(2);
  }

  private addFooter(doc: PDFKit.PDFDocument): void {
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc
        .fontSize(10)
        .text(
          `Page ${i + 1} of ${pageCount}`,
          50,
          doc.page.height - 50,
          { align: 'center' }
        );
    }
  }

  private drawTable(doc: PDFKit.PDFDocument, table: { headers: string[]; rows: string[][] }): void {
    const cellPadding = 5;
    const columnWidth = (doc.page.width - 100) / table.headers.length;
    let yPos = doc.y;

    // Draw headers
    table.headers.forEach((header, i) => {
      doc
        .font('Helvetica-Bold')
        .text(
          header,
          50 + (i * columnWidth),
          yPos,
          { width: columnWidth, align: 'left' }
        );
    });

    yPos += 20;
    doc.font('Helvetica');

    // Draw rows
    table.rows.forEach(row => {
      row.forEach((cell, i) => {
        doc.text(
          cell,
          50 + (i * columnWidth),
          yPos,
          { width: columnWidth, align: 'left' }
        );
      });
      yPos += 20;
    });

    doc.y = yPos + 10;
  }

  private async renderChartToImage(chartData: ChartData): Promise<Buffer> {
    // Implementation depends on your chart library
    // This is a placeholder that should be replaced with actual chart rendering
    return Buffer.from('');
  }

  private addComparisonAnalysis(doc: PDFKit.PDFDocument, metrics: Map<any, any>): void {
    const analysis = this.generateComparisonAnalysis(metrics);
    doc.text(analysis, { align: 'justify' });
  }

  private generateComparisonAnalysis(metrics: Map<any, any>): string {
    // Generate detailed analysis text based on metrics
    return 'Detailed performance analysis...'; // Placeholder
  }

  async generatePreview(template: ReportTemplate): Promise<Buffer> {
    // Generate a sample report with placeholder data
    const previewData = this.generatePreviewData();
    
    const doc = new PDFDocument({ 
      margin: 50,
      ...this.getTemplateSettings(template)
    });

    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      try {
        this.generatePreviewContent(doc, template, previewData);
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private generatePreviewContent(
    doc: PDFKit.PDFDocument,
    template: ReportTemplate,
    previewData: any
  ): void {
    // Add watermark
    this.addPreviewWatermark(doc);

    // Generate preview content using template sections
    template.sections
      .filter(section => section.enabled)
      .sort((a, b) => a.order - b.order)
      .forEach(section => {
        this.generatePreviewSection(doc, section, previewData);
      });
  }

  private addPreviewWatermark(doc: PDFKit.PDFDocument): void {
    const watermark = 'PREVIEW';
    doc.save();
    doc.rotate(45, { origin: [doc.page.width / 2, doc.page.height / 2] });
    doc.fontSize(60);
    doc.fillColor('rgba(200, 200, 200, 0.3)');
    doc.text(watermark, 0, 0, {
      align: 'center'
    });
    doc.restore();
  }

  private addPreviewSummary(doc: PDFKit.PDFDocument, previewData: any): void {
    doc.fontSize(16)
      .text('Summary', { underline: true })
      .moveDown(1)
      .fontSize(12);

    const summaryTable = {
      headers: ['Metric', 'Value'],
      rows: [
        ['Total Requests', previewData.metrics.totalRequests.toString()],
        ['Success Rate', `${(previewData.metrics.successRate * 100).toFixed(2)}%`],
        ['Average Latency', `${previewData.metrics.averageLatency.toFixed(2)}ms`],
        ['Average Confidence', `${(previewData.metrics.averageConfidence * 100).toFixed(2)}%`]
      ]
    };

    this.drawTable(doc, summaryTable);
    doc.moveDown(2);
  }

  private addPreviewMetrics(doc: PDFKit.PDFDocument, previewData: any): void {
    doc.fontSize(16)
      .text('Provider Metrics', { underline: true })
      .moveDown(1)
      .fontSize(12);

    const metricsTable = {
      headers: ['Provider', 'Requests', 'Success Rate', 'Latency', 'Confidence'],
      rows: previewData.providers.map(provider => [
        provider.name,
        provider.metrics.requests.toString(),
        `${(provider.metrics.successRate * 100).toFixed(2)}%`,
        `${provider.metrics.latency.toFixed(2)}ms`,
        `${(provider.metrics.confidence * 100).toFixed(2)}%`
      ])
    };

    this.drawTable(doc, metricsTable);
    doc.moveDown(2);
  }

  private addPreviewCharts(doc: PDFKit.PDFDocument, charts?: string[]): void {
    doc.fontSize(16)
      .text('Sample Charts', { underline: true })
      .moveDown(1)
      .fontSize(12);

    doc.text('Preview charts will be generated here', { align: 'center' });
    doc.moveDown(2);
  }

  private addPreviewComparison(doc: PDFKit.PDFDocument, previewData: any): void {
    doc.fontSize(16)
      .text('Provider Comparison', { underline: true })
      .moveDown(1)
      .fontSize(12);

    doc.text('Sample provider comparison data will be shown here', { align: 'center' });
    doc.moveDown(2);
  }

  private addPreviewAnalysis(doc: PDFKit.PDFDocument, previewData: any): void {
    doc.fontSize(16)
      .text('Performance Analysis', { underline: true })
      .moveDown(1)
      .fontSize(12);

    doc.text('Sample performance analysis will be generated here', { align: 'center' });
    doc.moveDown(2);
  }

  private generatePreviewData(): any {
    return {
      metrics: {
        totalRequests: 1000,
        successRate: 0.95,
        averageLatency: 250,
        averageConfidence: 0.85
      },
      providers: [
        {
          name: 'Sample Provider 1',
          metrics: {
            requests: 500,
            successRate: 0.97,
            latency: 200,
            confidence: 0.88
          }
        },
        {
          name: 'Sample Provider 2',
          metrics: {
            requests: 500,
            successRate: 0.93,
            latency: 300,
            confidence: 0.82
          }
        }
      ]
    };
  }

  private generatePreviewSection(
    doc: PDFKit.PDFDocument,
    section: ReportSection,
    previewData: any
  ): void {
    doc
      .fontSize(16)
      .text(section.title, { underline: true })
      .moveDown(1);

    switch (section.type) {
      case 'summary':
        this.addPreviewSummary(doc, previewData);
        break;
      case 'metrics':
        this.addPreviewMetrics(doc, previewData);
        break;
      case 'chart':
        this.addPreviewCharts(doc, section.options?.charts);
        break;
      case 'comparison':
        this.addPreviewComparison(doc, previewData);
        break;
      case 'analysis':
        this.addPreviewAnalysis(doc, previewData);
        break;
    }

    doc.moveDown(2);
  }

  private getDefaultSections(): ReportSection[] {
    return [
      {
        id: 'summary',
        title: 'Summary',
        type: 'summary',
        enabled: true,
        order: 1
      },
      {
        id: 'performance',
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
      },
      {
        id: 'comparison',
        title: 'Provider Comparison',
        type: 'comparison',
        enabled: true,
        order: 4
      }
    ];
  }

  private addAnalysisSection(doc: PDFKit.PDFDocument, options?: ReportSection['options']): void {
    doc
      .fontSize(16)
      .text('Performance Analysis', { underline: true })
      .moveDown(1)
      .fontSize(12);

    const metrics = this.metricsService.getAggregateMetrics();
    const analysis = this.generateAnalysis(metrics, options);
    doc.text(analysis, { align: 'justify' });
    doc.moveDown(2);
  }

  private generateAnalysis(metrics: any, options?: ReportSection['options']): string {
    // Generate detailed analysis text based on metrics and options
    return 'Detailed performance analysis...'; // Placeholder
  }
} 