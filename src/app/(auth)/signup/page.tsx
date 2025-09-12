/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
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
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push("/login");
      } else {
        const data = await res.json();
        setError(data.message || "Signup failed");
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-[#3e4a2b]">Create Account</h1>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[#3e4a2b] mb-2">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                placeholder="Enter your full name"
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-[#d6c9b8] focus:ring-2 focus:ring-[#3e4a2b] focus:border-[#3e4a2b] outline-none transition"
              />
            </div>

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
                className="w-full px-4 py-3 rounded-lg border border-[#d6c9b8] focus:ring-2 focus:ring-[#3e4a2b] focus:border-[#3e4a2b] outline-none transition"
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
                autoComplete="new-password"
                required
                placeholder="Create a password"
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-[#d6c9b8] focus:ring-2 focus:ring-[#3e4a2b] focus:border-[#3e4a2b] outline-none transition"
              />
              <p className="text-xs text-[#7a6a5a] mt-2">Use at least 8 characters with a mix of letters and numbers</p>
            </div>

            <div className="flex items-center text-sm">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                className="h-4 w-4 text-[#3e4a2b] focus:ring-[#3e4a2b] border-[#d6c9b8] rounded"
                required
              />
              <label htmlFor="terms" className="ml-2 block text-[#7a6a5a]">
                I agree to the <Link href="/terms" className="text-[#3e4a2b] hover:text-[#2d3720] font-medium">Terms and Conditions</Link>
              </label>
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
                  Creating account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-[#7a6a5a]">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-[#3e4a2b] hover:text-[#2d3720]">
                Log in
              </Link>
            </p>
          </div>
        </div>

        
      </div>
    </div>
  );
}