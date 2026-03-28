import { AppLogger } from "../shared/logger";
import { ArtifactBlobStore } from "../storage/blob-storage";
import { serializeError } from "../shared/serialize-error";
import { BotCallStore } from "./bot-call-store";
import { BotCallbackPayload, ManagedBotCallState } from "./types";

export class TeamsCallCallbackService {
  public constructor(
    private readonly callStore: BotCallStore,
    private readonly artifactBlobStore: ArtifactBlobStore,
    private readonly logger: AppLogger
  ) {}

  public handle(payload: BotCallbackPayload): void {
    void this.process(payload);
  }

  private async process(payload: BotCallbackPayload): Promise<void> {
    for (const notification of payload.value ?? []) {
      try {
        const callId = extractCallId(notification.resource);
        if (!callId) {
          continue;
        }

        const existing = await this.callStore.get(callId);
        const resourceData = notification.resourceData ?? {};
        const stateValue = readString(resourceData.state) ?? existing?.state ?? "unknown";
        const nextState: ManagedBotCallState = {
          callChainId: readString(resourceData.callChainId) ?? existing?.callChainId,
          callId,
          createdBy: existing?.createdBy ?? "graph-callback",
          joinWebUrl: existing?.joinWebUrl,
          meetingMessageId: existing?.meetingMessageId,
          organizerUserId: existing?.organizerUserId,
          requestedAt: existing?.requestedAt,
          requestedModalities: existing?.requestedModalities ?? ["audio"],
          state: stateValue,
          tenantId: readString(resourceData.tenantId) ?? existing?.tenantId,
          terminatedAt: stateValue === "terminated" ? new Date().toISOString() : existing?.terminatedAt,
          threadId: existing?.threadId,
          updatedAt: new Date().toISOString()
        };

        await this.callStore.put(nextState);
      } catch (error) {
        await this.artifactBlobStore.archiveDeadLetter("teams-call-callback", {
          error: serializeError(error),
          notification
        });

        this.logger.error({ error: serializeError(error), notification }, "Failed to process Teams call callback.");
      }
    }
  }
}

function extractCallId(resource?: string): string | null {
  if (!resource) {
    return null;
  }

  const normalized = resource.replace(/^https:\/\/graph\.microsoft\.com\/v1\.0\//i, "").replace(/^\/+/, "");
  const match = /^communications\/calls\/(?<callId>[^/?]+)/i.exec(normalized);
  return match?.groups?.callId ?? null;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}
