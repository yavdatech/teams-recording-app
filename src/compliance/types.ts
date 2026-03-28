import { ArtifactType, ParentResourceType, StructuredEvent } from "../shared/types";

export interface ExpectedArtifactPolicy {
  recordingRequired: boolean;
  transcriptRequired: boolean;
}

export interface ComplianceMeetingRegistration {
  endedAt: string;
  organizerUserId?: string;
  organizerUpn?: string;
  parentResourceId: string;
  parentResourceType: ParentResourceType;
  source?: string;
  startedAt?: string;
  tenantId: string;
  title?: string;
}

export interface ComplianceMeetingRecord extends ComplianceMeetingRegistration {
  artifacts: {
    recording?: ComplianceObservedArtifact;
    transcript?: ComplianceObservedArtifact;
  };
  caseId: string;
  complianceAchievedAt?: string;
  createdAt: string;
  expectedArtifacts: ExpectedArtifactPolicy;
  firstViolationAt?: string;
  gracePeriodMinutes: number;
  history: ComplianceHistoryEntry[];
  lastEvaluatedAt?: string;
  reminderCount: number;
  status: "compliant" | "open_violation" | "pending";
  updatedAt: string;
  violationOpen: boolean;
}

export interface ComplianceObservedArtifact {
  artifactId: string;
  contentBlobUrl: string;
  contentType: string;
  fetchedAt: string;
  graphResource: string;
  observedAt: string;
}

export interface ComplianceHistoryEntry {
  detail?: string;
  recordedAt: string;
  type: "artifact_observed" | "meeting_registered" | "meeting_resolved" | "reminder_sent" | "violation_opened";
}

export interface ComplianceCheckJob {
  caseId: string;
  scheduledFor: string;
  trigger: "meeting_registered" | "reminder_due";
}

export interface ComplianceSummary {
  compliant: number;
  openViolations: number;
  pending: number;
  total: number;
}

export interface MeetingComplianceViolationEventData {
  caseId: string;
  endedAt: string;
  expectedArtifacts: ExpectedArtifactPolicy;
  missingArtifacts: ArtifactType[];
  organizerUpn?: string;
  organizerUserId?: string;
  parentResourceId: string;
  parentResourceType: ParentResourceType;
  reminderCount: number;
  tenantId: string;
  title?: string;
}

export interface MeetingComplianceResolvedEventData {
  caseId: string;
  compliantAt: string;
  parentResourceId: string;
  parentResourceType: ParentResourceType;
  tenantId: string;
}

export interface MeetingComplianceRegisteredEventData {
  caseId: string;
  endedAt: string;
  expectedArtifacts: ExpectedArtifactPolicy;
  gracePeriodMinutes: number;
  parentResourceId: string;
  parentResourceType: ParentResourceType;
  tenantId: string;
}

export interface MeetingComplianceReminderEventData extends MeetingComplianceViolationEventData {
  nextReminderAt?: string;
}

export type ComplianceEvent =
  | StructuredEvent<MeetingComplianceRegisteredEventData>
  | StructuredEvent<MeetingComplianceResolvedEventData>
  | StructuredEvent<MeetingComplianceReminderEventData>
  | StructuredEvent<MeetingComplianceViolationEventData>;
