export type ArtifactType = "transcript" | "recording";
export type ParentResourceType = "onlineMeeting" | "adhocCall";
export type ResourceScope = "user" | "communications";

export interface ArtifactReference {
  artifactType: ArtifactType;
  artifactId: string;
  normalizedResourcePath: string;
  parentResourceId: string;
  parentResourceType: ParentResourceType;
  resourceScope: ResourceScope;
  ownerUserId?: string;
}

export interface FetchedArtifact {
  content: Buffer;
  contentType: string;
  fetchedAt: string;
  metadata: Record<string, unknown>;
  metadataEtag?: string;
  reference: ArtifactReference;
  sourceResourcePath: string;
}

export interface StoredArtifact {
  contentBlobName: string;
  contentBlobUrl: string;
  metadataBlobName: string;
  metadataBlobUrl: string;
  notificationBlobName: string;
  notificationBlobUrl: string;
}

export interface StructuredEvent<TDetail> {
  data: TDetail;
  id: string;
  source: string;
  specversion: "1.0";
  subject: string;
  time: string;
  type: string;
}
