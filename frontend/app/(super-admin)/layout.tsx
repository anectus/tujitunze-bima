import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={["Super-admin"]}>
      {children}
    </ProtectedRoute>
  );
}
