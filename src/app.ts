import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import agentRoutes from "./routes/agents.js";
import aiRoutes from "./routes/ai.js";
import itemRoutes from "./routes/items.js";
import recommendationRoutes from "./routes/recommendations.js";
import contactRoutes from "./routes/contact.js";
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/agents", agentRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/contact", contactRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(errorHandler);

export default app;
