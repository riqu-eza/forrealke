/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import CustomerRequest from "@/models/CustomerRequest";
import mongoose from "mongoose";

export async function GET(req: Request) {
  await connectDB();
  try {
    const url = new URL(req.url);
    const technicianId = url.searchParams.get("technicianId");
    const customerId = url.searchParams.get("customerId");

    let query: any = {};

    if (technicianId) {
      query["assignedTechId"] = new mongoose.Types.ObjectId(technicianId);
    }

    if (customerId) {
      query["customerId"] = customerId;
    }

    // If no query params, fetch all
    if (!technicianId && !customerId) {
    }

    const requests = await CustomerRequest.find(query).sort({ createdAt: -1 });
    return NextResponse.json(requests, { status: 200 });
  } catch (error: any) {
    console.error("❌ Error in GET /api/requests:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/requests
export async function POST(req: Request) {
  await connectDB();
  try {
    const body = await req.json();

    // Make sure customerId is provided (from authenticated user)
    if (!body.customerId) {
      throw new Error("customerId is required to create a request");
    }

    const newRequest = await CustomerRequest.create(body);
    console.log(`✅ New request created for customer: ${body.customerId}`);
    return NextResponse.json(newRequest, { status: 201 });
  } catch (error: any) {
    console.error("❌ Error in POST /api/requests:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
