import mongoose, { Schema, Document } from "mongoose";

export interface IAgent extends Document {
  name: string;
  category: string;
  description: string;
  icon: string;
  rating: number;
  usageCount: number;
}

const AgentSchema = new Schema<IAgent>({
  name: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String },
  rating: { type: Number, default: 0 },
  usageCount: { type: Number, default: 0 },
});

export default mongoose.model<IAgent>("Agent", AgentSchema);
