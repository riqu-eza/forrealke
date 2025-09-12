import mongoose, { Schema, Document } from "mongoose";

export interface IAssignedJob {
  requestId: mongoose.Types.ObjectId;
  date: Date;
  startTime: string; // "09:00"
  endTime: string;   // "12:00"
}

export interface ITechnician extends Document {
  userId: mongoose.Types.ObjectId;
  skills: string[];
  currentJobs: number;

  workHours: {
    start: string; // "08:00"
    end: string;   // "17:00"
    days: string[]; // ["Mon","Tue","Wed","Thu","Fri"]
  };

  assignedJobs: IAssignedJob[];
}

const AssignedJobSchema = new Schema<IAssignedJob>(
  {
    requestId: { type: Schema.Types.ObjectId, ref: "CustomerRequest" },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  },
  { _id: false }
);

const TechnicianSchema = new Schema<ITechnician>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  skills: [{ type: String, required: true }],
  currentJobs: { type: Number, default: 0 },

  workHours: {
    start: { type: String, default: "08:00" },
    end: { type: String, default: "17:00" },
    days: { type: [String], default: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
  },

  assignedJobs: { type: [AssignedJobSchema], default: [] },
});

export default mongoose.models.Technician ||
  mongoose.model<ITechnician>("Technician", TechnicianSchema);
