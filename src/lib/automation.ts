/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// assignJob.ts
import CustomerRequest from "@/models/CustomerRequest";
import Technician from "@/models/Technician";
import mongoose from "mongoose";

// weights (can be tuned later)
const w1 = 0.3; // distance
const w2 = 0.3; // earliest start
const w3 = 0.2; // workload
const w4 = 0.2; // rating

// haversine for distance in km
function haversine(
  [lng1, lat1]: [number, number],
  [lng2, lat2]: [number, number]
) {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// 👇 simplified findEarliestSlot
async function findEarliestSlot(
  tech: any,
  preferredWindow: any,
  requiredMins: number
) {
  // TODO: fetch tech’s jobs for the day
  // TODO: check tech.shift & weeklyAvailability
  // For now: just return preferredWindow.start if exists
  if (preferredWindow?.start) return preferredWindow.start;
  return new Date(); // fallback: now
}

export async function assignJob(requestId: string, userId: string) {
  const req = await CustomerRequest.findById(requestId);
  if (!req) throw new Error("Request not found");

  // 1. Find candidate technicians
  const candidates = await Technician.find({
    active: true,
    skills: req.carDetails.make,
    location: {
      $near: {
        $geometry: req.yard.location,
      },
    },
  });

  if (!candidates.length) throw new Error("No technicians available nearby");

  // 2. Score each candidate
  let best: any = null;
  let bestScore = Infinity;

  for (const tech of candidates) {
    const distance = haversine(
      tech.location.coordinates,
      req.yard.location.coordinates
    );

    const nextAvailableSlot = await findEarliestSlot(
      tech,
      req.preferredWindow,
      req.estimatedDurationMins + req.travelBufferMins
    );

    const workloadScore = tech.maxDailyJobs
      ? (tech.currentJobs || 0) / tech.maxDailyJobs
      : 1;
    const distanceNorm = distance / 15; // normalized 0–1
    const earliestNorm = 0.5; // TODO: normalize relative to day
    const workloadNorm = workloadScore;
    const ratingNorm = tech.rating / 5;

    const score =
      w1 * distanceNorm +
      w2 * earliestNorm +
      w3 * workloadNorm -
      w4 * ratingNorm;

    if (score < bestScore) {
      bestScore = score;
      best = { tech, nextAvailableSlot };
    }
  }

  if (!best) throw new Error("No suitable technician found");

  // 3. Tentative schedule
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    req.assignedTechId = best.tech._id;
    req.scheduledStart = best.nextAvailableSlot;
    req.scheduledEnd = new Date(
      best.nextAvailableSlot.getTime() + req.estimatedDurationMins * 60000
    );
    req.status = "assigned_pending";
    await req.save({ session });

    await session.commitTransaction();
    session.endSession();

    // TODO: trigger notification to technician
    return req;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
}
