import {
  LLMProviderError,
  ProviderAuthenticationError,
  ProviderContentFilterError,
  ProviderContextLengthError,
  ProviderInvalidRequestError,
  ProviderQuotaExceededError,
  ProviderRateLimitError,
  ProviderResponseParseError,
  ProviderTimeoutError,
  ProviderUnavailableError,
} from './provider-errors';

/**
 * Known provider names.
 */
export const KNOWN_PROVIDERS = [
  'openai',
  'anthropic',
  'cohere',
  'google-gemini',
  'google-medpalm',
] as const;

/**
 * Provider name type.
 */
export type ProviderName = typeof KNOWN_PROVIDERS[number];

/**
 * Error pattern mapping for a provider.
 */
export interface IErrorPattern {
  readonly pattern: RegExp | string;
  readonly errorType: typeof ProviderAuthenticationError |
    typeof ProviderContentFilterError |
    typeof ProviderContextLengthError |
    typeof ProviderInvalidRequestError |
    typeof ProviderQuotaExceededError |
    typeof ProviderRateLimitError |
    typeof ProviderResponseParseError |
    typeof ProviderTimeoutError |
    typeof ProviderUnavailableError;
  readonly extractDetails?: (error: unknown) => string | number | undefined;
}

/**
 * Error mapping configuration for a provider.
 */
export interface IErrorMapping {
  readonly provider: ProviderName;
  readonly errorPatterns: readonly IErrorPattern[];
}

/**
 * HTTP error response.
 */
interface IHttpErrorResponse {
  readonly status?: number;
  readonly headers?: Readonly<Record<string, string>>;
  readonly data?: unknown;
}

/**
 * HTTP error with response.
 */
interface IHttpError extends Error {
  readonly code?: string;
  readonly timeout?: number;
  readonly response?: IHttpErrorResponse;
}

/**
 * Type guard for HTTP errors.
 */
function isHttpError(error: unknown): error is IHttpError {
  return error instanceof Error && (
    'code' in error ||
    'timeout' in error ||
    'response' in error
  );
}

/**
 * Type guard for error constructors that take string details.
 */
function isStringDetailsConstructor(
  constructor: IErrorPattern['errorType']
): constructor is typeof ProviderAuthenticationError | typeof ProviderContentFilterError | typeof ProviderResponseParseError | typeof ProviderInvalidRequestError {
  return constructor === ProviderAuthenticationError ||
    constructor === ProviderContentFilterError ||
    constructor === ProviderResponseParseError ||
    constructor === ProviderInvalidRequestError;
}

/**
 * Type guard for error constructors that take number details.
 */
function isNumberDetailsConstructor(
  constructor: IErrorPattern['errorType']
): constructor is typeof ProviderRateLimitError | typeof ProviderContextLengthError | typeof ProviderTimeoutError {
  return constructor === ProviderRateLimitError ||
    constructor === ProviderContextLengthError ||
    constructor === ProviderTimeoutError;
}

/**
 * Type guard for error constructors that don't take details.
 */
function isNoDetailsConstructor(
  constructor: IErrorPattern['errorType']
): constructor is typeof ProviderQuotaExceededError | typeof ProviderUnavailableError {
  return constructor === ProviderQuotaExceededError || constructor === ProviderUnavailableError;
}

const ERROR_MAPPINGS: readonly IErrorMapping[] = [
  {
    provider: 'openai',
    errorPatterns: [
      {
        pattern: /rate limit/i,
        errorType: ProviderRateLimitError,
        extractDetails: (error: unknown): number | undefined => {
          if (!isHttpError(error)) return undefined;
          const retryAfter = error.response?.headers?.['retry-after'];
          return retryAfter ? parseInt(retryAfter, 10) * 1000 : undefined;
        },
      },
      {
        pattern: /authentication/i,
        errorType: ProviderAuthenticationError,
        extractDetails: (error: unknown): string | undefined => {
          if (!isHttpError(error)) return undefined;
          return error.message;
        },
      },
      {
        pattern: /quota exceeded/i,
        errorType: ProviderQuotaExceededError,
      },
      {
        pattern: /content filter/i,
        errorType: ProviderContentFilterError,
        extractDetails: (error: unknown): string => {
          if (!isHttpError(error)) return 'Content filtered';
          return ((error.response?.data as { error?: { message?: string } })?.error?.message) ?? 'Content filtered';
        },
      },
      {
        pattern: /context length/i,
        errorType: ProviderContextLengthError,
        extractDetails: (error: unknown): number => {
          if (!isHttpError(error)) return 4096;
          return ((error.response?.data as { error?: { max_tokens?: number } })?.error?.max_tokens) ?? 4096;
        },
      },
    ],
  },
  {
    provider: 'anthropic',
    errorPatterns: [
      {
        pattern: /rate_limit_error/,
        errorType: ProviderRateLimitError,
      },
      {
        pattern: /authentication_error/,
        errorType: ProviderAuthenticationError,
      },
      {
        pattern: /context_length_exceeded/,
        errorType: ProviderContextLengthError,
        extractDetails: (error: unknown): number => {
          if (!isHttpError(error)) return 4096;
          return ((error as { max_tokens?: number }).max_tokens) ?? 4096;
        },
      },
    ],
  },
  {
    provider: 'cohere',
    errorPatterns: [
      {
        pattern: 'TOO_MANY_REQUESTS',
        errorType: ProviderRateLimitError,
      },
      {
        pattern: 'UNAUTHORIZED',
        errorType: ProviderAuthenticationError,
      },
      {
        pattern: 'QUOTA_EXCEEDED',
        errorType: ProviderQuotaExceededError,
      },
    ],
  },
  {
    provider: 'google-gemini',
    errorPatterns: [
      {
        pattern: /quota exceeded/i,
        errorType: ProviderQuotaExceededError,
      },
      {
        pattern: /permission denied/i,
        errorType: ProviderAuthenticationError,
      },
      {
        pattern: /content filtered/i,
        errorType: ProviderContentFilterError,
        extractDetails: (): string => 'Content filtered by Gemini',
      },
    ],
  },
] as const;

