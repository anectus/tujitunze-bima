import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/telecom/dashboard" },
  { label: "Operator Profile", href: "/telecom/operator" },
  { label: "Registered Members", href: "/telecom/members" },
  { label: "Contribution Transactions", href: "/telecom/contributions" },
  { label: "Contribution Rules", href: "/telecom/contribution-rules" },
  { label: "Reconciliation", href: "/telecom/reconciliation" },
  { label: "Reports", href: "/telecom/reports" },
  { label: "Audit & Security", href: "/telecom/audit-logs" },
];

export default function TelecomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={["Telecom"]}>
      <DashboardLayout roleLabel="Telecom" navItems={NAV_ITEMS}>
        {children}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
