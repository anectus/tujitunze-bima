import Sidebar, { SidebarNavItem } from "@/components/common/Sidebar";

interface DashboardLayoutProps {
  roleLabel: string;
  navItems: SidebarNavItem[];
  children: React.ReactNode;
}

// Persistent chrome for every staff route group (Admin, Super-admin,
// Hospital, Bank, Telecom, Insurance) — mounted once in each group's
// layout.tsx so the sidebar's own links never leave the shell partway
// through navigation.
export default function DashboardLayout({
  roleLabel,
  navItems,
  children,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">

      <Sidebar roleLabel={roleLabel} navItems={navItems} />

      <div className="md:pl-64">{children}</div>

    </div>
  );
}
