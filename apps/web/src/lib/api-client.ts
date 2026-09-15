/**
 * Resilient API Client for Regulation-as-Code Compiler
 * Handles:
 * - API timeouts via AbortSignal.timeout
 * - Exponential backoff retry for network/5xx failures
 * - Automatic X-Idempotency-Key on mutating requests
 * - Normalized JSON error parsing
 */

export interface ApiClientOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
  idempotencyKey?: string;
}

export class ApiError extends Error {
  statusCode: number;
  code: string;
  details: any;

  constructor(message: string, statusCode: number, code: string = 'API_ERROR', details: any = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export async function apiClient<T = any>(
  url: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const {
    timeoutMs = 15000,
    retries = 2,
    idempotencyKey,
    headers: customHeaders = {},
    ...fetchOptions
  } = options;

  const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
    (fetchOptions.method || 'GET').toUpperCase()
  );

  const headers = new Headers(customHeaders);
  if (isMutating && !headers.has('X-Idempotency-Key')) {
    const key = idempotencyKey || `idem-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    headers.set('X-Idempotency-Key', key);
  }

  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt <= retries) {
    attempt++;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      });
      clearTimeout(timer);

      // Handle 5xx server errors with retry
      if (response.status >= 500 && attempt <= retries) {
        const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      const contentType = response.headers.get('content-type') || '';
      let data: any = null;
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
        let errorCode = 'HTTP_ERROR';
        let errorDetails = null;

        if (data && typeof data === 'object') {
          if (data.error && typeof data.error === 'object') {
            errorMsg = data.error.message || errorMsg;
            errorCode = data.error.code || errorCode;
            errorDetails = data.error.details || null;
          } else if (data.detail) {
            errorMsg = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
          }
        }

        throw new ApiError(errorMsg, response.status, errorCode, errorDetails);
      }

      return data as T;
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        lastError = new ApiError(
          `Request to ${url} timed out after ${timeoutMs / 1000}s. Please check your network and try again.`,
          504,
          'REQUEST_TIMEOUT'
        );
      } else {
        lastError = err;
      }

      // Retry network errors
      if (attempt <= retries && !(err instanceof ApiError && err.statusCode < 500)) {
        const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      break;
    }
  }

  throw lastError || new Error('Request failed after multiple attempts');
}
