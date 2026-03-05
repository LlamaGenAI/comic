import { LlamaGenAPIError, LlamaGenTimeoutError } from './errors';
import type { FetchLike } from './types';

interface HTTPClientOptions {
  apiKey: string;
  baseURL: string;
  timeoutMs: number;
  maxRetries: number;
  retryDelayMs: number;
  fetchImpl?: FetchLike;
}

export class HTTPClient {
  private readonly apiKey: string;
  private readonly baseURL: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;
  private readonly fetchImpl: FetchLike;

  constructor(options: HTTPClientOptions) {
    this.apiKey = options.apiKey;
    this.baseURL = options.baseURL.replace(/\/$/, '');
    this.timeoutMs = options.timeoutMs;
    this.maxRetries = options.maxRetries;
    this.retryDelayMs = options.retryDelayMs;

    const candidate = options.fetchImpl ?? globalThis.fetch;
    if (!candidate) {
      throw new Error('No fetch implementation found. Use Node.js 18+ or pass options.fetch.');
    }
    this.fetchImpl = candidate;
  }

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    let attempt = 0;
    for (;;) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const response = await this.fetchImpl(`${this.baseURL}${path}`, {
          ...init,
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            ...(init.headers ?? {})
          }
        });

        const text = await response.text();
        const data = text ? safeJsonParse(text) : undefined;

        if (!response.ok) {
          if (shouldRetry(response.status) && attempt < this.maxRetries) {
            attempt += 1;
            await delay(this.retryDelayMs * attempt);
            continue;
          }

          throw new LlamaGenAPIError(
            `LlamaGen API request failed with status ${response.status}`,
            response.status,
            data
          );
        }

        return data as T;
      } catch (error) {
        if (error instanceof LlamaGenAPIError) {
          throw error;
        }

        if (error instanceof DOMException && error.name === 'AbortError') {
          throw new LlamaGenTimeoutError(`Request timed out after ${this.timeoutMs}ms`);
        }

        throw error;
      } finally {
        clearTimeout(timeout);
      }
    }
  }
}

function safeJsonParse(input: string): unknown {
  try {
    return JSON.parse(input);
  } catch {
    return input;
  }
}

function shouldRetry(status: number): boolean {
  return status === 429 || status >= 500;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
