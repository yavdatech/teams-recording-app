import { Request, Response, Router } from "express";

import { GraphWebhookService } from "./webhook-service";
import { GraphNotificationCollection } from "./notification-types";

export function createWebhookRouter(webhookService: GraphWebhookService): Router {
  const router = Router();

  router.get("/graph", validationHandler);
  router.post("/graph", (req, res) => {
    if (respondToValidation(req, res)) {
      return;
    }

    webhookService.handleResourceNotifications((req.body ?? {}) as GraphNotificationCollection);
    res.sendStatus(202);
  });

  router.get("/graph/lifecycle", validationHandler);
  router.post("/graph/lifecycle", (req, res) => {
    if (respondToValidation(req, res)) {
      return;
    }

    webhookService.handleLifecycleNotifications((req.body ?? {}) as GraphNotificationCollection);
    res.sendStatus(202);
  });

  return router;
}

function validationHandler(req: Request, res: Response): void {
  if (respondToValidation(req, res)) {
    return;
  }

  res.sendStatus(405);
}

function respondToValidation(req: Request, res: Response): boolean {
  const validationToken = req.query.validationToken;
  const token = Array.isArray(validationToken) ? validationToken[0] : validationToken;

  if (typeof token !== "string") {
    return false;
  }

  res.status(200).contentType("text/plain").send(token);
  return true;
}
