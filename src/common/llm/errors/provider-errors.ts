/**
 * Base error class for LLM provider errors.
 */
export class LLMProviderError<TDetails = unknown> extends Error {
  readonly provider: string;
  readonly details?: TDetails;
  readonly metadata?: Record<string, unknown>;

  constructor(message: string, provider: string, details?: TDetails, metadata?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.provider = provider;
    this.details = details;
    this.metadata = metadata;
  }
}

/**
 * Error thrown when provider authentication fails.
 */
export class ProviderAuthenticationError extends LLMProviderError<string> {
  constructor(provider: string, details?: string) {
    super(`Authentication failed for provider ${provider}`, provider, details);
  }
}

/**
 * Error thrown when provider rate limit is exceeded.
 */
export class ProviderRateLimitError extends LLMProviderError<number> {
  constructor(provider: string, details?: number) {
    super(`Rate limit exceeded for provider ${provider}`, provider, details);
  }
}

/**
 * Error thrown when provider quota is exceeded.
 */
export class ProviderQuotaExceededError extends LLMProviderError<void> {
  constructor(provider: string) {
    super(`Quota exceeded for provider ${provider}`, provider);
  }
}

/**
 * Error thrown when provider content filter blocks the request.
 */
export class ProviderContentFilterError extends LLMProviderError<string> {
  constructor(provider: string, details?: string) {
    super(`Content filtered by provider ${provider}`, provider, details);
  }
}

/**
 * Error thrown when provider context length is exceeded.
 */
export class ProviderContextLengthError extends LLMProviderError<number> {
  constructor(provider: string, details?: number) {
    super(`Context length exceeded for provider ${provider}`, provider, details);
  }
}

/**
 * Error thrown when provider request times out.
 */
export class ProviderTimeoutError extends LLMProviderError<number> {
  constructor(provider: string, details?: number) {
    super(`Request timed out for provider ${provider}`, provider, details);
  }
}

/**
 * Error thrown when provider request is invalid.
 */
export class ProviderInvalidRequestError extends LLMProviderError<string> {
  constructor(provider: string, details?: string) {
    super(`Invalid request for provider ${provider}`, provider, details);
  }
}

/**
 * Error thrown when provider is unavailable.
 */
export class ProviderUnavailableError extends LLMProviderError<void> {
  constructor(provider: string) {
    super(`Provider ${provider} is unavailable`, provider);
  }
}

/**
 * Error thrown when provider response cannot be parsed.
 */
export class ProviderResponseParseError extends LLMProviderError<string> {
  constructor(provider: string, details?: string) {
    super(`Failed to parse response from provider ${provider}`, provider, details);
  }
} 