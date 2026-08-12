import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function HospitalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={["Hospital"]}>{children}</ProtectedRoute>
  );
}
