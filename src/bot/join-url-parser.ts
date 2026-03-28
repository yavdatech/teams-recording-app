import { NonRetriableError } from "../shared/errors";
import { TeamsMeetingJoinContext } from "./types";

export function parseTeamsJoinWebUrl(joinWebUrl: string): TeamsMeetingJoinContext {
  let url: URL;

  try {
    url = new URL(joinWebUrl);
  } catch (error) {
    throw new NonRetriableError("joinWebUrl is not a valid URL.", { cause: error });
  }

  const match = /\/meetup-join\/(?<threadId>[^/]+)\/(?<messageId>[^/?]+)/i.exec(url.pathname);
  if (!match?.groups) {
    throw new NonRetriableError("joinWebUrl does not look like a Teams meeting join URL.");
  }

  const rawContext = url.searchParams.get("context");
  if (!rawContext) {
    throw new NonRetriableError("joinWebUrl is missing the Teams context query parameter.");
  }

  let context: { Oid?: string; Tid?: string };
  try {
    context = JSON.parse(rawContext) as { Oid?: string; Tid?: string };
  } catch (error) {
    throw new NonRetriableError("joinWebUrl contains an unreadable Teams context payload.", { cause: error });
  }

  const tenantId = context.Tid;
  const organizerUserId = context.Oid;

  if (!tenantId || !organizerUserId) {
    throw new NonRetriableError("joinWebUrl context must include Tid and Oid.");
  }

  return {
    joinWebUrl,
    messageId: decodeURIComponent(match.groups.messageId),
    organizerUserId,
    tenantId,
    threadId: decodeURIComponent(match.groups.threadId)
  };
}
