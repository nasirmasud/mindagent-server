import mongoose, { Schema, Document } from "mongoose";

export interface IDataAnalysis extends Document {
  userId: mongoose.Types.ObjectId;
  fileName: string;
  fileType: "csv" | "xlsx" | "json";
  originalRowCount: number;
  parsedPreview: Record<string, unknown>[];
  aiInsights: {
    summary: string;
    trends: string[];
    risks: string[];
    kpis: { label: string; value: string }[];
  };
  provider: string;
  reportUrl?: string;
  createdAt: Date;
}

const DataAnalysisSchema = new Schema<IDataAnalysis>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  fileName: { type: String, required: true },
  fileType: { type: String, enum: ["csv", "xlsx", "json"], required: true },
  originalRowCount: { type: Number, required: true },
  parsedPreview: { type: [Schema.Types.Mixed], default: [] },
  aiInsights: {
    summary: { type: String, default: "" },
    trends: { type: [String], default: [] },
    risks: { type: [String], default: [] },
    kpis: { type: [{ label: String, value: String }], default: [] },
  },
  provider: { type: String, default: "openrouter" },
  reportUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IDataAnalysis>("DataAnalysis", DataAnalysisSchema);
