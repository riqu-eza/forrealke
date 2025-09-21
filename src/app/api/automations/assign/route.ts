/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { assignJob } from "@/lib/automation";

export async function POST(req: Request) {
  await connectDB();
  try {
    const { requestId ,userId} = await req.json();
    const result = await assignJob(requestId,userId);
    console.log("✅ Assigned technician:", result);
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error("❌ Error in assign:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
