import { Router } from "express";

import { asyncRoute } from "../shared/express-helpers";
import { MeetingComplianceService } from "./service";
import { ComplianceMeetingRegistration, ExpectedArtifactPolicy } from "./types";

export function createComplianceRouter(service: MeetingComplianceService): Router {
  const router = Router();

  router.get("/meetings", asyncRoute(async (_req, res) => {
    const meetings = await service.listMeetings();
    res.status(200).json({ value: meetings });
  }));

  router.get("/summary", asyncRoute(async (_req, res) => {
    const summary = await service.summarize();
    res.status(200).json(summary);
  }));

  router.get("/meetings/:caseId", asyncRoute(async (req, res) => {
    const meeting = await service.getMeeting(req.params.caseId);
    if (!meeting) {
      res.status(404).json({ error: "compliance_case_not_found" });
      return;
    }

    res.status(200).json(meeting);
  }));

  router.post("/meetings/register", asyncRoute(async (req, res) => {
    const body = req.body as ComplianceMeetingRegistration & {
      expectedArtifacts?: Partial<ExpectedArtifactPolicy>;
      gracePeriodMinutes?: number;
    };

    const meeting = await service.registerMeeting(body, body.expectedArtifacts, body.gracePeriodMinutes);
    res.status(202).json(meeting);
  }));

  return router;
}
