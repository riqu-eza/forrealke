import { approveQuote } from "@/lib/automation";
import { connectDB } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> } // 👈 params is a Promise
) {
  await connectDB();

  try {
    const body = await req.json();
    const { approved, userId } = body;

    // 👇 Await params
    const { id } = await context.params;

    const updatedRequest = await approveQuote(id, approved, userId);

    return NextResponse.json(updatedRequest, { status: 200 });
  } catch (err: unknown) {
    console.error("Error approving quote:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
