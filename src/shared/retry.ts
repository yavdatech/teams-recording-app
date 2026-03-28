import { RetryableError } from "./errors";

export interface RetryOptions {
  name: string;
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs?: number;
  shouldRetry?: (error: unknown) => boolean;
  onRetry?: (error: unknown, nextAttempt: number, delayMs: number) => void | Promise<void>;
}

export async function retry<T>(operation: () => Promise<T>, options: RetryOptions): Promise<T> {
  let attempt = 1;
  let delayMs = options.initialDelayMs;

  for (;;) {
    try {
      return await operation();
    } catch (error) {
      const canRetry =
        attempt < options.maxAttempts &&
        (options.shouldRetry?.(error) ?? error instanceof RetryableError);

      if (!canRetry) {
        throw error;
      }

      const explicitRetryDelay = error instanceof RetryableError ? error.retryAfterMs : undefined;
      const effectiveDelay = explicitRetryDelay ?? delayMs;
      await options.onRetry?.(error, attempt + 1, effectiveDelay);
      await sleep(effectiveDelay);

      attempt += 1;
      delayMs = Math.min(
        Math.round(delayMs * 2 * (0.8 + Math.random() * 0.4)),
        options.maxDelayMs ?? 30_000
      );
    }
  }
}

export function sleep(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}
