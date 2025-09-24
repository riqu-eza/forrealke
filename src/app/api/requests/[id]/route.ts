/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import CustomerRequest from "@/models/CustomerRequest";

/**
 * NOTE:
 * - Use NextRequest for the first arg.
 * - context.params should be awaited: const { id } = await context.params;
 * - Keep signatures consistent across GET/PUT/PATCH/DELETE.
 */

// GET single request
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await connectDB();
  try {
    const { id } = await context.params;
    const request = await CustomerRequest.findById(id);
    if (!request) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(request, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT (full replace)
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await connectDB();
  try {
    const { id } = await context.params;
    const body = await req.json();

    const updatedRequest = await CustomerRequest.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updatedRequest) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(updatedRequest, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH (partial update)

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await connectDB();

  try {
    const { id } = await context.params;
    const body = await req.json();

    // Only update fields present in body (retain others)
    const updatedRequest = await CustomerRequest.findByIdAndUpdate(
      id,
      { $set: { ...body } },
      { new: true, runValidators: true }
    );

    if (!updatedRequest) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Fetch latest from DB to ensure it's fresh
    const fresh = await CustomerRequest.findById(id);
    return NextResponse.json(fresh, { status: 200 });
  } catch (error: any) {
    console.error("PATCH error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


// DELETE
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await connectDB();
  try {
    const { id } = await context.params;
    const deletedRequest = await CustomerRequest.findByIdAndDelete(id);
    if (!deletedRequest) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Deleted successfully" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
