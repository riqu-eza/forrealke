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

export async function assignJob(requestId: string) {
  const req = await CustomerRequest.findById(requestId);
  if (!req) throw new Error("Request not found");

  // 1. Fetch ALL active techs
  const allTechs = await Technician.find({ active: true });

  if (!allTechs.length)
    throw new Error("No active technicians in the system");

  // 2. SOFT filter by skill
  const skilledTechs = allTechs.filter(t =>
    t.skills.map(s => s.toLowerCase())
           .includes(req.carDetails.make.toLowerCase())
  );

  const candidates = skilledTechs.length ? skilledTechs : allTechs;

  let best = null;
  let bestScore = Infinity;

  for (const tech of candidates) {
    let distance = 9999;

    // safe distance calculation
    if (
      tech.location?.coordinates?.length === 2 &&
      !isNaN(tech.location.coordinates[0]) &&
      !isNaN(tech.location.coordinates[1])
    ) {
      distance = haversine(
        tech.location.coordinates,
        req.yard.location.coordinates
      );
    }

    const nextAvailableSlot = await findEarliestSlot(
      tech,
      req.preferredWindow,
      req.estimatedDurationMins
    );

    const workload = tech.currentJobs && tech.maxDailyJobs
      ? tech.currentJobs / tech.maxDailyJobs
      : 0;

    const rating = tech.rating ? tech.rating / 5 : 0;

    const score =
      w1 * (distance / 15) +
      w2 * 0.5 +
      w3 * workload -
      w4 * rating;

    if (score < bestScore) {
      bestScore = score;
      best = { tech, nextAvailableSlot };
    }
  }

  // 3. Always have a best candidate
  if (!best) {
    // fallback: technician with highest rating
    const fallback = allTechs.sort((a, b) => b.rating - a.rating)[0];
    best = { tech: fallback, nextAvailableSlot: new Date() };
  }

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

    return req;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
}

