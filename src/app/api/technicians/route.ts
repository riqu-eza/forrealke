/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Technician from "@/models/Technician";

// GET technician profile for logged-in user
export async function GET(req: Request) {
  await connectDB();
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId"); // pass userId from client

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    let tech = await Technician.findOne({ userId });

    // If first time, create a default technician record
    if (!tech) {
      tech = await Technician.create({
        userId,
        location: { type: "Point", coordinates: [""] }, // ✅ default Nairobi coords
        skills: [],
        shift: [],
        weeklyAvailability: [
          { dayOfWeek: 1, start: "08:00", end: "17:00" }, // Monday default
          { dayOfWeek: 2, start: "08:00", end: "17:00" },
          { dayOfWeek: 3, start: "08:00", end: "17:00" },
          { dayOfWeek: 4, start: "08:00", end: "17:00" },
          { dayOfWeek: 5, start: "08:00", end: "17:00" },
        ],
        maxDailyJobs: 5,
        rating: 5,
        active: true,
      });
    }

    return NextResponse.json(tech, { status: 200 });
  } catch (err: any) {
    console.error("❌ Error fetching technician", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH: update technician profile
export async function PATCH(req: Request) {
  await connectDB();
  try {
    const body = await req.json(); // { userId, updates }
    const { userId, updates } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const tech = await Technician.findOneAndUpdate(
      { userId },
      { $set: updates },
      { new: true }
    );

    if (!tech) {
      return NextResponse.json({ error: "Technician not found" }, { status: 404 });
    }

    return NextResponse.json(tech, { status: 200 });
  } catch (err: any) {
    console.error("❌ Error updating technician", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


