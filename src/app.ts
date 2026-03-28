import express from "express";
import pinoHttp from "pino-http";

import { TeamsCallCallbackService } from "./bot/callback-service";
import { TeamsCallControlService } from "./bot/call-control-service";
import { createBotRouter } from "./bot/routes";
import { MeetingComplianceService } from "./compliance/service";
import { createComplianceRouter } from "./compliance/routes";
import { AppLogger } from "./shared/logger";
import { serializeError } from "./shared/serialize-error";
import { asyncRoute } from "./shared/express-helpers";
import { GraphSubscriptionService } from "./graph/subscription-service";
import { GraphWebhookService } from "./webhook/webhook-service";
import { createWebhookRouter } from "./webhook/routes";

export interface RuntimeState {
  lastSubscriptionSyncAt?: string;
  lastSubscriptionSyncError?: Record<string, unknown>;
  startedAt: string;
}

export function createApp(
  logger: AppLogger,
  runtimeState: RuntimeState,
  subscriptionService: GraphSubscriptionService,
  webhookService: GraphWebhookService,
  botServices?: {
    callbackService: TeamsCallCallbackService;
    controlService: TeamsCallControlService;
  },
  complianceService?: MeetingComplianceService
) {
  const app = express();

  app.use(express.json({ limit: "2mb" }));
  app.use(
    pinoHttp({
      logger
    })
  );

  app.get("/healthz", (_req, res) => {
    res.status(200).json({
      lastSubscriptionSyncAt: runtimeState.lastSubscriptionSyncAt,
      lastSubscriptionSyncError: runtimeState.lastSubscriptionSyncError,
      startedAt: runtimeState.startedAt,
      status: "ok"
    });
  });

  app.get("/api/subscriptions", asyncRoute(async (_req, res) => {
    const subscriptions = await subscriptionService.listManagedSubscriptions();
    res.status(200).json({ value: subscriptions });
  }));

  app.post("/api/subscriptions/sync", asyncRoute(async (_req, res) => {
    const subscriptions = await subscriptionService.syncSubscriptions();
    runtimeState.lastSubscriptionSyncAt = new Date().toISOString();
    runtimeState.lastSubscriptionSyncError = undefined;
    res.status(200).json({ value: subscriptions });
  }));

  app.post("/api/subscriptions/:subscriptionId/reauthorize", asyncRoute(async (req, res) => {
    await subscriptionService.reauthorizeSubscription(req.params.subscriptionId);
    res.sendStatus(202);
  }));

  if (botServices) {
    app.use("/api/bot", createBotRouter(botServices.controlService, botServices.callbackService));
    app.post("/webhooks/teams/calls", (req, res) => {
      botServices.callbackService.handle(req.body as { value?: Array<Record<string, unknown>> });
      res.sendStatus(202);
    });
  }

  if (complianceService) {
    app.use("/api/compliance", createComplianceRouter(complianceService));
  }

  app.use("/webhooks", createWebhookRouter(webhookService));

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error({ error: serializeError(error) }, "Unhandled HTTP error.");
    res.status(500).json({
      error: "internal_server_error"
    });
  });

  return app;
}
