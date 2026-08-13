
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { ACCESS_TOKEN_STORAGE_KEY } from "@/lib/utils/permissions";
import StatusBadge from "@/components/common/StatusBadge";

export default function DashboardPage() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-white py-12 px-4">

      <div className="max-w-2xl mx-auto text-center">

        <div className="flex items-center justify-center gap-2">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome to Tujitunze
          </h1>

          <StatusBadge domain="member" status="active" />
        </div>

        <p className="mt-2 text-gray-600">
          Your account is set up. The full dashboard is coming soon.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 text-left">

          <Link
            href="/wallet"
            className="rounded-2xl border border-gray-100 bg-white p-6
            shadow-md transition hover:shadow-xl hover:-translate-y-1"
          >
            <p className="text-lg font-bold text-gray-900">
              Wallet
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Check your balance and top up via mobile money.
            </p>
          </Link>

          <Link
            href="/wallet/transactions"
            className="rounded-2xl border border-gray-100 bg-white p-6
            shadow-md transition hover:shadow-xl hover:-translate-y-1"
          >
            <p className="text-lg font-bold text-gray-900">
              Wallet Transactions
            </p>
            <p className="mt-1 text-sm text-gray-600">
              View your deposits, withdrawals, and transfers.
            </p>
          </Link>

          <Link
            href="/insurance/claims"
            className="rounded-2xl border border-gray-100 bg-white p-6
            shadow-md transition hover:shadow-xl hover:-translate-y-1"
          >
            <p className="text-lg font-bold text-gray-900">
              Insurance Claims
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Track your submitted claims and coverage status.
            </p>
          </Link>

        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-8 rounded-lg bg-blue-700 px-6 py-3
          font-semibold text-white transition hover:bg-blue-800"
        >
          Log Out
        </button>

      </div>

    </div>
  );
}
