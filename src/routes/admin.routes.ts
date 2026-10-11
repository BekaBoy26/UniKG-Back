import { Router } from "express";
import * as admin from "../controllers/admin.controller.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";

export const adminRouter = Router();

// Только для пользователей с profiles.role = 'admin' (запись дополнительно проверяет RLS)
adminRouter.use(requireAuth, requireAdmin);
adminRouter.get("/stats", admin.stats);
adminRouter.get("/institutions", admin.listInstitutions);
adminRouter.post("/institutions", admin.createInstitution);
adminRouter.get("/institutions/:id", admin.getInstitution);
adminRouter.put("/institutions/:id", admin.updateInstitution);
adminRouter.delete("/institutions/:id", admin.deleteInstitution);
adminRouter.get("/comments", admin.listComments);
adminRouter.delete("/comments/:id", admin.deleteComment);
