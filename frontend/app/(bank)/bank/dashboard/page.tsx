"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatisticCard from "@/components/cards/StatisticCard";

interface BankDashboardData {
  bank: { name: string | null; status: string | null };
  linkedAccountCount: number;
  totalFunds: number;
  todayDeposits: number;
  todayWithdrawals: number;
  pendingSettlements: number;
  completedSettlements: number;
  reconciliationStatus: {
    runId: number;
    matchedCount: number;
    unmatchedCount: number;
    runDate: string;
  } | null;
}

function formatTsh(amount: number) {
  return `TSh ${Number(amount).toLocaleString("en-TZ")}`;
}

export default function BankDashboardPage() {
  const router = useRouter();

  const [data, setData] = useState<BankDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      const token = getAccessToken();

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch("http://localhost:3002/bank/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        const body = await response.json();

        if (!response.ok) {
          throw new Error(body.message || "Unable to load the dashboard.");
        }

        setData(body);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load the dashboard."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [router]);

  return (
    <div>

      <DashboardHeader title="Bank Dashboard" />

      <div className="p-4 sm:p-8">

        {error && (
          <div className="mb-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (

          <p className="text-gray-500">Loading dashboard...</p>

        ) : data ? (

          <>

            <h2 className="mb-6 text-lg font-semibold text-gray-900">
              {data.bank.name} <span className="text-sm font-normal text-gray-500">({data.bank.status})</span>
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

              <StatisticCard label="Total Funds" value={formatTsh(data.totalFunds)} />
              <StatisticCard label="Today's Deposits" value={formatTsh(data.todayDeposits)} />
              <StatisticCard label="Today's Withdrawals" value={formatTsh(data.todayWithdrawals)} />
              <StatisticCard label="Pending Settlements" value={data.pendingSettlements} />
              <StatisticCard label="Completed Settlements" value={data.completedSettlements} />
              <StatisticCard
                label="Reconciliation Status"
                value={
                  data.reconciliationStatus
                    ? `${data.reconciliationStatus.matchedCount} matched / ${data.reconciliationStatus.unmatchedCount} unmatched`
                    : "Not yet run"
                }
                hint={
                  data.reconciliationStatus
                    ? `Run #${data.reconciliationStatus.runId}`
                    : undefined
                }
              />

            </div>

            <div className="mt-8 flex flex-wrap gap-3 text-sm">
              <Link href="/bank/fund-accounts" className="font-semibold text-blue-700 hover:text-blue-800">
                Manage Fund Accounts →
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/bank/settlements" className="font-semibold text-blue-700 hover:text-blue-800">
                Settlements →
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/bank/reconciliation" className="font-semibold text-blue-700 hover:text-blue-800">
                Reconciliation →
              </Link>
            </div>

          </>

        ) : null}

      </div>

    </div>
  );
}
