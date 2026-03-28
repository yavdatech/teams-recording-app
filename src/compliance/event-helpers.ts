import {
  createMeetingComplianceRegisteredEvent,
  createMeetingComplianceReminderEvent,
  createMeetingComplianceResolvedEvent,
  createMeetingComplianceViolationOpenedEvent
} from "../events/event-factory";
import { DownstreamEventPublisher } from "../events/downstream-event-publisher";
import { ComplianceNotifier } from "./notifier";
import { ComplianceEvent, ComplianceMeetingRecord } from "./types";

export class ComplianceEventDispatcher {
  public constructor(
    private readonly eventPublisher: DownstreamEventPublisher,
    private readonly notifier: ComplianceNotifier
  ) {}

  public async publishMeetingRegistered(record: ComplianceMeetingRecord): Promise<void> {
    await this.publish(createMeetingComplianceRegisteredEvent(record));
  }

  public async publishViolationOpened(record: ComplianceMeetingRecord, missingArtifacts: Array<"recording" | "transcript">): Promise<void> {
    await this.publish(createMeetingComplianceViolationOpenedEvent(record, missingArtifacts));
  }

  public async publishReminder(record: ComplianceMeetingRecord, missingArtifacts: Array<"recording" | "transcript">, nextReminderAt?: string): Promise<void> {
    await this.publish(createMeetingComplianceReminderEvent(record, missingArtifacts, nextReminderAt));
  }

  public async publishResolved(record: ComplianceMeetingRecord): Promise<void> {
    await this.publish(createMeetingComplianceResolvedEvent(record));
  }

  private async publish(event: ComplianceEvent): Promise<void> {
    await this.eventPublisher.publish(event);
    await this.notifier.notify(event);
  }
}
