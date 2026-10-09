import mongoose, { Schema, Document } from "mongoose";

export interface ISubscriber extends Document {
  email: string;
  createdAt: Date;
}

const SubscriberSchema = new Schema<ISubscriber>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<ISubscriber>("Subscriber", SubscriberSchema);