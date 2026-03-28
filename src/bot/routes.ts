import { Router } from "express";

import { TeamsCallCallbackService } from "./callback-service";
import { TeamsCallControlService } from "./call-control-service";

export function createBotRouter(
  callControlService: TeamsCallControlService,
  callbackService: TeamsCallCallbackService
): Router {
  const router = Router();

  router.get("/calls", async (req, res, next) => {
    try {
      const calls = await callControlService.listCalls();
      res.status(200).json({ value: calls });
    } catch (error) {
      next(error);
    }
  });

  router.get("/calls/:callId", async (req, res, next) => {
    try {
      const call = await callControlService.getCall(req.params.callId);
      if (!call) {
        res.status(404).json({ error: "call_not_found" });
        return;
      }

      res.status(200).json(call);
    } catch (error) {
      next(error);
    }
  });

  router.post("/join", async (req, res, next) => {
    try {
      const call = await callControlService.joinMeeting(req.body as { joinWebUrl: string; allowConversationWithoutHost?: boolean; requestedModalities?: string[] });
      res.status(202).json(call);
    } catch (error) {
      next(error);
    }
  });

  router.post("/calls/:callId/leave", async (req, res, next) => {
    try {
      const call = await callControlService.leaveCall(req.params.callId);
      res.status(202).json(call);
    } catch (error) {
      next(error);
    }
  });

  router.post("/callbacks", (req, res) => {
    callbackService.handle(req.body as { value?: Array<Record<string, unknown>> });
    res.sendStatus(202);
  });

  return router;
}
