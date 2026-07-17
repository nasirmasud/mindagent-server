import dotenv from "dotenv";
dotenv.config();

export const env = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI || "",
  JWT_SECRET: process.env.JWT_SECRET || "",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  GROQ_API_KEY: process.env.GROQ_API_KEY || "",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
};
