export interface QueuePublishOptions {
  delayMs?: number;
  messageId?: string;
}

export interface QueueMessageContext {
  attempt: number;
  messageId: string;
}

export interface QueueSubscribeOptions<T> {
  concurrency: number;
  maxAttempts: number;
  onDeadLetter?: (message: T, context: QueueMessageContext, error: unknown) => Promise<void>;
}

export type QueueHandler<T> = (message: T, context: QueueMessageContext) => Promise<void>;

export interface QueueTransport<T> {
  close(): Promise<void>;
  publish(message: T, options?: QueuePublishOptions): Promise<void>;
  subscribe(handler: QueueHandler<T>, options: QueueSubscribeOptions<T>): Promise<void>;
}
