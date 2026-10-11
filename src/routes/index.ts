import { Router } from "express";
import { institutionsRouter } from "./institutions.routes.js";
import { aiRouter } from "./ai.routes.js";
import { adminRouter } from "./admin.routes.js";
import * as me from "../controllers/me.controller.js";
import { requireAuth } from "../middleware/auth.js";

export const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});
router.get("/me", requireAuth, me.get);
router.use("/institutions", institutionsRouter);
router.use("/ai", aiRouter);
router.use("/admin", adminRouter);
