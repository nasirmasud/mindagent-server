import mongoose, { Schema, Document } from "mongoose";

export interface IImageAnalysis extends Document {
  userId: mongoose.Types.ObjectId;
  imageData: string;
  imageName: string;
  prompt: string;
  analysis: string;
  tags: { label: string; conf: number }[];
  dimensions: { width: number; height: number } | null;
  palette: string[] | null;
  createdAt: Date;
}

const ImageAnalysisSchema = new Schema<IImageAnalysis>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  imageData: { type: String, required: true },
  imageName: { type: String, default: "untitled" },
  prompt: { type: String, default: "" },
  analysis: { type: String, default: "" },
  tags: [{ label: String, conf: Number }],
  dimensions: { width: Number, height: Number },
  palette: [String],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IImageAnalysis>("ImageAnalysis", ImageAnalysisSchema);
