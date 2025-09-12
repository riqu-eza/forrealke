/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { closeJob } from "@/lib/automation";

export async function POST(req: Request) {
  await connectDB();
  try {
    const { requestId } = await req.json();
    const result = await closeJob(requestId);
    console.log("✅ Job closed:", result);
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error("❌ Error in closeJob:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
