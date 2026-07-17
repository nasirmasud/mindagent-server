import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  authProvider: "email" | "google";
  googleId?: string;
  avatar?: string;
  preferredProvider: "groq" | "gemini";
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  authProvider: { type: String, enum: ["email", "google"], required: true },
  googleId: { type: String },
  avatar: { type: String },
  preferredProvider: { type: String, enum: ["groq", "gemini"], default: "groq" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IUser>("User", UserSchema);
