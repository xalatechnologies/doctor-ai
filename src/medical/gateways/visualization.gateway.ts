import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { VisualizationService } from '../services/visualization.service';

interface ChartSubscription {
  chartType: string;
  provider?: string;
  timeframe?: string;
  config?: any;
}

@WebSocketGateway({
  namespace: '/visualization',
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})
export class VisualizationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private subscriptions: Map<string, Set<ChartSubscription>> = new Map();
  private updateInterval: NodeJS.Timer;

  constructor(private visualizationService: VisualizationService) {
    // Update subscribed charts every second
    this.updateInterval = setInterval(() => {
      this.broadcastChartUpdates();
    }, 1000);
  }

  handleConnection(client: Socket) {
    this.subscriptions.set(client.id, new Set());
  }

  handleDisconnect(client: Socket) {
    this.subscriptions.delete(client.id);
  }

  @SubscribeMessage('subscribe_chart')
  handleChartSubscription(client: Socket, subscription: ChartSubscription) {
    const clientSubs = this.subscriptions.get(client.id);
    clientSubs.add(subscription);
    
    // Send initial data
    this.sendChartData(client, subscription);
  }

  @SubscribeMessage('unsubscribe_chart')
  handleChartUnsubscription(client: Socket, subscription: ChartSubscription) {
    const clientSubs = this.subscriptions.get(client.id);
    clientSubs.delete(subscription);
  }

  @SubscribeMessage('update_config')
  handleConfigUpdate(client: Socket, data: { chartId: string; config: any }) {
    const clientSubs = this.subscriptions.get(client.id);
    const subscription = Array.from(clientSubs).find(sub => sub.chartType === data.chartId);
    if (subscription) {
      subscription.config = data.config;
      this.sendChartData(client, subscription);
    }
  }

  private async broadcastChartUpdates() {
    for (const [clientId, subs] of this.subscriptions.entries()) {
      const client = this.server.sockets.sockets.get(clientId);
      if (client) {
        for (const subscription of subs) {
          await this.sendChartData(client, subscription);
        }
      }
    }
  }

  private async sendChartData(client: Socket, subscription: ChartSubscription) {
    try {
      const chartData = await this.getChartData(subscription);
      client.emit('chart_update', {
        chartType: subscription.chartType,
        data: chartData
      });
    } catch (error) {
      client.emit('chart_error', {
        chartType: subscription.chartType,
        error: error.message
      });
    }
  }

  private async getChartData(subscription: ChartSubscription) {
    switch (subscription.chartType) {
      case 'latency':
        return this.visualizationService.getLatencyDistribution(subscription.provider);
      case 'confidence':
        return this.visualizationService.getConfidenceDistribution(subscription.provider);
      case 'timeseries':
        return this.visualizationService.getTimeSeriesData(subscription.timeframe as any);
      case 'radar':
        return this.visualizationService.getPerformanceRadar(subscription.provider);
      case 'heatmap':
        return this.visualizationService.getHeatmapData(subscription.timeframe as any);
      case 'scatter':
        return this.visualizationService.getScatterPlot();
      default:
        throw new Error(`Unsupported chart type: ${subscription.chartType}`);
    }
  }
} 