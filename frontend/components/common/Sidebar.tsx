"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/lib/hooks/useAuth";

export interface SidebarNavItem {
  label: string;
  href: string;
}

interface SidebarProps {
  roleLabel: string;
  navItems: SidebarNavItem[];
}

export default function Sidebar({ roleLabel, navItems }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-gray-100 bg-white">

      <div className="px-6 py-6 border-b border-gray-100">
        <Link href="/" className="text-xl font-bold text-blue-700">
          Tujitunze
        </Link>
        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
          {roleLabel}
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">

        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
              block
              rounded-lg
              px-3 py-2
              text-sm
              font-medium
              transition
              ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-blue-700"
              }`}
            >
              {item.label}
            </Link>
          );
        })}

      </nav>

      <div className="px-3 py-4 border-t border-gray-100">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-blue-700"
        >
          Log Out
        </button>
      </div>

    </aside>
  );
}
