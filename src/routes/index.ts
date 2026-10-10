import { Router } from "express";
import { institutionsRouter } from "./institutions.routes.js";
import { adminRouter } from "./admin.routes.js";
import { aiRouter } from "./ai.routes.js";

export const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});
router.use("/institutions", institutionsRouter);
router.use("/admin", adminRouter);
router.use("/ai", aiRouter);
