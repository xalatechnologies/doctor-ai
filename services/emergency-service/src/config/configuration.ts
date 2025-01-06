export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    queue: process.env.RABBITMQ_QUEUE || 'emergency_queue',
  },
  api: {
    globalPrefix: process.env.API_PREFIX || 'api/v1',
  },
  cors: {
    enabled: process.env.CORS_ENABLED === 'true',
    origin: process.env.CORS_ORIGIN || '*',
  },
}); 