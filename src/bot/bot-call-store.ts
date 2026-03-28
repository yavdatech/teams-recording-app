import { BlobStateStore } from "../storage/state-store";
import { ManagedBotCallState } from "./types";

export class BotCallStore {
  public constructor(private readonly stateStore: BlobStateStore) {}

  public async list(): Promise<ManagedBotCallState[]> {
    const calls = await this.stateStore.list<ManagedBotCallState>("bot/calls/");
    return calls.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  public async get(callId: string): Promise<ManagedBotCallState | null> {
    return (await this.stateStore.get<ManagedBotCallState>(this.key(callId)))?.value ?? null;
  }

  public async put(call: ManagedBotCallState): Promise<void> {
    await this.stateStore.put(this.key(call.callId), call);
  }

  private key(callId: string): string {
    return `bot/calls/${callId}.json`;
  }
}
