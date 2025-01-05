import { Injectable } from '@nestjs/common';
import { MetricsService, ProviderMetrics, MetricsTimeframe } from './metrics.service';
import { LLMProvider } from './llm-orchestration.service';
import { ChartConfig } from '../interfaces/chart-config.interface';

interface ChartOptions {
  animation?: {
    duration: number;
    easing: 'linear' | 'easeInOut' | 'easeIn' | 'easeOut';
    enabled: boolean;
  };
  interactive?: boolean;
  responsive?: boolean;
  scales?: any;
  plugins?: any;
}

export interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'radar' | 'scatter' | 'heatmap';
  labels: string[];
  datasets: {
    label: string;
    data: number[] | { x: number; y: number }[];
    backgroundColor?: string | string[];
    borderColor?: string;
    fill?: boolean;
    tension?: number;
    pointRadius?: number;
  }[];
  options?: ChartOptions;
}

export interface ExportData {
  timestamp: string;
  type: string;
  data: any;
  metadata: {
    timeframe: string;
    provider?: string;
    filters?: any;
  };
}

@Injectable()
export class VisualizationService {
  private readonly colors = {
    success: 'rgba(75, 192, 192, 0.2)',
    error: 'rgba(255, 99, 132, 0.2)',
    warning: 'rgba(255, 206, 86, 0.2)',
    info: 'rgba(54, 162, 235, 0.2)'
  };

  constructor(private metricsService: MetricsService) {}

  getProviderComparison(): ChartData {
    const metricsMap = this.metricsService.getAllMetrics();
    const providers = Array.from(metricsMap.keys()) as LLMProvider[];
    const providerLabels = providers.map(String);
    
    const chartData: ChartData = {
      type: 'bar',
      labels: providerLabels,
      datasets: [
        {
          label: 'Success Rate',
          data: providers.map(provider => {
            const metrics = metricsMap.get(provider)?.total;
            return metrics ? (metrics.successRate * 100) : 0;
          }),
          backgroundColor: this.colors.success
        },
        {
          label: 'Average Latency (ms)',
          data: providers.map(provider => {
            const metrics = metricsMap.get(provider)?.total;
            return metrics ? metrics.averageLatency : 0;
          }),
          backgroundColor: this.colors.info
        },
        {
          label: 'Average Confidence',
          data: providers.map(provider => {
            const metrics = metricsMap.get(provider)?.total;
            return metrics ? (metrics.averageConfidence * 100) : 0;
          }),
          backgroundColor: this.colors.warning
        }
      ]
    };

    return chartData;
  }

  getHeatmapData(timeframe: '24h' | '7d'): ChartData {
    const metrics = this.metricsService.getAllMetrics();
    const timestamps = this.generateTimeLabels(timeframe);
    const providers = Array.from(metrics.keys()) as LLMProvider[];

    return {
      type: 'heatmap',
      labels: timestamps,
      datasets: providers.map(provider => ({
        label: String(provider),
        data: this.generateHeatmapValues(metrics.get(provider), timeframe),
        backgroundColor: this.generateHeatmapColors()
      })),
      options: {
        plugins: {
          tooltip: {
            callbacks: {
              label: (context: any) => `${context.dataset.label}: ${context.formattedValue}`
            }
          }
        }
      }
    };
  }

  private generateTimeLabels(timeframe: '1h' | '24h' | '7d'): string[] {
    const now = new Date();
    const labels: string[] = [];
    const intervals = timeframe === '1h' ? 60 : timeframe === '24h' ? 24 : 7;
    const step = timeframe === '1h' ? 1 : timeframe === '24h' ? 60 : 24 * 60;

    for (let i = intervals - 1; i >= 0; i--) {
      const time = new Date(now.getTime() - i * step * 60000);
      labels.push(this.formatTimeLabel(time, timeframe));
    }

    return labels;
  }

  private formatTimeLabel(date: Date, timeframe: '1h' | '24h' | '7d'): string {
    if (timeframe === '1h') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (timeframe === '24h') {
      return date.toLocaleTimeString([], { hour: '2-digit' });
    }
    return date.toLocaleDateString([], { weekday: 'short' });
  }

  private generateHeatmapValues(metrics: any, timeframe: string): number[] {
    // Implementation for generating heatmap values
    return Array(24).fill(0).map(() => Math.random() * 100);
  }

  private generateHeatmapColors(): string[] {
    return [
      'rgba(0, 0, 255, 0.2)',   // Cool
      'rgba(0, 255, 0, 0.2)',   // Moderate
      'rgba(255, 0, 0, 0.2)'    // Hot
    ];
  }

  async exportChartData(chartType: string, params: any): Promise<ExportData> {
    const data = await this.getChartData(chartType, params);
    return {
      timestamp: new Date().toISOString(),
      type: chartType,
      data,
      metadata: {
        timeframe: params.timeframe || 'all',
        provider: params.provider,
        filters: params.filters
      }
    };
  }

