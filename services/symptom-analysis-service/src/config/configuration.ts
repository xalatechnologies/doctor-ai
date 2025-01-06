export default () => ({
  port: parseInt(process.env.PORT ?? '3002', 10),
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    queue: process.env.RABBITMQ_QUEUE || 'symptom_analysis_queue',
    prefetchCount: parseInt(process.env.RABBITMQ_PREFETCH_COUNT ?? '1', 10),
  },
  monitoring: {
    enabled: process.env.MONITORING_ENABLED === 'true',
    port: parseInt(process.env.MONITORING_PORT ?? '9091', 10),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
}); 