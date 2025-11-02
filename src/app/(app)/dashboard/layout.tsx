"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/settings", label: "Business Settings" },
  { href: "/dashboard/widget", label: "Widget" },
  { href: "/dashboard/billing", label: "Billing" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div className="min-h-screen grid grid-cols-12">
      <aside className="col-span-12 sm:col-span-3 lg:col-span-2 border-r bg-black">
        <div className="p-4 border-b">
          <div className="font-bold">Aliigo</div>
          <div className="text-xs text-gray-500">Dashboard</div>
        </div>
        <nav className="p-3 space-y-1">
          {nav.map((n) => {
            const active = path === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`block px-3 py-2 rounded text-sm ${
                  active ? "bg-black text-white" : "hover:bg-gray-100"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="col-span-12 sm:col-span-9 lg:col-span-10 p-6">
        {children}
      </main>
    </div>
  );
}
