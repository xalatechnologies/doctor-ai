import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import { MetricsService } from '../metrics/metrics.service';

export type LLMProvider = 'openai' | 'anthropic' | 'cohere';

interface LLMInstance {
  client: any;
  config: any;
  handler: (prompt: string) => Promise<string>;
}

interface LLMsConfig {
  openai?: {
    enabled: boolean;
    apiKey: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };
  anthropic?: {
    enabled: boolean;
    apiKey: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };
}

@Injectable()
export class LLMService implements OnModuleInit {
  private readonly logger = new Logger(LLMService.name);
  private readonly llmInstances: Map<LLMProvider, LLMInstance> = new Map();
  private readonly config: LLMsConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly metricsService: MetricsService
  ) {
    const openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');
    const anthropicApiKey = this.configService.get<string>('ANTHROPIC_API_KEY');

    this.config = {
      openai: openaiApiKey ? {
        enabled: true,
        apiKey: openaiApiKey,
        model: this.configService.get('OPENAI_MODEL') || 'gpt-4',
        temperature: this.configService.get('OPENAI_TEMPERATURE') || 0.7,
        maxTokens: this.configService.get('OPENAI_MAX_TOKENS') || 2000,
      } : undefined,
      anthropic: anthropicApiKey ? {
        enabled: true,
        apiKey: anthropicApiKey,
        model: this.configService.get('ANTHROPIC_MODEL') || 'claude-2',
        temperature: this.configService.get('ANTHROPIC_TEMPERATURE') || 0.7,
        maxTokens: this.configService.get('ANTHROPIC_MAX_TOKENS') || 2000,
      } : undefined,
    };
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.initializeLLMClients();
      if (this.llmInstances.size === 0) {
        throw new Error('No LLM providers were successfully initialized');
      }
    } catch (error) {
      this.logger.error('Failed to initialize LLM providers:', error);
      throw error;
    }
  }

  private async initializeLLMClients(): Promise<void> {
    if (this.config.openai?.enabled && this.config.openai.apiKey) {
      const client = new OpenAI({
        apiKey: this.config.openai.apiKey,
      });
      this.llmInstances.set('openai', {
        client,
        config: this.config.openai,
        handler: async (prompt: string) => {
          const startTime = process.hrtime();
          try {
            this.metricsService.incrementLLMRequest('openai', this.config.openai?.model || 'gpt-4');
            const response = await client.chat.completions.create({
              model: this.config.openai?.model || 'gpt-4',
              messages: [{ role: 'user', content: prompt }],
              temperature: this.config.openai?.temperature || 0.7,
              max_tokens: this.config.openai?.maxTokens || 2000,
            });

            // Record duration
            const elapsed = process.hrtime(startTime);
            const duration = (elapsed[0] * 1e9 + elapsed[1]) / 1e9; // Convert to seconds
            this.metricsService.observeLLMDuration('openai', this.config.openai?.model || 'gpt-4', duration);

            // Record token usage
            if (response.usage) {
              this.metricsService.incrementLLMTokens('openai', this.config.openai?.model || 'gpt-4', 'prompt', response.usage.prompt_tokens);
              this.metricsService.incrementLLMTokens('openai', this.config.openai?.model || 'gpt-4', 'completion', response.usage.completion_tokens);
            }

            return response.choices[0].message.content || '';
          } catch (error) {
            this.metricsService.incrementLLMError('openai', this.config.openai?.model || 'gpt-4', error.name || 'unknown');
            throw error;
          }
        },
      });
    }

    if (this.config.anthropic?.enabled && this.config.anthropic.apiKey) {
      const client = new Anthropic({
        apiKey: this.config.anthropic.apiKey,
      });
      this.llmInstances.set('anthropic', {
        client,
        config: this.config.anthropic,
        handler: async (prompt: string) => {
          const startTime = process.hrtime();
          try {
            this.metricsService.incrementLLMRequest('anthropic', this.config.anthropic?.model || 'claude-2');
            const response = await client.messages.create({
              model: this.config.anthropic?.model || 'claude-2',
              messages: [{ role: 'user', content: prompt }],
              max_tokens: this.config.anthropic?.maxTokens || 2000,
            });

            // Record duration
            const elapsed = process.hrtime(startTime);
            const duration = (elapsed[0] * 1e9 + elapsed[1]) / 1e9; // Convert to seconds
            this.metricsService.observeLLMDuration('anthropic', this.config.anthropic?.model || 'claude-2', duration);

            // Record token usage if available
            if (response.usage) {
              this.metricsService.incrementLLMTokens('anthropic', this.config.anthropic?.model || 'claude-2', 'prompt', response.usage.input_tokens);
              this.metricsService.incrementLLMTokens('anthropic', this.config.anthropic?.model || 'claude-2', 'completion', response.usage.output_tokens);
            }

            return Array.isArray(response.content) 
              ? response.content
                  .filter(block => 'type' in block && block.type === 'text')
                  .map(block => ('text' in block ? block.text : ''))
                  .join('\n')
              : response.content || '';
          } catch (error) {
            this.metricsService.incrementLLMError('anthropic', this.config.anthropic?.model || 'claude-2', error.name || 'unknown');
            throw error;
          }
        },
      });
    }
  }

  async generateResponse(prompt: string, provider?: LLMProvider): Promise<string> {
    const llmProvider = provider ? this.llmInstances.get(provider) : (this.llmInstances.get('openai') || this.llmInstances.get('anthropic'));
    if (!llmProvider) {
      throw new Error(`No LLM provider available${provider ? ` for ${provider}` : ''}`);
    }
    return llmProvider.handler(prompt);
  }
} 