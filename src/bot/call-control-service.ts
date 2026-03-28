import { Env } from "../config/env";
import { GraphApiClient, GraphApiError } from "../graph/graph-client";
import { NonRetriableError } from "../shared/errors";
import { AppLogger } from "../shared/logger";
import { parseTeamsJoinWebUrl } from "./join-url-parser";
import { BotCallStore } from "./bot-call-store";
import { BotJoinMeetingRequest, GraphBotCall, ManagedBotCallState } from "./types";

export class TeamsCallControlService {
  public constructor(
    private readonly env: Env,
    private readonly graphClient: GraphApiClient,
    private readonly callStore: BotCallStore,
    private readonly logger: AppLogger
  ) {}

  public async listCalls(): Promise<ManagedBotCallState[]> {
    return this.callStore.list();
  }

  public async getCall(callId: string): Promise<ManagedBotCallState | null> {
    return this.callStore.get(callId);
  }

  public async joinMeeting(request: BotJoinMeetingRequest): Promise<ManagedBotCallState> {
    if (!this.env.BOT_ENABLED) {
      throw new NonRetriableError("Bot calling mode is disabled.");
    }

    if (typeof request.joinWebUrl !== "string" || request.joinWebUrl.trim().length === 0) {
      throw new NonRetriableError("joinWebUrl is required.");
    }

    if (request.requestedModalities && !Array.isArray(request.requestedModalities)) {
      throw new NonRetriableError("requestedModalities must be an array when provided.");
    }

    const joinContext = parseTeamsJoinWebUrl(request.joinWebUrl);
    const requestedModalities = normalizeRequestedModalities(
      request.requestedModalities ?? this.env.BOT_REQUESTED_MODALITIES,
      this.env.BOT_SUPPORTS_VIDEO
    );

    const graphCall = await this.graphClient.postJson<GraphBotCall>(
      "communications/calls",
      {
        "@odata.type": "#microsoft.graph.call",
        callbackUri: this.env.BOT_CALLBACK_URL,
        chatInfo: {
          "@odata.type": "#microsoft.graph.chatInfo",
          messageId: joinContext.messageId,
          replyChainMessageId: null,
          threadId: joinContext.threadId
        },
        meetingInfo: {
          "@odata.type": "#microsoft.graph.organizerMeetingInfo",
          allowConversationWithoutHost:
            request.allowConversationWithoutHost ?? this.env.BOT_ALLOW_CONVERSATION_WITHOUT_HOST,
          organizer: {
            "@odata.type": "#microsoft.graph.identitySet",
            user: {
              "@odata.type": "#microsoft.graph.identity",
              id: joinContext.organizerUserId,
              tenantId: joinContext.tenantId
            }
          }
        },
        mediaConfig: {
          "@odata.type": "#microsoft.graph.serviceHostedMediaConfig",
          preFetchMedia: []
        },
        requestedModalities,
        tenantId: joinContext.tenantId
      },
      {
        name: "teams-bot-join-meeting"
      }
    );

    const state: ManagedBotCallState = {
      callChainId: graphCall.callChainId,
      callId: graphCall.id,
      createdBy: "graph-create",
      joinWebUrl: joinContext.joinWebUrl,
      meetingMessageId: joinContext.messageId,
      organizerUserId: joinContext.organizerUserId,
      requestedAt: new Date().toISOString(),
      requestedModalities,
      state: graphCall.state ?? "establishing",
      tenantId: joinContext.tenantId,
      threadId: joinContext.threadId,
      updatedAt: new Date().toISOString()
    };

    await this.callStore.put(state);
    this.logger.info({ callId: state.callId, tenantId: state.tenantId }, "Requested Teams bot join.");
    return state;
  }

  public async leaveCall(callId: string): Promise<ManagedBotCallState> {
    const existing = await this.callStore.get(callId);
    if (!existing) {
      throw new NonRetriableError(`Call ${callId} is not tracked by the bot service.`);
    }

    try {
      await this.graphClient.deleteNoContent(`communications/calls/${callId}`, {
        name: `teams-bot-leave-call:${callId}`,
        retryableStatuses: new Set([429])
      });
    } catch (error) {
      if (!(error instanceof GraphApiError) || error.status !== 404) {
        throw error;
      }
    }

    const nextState: ManagedBotCallState = {
      ...existing,
      state: "terminated",
      terminatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await this.callStore.put(nextState);
    this.logger.info({ callId }, "Requested Teams bot leave.");
    return nextState;
  }
}

function normalizeRequestedModalities(modalities: string[], supportsVideo: boolean): string[] {
  const normalized = Array.from(new Set(modalities.map((value) => value.trim().toLowerCase()).filter(Boolean)));

  if (normalized.length === 0) {
    throw new NonRetriableError("At least one requested modality is required.");
  }

  if (!supportsVideo && normalized.includes("video")) {
    throw new NonRetriableError("BOT_SUPPORTS_VIDEO=false but the join request asked for video.");
  }

  return normalized;
}
