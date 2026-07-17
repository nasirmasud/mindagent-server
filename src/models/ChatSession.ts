import mongoose, { Schema, Document } from "mongoose";

export interface IMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

export interface IChatSession extends Document {
  userId: mongoose.Types.ObjectId;
  agentType: string;
  messages: IMessage[];
}

const MessageSchema = new Schema<IMessage>({
  role: { type: String, enum: ["user", "assistant", "system"], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const ChatSessionSchema = new Schema<IChatSession>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  agentType: { type: String, required: true },
  messages: [MessageSchema],
});

export default mongoose.model<IChatSession>("ChatSession", ChatSessionSchema);
