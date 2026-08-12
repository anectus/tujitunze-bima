import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={["Member"]}>{children}</ProtectedRoute>
  );
}
