/* Shared functions for automation */
import CustomerRequest from "@/models/CustomerRequest";
import Part from "@/models/Part";
import Technician, { ITechnician } from "@/models/Technician";
import { Types } from "mongoose";

export async function triageRequest(requestId: string, userId: string) {
  const request = await CustomerRequest.findById(requestId);

  if (!request) throw new Error("Request not found");

  const { description, serviceType } = request;
  const desc = (description || "").toLowerCase();

  const servicePriority: Record<string, number> = {
    engine: 9,
    transmission: 9,
    brakes: 8,
    suspension: 6,
    electrical: 6,
    diagnostics: 5,
    oil_change: 3,
    tyres: 5,
    ac: 4,
    bodywork: 4,
  };

  const keywordModifiers: Record<string, number> = {
    "smoke": +2,
    "fire": +3,
    "leak": +2,
    "won’t start": +3,
    "brake": +2,
    "stall": +1,
    "noise": +1,
    "overheat": +2,
    "slow": -1,
    "maintenance": -2,
  };

  // Step 1: Start with service base priority
  let priority = serviceType && servicePriority[serviceType] 
    ? servicePriority[serviceType] 
    : 5; // default mid-priority

  // Step 2: Apply keyword modifiers
  for (const [word, modifier] of Object.entries(keywordModifiers)) {
    if (desc.includes(word)) {
      priority += modifier;
    }
  }

  // Ensure priority stays between 1 and 10
  priority = Math.max(1, Math.min(priority, 10));

  // Save to history
  request.history.push({
    action: `Triaged as priority ${priority}/10`,
    by: userId || "system", // automated
    timestamp: new Date(),
  });

  request.priority = priority;
  await request.save();

  return { requestId, priority, serviceType, description };
}


export async function assignTechnician(requestId: string, userId: string) {
  const request = await CustomerRequest.findById(requestId);
  if (!request) throw new Error("Request not found");

  // 1. Try to find a technician with matching skill (least jobs first)
  let tech = await Technician.findOne({ skills: request.serviceType }).sort({
    currentJobs: 1,
  });

  // 2. Fallback: if no skilled technician, assign the one with least jobs overall
  if (!tech) {
    tech = await Technician.findOne().sort({ currentJobs: 1 });
  }

  if (!tech) throw new Error("No technician available");

  // --- update request ---
  request.history.push({
    action: `Assigned to technician ${tech._id}`,
    by: userId || "system",
    timestamp: new Date(),
  });

  request.assignedTo = tech._id;
  request.status = "assigned";

  // --- update technician ---
  tech.currentJobs += 1;
  await Promise.all([request.save(), tech.save()]);

  return { requestId, technicianId: tech._id };
}



function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  d.setMinutes(d.getMinutes() + minutes);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export async function scheduleJob(requestId: string, userId: string) {
  const request = await CustomerRequest.findById(requestId);
  if (!request) throw new Error("Request not found");

  if (!request.assignedTo) throw new Error("No technician assigned to this request");

  const technician: ITechnician | null = await Technician.findById(request.assignedTo);
  if (!technician) throw new Error("Technician not found");

  const jobLength = 180; // 3 hours
  const breakLength = 30;

  let startTime = technician.workHours.start;
  let date = new Date();
  let endTime = addMinutesToTime(startTime, jobLength);

  if (technician.assignedJobs.length > 0) {
    const lastJob = technician.assignedJobs[technician.assignedJobs.length - 1];
    date = lastJob.date;

    // next job starts after last end + break
    startTime = addMinutesToTime(lastJob.endTime, breakLength);
    endTime = addMinutesToTime(startTime, jobLength);
  }

  const scheduledAt = new Date(date);
  const [sh, sm] = startTime.split(":").map(Number);
  scheduledAt.setHours(sh, sm, 0, 0);

  const scheduledEnd = new Date(date);
  const [eh, em] = endTime.split(":").map(Number);
  scheduledEnd.setHours(eh, em, 0, 0);

  request.history.push({
    action: `Scheduled for ${scheduledAt.toISOString()}`,
    by: userId || "system",
    timestamp: new Date(),
  });
  request.status = "in_progress";
  request.scheduledAt = scheduledAt;

  technician.assignedJobs.push({
    requestId: new Types.ObjectId(requestId),
    date: scheduledAt,
    startTime,
    endTime,
  });
  technician.currentJobs += 1;

  await Promise.all([request.save(), technician.save()]);


  return {
    requestId,
    technicianId: technician._id,
    scheduledAt,
    scheduledEnd,
    startTime,
    endTime,
  };
}



const LABOR_RATE = 1000; // KES per hour (adjust to your needs)
export async function generateQuote(requestId: string) {
  const request = await CustomerRequest.findById(requestId).populate("partsUsed.partId");
  if (!request) throw new Error("Request not found");

  let total = 0;
  const breakdown: { item: string; qty: number; unitPrice: number; subtotal: number }[] = [];

  // 🔹 Parts
  for (const used of request.partsUsed) {
    const part = await Part.findById(used.partId);
    if (!part) continue;

    const subtotal = part.price * used.quantity;
    total += subtotal;

    breakdown.push({
      item: part.name,
      qty: used.quantity,
      unitPrice: part.price,
      subtotal,
    });
  }

  // 🔹 Labor
  const laborCost = request.laborHours * LABOR_RATE;
  if (laborCost > 0) {
    total += laborCost;
    breakdown.push({
      item: "Labor",
      qty: request.laborHours,
      unitPrice: LABOR_RATE,
      subtotal: laborCost,
    });
  }

  // ✅ Update request
  request.quote = {
    amount: total,
    currency: "KES",
    details: JSON.stringify(breakdown), // or array, if you prefer
    approved: false,
  };
  request.status = "quoted";

  request.history.push({
    action: "Quote generated",
    by: "system",
    timestamp: new Date(),
  });

  await request.save();
  return request;
}

export async function approveQuote(requestId: string, approved: boolean, userId?: string) {
  const request = await CustomerRequest.findById(requestId);
  if (!request) throw new Error("Request not found");
  if (!request.quote) throw new Error("No quote to approve");

  request.quote.approved = approved;
  request.quote.approvedAt = new Date();
  request.status = approved ? "approved" : "quoted";

  request.history.push({
    action: approved ? "Quote approved" : "Quote rejected",
    by: userId || "system",
    timestamp: new Date(),
  });

  await request.save();
  return { requestId, approved };
}


export async function closeJob(requestId: string) {
  const request = await CustomerRequest.findById(requestId);
  if (!request) throw new Error("Request not found");

  request.status = "completed";
  request.history.push({
    action: "Job closed",
    by: null,
    timestamp: new Date(),
  });

  await request.save();
  return { requestId, status: "completed" };
}
