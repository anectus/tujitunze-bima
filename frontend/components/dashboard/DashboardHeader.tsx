"use client";

import { useAuth } from "@/lib/hooks/useAuth";

interface DashboardHeaderProps {
  title: string;
}

export default function DashboardHeader({ title }: DashboardHeaderProps) {
  const { firstName } = useAuth();

  return (
    <header className="border-b border-gray-100 bg-white px-4 py-4 sm:px-8">

      <div className="flex items-center justify-between">

        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
          {title}
        </h1>

        {firstName && (
          <p className="text-sm text-gray-500">
            Welcome, <span className="font-medium text-gray-700">{firstName}</span>
          </p>
        )}

      </div>

    </header>
  );
}
