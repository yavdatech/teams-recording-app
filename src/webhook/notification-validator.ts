import { createRemoteJWKSet, JWTPayload, jwtVerify } from "jose";

import { Env } from "../config/env";
import { NonRetriableError } from "../shared/errors";
import { GraphNotificationCollection } from "./notification-types";

const GRAPH_CHANGE_TRACKING_APP_ID = "0bf30f3b-4a52-48df-9a82-234910c4a086";

export class NotificationValidator {
  private readonly jwks = createRemoteJWKSet(new URL("https://login.microsoftonline.com/common/discovery/v2.0/keys"));

  public constructor(private readonly env: Env) {}

  public async validateCollection(collection: GraphNotificationCollection): Promise<void> {
    const notifications = collection.value ?? [];

    for (const notification of notifications) {
      if (notification.clientState !== this.env.GRAPH_NOTIFICATION_CLIENT_STATE) {
        throw new NonRetriableError(`Unexpected Microsoft Graph clientState for subscription ${notification.subscriptionId}.`);
      }
    }

    if (notifications.some((notification) => Boolean(notification.encryptedContent))) {
      if (!collection.validationTokens?.length) {
        throw new NonRetriableError("Rich Microsoft Graph notifications must include validationTokens.");
      }

      const validatedTenants = new Set<string>();

      for (const token of collection.validationTokens) {
        const payload = await this.verifyValidationToken(token);
        if (typeof payload.tid === "string") {
          validatedTenants.add(payload.tid);
        }
      }

      for (const notification of notifications) {
        if (notification.tenantId && !validatedTenants.has(notification.tenantId)) {
          throw new NonRetriableError(`No validation token matched tenant ${notification.tenantId}.`);
        }
      }
    }
  }

  private async verifyValidationToken(token: string): Promise<JWTPayload> {
    const verification = await jwtVerify(token, this.jwks, {
      audience: this.env.AZURE_CLIENT_ID
    });

    const payloadRecord = verification.payload as JWTPayload & { appid?: string; azp?: string };
    const issuingApplication = payloadRecord.azp ?? payloadRecord.appid;

    if (issuingApplication !== GRAPH_CHANGE_TRACKING_APP_ID) {
      throw new NonRetriableError("Validation token was not issued by Microsoft Graph change tracking.");
    }

    return verification.payload;
  }
}
