import mongoose from "mongoose";
import { config } from "dotenv";
import User, { UserRole } from "../models/User.js";

config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/mindagent";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function findByEmail(email: string) {
  const direct = await User.findOne({ email });
  if (direct) return direct;

  const escaped = email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = await User.find({ email: new RegExp(`^${escaped}$`, "i") });
  if (matches.length > 1) {
    throw new Error(
      `"${email}" matches ${matches.length} accounts that differ only by casing. Resolve this in the database first.`
    );
  }
  return matches[0] ?? null;
}

async function main() {
  const args = process.argv.slice(2);
  const revoke = args.includes("--revoke");
  const email = args.find((a) => !a.startsWith("--"))?.trim();

  if (!email) {
    console.error("Usage: npm run promote:admin -- <email>");
    console.error("       npm run promote:admin -- <email> --revoke");
    process.exit(1);
  }

  if (!EMAIL_RE.test(email)) {
    console.error(`Not a valid email address: ${email}`);
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log(`Connected to MongoDB (${mongoose.connection.name})`);

  try {
    const user = await findByEmail(email);
    if (!user) {
      console.error(`No user found with email: ${email}`);
      console.error("Sign in or register with that address first, then re-run this script.");
      process.exit(1);
    }

    const target: UserRole = revoke ? "user" : "admin";
    if (user.role === target) {
      console.log(`${email} already has role "${target}". Nothing to do.`);
      return;
    }

    user.role = target;
    await user.save();
    console.log(`Set ${email} (${user.name}) to role "${target}".`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(async (err: Error) => {
  console.error(`Failed: ${err.message}`);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
