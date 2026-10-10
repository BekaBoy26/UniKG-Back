import { Router } from "express";
import * as ai from "../controllers/ai.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rate-limit.js";

export const aiRouter = Router();

aiRouter.use(requireAuth);
aiRouter.post("/chat", rateLimit({ windowMs: 60_000, max: 15 }), ai.chat);
aiRouter.get("/chats", ai.listChats);
aiRouter.get("/chats/:id", ai.getChat);
aiRouter.delete("/chats/:id", ai.deleteChat);
