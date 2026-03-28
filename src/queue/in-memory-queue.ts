import { randomUUID } from "node:crypto";

import { NonRetriableError } from "../shared/errors";
import { QueueHandler, QueueMessageContext, QueuePublishOptions, QueueSubscribeOptions, QueueTransport } from "./queue-types";

interface PendingMessage<T> {
  context: QueueMessageContext;
  message: T;
}

export class InMemoryQueue<T> implements QueueTransport<T> {
  private active = 0;
  private handler?: QueueHandler<T>;
  private pending: PendingMessage<T>[] = [];
  private subscribeOptions?: QueueSubscribeOptions<T>;
  private readonly timers = new Set<NodeJS.Timeout>();

  public async publish(message: T, options?: QueuePublishOptions): Promise<void> {
    const pending: PendingMessage<T> = {
      context: {
        attempt: 1,
        messageId: options?.messageId ?? randomUUID()
      },
      message
    };

    this.enqueue(pending, options?.delayMs ?? 0);
  }

  public async subscribe(handler: QueueHandler<T>, options: QueueSubscribeOptions<T>): Promise<void> {
    this.handler = handler;
    this.subscribeOptions = options;
    this.drain();
  }

  public async close(): Promise<void> {
    for (const timer of this.timers) {
      clearTimeout(timer);
    }

    this.timers.clear();
    this.pending = [];
  }

  private enqueue(message: PendingMessage<T>, delayMs: number): void {
    if (delayMs <= 0) {
      this.pending.push(message);
      this.drain();
      return;
    }

    const timer = setTimeout(() => {
      this.timers.delete(timer);
      this.pending.push(message);
      this.drain();
    }, delayMs);

    this.timers.add(timer);
  }

  private drain(): void {
    if (!this.handler || !this.subscribeOptions) {
      return;
    }

    while (this.active < this.subscribeOptions.concurrency && this.pending.length > 0) {
      const next = this.pending.shift();
      if (!next) {
        return;
      }

      this.active += 1;
      void this.process(next);
    }
  }

  private async process(item: PendingMessage<T>): Promise<void> {
    try {
      await this.handler!(item.message, item.context);
    } catch (error) {
      const canRetry =
        !(error instanceof NonRetriableError) && item.context.attempt < (this.subscribeOptions?.maxAttempts ?? 1);

      if (canRetry) {
        this.enqueue(
          {
            context: {
              ...item.context,
              attempt: item.context.attempt + 1
            },
            message: item.message
          },
          computeRetryDelayMs(item.context.attempt + 1)
        );
      } else {
        await this.subscribeOptions?.onDeadLetter?.(item.message, item.context, error);
      }
    } finally {
      this.active -= 1;
      this.drain();
    }
  }
}

function computeRetryDelayMs(attempt: number): number {
  return Math.min(2 ** attempt * 1_000, 60_000);
}
