/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { scheduleJob } from "@/lib/automation";

export async function POST(req: Request) {
  await connectDB();
  try {
    const { requestId,  userId } = await req.json();
    const result = await scheduleJob(requestId, userId);
    console.log("✅ Scheduled job:", result);
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error("❌ Error in schedule:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
