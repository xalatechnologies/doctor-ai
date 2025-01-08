import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';
import * as path from 'path';

export const configValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  SYMPTOM_ANALYSIS_PORT: Joi.number().default(3002),
  
  // MongoDB
  MONGODB_URI: Joi.string().required(),
  MONGODB_DB_NAME: Joi.string().required(),
  
  // RabbitMQ
  RABBITMQ_URL: Joi.string().required(),
  RABBITMQ_DEFAULT_USER: Joi.string().required(),
  RABBITMQ_DEFAULT_PASS: Joi.string().required(),
  
  // Metrics
  METRICS_ENABLED: Joi.boolean().default(true),
  METRICS_PREFIX: Joi.string().default('doctor_ai'),
  
  // LLM Configuration
  LLM_DEFAULT_PROVIDER: Joi.string().valid('openai', 'anthropic', 'google-palm', 'google-gemini', 'deepseek').default('openai'),
  OPENAI_API_KEY: Joi.string().when('LLM_DEFAULT_PROVIDER', { is: 'openai', then: Joi.required() }),
  ANTHROPIC_API_KEY: Joi.string().when('LLM_DEFAULT_PROVIDER', { is: 'anthropic', then: Joi.required() }),
  GOOGLE_PALM_API_KEY: Joi.string().when('LLM_DEFAULT_PROVIDER', { is: 'google-palm', then: Joi.required() }),
  GOOGLE_GEMINI_API_KEY: Joi.string().when('LLM_DEFAULT_PROVIDER', { is: 'google-gemini', then: Joi.required() }),
  DEEPSEEK_API_KEY: Joi.string().when('LLM_DEFAULT_PROVIDER', { is: 'deepseek', then: Joi.required() })
});

export const getRootPath = () => {
  return path.resolve(__dirname, '../../../..');
};

export default registerAs('config', () => ({
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.SYMPTOM_ANALYSIS_PORT || '3002', 10),
  
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    dbName: process.env.MONGODB_DB_NAME || 'doctor_ai',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      retryWrites: true,
      w: 'majority'
    }
  },
  
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    user: process.env.RABBITMQ_DEFAULT_USER || 'guest',
    password: process.env.RABBITMQ_DEFAULT_PASS || 'guest'
  },
  
  metrics: {
    enabled: process.env.METRICS_ENABLED === 'true',
    prefix: process.env.METRICS_PREFIX || 'doctor_ai'
  },
  
  llm: {
    defaultProvider: process.env.LLM_DEFAULT_PROVIDER || 'openai',
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL || 'gpt-4',
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000', 10)
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      model: process.env.ANTHROPIC_MODEL || 'claude-2',
      maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS || '2000', 10)
    },
    googlePalm: {
      apiKey: process.env.GOOGLE_PALM_API_KEY || '',
      model: process.env.GOOGLE_PALM_MODEL || 'medpalm2-large',
      maxTokens: parseInt(process.env.GOOGLE_PALM_MAX_TOKENS || '2048', 10)
    },
    googleGemini: {
      apiKey: process.env.GOOGLE_GEMINI_API_KEY || '',
      model: process.env.GOOGLE_GEMINI_MODEL || 'gemini-pro',
      maxTokens: parseInt(process.env.GOOGLE_GEMINI_MAX_TOKENS || '2048', 10)
    },
    deepseek: {
      apiKey: process.env.DEEPSEEK_API_KEY || '',
      baseUrl: process.env.DEEPSEEK_API_BASE_URL || 'https://api.deepseek.com/v1',
      model: process.env.DEEPSEEK_MODEL || 'deepseek-coder-33b-instruct',
      maxTokens: parseInt(process.env.DEEPSEEK_MAX_TOKENS || '2048', 10)
    }
  }
})); 