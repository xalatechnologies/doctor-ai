import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChartConfiguration, ChartData, ChartOptions } from 'chart.js';
import { Canvas, createCanvas, CanvasRenderingContext2D } from 'canvas';

export type ChartType =
  | 'line'
  | 'bar'
  | 'pie'
  | 'doughnut'
  | 'radar'
  | 'scatter';

export interface VisualizationOptions {
  width: number;
  height: number;
  backgroundColor?: string;
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  title?: {
    display: boolean;
    text: string;
  };
  legend?: {
    display: boolean;
    position?: 'top' | 'bottom' | 'left' | 'right';
  };
}

@Injectable()
export class VisualizationService {
  private readonly logger = new Logger(VisualizationService.name);

  constructor(private readonly configService: ConfigService) {}

  async generateChart(
    type: ChartType,
    data: ChartData,
    options: VisualizationOptions,
  ): Promise<Buffer> {
    try {
      const canvas = createCanvas(options.width, options.height);
      const ctx = canvas.getContext('2d');

      const chartConfig: ChartConfiguration = {
        type,
        data,
        options: this.createChartOptions(options),
      };

      // Create chart using Chart.js
      // Note: This is a simplified version. In a real implementation,
      // you would need to use a headless browser or a server-side
      // chart rendering library that's compatible with Node.js

      // For now, we'll just draw a placeholder
      this.drawPlaceholder(canvas, ctx, type, options);

      return canvas.toBuffer('image/png');
    } catch (error) {
      this.logger.error('Failed to generate chart:', error);
      throw error;
    }
  }

  private createChartOptions(options: VisualizationOptions): ChartOptions {
    return {
      responsive: options.responsive ?? true,
      maintainAspectRatio: options.maintainAspectRatio ?? true,
      plugins: {
        title: {
          display: options.title?.display ?? false,
          text: options.title?.text ?? '',
        },
        legend: {
          display: options.legend?.display ?? true,
          position: options.legend?.position ?? 'top',
        },
      },
    };
  }

  private drawPlaceholder(
    canvas: Canvas,
    ctx: CanvasRenderingContext2D,
    type: ChartType,
    options: VisualizationOptions,
  ): void {
    // Clear canvas
    ctx.fillStyle = options.backgroundColor || '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw border
    ctx.strokeStyle = '#000000';
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Draw chart type text
    ctx.fillStyle = '#000000';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      `Placeholder for ${type} chart`,
      canvas.width / 2,
      canvas.height / 2,
    );
  }

  async generateMultipleCharts(
    charts: Array<{
      type: ChartType;
      data: ChartData;
      options: VisualizationOptions;
    }>,
  ): Promise<Buffer[]> {
    try {
      return await Promise.all(
        charts.map((chart) =>
          this.generateChart(chart.type, chart.data, chart.options),
        ),
      );
    } catch (error) {
      this.logger.error('Failed to generate multiple charts:', error);
      throw error;
    }
  }

  async generateDashboard(
    layout: {
      rows: number;
      cols: number;
      charts: Array<{
        type: ChartType;
        data: ChartData;
        options: VisualizationOptions;
        position: {
          row: number;
          col: number;
          rowSpan?: number;
          colSpan?: number;
        };
      }>;
    },
    options: {
      width: number;
      height: number;
      padding?: number;
      backgroundColor?: string;
    },
  ): Promise<Buffer> {
    try {
      const canvas = createCanvas(options.width, options.height);
      const ctx = canvas.getContext('2d');

      // Fill background
      ctx.fillStyle = options.backgroundColor || '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const padding = options.padding || 10;
      const cellWidth =
        (canvas.width - padding * (layout.cols + 1)) / layout.cols;
      const cellHeight =
        (canvas.height - padding * (layout.rows + 1)) / layout.rows;

      // Draw each chart
      for (const chart of layout.charts) {
        const { row, col, rowSpan = 1, colSpan = 1 } = chart.position;
        const x = padding + col * (cellWidth + padding);
        const y = padding + row * (cellHeight + padding);
        const width = cellWidth * colSpan + padding * (colSpan - 1);
        const height = cellHeight * rowSpan + padding * (rowSpan - 1);

        const chartBuffer = await this.generateChart(chart.type, chart.data, {
          ...chart.options,
          width,
          height,
        });

        // Draw chart on dashboard
        const chartImage = await this.loadImage(chartBuffer);
        ctx.drawImage(chartImage, x, y, width, height);
      }

      return canvas.toBuffer('image/png');
    } catch (error) {
      this.logger.error('Failed to generate dashboard:', error);
      throw error;
    }
  }

  private async loadImage(buffer: Buffer): Promise<any> {
    // In a real implementation, you would use the canvas.loadImage function
    // For now, we'll return a placeholder
    return {
      width: 100,
      height: 100,
    };
  }
}
