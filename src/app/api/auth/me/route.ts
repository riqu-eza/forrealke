import { NextResponse, NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { User } from "@/models/user";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ user: null });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    await connectDB();
    const user = await User.findById(decoded.id).lean();

    return NextResponse.json({
      user: user ? { ...user, password: undefined } : null,
    });
  } catch (err) {
    return NextResponse.json({ user: null });
  }
}

