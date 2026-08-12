
"use client";

import { useRouter } from "next/navigation";

import { ACCESS_TOKEN_STORAGE_KEY } from "@/lib/utils/permissions";

export default function DashboardPage() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">

      <div className="max-w-2xl mx-auto text-center">

        <h1 className="text-3xl font-bold text-gray-900">
          Welcome to Tujitunze
        </h1>

        <p className="mt-2 text-gray-600">
          Your account is set up. The full dashboard is coming soon.
        </p>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-8 rounded-lg bg-green-700 px-6 py-3
          font-semibold text-white transition hover:bg-green-800"
        >
          Log Out
        </button>

      </div>

    </div>
  );
}
