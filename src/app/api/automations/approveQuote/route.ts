/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { approveQuote } from "@/lib/automation";

export async function POST(req: Request) {
  await connectDB();
  try {
    const { requestId, approved } = await req.json();
    const result = await approveQuote(requestId, approved);
    console.log("✅ Quote approval:", result);
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error("❌ Error in approveQuote:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
