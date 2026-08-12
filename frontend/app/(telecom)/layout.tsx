import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function TelecomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={["Telecom"]}>{children}</ProtectedRoute>
  );
}
