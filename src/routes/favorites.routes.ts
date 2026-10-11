import { Router } from "express";
import * as favorites from "../controllers/favorites.controller.js";
import { requireAuth } from "../middleware/auth.js";

// Избранное вошедшего пользователя (у гостей оно хранится в браузере)
export const favoritesRouter = Router();

favoritesRouter.use(requireAuth);
favoritesRouter.get("/", favorites.list);
favoritesRouter.post("/merge", favorites.merge);
favoritesRouter.put("/:slug", favorites.add);
favoritesRouter.delete("/:slug", favorites.remove);
