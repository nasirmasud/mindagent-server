import mongoose, { Schema, Document } from "mongoose";

export type UserRole = "user" | "admin";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  authProvider: "email" | "google";
  googleId?: string;
  avatar?: string;
  role: UserRole;
  preferredProvider: "openrouter";
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, select: false },
  authProvider: { type: String, enum: ["email", "google"], required: true },
  googleId: { type: String },
  avatar: { type: String },
  role: { type: String, enum: ["user", "admin"], default: "user", index: true },
  preferredProvider: { type: String, enum: ["openrouter"], default: "openrouter" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IUser>("User", UserSchema);
