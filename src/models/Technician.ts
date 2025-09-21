// models/Technician.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ITechnician extends Document {
  userId: mongoose.Types.ObjectId; // 🔗 Reference to User
  location: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  skills: string[]; // e.g., ["sedan", "suv", "heavy"]
  shift: {
    start: Date;
    end: Date;
  }[];
  weeklyAvailability: {
    dayOfWeek: number; // 0 (Sunday) - 6 (Saturday)
    start: string; // "08:00"
    end: string;   // "17:00"
  }[];
  maxDailyJobs: number;
  rating: number;
  active: boolean;
}

const TechnicianSchema = new Schema<ITechnician>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true }, // 🔗


    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
      },
    },

    skills: [{ type: String, required: true }],

    shift: [
      {
        start: { type: Date, required: true },
        end: { type: Date, required: true },
      },
    ],

    weeklyAvailability: [
      {
        dayOfWeek: { type: Number, min: 0, max: 6, required: true },
        start: { type: String, required: true }, // "08:00"
        end: { type: String, required: true },   // "17:00"
      },
    ],

    maxDailyJobs: { type: Number, default: 5 },
    rating: { type: Number, default: 5, min: 0, max: 5 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Enable geospatial queries
TechnicianSchema.index({ location: "2dsphere" });

export default mongoose.models.Technician ||
  mongoose.model<ITechnician>("Technician", TechnicianSchema);
