import { createArtifactIngestionFailedEvent } from "../events/event-factory";
import { DownstreamEventPublisher } from "../events/downstream-event-publisher";
import { QueueTransport } from "../queue/queue-types";
import { ArtifactBlobStore } from "../storage/blob-storage";
import { AppLogger } from "../shared/logger";
import { serializeError } from "../shared/serialize-error";
import { Env } from "../config/env";
import { ArtifactIngestionJob } from "./types";
import { ArtifactIngestionService } from "./artifact-ingestion-service";

export class IngestionWorkerRunner {
  public constructor(
    private readonly env: Env,
    private readonly queue: QueueTransport<ArtifactIngestionJob>,
    private readonly ingestionService: ArtifactIngestionService,
    private readonly artifactBlobStore: ArtifactBlobStore,
    private readonly eventPublisher: DownstreamEventPublisher,
    private readonly logger: AppLogger
  ) {}

  public async start(): Promise<void> {
    await this.queue.subscribe(
      async (job) => {
        await this.ingestionService.process(job);
      },
      {
        concurrency: this.env.INGESTION_WORKER_CONCURRENCY,
        maxAttempts: this.env.QUEUE_MAX_DELIVERIES,
        onDeadLetter: async (job, context, error) => {
          await this.artifactBlobStore.archiveDeadLetter("ingestion", {
            error: serializeError(error),
            job,
            queueContext: context
          });

          await this.eventPublisher.publish(createArtifactIngestionFailedEvent(job, context.attempt, error));

          this.logger.error(
            {
              attempt: context.attempt,
              error: serializeError(error),
              jobId: job.jobId
            },
            "Artifact ingestion message moved to dead-letter handling."
          );
        }
      }
    );
  }

  public async close(): Promise<void> {
    await this.queue.close();
  }
}
