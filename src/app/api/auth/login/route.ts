/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { User } from "@/models/user";

export async function POST(req: Request) {
  try {

    await connectDB();

    const body = await req.json();

    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(password, user.password!);

    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );
    console.log("🎫 [JWT] Token generated");

    return NextResponse.json({
      message: "Login successful",
      token,
      user,
    });
  } catch (error: any) {
    console.error("🔥 [LOGIN ERROR]", error.message || error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
