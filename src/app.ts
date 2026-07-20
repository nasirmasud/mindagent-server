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
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));
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

app.get("/", (_req, res) => {
  res.json({ name: "MindAgent API", version: "1.0.0", status: "ok" });
});

app.use(errorHandler);

export default app;
