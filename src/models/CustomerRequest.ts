// models/CustomerRequest.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ICustomerRequest extends Document {
  createdAt: string;
  customerId: mongoose.Types.ObjectId;
  yard: {
    name: string;
    address: string;
    location: {
      type: "Point";
      coordinates: [number, number]; // [lng, lat]
    };
  };
  timestamps?: Date;
  carDetails: {
    make: string;
    model: string;
    year: number;
    regNo: string;
    type: string; // sedan, suv, heavy etc.
  };
  preferredWindow: {
    start: Date;
    end: Date;
  };
  estimatedDurationMins: number; // default 45-90
  status:
    | "new"
    | "assigned_pending"
    | "scheduled"
    | "in_progress"
    | "report_submitted"
    | "pending_payment"
    | "paid"
    | "closed"
    | "cancelled";
  assignedTechId?: mongoose.Types.ObjectId;
  scheduledStart?: Date;
  scheduledEnd?: Date;
  travelBufferMins: number;
  priority: number;
}

const CustomerRequestSchema = new Schema<ICustomerRequest>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    yard: {
      name: { type: String, required: true },
      address: { type: String, required: true },
      location: {
        type: {
          type: String,
          enum: ["Point"],
          required: true,
        },
        coordinates: { type: [Number], required: true }, // [lng, lat]
      },
    },

    carDetails: {
      make: { type: String, required: true },
      model: { type: String, required: true },
      year: { type: Number, required: true },
      regNo: { type: String, required: true },
      type: { type: String, required: true }, // sedan/suv/heavy etc.
    },

    preferredWindow: {
      start: { type: Date, required: true },
      end: { type: Date, required: true },
    },

    estimatedDurationMins: { type: Number, default: 60 }, // can range 45–90

    status: {
      type: String,
      enum: [
        "new",
        "assigned_pending",
        "scheduled",
        "in_progress",
        "report_submitted",
        "pending_payment",
        "paid",
        "closed",
        "cancelled",
      ],
      default: "new",
    },

    assignedTechId: { type: Schema.Types.ObjectId, ref: "Technician" },

    scheduledStart: { type: Date },
    scheduledEnd: { type: Date },

    travelBufferMins: { type: Number, default: 30 }, // default 30 min buffer
    priority: { type: Number, default: 0 }, // higher → more urgent
  },
  { timestamps: true }
);

// ✅ Geo index for yard location
CustomerRequestSchema.index({ "yard.location": "2dsphere" });

export default mongoose.models.CustomerRequest ||
  mongoose.model<ICustomerRequest>("CustomerRequest", CustomerRequestSchema);
