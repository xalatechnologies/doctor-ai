import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { MetricsService } from '../services/metrics.service';
import { AlertingService } from '../services/alerting.service';

@Injectable()
@WebSocketGateway({
  namespace: 'monitoring',
  cors: true
})
export class MonitoringGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private clients: Map<string, Socket> = new Map();
  private metricsInterval: NodeJS.Timer;

  constructor(
    private readonly metricsService: MetricsService,
    private readonly alertingService: AlertingService
  ) {
    // Broadcast metrics every 5 seconds
    this.metricsInterval = setInterval(() => {
      this.broadcastMetrics();
    }, 5000);
  }

  handleConnection(client: any) {
    console.log('Client connected to monitoring');
  }

  handleDisconnect(client: any) {
    console.log('Client disconnected from monitoring');
  }

  @SubscribeMessage('subscribe_alerts')
  handleAlertSubscription(client: Socket) {
    client.join('alerts');
  }

  private async sendInitialData(client: Socket) {
    const metrics = await this.metricsService.getAllMetrics();
    const alerts = await this.alertingService.getCurrentAlerts();
    
    client.emit('initial_data', {
      metrics: Object.fromEntries(metrics),
      alerts
    });
  }

  private async broadcastMetrics() {
    const metrics = await this.metricsService.getAllMetrics();
    this.server.emit('metrics_update', Object.fromEntries(metrics));
  }

  async broadcastAlert(alert: any) {
    this.server.to('alerts').emit('new_alert', alert);
  }
} 