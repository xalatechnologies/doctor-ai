import { Controller, Get, Query, Post, Body, Res, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { VisualizationService, ChartData, ExportData } from '../services/visualization.service';
import { AuthGuard } from '../guards/auth.guard';
import { PDFReportService } from '../services/pdf-report.service';
import { ReportTemplate } from '../interfaces/report-template.interface';
import { ReportArchiveService, ArchivedReport } from '../services/report-archive.service';

@ApiTags('Visualization')
@Controller('visualization')
@UseGuards(AuthGuard)
export class VisualizationController {
  constructor(
    private readonly visualizationService: VisualizationService,
    private readonly pdfReportService: PDFReportService,
    private readonly reportArchiveService: ReportArchiveService
  ) {}

  @Get('latency')
  @ApiOperation({ summary: 'Get latency distribution visualization data' })
  getLatencyDistribution(@Query('provider') provider?: string) {
    return this.visualizationService.getLatencyDistribution(provider);
  }

  @Get('confidence')
  @ApiOperation({ summary: 'Get confidence distribution visualization data' })
  getConfidenceDistribution(@Query('provider') provider?: string) {
    return this.visualizationService.getConfidenceDistribution(provider);
  }

  @Get('comparison')
  @ApiOperation({ summary: 'Get provider comparison visualization data' })
  getProviderComparison() {
    return this.visualizationService.getProviderComparison();
  }

  @Get('timeseries')
  @ApiOperation({ summary: 'Get time series visualization data' })
  getTimeSeriesData(@Query('timeframe') timeframe: '1h' | '24h' | '7d' = '1h') {
    return this.visualizationService.getTimeSeriesData(timeframe);
  }

  @Get('radar')
  @ApiOperation({ summary: 'Get performance radar chart data' })
  getPerformanceRadar(@Query('provider') provider?: string): ChartData {
    return this.visualizationService.getPerformanceRadar(provider);
  }

  @Get('heatmap')
  @ApiOperation({ summary: 'Get performance heatmap data' })
  getHeatmap(@Query('timeframe') timeframe: '24h' | '7d' = '24h'): ChartData {
    return this.visualizationService.getHeatmapData(timeframe);
  }

  @Get('scatter')
  @ApiOperation({ summary: 'Get latency vs confidence scatter plot' })
  getScatterPlot(): ChartData {
    return this.visualizationService.getScatterPlot();
  }

  @Post('export')
  @ApiOperation({ summary: 'Export chart data' })
  async exportChart(@Body() params: any): Promise<ExportData> {
    return this.visualizationService.exportChartData(params.chartType, params);
  }

  @Get('export/metrics')
  @ApiOperation({ summary: 'Export metrics report' })
  async exportMetrics(@Res() res: Response): Promise<void> {
    const report = await this.visualizationService.exportMetricsReport();
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=metrics-report.json');
    res.send(report);
  }

  @Get('report/pdf')
  @ApiOperation({ summary: 'Generate PDF performance report' })
  @ApiResponse({
    status: 200,
    description: 'Returns a PDF report of LLM performance metrics'
  })
  async generatePDFReport(
    @Query('timeframe') timeframe: '24h' | '7d' = '24h',
    @Res() res: Response
  ): Promise<void> {
    const pdfBuffer = await this.pdfReportService.generateReport(timeframe);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=llm-performance-report.pdf');
    res.send(pdfBuffer);
  }

  @Post('report/preview')
  @ApiOperation({ summary: 'Generate PDF report preview' })
  @ApiResponse({
    status: 200,
    description: 'Returns a preview of the PDF report with the given template'
  })
  async previewReport(
    @Body() template: ReportTemplate,
    @Res() res: Response
  ): Promise<void> {
    const previewBuffer = await this.pdfReportService.generatePreview(template);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=report-preview.pdf');
    res.send(previewBuffer);
  }

  @Get('reports')
  @ApiOperation({ summary: 'List archived reports' })
  async listReports(
    @Query('templateId') templateId?: string,
    @Query('timeframe') timeframe?: '24h' | '7d',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.reportArchiveService.listReports({
      templateId,
      timeframe,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    });
  }

  @Get('reports/:id')
  @ApiOperation({ summary: 'Get archived report' })
  async getReport(
    @Param('id') id: string,
    @Res() res: Response
  ): Promise<void> {
    const report = await this.reportArchiveService.getReport(id);
    const metadata = await this.reportArchiveService.getReportMetadata(id);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${metadata.id}.pdf`);
    res.send(report);
  }
} 