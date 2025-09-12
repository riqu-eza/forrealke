"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const tabs = [
    { name: "Parts", href: "/dashboard/admin/parts" },
    { name: "Teams", href: "/dashboard/admin/teams" },
    { name: "Pricing", href: "/dashboard/admin/pricing" },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-48 bg-gray-100 p-4 border-r">
        <h2 className="text-lg font-bold mb-4">Admin</h2>
        <nav className="space-y-2">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`block p-2 rounded-lg ${
                pathname.startsWith(tab.href)
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-800 border"
              }`}
            >
              {tab.name}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
