/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import CustomerRequest from "@/models/CustomerRequest";
import { generateQuote } from "@/lib/automation";

// GET single request
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  await connectDB();
  try {
    const request = await CustomerRequest.findById(params.id);
    if (!request) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(request, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// UPDATE (PUT → full replace)
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  await connectDB();
  try {
    const body = await req.json();
    const updatedRequest = await CustomerRequest.findByIdAndUpdate(
      params.id,
      body,
      {
        new: true,
      }
    );
    if (!updatedRequest) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(updatedRequest, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ✅ PARTIAL UPDATE (PATCH → merge fields)
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> } // params is a Promise in App Router
) {
  console.log("➡️ PATCH /api/requests called");
  await connectDB();
  console.log("✅ DB connected");

  try {
    // IMPORTANT: await params (Next.js App Router requirement)
    const { id } = await context.params;
    console.log("🆔 Request ID from params:", id);

    const body = await req.json();
    console.log("📦 Request body:", JSON.stringify(body));

    // Update the request
    const updatedRequest = await CustomerRequest.findByIdAndUpdate(
      id,
      { $set: body }, // only update provided fields
      { new: true }
    );

    console.log("🔄 UpdatedRequest result:", !!updatedRequest);

    if (!updatedRequest) {
      console.warn("⚠️ No request found with ID:", id);
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // If the incoming update set status to "quoted" -> generate quote
    if (body.status === "quoted") {
      console.log("💡 Status is quoted, attempting to generate quote...");

      try {
        // Pass the request _id (ensure you use the actual field)
        const quoteResult = await generateQuote(updatedRequest._id.toString());
        console.log("✅ generateQuote returned:", quoteResult);
        // reload the request to include saved quote (if generateQuote mutates DB)
        await updatedRequest.reload?.(); // mongoose docs: doc.reload exists on queries; if not, refetch
      } catch (err) {
        // log error but do not fail the entire PATCH
        console.error("❌ Error generating quote:", err);
      }
    }

    console.log("✅ PATCH finished, returning updated request");
    // Return the fresh document (refetch to ensure latest quote if generateQuote updated it)
    const fresh = await CustomerRequest.findById(id);
    return NextResponse.json(fresh, { status: 200 });
  } catch (error: any) {
    console.error("🔥 PATCH error caught:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}




// DELETE
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  await connectDB();
  try {
    const deletedRequest = await CustomerRequest.findByIdAndDelete(params.id);
    if (!deletedRequest) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(
      { message: "Deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
