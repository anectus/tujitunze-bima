import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/bank/dashboard" },
  { label: "Bank Profile", href: "/bank/profile" },
  { label: "Fund Accounts", href: "/bank/fund-accounts" },
  { label: "Transactions", href: "/bank/transactions" },
  { label: "Settlements", href: "/bank/settlements" },
  { label: "Reconciliation", href: "/bank/reconciliation" },
  { label: "Reports", href: "/bank/reports" },
  { label: "Audit & Security", href: "/bank/audit-logs" },
];

export default function BankLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={["Bank"]}>
      <DashboardLayout roleLabel="Bank" navItems={NAV_ITEMS}>
        {children}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
