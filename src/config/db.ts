import mongoose from "mongoose";

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI is not defined");
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log("MongoDB connected");
}
