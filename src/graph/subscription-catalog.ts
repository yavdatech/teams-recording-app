import { Env } from "../config/env";
import { ArtifactType } from "../shared/types";

export interface DesiredSubscription {
  artifactType: ArtifactType;
  changeType: "created";
  key: string;
  resource: string;
}

export function buildDesiredSubscriptions(env: Env): DesiredSubscription[] {
  if (env.GRAPH_SUBSCRIPTION_MODE === "tenant") {
    return [
      {
        artifactType: "transcript",
        changeType: "created",
        key: "tenant-transcripts",
        resource: "communications/onlineMeetings/getAllTranscripts"
      },
      {
        artifactType: "recording",
        changeType: "created",
        key: "tenant-recordings",
        resource: "communications/onlineMeetings/getAllRecordings"
      }
    ];
  }

  return env.GRAPH_ORGANIZER_USER_IDS.flatMap((userId) => [
    {
      artifactType: "transcript" as const,
      changeType: "created" as const,
      key: `user-${userId}-transcripts`,
      resource: `users/${userId}/onlineMeetings/getAllTranscripts`
    },
    {
      artifactType: "recording" as const,
      changeType: "created" as const,
      key: `user-${userId}-recordings`,
      resource: `users/${userId}/onlineMeetings/getAllRecordings`
    }
  ]);
}
