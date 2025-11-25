/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/user";

export async function POST(req: Request) {
  try {

    await connectDB();

    const body = await req.json();
    console.log("📦 Request body:", body);

    const { name, email, password } = body;

    if (!name || !email || !password) {
      console.warn("⚠️ Missing fields:", { name, email, password });
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    console.log("🔍 Existing user check:", existingUser ? "FOUND" : "NOT FOUND");

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("🔑 Password hashed successfully");

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    console.log("🎉 New user created:", newUser);

    return NextResponse.json({ message: "User created", user: newUser }, { status: 201 });
  } catch (error: any) {
    console.error("❌ Signup error:", error.message, error.stack);
    return NextResponse.json({ error: "Something went wrong", details: error.message }, { status: 500 });
  }
}
