import { ArtifactType } from "../shared/types";

export interface ArtifactIngestionJob {
  artifactType: ArtifactType;
  decryptedResourceData?: Record<string, unknown>;
  graphResource: string;
  jobId: string;
  notificationReceivedAt: string;
  resourceData?: Record<string, unknown>;
  sourceNotification: Record<string, unknown>;
  subscriptionId: string;
  tenantId: string;
}
