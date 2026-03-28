import { Env } from "../config/env";
import { NonRetriableError } from "../shared/errors";
import { FetchedArtifact, StoredArtifact } from "../shared/types";
import { ComplianceStore } from "./store";
import {
  ComplianceCheckJob,
  ComplianceMeetingRecord,
  ComplianceMeetingRegistration,
  ComplianceObservedArtifact,
  ExpectedArtifactPolicy
} from "./types";
import { ComplianceEventDispatcher } from "./event-helpers";
import { QueueTransport } from "../queue/queue-types";

export class MeetingComplianceService {
  public constructor(
    private readonly env: Env,
    private readonly store: ComplianceStore,
    private readonly queue: QueueTransport<ComplianceCheckJob>,
    private readonly events: ComplianceEventDispatcher
  ) {}

  public async registerMeeting(
    registration: ComplianceMeetingRegistration,
    expectedArtifacts?: Partial<ExpectedArtifactPolicy>,
    gracePeriodMinutes?: number
  ): Promise<ComplianceMeetingRecord> {
    validateRegistration(registration);

    const caseId = ComplianceStore.createCaseId(
      registration.tenantId,
      registration.parentResourceType,
      registration.parentResourceId
    );

    const existing = await this.store.get(caseId);
    const now = new Date().toISOString();
    const nextExpectedArtifacts = {
      recordingRequired:
        expectedArtifacts?.recordingRequired ?? existing?.expectedArtifacts.recordingRequired ?? this.env.COMPLIANCE_DEFAULT_EXPECT_RECORDING,
      transcriptRequired:
        expectedArtifacts?.transcriptRequired ?? existing?.expectedArtifacts.transcriptRequired ?? this.env.COMPLIANCE_DEFAULT_EXPECT_TRANSCRIPT
    };
    const nextStatus = evaluateStatus(existing?.artifacts ?? {}, nextExpectedArtifacts);
    const record: ComplianceMeetingRecord = {
      artifacts: existing?.artifacts ?? {},
      caseId,
      complianceAchievedAt: existing?.complianceAchievedAt,
      createdAt: existing?.createdAt ?? now,
      endedAt: registration.endedAt,
      expectedArtifacts: nextExpectedArtifacts,
      firstViolationAt: existing?.firstViolationAt,
      gracePeriodMinutes: gracePeriodMinutes ?? existing?.gracePeriodMinutes ?? this.env.COMPLIANCE_DEFAULT_GRACE_PERIOD_MINUTES,
      history: existing?.history ?? [],
      lastEvaluatedAt: existing?.lastEvaluatedAt,
      organizerUpn: registration.organizerUpn ?? existing?.organizerUpn,
      organizerUserId: registration.organizerUserId ?? existing?.organizerUserId,
      parentResourceId: registration.parentResourceId,
      parentResourceType: registration.parentResourceType,
      reminderCount: existing?.reminderCount ?? 0,
      source: registration.source ?? existing?.source,
      startedAt: registration.startedAt ?? existing?.startedAt,
      status: nextStatus,
      tenantId: registration.tenantId,
      title: registration.title ?? existing?.title,
      updatedAt: now,
      violationOpen: nextStatus === "compliant" ? false : (existing?.violationOpen ?? false)
    };

    record.history = appendHistory(record.history, "meeting_registered");
    await this.store.put(record);

    if (!existing) {
      await this.events.publishMeetingRegistered(record);
    }

    if (existing?.violationOpen && record.status === "compliant") {
      await this.events.publishResolved(record);
    }

    if (record.status === "pending" && !record.violationOpen) {
      await this.scheduleCheck(record, "meeting_registered", computeFirstCheckDelayMs(record));
    }

    return record;
  }

  public async listMeetings(): Promise<ComplianceMeetingRecord[]> {
    return this.store.list();
  }

  public async summarize() {
    return this.store.summarize();
  }

  public async getMeeting(caseId: string): Promise<ComplianceMeetingRecord | null> {
    return this.store.get(caseId);
  }