/**
 * Handles errors from LLM providers and converts them to typed errors.
 * 
 * @param provider - The provider that generated the error
 * @param error - The original error
 * @returns A typed provider error
 */
export function handleProviderError(provider: ProviderName, error: unknown): LLMProviderError {
  const mapping = ERROR_MAPPINGS.find((m) => m.provider === provider);
  if (!mapping) {
    return new LLMProviderError(`Unknown error from ${provider}`, provider, undefined, { originalError: error });
  }

  const errorMessage = error instanceof Error ? error.message : String(error);

  for (const { pattern, errorType, extractDetails } of mapping.errorPatterns) {
    if (
      (pattern instanceof RegExp && pattern.test(errorMessage)) ||
      (typeof pattern === 'string' && errorMessage.includes(pattern))
    ) {
      if (isNoDetailsConstructor(errorType)) {
        return new errorType(provider);
      }

      const details = extractDetails ? extractDetails(error) : undefined;
      if (isStringDetailsConstructor(errorType) && (typeof details === 'string' || details === undefined)) {
        return new errorType(provider, details);
      }
      if (isNumberDetailsConstructor(errorType) && (typeof details === 'number' || details === undefined)) {
        return new errorType(provider, details);
      }

      // If we can't match the details type, create a base error
      return new LLMProviderError(errorMessage, provider, details, { originalError: error });
    }
  }

  if (isHttpError(error)) {
    if (error.code === 'ECONNABORTED') {
      return new ProviderTimeoutError(provider, error.timeout ?? 30000);
    }

    if (error.response?.status === 429) {
      return new ProviderRateLimitError(provider);
    }

    if (error.response?.status === 401 || error.response?.status === 403) {
      return new ProviderAuthenticationError(provider);
    }

    if (error.response?.status === 400) {
      return new ProviderInvalidRequestError(provider, errorMessage);
    }

    if (error.response?.status === 503) {
      return new ProviderUnavailableError(provider);
    }

    try {
      if (error.response?.data) {
        JSON.parse(String(error.response.data));
      }
    } catch {
      if (error.response?.data) {
        return new ProviderResponseParseError(provider, 'Invalid JSON response');
      }
    }
  }

  return new LLMProviderError(errorMessage, provider, undefined, { originalError: error });
}

/**
 * Checks if an error is retryable.
 * 
 * @param error - The error to check
 * @returns Whether the error is retryable
 */
export function isRetryableError(error: LLMProviderError): boolean {
  return (
    error instanceof ProviderTimeoutError ||
    error instanceof ProviderRateLimitError ||
    error instanceof ProviderUnavailableError ||
    error instanceof ProviderResponseParseError
  );
}

/**
 * Gets the delay before retrying after an error.
 * 
 * @param error - The error that occurred
 * @param attempt - The retry attempt number
 * @returns The delay in milliseconds
 */
export function getRetryDelay(error: LLMProviderError, attempt: number): number {
  if (error instanceof ProviderRateLimitError && typeof error.details === 'number') {
    return error.details;
  }

  const baseDelay = 1000;
  const maxDelay = 32000;
  const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
  return delay + Math.random() * 1000;
}

/**
 * Retries an operation with exponential backoff.
 * 
 * @param operation - The operation to retry
 * @param provider - The provider to use for error handling
 * @param maxAttempts - Maximum number of attempts
 * @returns The operation result
 * @throws The last error if all attempts fail
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  provider: ProviderName,
  maxAttempts = 3,
): Promise<T> {
  let attempt = 1;

  while (true) {
    try {
      return await operation();
    } catch (error) {
      const providerError = error instanceof LLMProviderError ? error : handleProviderError(provider, error);

      if (!isRetryableError(providerError) || attempt >= maxAttempts) {
        throw providerError;
      }

      const delay = getRetryDelay(providerError, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
      attempt++;
    }
  }
} 