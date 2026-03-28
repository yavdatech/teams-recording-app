import { MeetingComplianceService } from "../compliance/service";
import { createArtifactIngestedEvent } from "../events/event-factory";
import { DownstreamEventPublisher } from "../events/downstream-event-publisher";
import { GraphApiError } from "../graph/graph-client";
import { ArtifactBlobStore } from "../storage/blob-storage";
import { NonRetriableError, RetryableError } from "../shared/errors";
import { ArtifactIdempotencyService } from "./idempotency-service";
import { GraphArtifactFetcher } from "./artifact-fetcher";
import { ArtifactIngestionJob } from "./types";

export class ArtifactIngestionService {
  public constructor(
    private readonly idempotencyService: ArtifactIdempotencyService,
    private readonly fetcher: GraphArtifactFetcher,
    private readonly artifactBlobStore: ArtifactBlobStore,
    private readonly eventPublisher: DownstreamEventPublisher,
    private readonly complianceService?: MeetingComplianceService
  ) {}

  public async process(job: ArtifactIngestionJob): Promise<"busy" | "completed" | "skipped"> {
    const claim = await this.idempotencyService.claim(`${job.tenantId}:${job.graphResource}`, job.jobId);

    if (claim.status === "completed" || claim.status === "busy") {
      return "skipped";
    }

    try {
      const artifact = await this.fetcher.fetch(job);
      const stored = await this.artifactBlobStore.storeArtifact(job, artifact);
      const event = createArtifactIngestedEvent(job, artifact, stored);

      if (this.complianceService) {
        await this.complianceService.recordArtifactObserved(job.tenantId, artifact, stored);
      }

      await this.eventPublisher.publish(event);
      await this.idempotencyService.markCompleted(claim, stored.contentBlobName);

      return "completed";
    } catch (error) {
      await this.idempotencyService.markFailed(claim, error);
      throw normalizeIngestionError(error);
    }
  }
}

function normalizeIngestionError(error: unknown): Error {
  if (error instanceof RetryableError || error instanceof NonRetriableError) {
    return error;
  }

  if (error instanceof GraphApiError && [400, 401, 403].includes(error.status)) {
    return new NonRetriableError(`Microsoft Graph rejected the artifact fetch with status ${error.status}.`, {
      cause: error
    });
  }

  return new RetryableError("Artifact ingestion failed and should be retried.", {
    cause: error
  });
}
