import { randomUUID } from "node:crypto";

import {
  ComplianceMeetingRecord,
  MeetingComplianceRegisteredEventData,
  MeetingComplianceReminderEventData,
  MeetingComplianceResolvedEventData,
  MeetingComplianceViolationEventData
} from "../compliance/types";
import { ArtifactIngestionJob } from "../ingestion/types";
import { FetchedArtifact, StoredArtifact, StructuredEvent } from "../shared/types";
import { serializeError } from "../shared/serialize-error";

export interface ArtifactIngestedEventData {
  artifactId: string;
  artifactType: "transcript" | "recording";
  contentBlobUrl: string;
  contentType: string;
  fetchedAt: string;
  graphMetadata: Record<string, unknown>;
  graphResource: string;
  metadataBlobUrl: string;
  notificationBlobUrl: string;
  ownerUserId?: string;
  parentResourceId: string;
  parentResourceType: "onlineMeeting" | "adhocCall";
  subscriptionId: string;
  tenantId: string;
}

export interface ArtifactIngestionFailedEventData {
  artifactType: "transcript" | "recording";
  attempt: number;
  error: Record<string, unknown>;
  graphResource: string;
  jobId: string;
  subscriptionId: string;
  tenantId: string;
}

export function createArtifactIngestedEvent(
  job: ArtifactIngestionJob,
  artifact: FetchedArtifact,
  stored: StoredArtifact
): StructuredEvent<ArtifactIngestedEventData> {
  return {
    data: {
      artifactId: artifact.reference.artifactId,
      artifactType: artifact.reference.artifactType,
      contentBlobUrl: stored.contentBlobUrl,
      contentType: artifact.contentType,
      fetchedAt: artifact.fetchedAt,
      graphMetadata: artifact.metadata,
      graphResource: artifact.sourceResourcePath,
      metadataBlobUrl: stored.metadataBlobUrl,
      notificationBlobUrl: stored.notificationBlobUrl,
      ownerUserId: artifact.reference.ownerUserId,
      parentResourceId: artifact.reference.parentResourceId,
      parentResourceType: artifact.reference.parentResourceType,
      subscriptionId: job.subscriptionId,
      tenantId: job.tenantId
    },
    id: randomUUID(),
    source: "urn:teams-recordings-ingestion-service",
    specversion: "1.0",
    subject: `${artifact.reference.artifactType}/${artifact.reference.artifactId}`,
    time: new Date().toISOString(),
    type: "com.example.teams.artifact.ingested.v1"
  };
}

export function createArtifactIngestionFailedEvent(
  job: ArtifactIngestionJob,
  attempt: number,
  error: unknown
): StructuredEvent<ArtifactIngestionFailedEventData> {
  return {
    data: {
      artifactType: job.artifactType,
      attempt,
      error: serializeError(error),
      graphResource: job.graphResource,
      jobId: job.jobId,
      subscriptionId: job.subscriptionId,
      tenantId: job.tenantId
    },
    id: randomUUID(),
    source: "urn:teams-recordings-ingestion-service",
    specversion: "1.0",
    subject: `${job.artifactType}/${job.jobId}`,
    time: new Date().toISOString(),
    type: "com.example.teams.artifact.ingestion-failed.v1"
  };
}

export function createMeetingComplianceRegisteredEvent(
  record: ComplianceMeetingRecord
): StructuredEvent<MeetingComplianceRegisteredEventData> {
  return {
    data: {
      caseId: record.caseId,
      endedAt: record.endedAt,
      expectedArtifacts: record.expectedArtifacts,
      gracePeriodMinutes: record.gracePeriodMinutes,
      parentResourceId: record.parentResourceId,
      parentResourceType: record.parentResourceType,
      tenantId: record.tenantId
    },
    id: randomUUID(),
    source: "urn:teams-meeting-compliance-service",
    specversion: "1.0",
    subject: `compliance/${record.caseId}`,
    time: new Date().toISOString(),
    type: "com.example.teams.meeting-compliance.registered.v1"
  };
}

export function createMeetingComplianceViolationOpenedEvent(
  record: ComplianceMeetingRecord,
  missingArtifacts: Array<"recording" | "transcript">
): StructuredEvent<MeetingComplianceViolationEventData> {
  return {
    data: {
      caseId: record.caseId,
      endedAt: record.endedAt,
      expectedArtifacts: record.expectedArtifacts,
      missingArtifacts,
      organizerUpn: record.organizerUpn,
      organizerUserId: record.organizerUserId,
      parentResourceId: record.parentResourceId,
      parentResourceType: record.parentResourceType,
      reminderCount: record.reminderCount,
      tenantId: record.tenantId,
      title: record.title
    },
    id: randomUUID(),
    source: "urn:teams-meeting-compliance-service",
    specversion: "1.0",
    subject: `compliance/${record.caseId}`,
    time: new Date().toISOString(),
    type: "com.example.teams.meeting-compliance.violation-opened.v1"
  };
}

export function createMeetingComplianceReminderEvent(
  record: ComplianceMeetingRecord,
  missingArtifacts: Array<"recording" | "transcript">,
  nextReminderAt?: string
): StructuredEvent<MeetingComplianceReminderEventData> {
  return {
    data: {
      caseId: record.caseId,
      endedAt: record.endedAt,
      expectedArtifacts: record.expectedArtifacts,
      missingArtifacts,
      nextReminderAt,
      organizerUpn: record.organizerUpn,
      organizerUserId: record.organizerUserId,
      parentResourceId: record.parentResourceId,
      parentResourceType: record.parentResourceType,
      reminderCount: record.reminderCount,
      tenantId: record.tenantId,
      title: record.title
    },
    id: randomUUID(),
    source: "urn:teams-meeting-compliance-service",
    specversion: "1.0",
    subject: `compliance/${record.caseId}`,
    time: new Date().toISOString(),
    type: "com.example.teams.meeting-compliance.reminder.v1"
  };
}

export function createMeetingComplianceResolvedEvent(
  record: ComplianceMeetingRecord
): StructuredEvent<MeetingComplianceResolvedEventData> {
  return {
    data: {
      caseId: record.caseId,
      compliantAt: record.complianceAchievedAt ?? new Date().toISOString(),
      parentResourceId: record.parentResourceId,
      parentResourceType: record.parentResourceType,
      tenantId: record.tenantId
    },
    id: randomUUID(),
    source: "urn:teams-meeting-compliance-service",
    specversion: "1.0",
    subject: `compliance/${record.caseId}`,
    time: new Date().toISOString(),
    type: "com.example.teams.meeting-compliance.resolved.v1"
  };
}
