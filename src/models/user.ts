import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string; // hashed
  role: "customer" | "manager" | "technician" | "accountant" | "admin";
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["customer", "manager", "technician", "accountant", "admin"],
      default: "customer",
    },
  },
  { timestamps: true }
);

// ✅ Prevent OverwriteModelError
export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
