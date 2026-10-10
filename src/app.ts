import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { router } from "./routes/index.js";
import { errorHandler, notFound } from "./middleware/error.js";

export const app = express();

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: "100kb" }));
app.use("/api", router);
app.use(notFound);
app.use(errorHandler);
