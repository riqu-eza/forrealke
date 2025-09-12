import mongoose, { Schema, Document } from "mongoose";

export interface IPart extends Document {
  name: string;
  description?: string;
  price: number;
  stock: number;
  unit: string; // e.g. "pcs", "liters"
  createdAt: Date;
  updatedAt: Date;
}

const PartSchema = new Schema<IPart>(
  {
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    unit: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Part || mongoose.model<IPart>("Part", PartSchema);
