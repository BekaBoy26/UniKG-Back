import { Router } from "express";
import * as institutions from "../controllers/institutions.controller.js";
import * as comments from "../controllers/comments.controller.js";
import { requireAuth } from "../middleware/auth.js";

export const institutionsRouter = Router();

institutionsRouter.get("/", institutions.list);
institutionsRouter.get("/:slug", institutions.getBySlug);
institutionsRouter.get("/:slug/comments", comments.list);
institutionsRouter.post("/:slug/comments", requireAuth, comments.create);