  public async recordArtifactObserved(
    tenantId: string,
    artifact: FetchedArtifact,
    stored: StoredArtifact
  ): Promise<ComplianceMeetingRecord> {
    const caseId = ComplianceStore.createCaseId(
      tenantId,
      artifact.reference.parentResourceType,
      artifact.reference.parentResourceId
    );

    const now = new Date().toISOString();
    const observedArtifact: ComplianceObservedArtifact = {
      artifactId: artifact.reference.artifactId,
      contentBlobUrl: stored.contentBlobUrl,
      contentType: artifact.contentType,
      fetchedAt: artifact.fetchedAt,
      graphResource: artifact.sourceResourcePath,
      observedAt: now
    };

    const existing = await this.store.get(caseId);
    const expectedArtifacts =
      existing?.expectedArtifacts ?? {
        recordingRequired: this.env.COMPLIANCE_DEFAULT_EXPECT_RECORDING,
        transcriptRequired: this.env.COMPLIANCE_DEFAULT_EXPECT_TRANSCRIPT
      };

    const record: ComplianceMeetingRecord = {
      artifacts: {
        ...existing?.artifacts,
        [artifact.reference.artifactType]: observedArtifact
      },
      caseId,
      complianceAchievedAt: existing?.complianceAchievedAt,
      createdAt: existing?.createdAt ?? now,
      endedAt:
        (artifact.metadata.endDateTime as string | undefined) ??
        existing?.endedAt ??
        now,
      expectedArtifacts,
      firstViolationAt: existing?.firstViolationAt,
      gracePeriodMinutes: existing?.gracePeriodMinutes ?? this.env.COMPLIANCE_DEFAULT_GRACE_PERIOD_MINUTES,
      history: appendHistory(
        existing?.history ?? [],
        "artifact_observed",
        `${artifact.reference.artifactType}:${artifact.reference.artifactId}`
      ),
      lastEvaluatedAt: existing?.lastEvaluatedAt,
      organizerUpn: existing?.organizerUpn,
      organizerUserId: artifact.reference.ownerUserId ?? existing?.organizerUserId,
      parentResourceId: artifact.reference.parentResourceId,
      parentResourceType: artifact.reference.parentResourceType,
      reminderCount: existing?.reminderCount ?? 0,
      source: existing?.source ?? "artifact_observed",
      startedAt: (artifact.metadata.startDateTime as string | undefined) ?? existing?.startedAt,
      status: "pending",
      tenantId,
      title: (artifact.metadata.meetingSubject as string | undefined) ?? existing?.title,
      updatedAt: now,
      violationOpen: existing?.violationOpen ?? false
    };

    const missingArtifacts = computeMissingArtifacts(record);
    if (missingArtifacts.length === 0) {
      record.status = "compliant";
      record.violationOpen = false;
      record.complianceAchievedAt = existing?.complianceAchievedAt ?? now;
      if (existing?.status !== "compliant") {
        record.history = appendHistory(record.history, "meeting_resolved");
      }
    } else if (existing?.violationOpen) {
      record.status = "open_violation";
      record.violationOpen = true;
    } else {
      record.status = "pending";
    }

    await this.store.put(record);

    if (existing?.status !== "compliant" && missingArtifacts.length === 0) {
      await this.events.publishResolved(record);
    }

    return record;
  }

