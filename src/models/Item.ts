import mongoose, { Schema, Document } from "mongoose";

export interface IItem extends Document {
  ownerId: mongoose.Types.ObjectId;
  title: string;
  shortDescription: string;
  fullDescription: string;
  sourceFileName: string;
  sourceFileType: "csv" | "xlsx" | "json" | "manual";
  rowCount: number;
  columns: string[];
  parsedPreview: Record<string, unknown>[];
  insights: {
    summary: string;
    trends: string[];
    kpis: { label: string; value: string }[];
    risks: string[];
  };
  chartData: { label: string; value: number }[];
  status: "processing" | "completed" | "failed";
  priority: "low" | "medium" | "high";
  imageUrl: string;
  createdAt: Date;
}

const ItemSchema = new Schema<IItem>({
  ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  shortDescription: { type: String, default: "" },
  fullDescription: { type: String, default: "" },
  sourceFileName: { type: String, default: "" },
  sourceFileType: { type: String, enum: ["csv", "xlsx", "json", "manual"], default: "manual" },
  rowCount: { type: Number, default: 0 },
  columns: [{ type: String }],
  parsedPreview: [{ type: Schema.Types.Mixed }],
  insights: {
    summary: { type: String, default: "" },
    trends: { type: [String], default: [] },
    kpis: { type: [{ label: String, value: String }], default: [] },
    risks: { type: [String], default: [] },
  },
  chartData: { type: [{ label: String, value: Number }], default: [] },
  status: { type: String, enum: ["processing", "completed", "failed"], default: "completed" },
  priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  imageUrl: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IItem>("Item", ItemSchema);
