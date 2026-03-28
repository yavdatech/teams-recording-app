import { createHash } from "node:crypto";

import { GraphSubscriptionService } from "../graph/subscription-service";
import { parseArtifactReference } from "../graph/graph-resource-paths";
import { QueueTransport } from "../queue/queue-types";
import { ArtifactIngestionJob } from "../ingestion/types";
import { ArtifactBlobStore } from "../storage/blob-storage";
import { AppLogger } from "../shared/logger";
import { serializeError } from "../shared/serialize-error";
import { NotificationValidator } from "./notification-validator";
import { GraphChangeNotification, GraphNotificationCollection } from "./notification-types";
import { ResourceDataDecryptor } from "./resource-decryptor";

export class GraphWebhookService {
  public constructor(
    private readonly validator: NotificationValidator,
    private readonly queue: QueueTransport<ArtifactIngestionJob>,
    private readonly artifactBlobStore: ArtifactBlobStore,
    private readonly subscriptionService: GraphSubscriptionService,
    private readonly logger: AppLogger,
    private readonly decryptor?: ResourceDataDecryptor
  ) {}

  public handleResourceNotifications(collection: GraphNotificationCollection): void {
    void this.processCollection("resource", collection);
  }

  public handleLifecycleNotifications(collection: GraphNotificationCollection): void {
    void this.processCollection("lifecycle", collection);
  }

  private async processCollection(kind: "lifecycle" | "resource", collection: GraphNotificationCollection): Promise<void> {
    await this.artifactBlobStore.archiveRawNotification(kind, collection);

    try {
      await this.validator.validateCollection(collection);

      for (const notification of collection.value ?? []) {
        try {
          if (notification.lifecycleEvent) {
            await this.handleLifecycleEvent(notification);
            continue;
          }

          const job = this.createIngestionJob(notification);
          if (!job) {
            continue;
          }

          await this.queue.publish(job, {
            messageId: job.jobId
          });
        } catch (notificationError) {
          await this.artifactBlobStore.archiveDeadLetter("webhook-notification", {
            error: serializeError(notificationError),
            notification
          });

          this.logger.error(
            {
              error: serializeError(notificationError),
              notification
            },
            "Failed to process an individual Microsoft Graph notification."
          );
        }
      }
    } catch (error) {
      await this.artifactBlobStore.archiveDeadLetter(`webhook-${kind}`, {
        collection,
        error: serializeError(error)
      });

      this.logger.error(
        {
          error: serializeError(error),
          kind
        },
        "Failed to process Microsoft Graph webhook payload."
      );
    }
  }

  private createIngestionJob(notification: GraphChangeNotification): ArtifactIngestionJob | null {
    if (notification.changeType !== "created") {
      this.logger.info(
        {
          changeType: notification.changeType,
          resource: notification.resource
        },
        "Ignoring non-created Microsoft Graph notification."
      );
      return null;
    }

    const decryptedResourceData =
      notification.encryptedContent && this.decryptor
        ? this.decryptor.decrypt<Record<string, unknown>>(notification.encryptedContent)
        : undefined;

    const resourcePath =
      (typeof notification.resourceData?.["@odata.id"] === "string" && notification.resourceData["@odata.id"]) ||
      notification.resource;

    const reference = parseArtifactReference(resourcePath);
    const jobId = createJobId(notification.subscriptionId, resourcePath);

    return {
      artifactType: reference.artifactType,
      decryptedResourceData,
      graphResource: resourcePath,
      jobId,
      notificationReceivedAt: new Date().toISOString(),
      resourceData: notification.resourceData,
      sourceNotification: notification as unknown as Record<string, unknown>,
      subscriptionId: notification.subscriptionId,
      tenantId: notification.tenantId ?? "unknown"
    };
  }

  private async handleLifecycleEvent(notification: GraphChangeNotification): Promise<void> {
    switch (notification.lifecycleEvent) {
      case "reauthorizationRequired":
        await this.subscriptionService.reauthorizeSubscription(notification.subscriptionId);
        return;
      case "missed":
      case "subscriptionRemoved":
        await this.subscriptionService.syncSubscriptions();
        return;
      default:
        this.logger.warn({ notification }, "Received unknown Microsoft Graph lifecycle event.");
    }
  }
}

function createJobId(subscriptionId: string, resourcePath: string): string {
  return createHash("sha256").update(`${subscriptionId}:${resourcePath}`).digest("hex");
}
