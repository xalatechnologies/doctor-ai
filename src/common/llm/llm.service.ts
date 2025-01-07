import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export type LLMProvider = 'openai' | 'anthropic' | 'cohere' | 'deepseek';

interface LLMConfig {
  enabled: boolean;
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  [key: string]: any;
}

interface LLMsConfig {
  openai?: LLMConfig;
  anthropic?: LLMConfig;
  cohere?: LLMConfig;
  deepseek?: LLMConfig;
}

interface LLMInstance {
  client: OpenAI | Anthropic;
  config: LLMConfig;
  handler: (prompt: string) => Promise<string>;
}

@Injectable()
export class LLMService implements OnModuleInit {
  private readonly logger = new Logger(LLMService.name);
  private readonly llmInstances: Map<LLMProvider, LLMInstance> = new Map();
  private readonly config: LLMsConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      openai: {
        enabled: !!this.configService.get('OPENAI_API_KEY'),
        apiKey: this.configService.get('OPENAI_API_KEY'),
        model: this.configService.get('OPENAI_MODEL') || 'gpt-4',
        temperature: this.configService.get('OPENAI_TEMPERATURE') || 0.7,
        maxTokens: this.configService.get('OPENAI_MAX_TOKENS') || 2000,
      },
      anthropic: {
        enabled: !!this.configService.get('ANTHROPIC_API_KEY'),
        apiKey: this.configService.get('ANTHROPIC_API_KEY'),
        model: this.configService.get('ANTHROPIC_MODEL') || 'claude-2',
        temperature: this.configService.get('ANTHROPIC_TEMPERATURE') || 0.7,
        maxTokens: this.configService.get('ANTHROPIC_MAX_TOKENS') || 2000,
      },
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
          const response = await client.chat.completions.create({
            model: this.config.openai?.model || 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            temperature: this.config.openai?.temperature || 0.7,
            max_tokens: this.config.openai?.maxTokens || 2000,
          });
          return response.choices[0].message.content || '';
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
          const response = await client.messages.create({
            model: this.config.anthropic?.model || 'claude-2',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: this.config.anthropic?.maxTokens || 2000,
          });
          return Array.isArray(response.content) 
            ? response.content
                .filter(block => 'type' in block && block.type === 'text')
                .map(block => ('text' in block ? block.text : ''))
                .join('\n')
            : response.content || '';
        },
      });
    }
  }

  async generateResponse(prompt: string, provider?: LLMProvider): Promise<string> {
    try {
      const selectedProvider = provider || this.getDefaultProvider();
      const instance = this.llmInstances.get(selectedProvider);
      
      if (!instance) {
        throw new Error(`Provider ${selectedProvider} is not initialized`);
      }

      const timer = this.startTimer();
      const response = await instance.handler(prompt);
      const duration = timer.end();

      this.logger.debug(`LLM response generated using ${selectedProvider} in ${duration}ms`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to generate LLM response: ${error.message}`);
      throw error;
    }
  }

  private getDefaultProvider(): LLMProvider {
    if (this.llmInstances.has('openai')) return 'openai';
    if (this.llmInstances.has('anthropic')) return 'anthropic';
    const firstProvider = Array.from(this.llmInstances.keys())[0];
    if (!firstProvider) {
      throw new Error('No LLM providers available');
    }
    return firstProvider;
  }

  private startTimer(): { end: () => number } {
    const start = process.hrtime();
    return {
      end: () => {
        const elapsed = process.hrtime(start);
        return (elapsed[0] * 1e9 + elapsed[1]) / 1e6; // Convert to milliseconds
      },
    };
  }
} 