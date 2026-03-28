import { Env } from "../config/env";
import { AppLogger } from "../shared/logger";
import { retry } from "../shared/retry";
import { serializeError } from "../shared/serialize-error";
import { ComplianceEvent } from "./types";

export class ComplianceNotifier {
  public constructor(
    private readonly env: Env,
    private readonly logger: AppLogger
  ) {}

  public async notify(event: ComplianceEvent): Promise<void> {
    if (!this.env.COMPLIANCE_NOTIFICATION_WEBHOOK_URL) {
      return;
    }

    await retry(
      async () => {
        const response = await fetch(this.env.COMPLIANCE_NOTIFICATION_WEBHOOK_URL!, {
          body: JSON.stringify(event),
          headers: {
            "content-type": "application/json"
          },
          method: "POST"
        });

        if (!response.ok) {
          throw new Error(`Compliance notification webhook returned HTTP ${response.status}.`);
        }
      },
      {
        initialDelayMs: 1_000,
        maxAttempts: 3,
        maxDelayMs: 10_000,
        name: "send-compliance-notification",
        onRetry: async (error, nextAttempt, delayMs) => {
          this.logger.warn(
            {
              delayMs,
              error: serializeError(error),
              nextAttempt
            },
            "Retrying compliance notification webhook."
          );
        },
        shouldRetry: () => true
      }
    );
  }
}
