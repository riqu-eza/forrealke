import mongoose, { Schema, Document } from "mongoose";

export interface ITeam extends Document {
  name: string;
  members: mongoose.Types.ObjectId[]; // refs to User
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export default mongoose.models.Team || mongoose.model<ITeam>("Team", TeamSchema);
