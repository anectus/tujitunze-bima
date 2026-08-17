import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Members", href: "/members" },
  { label: "Hospitals", href: "/admin/hospitals" },
  { label: "Audit Logs", href: "/audit-logs" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <DashboardLayout roleLabel="Admin" navItems={NAV_ITEMS}>
        {children}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
