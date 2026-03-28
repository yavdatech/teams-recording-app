import { createHash } from "node:crypto";

import { BlobStateStore } from "../storage/state-store";
import { ComplianceMeetingRecord, ComplianceSummary } from "./types";

export class ComplianceStore {
  public constructor(private readonly stateStore: BlobStateStore) {}

  public async get(caseId: string): Promise<ComplianceMeetingRecord | null> {
    return (await this.stateStore.get<ComplianceMeetingRecord>(this.key(caseId)))?.value ?? null;
  }

  public async put(record: ComplianceMeetingRecord): Promise<void> {
    await this.stateStore.put(this.key(record.caseId), record);
  }

  public async list(): Promise<ComplianceMeetingRecord[]> {
    const records = await this.stateStore.list<ComplianceMeetingRecord>("compliance/cases/");
    return records.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  public async summarize(): Promise<ComplianceSummary> {
    const records = await this.list();
    return {
      compliant: records.filter((record) => record.status === "compliant").length,
      openViolations: records.filter((record) => record.status === "open_violation").length,
      pending: records.filter((record) => record.status === "pending").length,
      total: records.length
    };
  }

  public static createCaseId(tenantId: string, parentResourceType: string, parentResourceId: string): string {
    return createHash("sha256")
      .update(`${tenantId}:${parentResourceType}:${parentResourceId}`)
      .digest("hex");
  }

  private key(caseId: string): string {
    return `compliance/cases/${caseId}.json`;
  }
}
