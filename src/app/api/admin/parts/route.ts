import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Part from "@/models/Part";

// GET all parts
export async function GET() {
  await connectDB();
  const parts = await Part.find();
  return NextResponse.json(parts);
}

// POST create part
export async function POST(req: Request) {
  await connectDB();
  const body = await req.json();
  const part = await Part.create(body);
  return NextResponse.json(part, { status: 201 });
}
