import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function BankLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute allowedRoles={["Bank"]}>{children}</ProtectedRoute>;
}