  public async evaluate(caseId: string): Promise<ComplianceMeetingRecord | null> {
    const record = await this.store.get(caseId);
    if (!record) {
      return null;
    }

    const missingArtifacts = computeMissingArtifacts(record);
    const now = new Date().toISOString();
    const nextRecord: ComplianceMeetingRecord = {
      ...record,
      lastEvaluatedAt: now,
      updatedAt: now
    };

    if (missingArtifacts.length === 0) {
      const resolved = {
        ...nextRecord,
        complianceAchievedAt: nextRecord.complianceAchievedAt ?? now,
        history: record.violationOpen ? appendHistory(nextRecord.history, "meeting_resolved") : nextRecord.history,
        status: "compliant" as const,
        violationOpen: false
      };

      await this.store.put(resolved);
      if (record.violationOpen) {
        await this.events.publishResolved(resolved);
      }

      return resolved;
    }

    if (!record.violationOpen) {
      const opened = {
        ...nextRecord,
        firstViolationAt: record.firstViolationAt ?? now,
        history: appendHistory(nextRecord.history, "violation_opened", missingArtifacts.join(",")),
        reminderCount: 0,
        status: "open_violation" as const,
        violationOpen: true
      };

      await this.store.put(opened);
      await this.events.publishViolationOpened(opened, missingArtifacts);
      await this.scheduleReminderIfNeeded(opened);
      return opened;
    }

    const reminded = {
      ...nextRecord,
      history: appendHistory(nextRecord.history, "reminder_sent", missingArtifacts.join(",")),
      reminderCount: record.reminderCount + 1,
      status: "open_violation" as const,
      violationOpen: true
    };

    await this.store.put(reminded);
    const nextReminderAt =
      reminded.reminderCount < this.env.COMPLIANCE_MAX_REMINDERS
        ? new Date(Date.now() + this.env.COMPLIANCE_REMINDER_INTERVAL_MINUTES * 60_000).toISOString()
        : undefined;

    await this.events.publishReminder(reminded, missingArtifacts, nextReminderAt);
    await this.scheduleReminderIfNeeded(reminded);
    return reminded;
  }

  private async scheduleCheck(record: ComplianceMeetingRecord, trigger: ComplianceCheckJob["trigger"], delayMs: number): Promise<void> {
    if (delayMs < 0) {
      delayMs = 0;
    }

    await this.queue.publish(
      {
        caseId: record.caseId,
        scheduledFor: new Date(Date.now() + delayMs).toISOString(),
        trigger
      },
      {
        delayMs,
        messageId: `${record.caseId}:${trigger}:${Date.now()}`
      }
    );
  }

  private async scheduleReminderIfNeeded(record: ComplianceMeetingRecord): Promise<void> {
    if (record.reminderCount >= this.env.COMPLIANCE_MAX_REMINDERS) {
      return;
    }

    await this.scheduleCheck(
      record,
      "reminder_due",
      this.env.COMPLIANCE_REMINDER_INTERVAL_MINUTES * 60_000
    );
  }
}

function computeFirstCheckDelayMs(record: ComplianceMeetingRecord): number {
  const dueAt = Date.parse(record.endedAt) + record.gracePeriodMinutes * 60_000;
  return Math.max(dueAt - Date.now(), 0);
}

function computeMissingArtifacts(record: ComplianceMeetingRecord): Array<"recording" | "transcript"> {
  const missing: Array<"recording" | "transcript"> = [];

  if (record.expectedArtifacts.recordingRequired && !record.artifacts.recording) {
    missing.push("recording");
  }

  if (record.expectedArtifacts.transcriptRequired && !record.artifacts.transcript) {
    missing.push("transcript");
  }

  return missing;
}

function evaluateStatus(
  artifacts: ComplianceMeetingRecord["artifacts"],
  expectedArtifacts: ExpectedArtifactPolicy
): ComplianceMeetingRecord["status"] {
  const missing =
    (expectedArtifacts.recordingRequired && !artifacts.recording) ||
    (expectedArtifacts.transcriptRequired && !artifacts.transcript);

  return missing ? "pending" : "compliant";
}

function appendHistory(
  history: ComplianceMeetingRecord["history"],
  type: ComplianceMeetingRecord["history"][number]["type"],
  detail?: string
): ComplianceMeetingRecord["history"] {
  return [
    ...history,
    {
      detail,
      recordedAt: new Date().toISOString(),
      type
    }
  ];
}

function validateRegistration(registration: ComplianceMeetingRegistration): void {
  if (!registration.parentResourceId || !registration.tenantId || !registration.endedAt) {
    throw new NonRetriableError("tenantId, parentResourceId, and endedAt are required for compliance registration.");
  }

  if (Number.isNaN(Date.parse(registration.endedAt))) {
    throw new NonRetriableError("endedAt must be an ISO-8601 timestamp.");
  }

  if (registration.startedAt && Number.isNaN(Date.parse(registration.startedAt))) {
    throw new NonRetriableError("startedAt must be an ISO-8601 timestamp when provided.");
  }
}
