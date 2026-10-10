    import { Router } from "express";
import * as comments from "../controllers/comments.controller.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);
adminRouter.get("/comments", comments.moderationQueue);
adminRouter.patch("/comments/:id", comments.moderate);
