import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export const runtime = "nodejs";   
export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;

  // Accessing dashboard
  if (req.nextUrl.pathname.startsWith("/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    try {
      jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
