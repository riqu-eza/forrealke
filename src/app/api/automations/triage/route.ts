/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { triageRequest } from "@/lib/automation";

export async function POST(req: Request) {
  await connectDB();
  try {
    const { requestId,userId } = await req.json();
    const result = await triageRequest(requestId,userId);
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
