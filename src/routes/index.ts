import { Router } from "express";
import { institutionsRouter } from "./institutions.routes.js";
import { aiRouter } from "./ai.routes.js";
import { adminRouter } from "./admin.routes.js";
import { favoritesRouter } from "./favorites.routes.js";
import * as me from "../controllers/me.controller.js";
import { requireAuth } from "../middleware/auth.js";

export const router = Router();

router.get("/health", (_req, res) => {
  // commit — версия на Render (переменную RENDER_GIT_COMMIT задаёт сам Render), по ней видно, что деплой обновился
  res.json({ status: "ok", commit: process.env.RENDER_GIT_COMMIT?.slice(0, 7) ?? null });
});
router.get("/me", requireAuth, me.get);
router.use("/institutions", institutionsRouter);
router.use("/ai", aiRouter);
router.use("/admin", adminRouter);
router.use("/favorites", favoritesRouter);
