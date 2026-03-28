export interface TeamsMeetingJoinContext {
  joinWebUrl: string;
  messageId: string;
  organizerUserId: string;
  tenantId: string;
  threadId: string;
}

export interface BotJoinMeetingRequest {
  allowConversationWithoutHost?: boolean;
  joinWebUrl: string;
  requestedModalities?: string[];
}

export interface GraphBotCall {
  callChainId?: string;
  id: string;
  state?: string;
}

export interface BotCallNotification {
  changeType?: string;
  resource?: string;
  resourceData?: Record<string, unknown>;
}

export interface BotCallbackPayload {
  value?: BotCallNotification[];
}

export interface ManagedBotCallState {
  callChainId?: string;
  callId: string;
  createdBy: "graph-create" | "graph-callback";
  joinWebUrl?: string;
  meetingMessageId?: string;
  organizerUserId?: string;
  requestedAt?: string;
  requestedModalities: string[];
  state: string;
  terminatedAt?: string;
  tenantId?: string;
  threadId?: string;
  updatedAt: string;
}
