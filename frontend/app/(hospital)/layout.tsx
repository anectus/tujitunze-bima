import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/hospital/dashboard" },
  { label: "Hospital Profile", href: "/hospital/profile" },
  { label: "Member Verification", href: "/hospital/verifications" },
  { label: "Eligible Members", href: "/hospital/eligible-members" },
  { label: "Treatment", href: "/hospital/treatments" },
  { label: "Claims", href: "/hospital/claims" },
  { label: "Payments", href: "/hospital/payments" },
  { label: "Reports", href: "/hospital/reports" },
  { label: "Audit & Security", href: "/hospital/audit-logs" },
];

export default function HospitalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={["Hospital"]}>
      <DashboardLayout roleLabel="Hospital" navItems={NAV_ITEMS}>
        {children}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