  async exportMetricsReport(): Promise<Blob> {
    const metrics = this.metricsService.getAllMetrics();
    const report = this.generateMetricsReport(metrics);
    
    return new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json'
    });
  }

  private generateMetricsReport(metrics: Map<LLMProvider, any>): any {
    return {
      summary: this.metricsService.getAggregateMetrics(),
      providerDetails: Object.fromEntries(metrics),
      timestamp: new Date().toISOString(),
      period: '24h',
      charts: {
        performance: this.getProviderComparison(),
        heatmap: this.getHeatmapData('24h')
      }
    };
  }

  private getChartData(chartType: string, params: any): ChartData {
    switch (chartType) {
      case 'comparison':
        return this.getProviderComparison();
      case 'heatmap':
        return this.getHeatmapData(params.timeframe || '24h');
      default:
        throw new Error(`Unsupported chart type: ${chartType}`);
    }
  }

  private calculateMetrics(metrics: ProviderMetrics): {
    successRate: number;
    latency: number;
    confidence: number;
  } {
    return {
      successRate: metrics.successRate * 100,
      latency: metrics.averageLatency,
      confidence: metrics.averageConfidence * 100
    };
  }

  getLatencyDistribution(provider?: LLMProvider, config?: ChartConfig): ChartData {
    const metrics = provider 
      ? this.metricsService.getProviderMetrics(provider)?.total
      : this.metricsService.getAggregateMetrics();

    if (!metrics) return this.getEmptyChart();

    const latencyData = provider 
      ? (metrics as ProviderMetrics).responseTimeHistogram 
      : metrics.latencyDistribution;
    
    if (!latencyData) return this.getEmptyChart();

    const values = Array.from(latencyData.values());
    return {
      type: 'bar',
      labels: Array.from(latencyData.keys()),
      datasets: [{
        label: 'Response Time Distribution',
        data: values as number[],
        backgroundColor: Object.values(this.colors),
        borderColor: 'rgba(75, 192, 192, 1)',
        fill: true
      }]
    };
  }

  getConfidenceDistribution(provider?: LLMProvider, config?: ChartConfig): ChartData {
    const metrics = provider 
      ? this.metricsService.getProviderMetrics(provider)?.total
      : this.metricsService.getAggregateMetrics();

    if (!metrics) return this.getEmptyChart();

    const confidenceData = provider 
      ? (metrics as ProviderMetrics).confidenceHistogram 
      : metrics.confidenceDistribution;
    
    if (!confidenceData) return this.getEmptyChart();

    const values = Array.from(confidenceData.values());
    return {
      type: 'bar',
      labels: Array.from(confidenceData.keys()),
      datasets: [{
        label: 'Confidence Score Distribution',
        data: values as number[],
        backgroundColor: Object.values(this.colors),
        borderColor: 'rgba(54, 162, 235, 1)',
        fill: true
      }]
    };
  }

  getTimeSeriesData(timeframe: '1h' | '24h' | '7d'): ChartData {
    const metrics = this.metricsService.getAllMetrics();
    const timestamps = this.generateTimeLabels(timeframe);
    const providers = Array.from(metrics.keys()) as LLMProvider[];

    return {
      type: 'line',
      labels: timestamps,
      datasets: providers.map(provider => ({
        label: String(provider),
        data: Array(timestamps.length).fill(0).map(() => Math.random() * 100) as number[],
        borderColor: this.colors.info,
        fill: false
      }))
    };
  }

  private getEmptyChart(): ChartData {
    return {
      type: 'bar',
      labels: [],
      datasets: [{
        label: 'No Data',
        data: [],
        backgroundColor: Object.values(this.colors)[0],
        borderColor: 'rgba(75, 192, 192, 1)',
        fill: true
      }]
    };
  }

  getPerformanceRadar(provider?: LLMProvider): ChartData {
    const metrics = provider 
      ? this.metricsService.getProviderMetrics(provider)?.total
      : this.metricsService.getAggregateMetrics();

    if (!metrics) return this.getEmptyChart();

    return {
      type: 'radar',
      labels: ['Success Rate', 'Latency', 'Confidence', 'Error Rate', 'Token Usage'],
      datasets: [{
        label: String(provider || 'Overall Performance'),
        data: [
          metrics.successRate * 100,
          Math.min(100, metrics.averageLatency / 10), // Normalize latency to 0-100
          metrics.averageConfidence * 100,
          (1 - metrics.successRate) * 100, // Error rate is inverse of success rate
          Math.min(100, (metrics.tokenUsage?.average || 0) / 100) // Normalize token usage
        ],
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        fill: true
      }]
    };
  }

  getScatterPlot(): ChartData {
    const metrics = this.metricsService.getAllMetrics();
    const datasets = Array.from(metrics.entries()).map(([provider, data]) => ({
      label: String(provider),
      data: [{
        x: data.total.averageLatency,
        y: data.total.averageConfidence * 100
      }],
      backgroundColor: this.colors.info,
      pointRadius: 8
    }));

    return {
      type: 'scatter',
      labels: [],
      datasets,
      options: {
        scales: {
          x: { title: { display: true, text: 'Latency (ms)' } },
          y: { title: { display: true, text: 'Confidence (%)' } }
        }
      }
    };
  }
} 