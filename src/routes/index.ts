import { Router } from "express";
import { institutionsRouter } from "./institutions.routes.js";
import { aiRouter } from "./ai.routes.js";

export const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});
router.use("/institutions", institutionsRouter);
router.use("/ai", aiRouter);
