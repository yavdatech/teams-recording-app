import { loadGraphEncryptionCertificateBase64 } from "../auth/certificate-loader";
import { Env } from "../config/env";
import { BlobStateStore } from "../storage/state-store";
import { AppLogger } from "../shared/logger";
import { DesiredSubscription, buildDesiredSubscriptions } from "./subscription-catalog";
import { GraphApiClient, GraphApiError } from "./graph-client";

interface GraphSubscriptionResponse {
  expirationDateTime: string;
  id: string;
  resource: string;
}

export interface ManagedSubscriptionState {
  artifactType: "transcript" | "recording";
  createdAt: string;
  expirationDateTime: string;
  id: string;
  key: string;
  notificationUrl: string;
  resource: string;
  updatedAt: string;
}

export class GraphSubscriptionService {
  private encryptionCertificateBase64Promise?: Promise<string>;

  public constructor(
    private readonly env: Env,
    private readonly graphClient: GraphApiClient,
    private readonly stateStore: BlobStateStore,
    private readonly logger: AppLogger
  ) {}

  public async listManagedSubscriptions(): Promise<ManagedSubscriptionState[]> {
    return this.stateStore.list<ManagedSubscriptionState>("subscriptions/");
  }

  public async syncSubscriptions(): Promise<ManagedSubscriptionState[]> {
    const desiredSubscriptions = buildDesiredSubscriptions(this.env);
    const desiredKeys = new Set(desiredSubscriptions.map((subscription) => subscription.key));
    const current = new Map(
      (await this.listManagedSubscriptions()).map((subscription) => [subscription.key, subscription] as const)
    );

    const synced: ManagedSubscriptionState[] = [];

    for (const desired of desiredSubscriptions) {
      const existing = current.get(desired.key);

      if (existing && !isWithinRenewalWindow(existing.expirationDateTime, this.env.GRAPH_SUBSCRIPTION_RENEWAL_WINDOW_MINUTES)) {
        synced.push(existing);
        continue;
      }

      const nextState = existing
        ? await this.renewSubscription(existing, desired)
        : await this.createSubscription(desired);

      synced.push(nextState);
    }

    for (const [key, subscription] of current.entries()) {
      if (!desiredKeys.has(key)) {
        await this.deleteSubscription(subscription);
      }
    }

    return synced;
  }

  public async reauthorizeSubscription(subscriptionId: string): Promise<void> {
    await this.graphClient.postNoContent(`subscriptions/${subscriptionId}/reauthorize`, {}, {
      name: "reauthorize-subscription",
      retryableStatuses: new Set([429])
    });

    this.logger.info({ subscriptionId }, "Reauthorized Microsoft Graph subscription.");
  }

  private async deleteSubscription(subscription: ManagedSubscriptionState): Promise<void> {
    try {
      await this.graphClient.deleteNoContent(`subscriptions/${subscription.id}`, {
        name: `delete-subscription:${subscription.key}`,
        retryableStatuses: new Set([429])
      });
    } catch (error) {
      if (!(error instanceof GraphApiError) || error.status !== 404) {
        throw error;
      }
    }

    await this.stateStore.delete(`subscriptions/${subscription.key}.json`);
    this.logger.info({ subscriptionId: subscription.id }, "Deleted stale Microsoft Graph subscription.");
  }

  private async createSubscription(desired: DesiredSubscription): Promise<ManagedSubscriptionState> {
    const requestBody = await this.buildSubscriptionRequest(desired);
    const response = await this.graphClient.postJson<GraphSubscriptionResponse>("subscriptions", requestBody, {
      name: `create-subscription:${desired.key}`
    });

    const now = new Date().toISOString();
    const state: ManagedSubscriptionState = {
      artifactType: desired.artifactType,
      createdAt: now,
      expirationDateTime: response.expirationDateTime,
      id: response.id,
      key: desired.key,
      notificationUrl: this.env.GRAPH_NOTIFICATION_URL,
      resource: response.resource,
      updatedAt: now
    };

    await this.stateStore.put(`subscriptions/${desired.key}.json`, state);
    this.logger.info({ resource: desired.resource, subscriptionId: response.id }, "Created Microsoft Graph subscription.");
    return state;
  }

  private async renewSubscription(
    existing: ManagedSubscriptionState,
    desired: DesiredSubscription
  ): Promise<ManagedSubscriptionState> {
    const nextExpirationDateTime = buildExpirationDateTime(this.env.GRAPH_SUBSCRIPTION_TTL_MINUTES);

    try {
      await this.graphClient.patchJson<void>(
        `subscriptions/${existing.id}`,
        {
          expirationDateTime: nextExpirationDateTime
        },
        {
          name: `renew-subscription:${desired.key}`
        }
      );

      const updatedState: ManagedSubscriptionState = {
        ...existing,
        expirationDateTime: nextExpirationDateTime,
        updatedAt: new Date().toISOString()
      };

      await this.stateStore.put(`subscriptions/${desired.key}.json`, updatedState);
      this.logger.info({ subscriptionId: existing.id }, "Renewed Microsoft Graph subscription.");
      return updatedState;
    } catch (error) {
      if (!(error instanceof GraphApiError) || error.status !== 404) {
        throw error;
      }

      this.logger.warn({ subscriptionId: existing.id }, "Subscription missing in Microsoft Graph. Recreating.");
      return this.createSubscription(desired);
    }
  }

  private async buildSubscriptionRequest(desired: DesiredSubscription): Promise<Record<string, unknown>> {
    const body: Record<string, unknown> = {
      changeType: desired.changeType,
      clientState: this.env.GRAPH_NOTIFICATION_CLIENT_STATE,
      expirationDateTime: buildExpirationDateTime(this.env.GRAPH_SUBSCRIPTION_TTL_MINUTES),
      includeResourceData: this.env.GRAPH_INCLUDE_RESOURCE_DATA,
      lifecycleNotificationUrl: this.env.GRAPH_LIFECYCLE_NOTIFICATION_URL,
      notificationUrl: this.env.GRAPH_NOTIFICATION_URL,
      resource: desired.resource
    };

    if (this.env.GRAPH_INCLUDE_RESOURCE_DATA) {
      body.encryptionCertificate = await this.getEncryptionCertificateBase64();
      body.encryptionCertificateId = this.env.GRAPH_ENCRYPTION_CERTIFICATE_ID;
    }

    return body;
  }

  private async getEncryptionCertificateBase64(): Promise<string> {
    if (!this.encryptionCertificateBase64Promise) {
      this.encryptionCertificateBase64Promise = loadGraphEncryptionCertificateBase64(
        this.env.GRAPH_ENCRYPTION_CERTIFICATE_PATH!
      );
    }

    return this.encryptionCertificateBase64Promise;
  }
}

function buildExpirationDateTime(ttlMinutes: number): string {
  return new Date(Date.now() + ttlMinutes * 60_000).toISOString();
}

function isWithinRenewalWindow(expirationDateTime: string, renewalWindowMinutes: number): boolean {
  return Date.parse(expirationDateTime) - Date.now() <= renewalWindowMinutes * 60_000;
}
