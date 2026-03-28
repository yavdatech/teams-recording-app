import { ServiceBusClient, ServiceBusSender } from "@azure/service-bus";

import { Env } from "../config/env";
import { AppLogger } from "../shared/logger";
import { StructuredEvent } from "../shared/types";

export class DownstreamEventPublisher {
  private readonly client?: ServiceBusClient;
  private readonly sender?: ServiceBusSender;

  public constructor(
    private readonly env: Env,
    private readonly logger: AppLogger
  ) {
    if (env.QUEUE_MODE === "servicebus") {
      this.client = new ServiceBusClient(env.AZURE_SERVICE_BUS_CONNECTION_STRING!);
      this.sender = this.client.createSender(env.AZURE_SERVICE_BUS_EVENT_QUEUE);
    }
  }

  public async publish<T>(event: StructuredEvent<T>): Promise<void> {
    if (!this.sender) {
      this.logger.info({ event }, "Structured downstream event emitted.");
      return;
    }

    await this.sender.sendMessages({
      body: event,
      contentType: "application/json",
      messageId: event.id,
      subject: event.subject
    });
  }

  public async close(): Promise<void> {
    await this.sender?.close();
    await this.client?.close();
  }
}
