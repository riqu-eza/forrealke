"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { useUser } from "@/context/UserContext";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();

  // Redirect unauthenticated users out of dashboard
  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  if (!user) return null; // prevent flicker

  const allLinks = [
    { href: "/dashboard/manager", label: "Manager", roles: ["manager", "admin"] },
    { href: "/dashboard/tech", label: "Technician", roles: ["technician", "admin"] },
    { href: "/dashboard/customer", label: "Customer", roles: ["customer", "admin"] },
    { href: "/dashboard/accountant", label: "Accountant", roles: ["accountant", "admin"] },
    { href: "/dashboard/admin", label: "Admin", roles: ["admin"] },
  ];

  // Filter links based on user role
  const links = allLinks.filter((link) => link.roles.includes(user.role));

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-60 bg-gray-900 text-white p-4">
        <h2 className="text-xl font-bold mb-6">Dashboard</h2>
        <nav className="space-y-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block rounded px-3 py-2 transition ${
                pathname === link.href
                  ? "bg-gray-700 font-semibold"
                  : "hover:bg-gray-800"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-gray-50 p-6">{children}</main>
    </div>
  );
}
