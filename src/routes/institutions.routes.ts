import { Router } from "express";
import * as institutions from "../controllers/institutions.controller.js";
import * as comments from "../controllers/comments.controller.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rate-limit.js";

export const institutionsRouter = Router();

institutionsRouter.get("/", institutions.list);
institutionsRouter.get("/:slug", institutions.getBySlug);
// Без модерации — поэтому ограничиваем частоту публикаций
institutionsRouter.get("/:slug/comments", optionalAuth, comments.list);
institutionsRouter.post("/:slug/comments", requireAuth, rateLimit({ windowMs: 60_000, max: 5 }), comments.create);
institutionsRouter.delete("/:slug/comments/:id", requireAuth, comments.remove);
