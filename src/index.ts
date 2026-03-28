import { BotCallStore } from "./bot/bot-call-store";
import { TeamsCallCallbackService } from "./bot/callback-service";
import { TeamsCallControlService } from "./bot/call-control-service";
import { loadGraphNotificationPrivateKey } from "./auth/certificate-loader";
import { createGraphCredential } from "./auth/credential-factory";
import { GraphTokenProvider } from "./auth/token-provider";
import { createApp, RuntimeState } from "./app";
import { ComplianceEventDispatcher } from "./compliance/event-helpers";
import { ComplianceNotifier } from "./compliance/notifier";
import { MeetingComplianceService } from "./compliance/service";
import { ComplianceStore } from "./compliance/store";
import { ComplianceWorkerRunner } from "./compliance/worker-runner";
import { ComplianceCheckJob } from "./compliance/types";
import { env } from "./config/env";
import { DownstreamEventPublisher } from "./events/downstream-event-publisher";
import { GraphApiClient } from "./graph/graph-client";
import { GraphSubscriptionService } from "./graph/subscription-service";
import { GraphArtifactFetcher } from "./ingestion/artifact-fetcher";
import { ArtifactIngestionService } from "./ingestion/artifact-ingestion-service";
import { ArtifactIdempotencyService } from "./ingestion/idempotency-service";
import { IngestionWorkerRunner } from "./ingestion/worker-runner";
import { ArtifactIngestionJob } from "./ingestion/types";
import { InMemoryQueue } from "./queue/in-memory-queue";
import { QueueTransport } from "./queue/queue-types";
import { ServiceBusQueue } from "./queue/service-bus-queue";
import { createLogger } from "./shared/logger";
import { serializeError } from "./shared/serialize-error";
import { ArtifactBlobStore, AzureBlobStorage } from "./storage/blob-storage";
import { BlobStateStore } from "./storage/state-store";
import { NotificationValidator } from "./webhook/notification-validator";
import { ResourceDataDecryptor } from "./webhook/resource-decryptor";
import { GraphWebhookService } from "./webhook/webhook-service";

