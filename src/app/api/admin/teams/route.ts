import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Team from "@/models/Team";

// GET all teams
export async function GET() {
  await connectDB();
  const teams = await Team.find().populate("members", "name email role");
  return NextResponse.json(teams);
}

// POST create team
export async function POST(req: Request) {
  await connectDB();
  const body = await req.json();
  const team = await Team.create(body);
  return NextResponse.json(team, { status: 201 });
}
