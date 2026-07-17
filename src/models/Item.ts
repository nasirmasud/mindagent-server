import mongoose, { Schema, Document } from "mongoose";

export interface IItem extends Document {
  title: string;
  shortDesc: string;
  fullDesc: string;
  price: number;
  imageUrl?: string;
  ownerId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const ItemSchema = new Schema<IItem>({
  title: { type: String, required: true },
  shortDesc: { type: String, required: true },
  fullDesc: { type: String, required: true },
  price: { type: Number, required: true },
  imageUrl: { type: String },
  ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IItem>("Item", ItemSchema);
