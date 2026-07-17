import mongoose, { Schema, Document } from "mongoose";

export interface IGeneratedContent extends Document {
  userId: mongoose.Types.ObjectId;
  prompt: string;
  output: string;
  contentType: string;
  provider: string;
  createdAt: Date;
}

const GeneratedContentSchema = new Schema<IGeneratedContent>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  prompt: { type: String, required: true },
  output: { type: String, required: true },
  contentType: { type: String, required: true },
  provider: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IGeneratedContent>("GeneratedContent", GeneratedContentSchema);