async function main(): Promise<void> {
  const logger = createLogger(env.LOG_LEVEL);
  const runtimeState: RuntimeState = {
    startedAt: new Date().toISOString()
  };

  const blobStorage = new AzureBlobStorage(env.AZURE_STORAGE_CONNECTION_STRING);
  await blobStorage.ensureContainers([
    env.AZURE_BLOB_CONTAINER_ARTIFACTS,
    env.AZURE_BLOB_CONTAINER_STATE,
    env.AZURE_BLOB_CONTAINER_DEADLETTER
  ]);

  const stateStore = new BlobStateStore(env.AZURE_BLOB_CONTAINER_STATE, blobStorage, logger);
  const artifactBlobStore = new ArtifactBlobStore(env, blobStorage, logger);
  const tokenProvider = new GraphTokenProvider(createGraphCredential(env), env.GRAPH_SCOPE);
  const graphClient = new GraphApiClient(env.GRAPH_BASE_URL, tokenProvider, logger);
  const subscriptionService = new GraphSubscriptionService(env, graphClient, stateStore, logger);
  const botCallStore = new BotCallStore(stateStore);
  const complianceStore = new ComplianceStore(stateStore);

  const queue: QueueTransport<ArtifactIngestionJob> =
    env.QUEUE_MODE === "servicebus"
      ? new ServiceBusQueue<ArtifactIngestionJob>(
          env.AZURE_SERVICE_BUS_CONNECTION_STRING!,
          env.AZURE_SERVICE_BUS_INGESTION_QUEUE,
          logger
        )
      : new InMemoryQueue<ArtifactIngestionJob>();
  const complianceQueue: QueueTransport<ComplianceCheckJob> | undefined = env.COMPLIANCE_ENABLED
    ? env.QUEUE_MODE === "servicebus"
      ? new ServiceBusQueue<ComplianceCheckJob>(
          env.AZURE_SERVICE_BUS_CONNECTION_STRING!,
          env.AZURE_SERVICE_BUS_COMPLIANCE_QUEUE,
          logger
        )
      : new InMemoryQueue<ComplianceCheckJob>()
    : undefined;

  const eventPublisher = new DownstreamEventPublisher(env, logger);
  const complianceNotifier = new ComplianceNotifier(env, logger);
  const complianceEvents = new ComplianceEventDispatcher(eventPublisher, complianceNotifier);
  const complianceService = env.COMPLIANCE_ENABLED && complianceQueue
    ? new MeetingComplianceService(env, complianceStore, complianceQueue, complianceEvents)
    : undefined;
  const fetcher = new GraphArtifactFetcher(env, graphClient);
  const idempotencyService = new ArtifactIdempotencyService(stateStore, env.INGESTION_LOCK_TTL_SECONDS, logger);
  const ingestionService = new ArtifactIngestionService(
    idempotencyService,
    fetcher,
    artifactBlobStore,
    eventPublisher,
    complianceService
  );
  const worker = new IngestionWorkerRunner(env, queue, ingestionService, artifactBlobStore, eventPublisher, logger);
  await worker.start();
  const complianceWorker = complianceService
    ? new ComplianceWorkerRunner(env, complianceQueue, complianceService, artifactBlobStore, logger)
    : undefined;
  await complianceWorker?.start();

  const validator = new NotificationValidator(env);
  const decryptor =
    env.GRAPH_INCLUDE_RESOURCE_DATA && env.GRAPH_ENCRYPTION_PRIVATE_KEY_PATH
      ? new ResourceDataDecryptor(
          await loadGraphNotificationPrivateKey(
            env.GRAPH_ENCRYPTION_PRIVATE_KEY_PATH,
            env.GRAPH_ENCRYPTION_PRIVATE_KEY_PASSPHRASE
          )
        )
      : undefined;

  const webhookService = new GraphWebhookService(
    validator,
    queue,
    artifactBlobStore,
    subscriptionService,
    logger,
    decryptor
  );

  const botControlService = env.BOT_ENABLED
    ? new TeamsCallControlService(env, graphClient, botCallStore, logger)
    : undefined;
  const botCallbackService = env.BOT_ENABLED
    ? new TeamsCallCallbackService(botCallStore, artifactBlobStore, logger)
    : undefined;

  const app = createApp(
    logger,
    runtimeState,
    subscriptionService,
    webhookService,
    botControlService && botCallbackService
      ? {
          callbackService: botCallbackService,
          controlService: botControlService
        }
      : undefined,
    complianceService
  );
  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, "Teams recording/transcript ingestion service is listening.");
  });

  const syncSubscriptions = async (): Promise<void> => {
    try {
      await subscriptionService.syncSubscriptions();
      runtimeState.lastSubscriptionSyncAt = new Date().toISOString();
      runtimeState.lastSubscriptionSyncError = undefined;
    } catch (error) {
      runtimeState.lastSubscriptionSyncError = serializeError(error);
      logger.error({ error: serializeError(error) }, "Subscription sync failed.");
    }
  };

  await syncSubscriptions();
  const syncTimer = setInterval(() => {
    void syncSubscriptions();
  }, env.GRAPH_SUBSCRIPTION_SYNC_INTERVAL_MS);
  syncTimer.unref();

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, "Graceful shutdown started.");
    clearInterval(syncTimer);

    server.close(async (closeError) => {
      if (closeError) {
        logger.error({ error: serializeError(closeError) }, "HTTP server close failed.");
      }

      await worker.close();
      await complianceWorker?.close();
      await eventPublisher.close();
      process.exit(closeError ? 1 : 0);
    });
  };

  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });

  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
}

void main().catch((error) => {
  console.error("Fatal startup error", serializeError(error));
  process.exit(1);
});
