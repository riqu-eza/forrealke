/* eslint-disable @typescript-eslint/no-explicit-any */
// models/CustomerRequest.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ICustomerRequest extends Document {
  customerId: mongoose.Types.ObjectId;
  serviceType: string;
  description: string;
  attachments?: string[];
  assignedTo?: mongoose.Types.ObjectId;
  status:
    | "pending"
    | "assigned"
    | "in_progress"
    | "quoted"
    | "approved"
    | "completed"
    | "cancelled";
  quote?: {
    amount: number;
    currency: string;
    details: string;
    approved: boolean;
    approvedAt?: Date;
  };
  payment?: {
    transactionId: string;
    amount: number;
    method: "mpesa" | "card" | "cash";
    paidAt: Date;
  };
  inspectionNotes:string;
  partsUsed:{
    partId: string | mongoose.Types.ObjectId;
    quantity: number;
  };
  laborHours: number;
  photos : number;
  completedAt: Date;
  history: {
    action: string;
    by: string | mongoose.Types.ObjectId; // ✅ system OR UserId
    timestamp: Date;
    notes?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const CustomerRequestSchema = new Schema<ICustomerRequest>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    serviceType: { type: String, required: true },
    description: { type: String, required: true },
    attachments: [{ type: String }],
    inspectionNotes: { type: String, default: "" },
    partsUsed: [
      {
        partId: { type: Schema.Types.ObjectId, ref: "Part" },
        quantity: Number,
      },
    ],
    laborHours: { type: Number, default: 0 },
    photos: [{ type: String }], // store image URLs or file paths
    completedAt: { type: Date },
    status: {
      type: String,
      enum: [
        "pending",
        "assigned",
        "in_progress",
        "quoted",
        "approved",
        "completed",
        "cancelled",
      ],
      default: "pending",
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    quote: {
      amount: Number,
      currency: { type: String, default: "KES" },
      details: String,
      approved: { type: Boolean, default: false },
      approvedAt: Date,
    },
    payment: {
      transactionId: String,
      amount: Number,
      method: { type: String, enum: ["mpesa", "card", "cash"] },
      paidAt: Date,
    },
    history: [
      {
        action: { type: String, required: true },
        by: {
          type: Schema.Types.Mixed,
          validate: {
            validator: function (v: any) {
              return v === "system" || mongoose.Types.ObjectId.isValid(v);
            },
            message: "by must be 'system' or a valid User ObjectId",
          },
          required: true,
        },
        timestamp: { type: Date, default: Date.now },
        notes: String,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.CustomerRequest ||
  mongoose.model<ICustomerRequest>("CustomerRequest", CustomerRequestSchema);
