import { randomUUID } from "node:crypto";

import { ArtifactReference, ArtifactType } from "../shared/types";

export function buildArtifactBlobNames(
  tenantId: string,
  reference: ArtifactReference,
  occurredAt: string,
  contentType: string
): {
  contentBlobName: string;
  metadataBlobName: string;
  notificationBlobName: string;
} {
  const date = new Date(occurredAt);
  const prefix = [
    `tenant=${safeSegment(tenantId)}`,
    `year=${date.getUTCFullYear()}`,
    `month=${String(date.getUTCMonth() + 1).padStart(2, "0")}`,
    `day=${String(date.getUTCDate()).padStart(2, "0")}`,
    `${pluralize(reference.artifactType)}`,
    `${reference.parentResourceType}=${safeSegment(reference.parentResourceId)}`,
    `artifact=${safeSegment(reference.artifactId)}`
  ].join("/");

  return {
    contentBlobName: `${prefix}/content${inferExtension(contentType, reference.artifactType)}`,
    metadataBlobName: `${prefix}/metadata.json`,
    notificationBlobName: `${prefix}/notification.json`
  };
}

export function buildRawNotificationBlobName(kind: "resource" | "lifecycle"): string {
  const now = new Date();
  return [
    "raw-notifications",
    `year=${now.getUTCFullYear()}`,
    `month=${String(now.getUTCMonth() + 1).padStart(2, "0")}`,
    `day=${String(now.getUTCDate()).padStart(2, "0")}`,
    kind,
    `${now.toISOString()}-${randomUUID()}.json`
  ].join("/");
}

export function buildDeadLetterBlobName(scope: string): string {
  const now = new Date();
  return [
    "dead-letter",
    `year=${now.getUTCFullYear()}`,
    `month=${String(now.getUTCMonth() + 1).padStart(2, "0")}`,
    `day=${String(now.getUTCDate()).padStart(2, "0")}`,
    scope,
    `${now.toISOString()}-${randomUUID()}.json`
  ].join("/");
}

function inferExtension(contentType: string, artifactType: ArtifactType): string {
  const normalized = contentType.toLowerCase();

  if (normalized.includes("text/vtt")) {
    return ".vtt";
  }

  if (normalized.includes("application/json")) {
    return ".json";
  }

  if (normalized.includes("text/plain")) {
    return ".txt";
  }

  if (normalized.includes("video/mp4")) {
    return ".mp4";
  }

  if (normalized.includes("audio/mp4")) {
    return ".m4a";
  }

  return artifactType === "transcript" ? ".txt" : ".bin";
}

function pluralize(type: ArtifactType): string {
  return type === "transcript" ? "transcripts" : "recordings";
}

function safeSegment(value: string): string {
  return encodeURIComponent(value);
}
