import { Env } from "../config/env";
import { QueueTransport } from "../queue/queue-types";
import { ArtifactBlobStore } from "../storage/blob-storage";
import { AppLogger } from "../shared/logger";
import { serializeError } from "../shared/serialize-error";
import { ComplianceCheckJob } from "./types";
import { MeetingComplianceService } from "./service";

export class ComplianceWorkerRunner {
  public constructor(
    private readonly env: Env,
    private readonly queue: QueueTransport<ComplianceCheckJob>,
    private readonly service: MeetingComplianceService,
    private readonly artifactBlobStore: ArtifactBlobStore,
    private readonly logger: AppLogger
  ) {}

  public async start(): Promise<void> {
    await this.queue.subscribe(
      async (job) => {
        await this.service.evaluate(job.caseId);
      },
      {
        concurrency: this.env.COMPLIANCE_WORKER_CONCURRENCY,
        maxAttempts: this.env.QUEUE_MAX_DELIVERIES,
        onDeadLetter: async (job, context, error) => {
          await this.artifactBlobStore.archiveDeadLetter("compliance", {
            error: serializeError(error),
            job,
            queueContext: context
          });

          this.logger.error(
            {
              attempt: context.attempt,
              error: serializeError(error),
              job
            },
            "Compliance job moved to dead-letter handling."
          );
        }
      }
    );
  }

  public async close(): Promise<void> {
    await this.queue.close();
  }
}
