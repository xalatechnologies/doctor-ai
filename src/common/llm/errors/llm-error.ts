export class LLMError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly code: string,
    public readonly details?: Record<string, any>,
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

export class LLMAuthenticationError extends LLMError {
  constructor(provider: string, message: string, details?: Record<string, any>) {
    super(message, provider, 'AUTHENTICATION_ERROR', details);
    this.name = 'LLMAuthenticationError';
  }
}

export class LLMRateLimitError extends LLMError {
  constructor(provider: string, message: string, details?: Record<string, any>) {
    super(message, provider, 'RATE_LIMIT_ERROR', details);
    this.name = 'LLMRateLimitError';
  }
}

export class LLMContextLengthError extends LLMError {
  constructor(provider: string, message: string, details?: Record<string, any>) {
    super(message, provider, 'CONTEXT_LENGTH_ERROR', details);
    this.name = 'LLMContextLengthError';
  }
}

export class LLMInvalidResponseError extends LLMError {
  constructor(provider: string, message: string, details?: Record<string, any>) {
    super(message, provider, 'INVALID_RESPONSE_ERROR', details);
    this.name = 'LLMInvalidResponseError';
  }
}

export class LLMTimeoutError extends LLMError {
  constructor(provider: string, message: string, details?: Record<string, any>) {
    super(message, provider, 'TIMEOUT_ERROR', details);
    this.name = 'LLMTimeoutError';
  }
}

export class LLMUnavailableError extends LLMError {
  constructor(provider: string, message: string, details?: Record<string, any>) {
    super(message, provider, 'UNAVAILABLE_ERROR', details);
    this.name = 'LLMUnavailableError';
  }
} 