/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/context/UserContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useUser();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setError("");

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await res.json();

    if (res.ok) {
  // Save user + token in your auth context
  login(data.user, data.token);

  // Check role and redirect accordingly
  switch (data.user.role) {
    case "admin":
      router.push("/dashboard/admin");
      break;
    case "manager":
      router.push("/dashboard/manager");
      break;
    case "technician":
      router.push("/dashboard/tech");
      break;
    case "accountant":
      router.push("/dashboard/accountant");
      break;
    case "customer":
    default:
      router.push("/dashboard/customer");
      break;
  }
}
 else {
      setError(data.message || "Login failed");
    }
  } catch (err) {
    setError("Something went wrong");
  } finally {
    setIsLoading(false);
  }
};


  return (
    <div className="min-h-screen  flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-[#e8ded0]">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#3e4a2b] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-[#3e4a2b]">Welcome Back</h1>
            <p className="text-[#7a6a5a] mt-2">Sign in to your account</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#3e4a2b] mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="Enter your email"
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border text-black border-[#d6c9b8] focus:ring-2 focus:ring-[#3e4a2b] focus:border-[#3e4a2b] outline-none transition"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#3e4a2b] mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="Enter your password"
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border text-black border-[#d6c9b8] focus:ring-2 focus:ring-[#3e4a2b] focus:border-[#3e4a2b] outline-none transition"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-[#3e4a2b] focus:ring-[#3e4a2b] border-[#d6c9b8] rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-[#7a6a5a]">
                  Remember me
                </label>
              </div>

              <Link href="/forgot-password" className="text-[#3e4a2b] hover:text-[#2d3720] font-medium">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#3e4a2b] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#2d3720] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3e4a2b] transition disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-[#7a6a5a]">
              Don&#39;t have an account?{" "}
              <Link href="/signup" className="font-medium text-[#3e4a2b] hover:text-[#2d3720]">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        
      </div>
    </div>
  );
};