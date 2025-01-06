jest.setTimeout(60000);

process.env.NODE_ENV = 'test';
process.env.PORT = '3002';
process.env.RABBITMQ_URL = 'amqp://localhost:5672';
process.env.RABBITMQ_QUEUE = 'symptom_analysis_queue_test';
process.env.MONITORING_ENABLED = 'true';
process.env.MONITORING_PORT = '9091'; 