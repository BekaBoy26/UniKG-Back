import { Router } from "express";
import * as institutions from "../controllers/institutions.controller.js";
import * as comments from "../controllers/comments.controller.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";

export const institutionsRouter = Router();

institutionsRouter.get("/", institutions.list);
institutionsRouter.get("/:slug", institutions.getBySlug);
institutionsRouter.get("/:slug/comments", optionalAuth, comments.list);
// Частоту публикаций (5 в минуту) ограничивает триггер comments_rate_limit в БД — он ловит и запросы в обход API
institutionsRouter.post("/:slug/comments", requireAuth, comments.create);
institutionsRouter.delete("/:slug/comments/:id", requireAuth, comments.remove);
