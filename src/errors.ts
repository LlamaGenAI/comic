export class LlamaGenAPIError extends Error {
  public readonly status: number;
  public readonly data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'LlamaGenAPIError';
    this.status = status;
    this.data = data;
  }
}

export class LlamaGenTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LlamaGenTimeoutError';
  }
}
