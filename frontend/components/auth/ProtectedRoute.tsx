"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/hooks/useAuth";
import { hasRole } from "@/lib/utils/permissions";

interface ProtectedRouteProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

export default function ProtectedRoute({
  allowedRoles,
  children,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { roles, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (!hasRole(roles, allowedRoles)) {
      router.replace("/access-denied");
    }
  }, [isLoading, isAuthenticated, roles, allowedRoles, router]);

  if (isLoading || !isAuthenticated || !hasRole(roles, allowedRoles)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-gray-500">Checking access...</p>
      </div>
    );
  }

  return <>{children}</>;
}
