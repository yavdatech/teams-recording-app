import { Env } from "../config/env";
import { buildGraphArtifactContentPath, buildGraphArtifactPath, parseArtifactReference } from "../graph/graph-resource-paths";
import { GraphApiClient } from "../graph/graph-client";
import { ArtifactIngestionJob } from "./types";
import { FetchedArtifact } from "../shared/types";

const RETRYABLE_FETCH_STATUSES = new Set([404, 409, 423, 429, 500, 502, 503, 504]);

export class GraphArtifactFetcher {
  public constructor(
    private readonly env: Env,
    private readonly graphClient: GraphApiClient
  ) {}

  public async fetch(job: ArtifactIngestionJob): Promise<FetchedArtifact> {
    const reference = parseArtifactReference(job.graphResource);
    const metadataPath = buildGraphArtifactPath(reference);
    const contentPath = buildGraphArtifactContentPath(reference);

    const metadata = await this.graphClient.getJson<Record<string, unknown>>(metadataPath, {
      initialDelayMs: this.env.INGESTION_INITIAL_RETRY_DELAY_MS,
      maxDelayMs: 60_000,
      maxAttempts: this.env.INGESTION_MAX_FETCH_ATTEMPTS,
      name: `fetch-artifact-metadata:${reference.artifactType}:${reference.artifactId}`,
      retryableStatuses: RETRYABLE_FETCH_STATUSES
    });

    const download = await this.graphClient.downloadBuffer(contentPath, {
      initialDelayMs: this.env.INGESTION_INITIAL_RETRY_DELAY_MS,
      maxDelayMs: 60_000,
      maxAttempts: this.env.INGESTION_MAX_FETCH_ATTEMPTS,
      name: `fetch-artifact-content:${reference.artifactType}:${reference.artifactId}`,
      retryableStatuses: RETRYABLE_FETCH_STATUSES
    });

    return {
      content: download.content,
      contentType: download.contentType,
      fetchedAt: new Date().toISOString(),
      metadata,
      metadataEtag: download.etag,
      reference,
      sourceResourcePath: metadataPath
    };
  }
}
