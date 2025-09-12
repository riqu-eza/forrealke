import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import PricingRule from "@/models/PricingRule";

// GET all pricing rules
export async function GET() {
  await connectDB();
  const rules = await PricingRule.find();
  return NextResponse.json(rules);
}

// POST create pricing rule
export async function POST(req: Request) {
  await connectDB();
  const body = await req.json();
  const rule = await PricingRule.create(body);
  return NextResponse.json(rule, { status: 201 });
}
