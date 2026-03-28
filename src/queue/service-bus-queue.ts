import { randomUUID } from "node:crypto";

import {
  ProcessErrorArgs,
  ServiceBusClient,
  ServiceBusReceivedMessage,
  ServiceBusReceiver,
  ServiceBusSender
} from "@azure/service-bus";

import { AppLogger } from "../shared/logger";
import { serializeError } from "../shared/serialize-error";
import { NonRetriableError } from "../shared/errors";
import { QueueHandler, QueuePublishOptions, QueueSubscribeOptions, QueueTransport } from "./queue-types";

export class ServiceBusQueue<T> implements QueueTransport<T> {
  private readonly client: ServiceBusClient;
  private readonly receiver: ServiceBusReceiver;
  private readonly sender: ServiceBusSender;

  public constructor(
    connectionString: string,
    queueName: string,
    private readonly logger: AppLogger
  ) {
    this.client = new ServiceBusClient(connectionString);
    this.sender = this.client.createSender(queueName);
    this.receiver = this.client.createReceiver(queueName);
  }

  public async publish(message: T, options?: QueuePublishOptions): Promise<void> {
    await this.sender.sendMessages({
      body: message,
      contentType: "application/json",
      messageId: options?.messageId ?? randomUUID(),
      scheduledEnqueueTimeUtc: options?.delayMs ? new Date(Date.now() + options.delayMs) : undefined
    });
  }

  public async subscribe(handler: QueueHandler<T>, options: QueueSubscribeOptions<T>): Promise<void> {
    this.receiver.subscribe(
      {
        processError: async (args) => {
          await this.handleProcessError(args);
        },
        processMessage: async (message) => {
          await this.handleProcessMessage(message, handler, options);
        }
      },
      {
        autoCompleteMessages: false,
        maxConcurrentCalls: options.concurrency
      }
    );
  }

  public async close(): Promise<void> {
    await this.receiver.close();
    await this.sender.close();
    await this.client.close();
  }

  private async handleProcessMessage(
    message: ServiceBusReceivedMessage,
    handler: QueueHandler<T>,
    options: QueueSubscribeOptions<T>
  ): Promise<void> {
    const body = message.body as T;
    const context = {
      attempt: message.deliveryCount ?? 1,
      messageId: message.messageId ?? randomUUID()
    };

    try {
      await handler(body, context);
      await this.receiver.completeMessage(message);
    } catch (error) {
      const shouldDeadLetter =
        error instanceof NonRetriableError || (message.deliveryCount ?? 1) >= options.maxAttempts;

      if (shouldDeadLetter) {
        await options.onDeadLetter?.(body, context, error);
        await this.receiver.deadLetterMessage(message, {
          deadLetterErrorDescription: JSON.stringify(serializeError(error)),
          deadLetterReason: error instanceof NonRetriableError ? "NonRetriableError" : "RetryLimitExceeded"
        });
        return;
      }

      await this.receiver.abandonMessage(message);
    }
  }

  private async handleProcessError(args: ProcessErrorArgs): Promise<void> {
    this.logger.error(
      {
        entityPath: args.entityPath,
        error: serializeError(args.error),
        fullyQualifiedNamespace: args.fullyQualifiedNamespace
      },
      "Azure Service Bus receiver reported an error."
    );
  }
}
