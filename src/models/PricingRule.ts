import mongoose, { Schema, Document } from "mongoose";

export interface IPricingRule extends Document {
  serviceType: string; // engine, brakes, etc.
  baseRate: number;    // starting price
  perHour?: number;    // cost per hour
  perPart?: number;    // multiplier per part
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PricingRuleSchema = new Schema<IPricingRule>(
  {
    serviceType: { type: String, required: true },
    baseRate: { type: Number, required: true },
    perHour: { type: Number },
    perPart: { type: Number },
    notes: String,
  },
  { timestamps: true }
);

export default mongoose.models.PricingRule ||
  mongoose.model<IPricingRule>("PricingRule", PricingRuleSchema);
