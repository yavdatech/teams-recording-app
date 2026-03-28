import { createHash } from "node:crypto";

import { BlobStateStore } from "../storage/state-store";
import { RetryableError } from "../shared/errors";
import { AppLogger } from "../shared/logger";
import { serializeError } from "../shared/serialize-error";

interface ProcessingState {
  attempts: number;
  completedAt?: string;
  jobId: string;
  lastError?: Record<string, unknown>;
  leaseExpiresAt?: string;
  resourcePath: string;
  status: "completed" | "failed" | "processing";
  storedBlobName?: string;
  updatedAt: string;
}

export interface ClaimResult {
  etag?: string;
  state: ProcessingState;
  stateKey: string;
  status: "busy" | "claimed" | "completed";
}

export class ArtifactIdempotencyService {
  public constructor(
    private readonly stateStore: BlobStateStore,
    private readonly lockTtlSeconds: number,
    private readonly logger: AppLogger
  ) {}

  public async claim(resourcePath: string, jobId: string): Promise<ClaimResult> {
    const stateKey = `idempotency/${createStateHash(resourcePath)}.json`;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const existing = await this.stateStore.get<ProcessingState>(stateKey);

      if (existing?.value.status === "completed") {
        return {
          etag: existing.etag,
          state: existing.value,
          stateKey,
          status: "completed"
        };
      }

      if (existing?.value.status === "processing" && !isLeaseExpired(existing.value.leaseExpiresAt)) {
        return {
          etag: existing.etag,
          state: existing.value,
          stateKey,
          status: "busy"
        };
      }

      const nextState: ProcessingState = {
        attempts: (existing?.value.attempts ?? 0) + 1,
        jobId,
        leaseExpiresAt: new Date(Date.now() + this.lockTtlSeconds * 1_000).toISOString(),
        resourcePath,
        status: "processing",
        updatedAt: new Date().toISOString()
      };

      try {
        const saved = await this.stateStore.put(
          stateKey,
          nextState,
          existing?.etag ? { ifMatch: existing.etag } : { ifNoneMatch: "*" }
        );

        return {
          etag: saved.etag,
          state: nextState,
          stateKey,
          status: "claimed"
        };
      } catch (error) {
        if (!isPreconditionFailure(error)) {
          throw error;
        }
      }
    }

    throw new RetryableError(`Failed to acquire artifact idempotency lock for ${resourcePath}.`);
  }

  public async markCompleted(claim: ClaimResult, storedBlobName: string): Promise<void> {
    if (claim.status !== "claimed") {
      return;
    }

    const nextState: ProcessingState = {
      ...claim.state,
      completedAt: new Date().toISOString(),
      leaseExpiresAt: undefined,
      status: "completed",
      storedBlobName,
      updatedAt: new Date().toISOString()
    };

    await this.stateStore.put(claim.stateKey, nextState, claim.etag ? { ifMatch: claim.etag } : undefined);
  }

  public async markFailed(claim: ClaimResult, error: unknown): Promise<void> {
    if (claim.status !== "claimed") {
      return;
    }

    const nextState: ProcessingState = {
      ...claim.state,
      lastError: serializeError(error),
      leaseExpiresAt: undefined,
      status: "failed",
      updatedAt: new Date().toISOString()
    };

    try {
      await this.stateStore.put(claim.stateKey, nextState, claim.etag ? { ifMatch: claim.etag } : undefined);
    } catch (writeError) {
      this.logger.warn(
        {
          error: serializeError(writeError),
          resourcePath: claim.state.resourcePath,
          stateKey: claim.stateKey
        },
        "Failed to persist failed artifact state."
      );
    }
  }
}

function createStateHash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function isLeaseExpired(leaseExpiresAt?: string): boolean {
  if (!leaseExpiresAt) {
    return true;
  }

  return Date.parse(leaseExpiresAt) <= Date.now();
}

function isPreconditionFailure(error: unknown): boolean {
  return typeof error === "object" && error !== null && "statusCode" in error && (error as { statusCode?: number }).statusCode === 412;
}
