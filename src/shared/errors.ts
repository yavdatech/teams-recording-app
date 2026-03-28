export class RetryableError extends Error {
  public readonly retryAfterMs?: number;

  public constructor(message: string, options?: { cause?: unknown; retryAfterMs?: number }) {
    super(message, options);
    this.name = "RetryableError";
    this.retryAfterMs = options?.retryAfterMs;
  }
}

export class NonRetriableError extends Error {
  public constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "NonRetriableError";
  }
}
