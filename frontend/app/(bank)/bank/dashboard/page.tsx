"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatisticCard from "@/components/cards/StatisticCard";

interface BankTransaction {
  transactionId: number;
  reference: string;
  type: string;
  amount: number;
  status: string;
  date: string;
  accountNumber: string;
}

interface BankDashboardData {
  bank: { name: string | null; status: string | null };
  linkedAccountCount: number;
  transactionCount: number;
  transactionTotal: number;
  recentTransactions: BankTransaction[];
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

              <StatisticCard label="Linked Accounts" value={data.linkedAccountCount} />
              <StatisticCard label="Total Transactions" value={data.transactionCount} />
              <StatisticCard
                label="Transaction Volume"
                value={`TSh ${Number(data.transactionTotal).toLocaleString("en-TZ")}`}
              />

            </div>

            <div className="mt-8 overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-md">

              <table className="w-full text-left text-sm">

                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Reference</th>
                    <th className="px-6 py-3 font-semibold">Account</th>
                    <th className="px-6 py-3 font-semibold">Type</th>
                    <th className="px-6 py-3 font-semibold">Amount</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold">Date</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">

                  {data.recentTransactions.length === 0 ? (
                    <tr>
                      <td className="px-6 py-4 text-gray-500" colSpan={6}>
                        No transactions yet.
                      </td>
                    </tr>
                  ) : (
                    data.recentTransactions.map((tx) => (
                      <tr key={tx.transactionId}>
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {tx.reference}
                        </td>
                        <td className="px-6 py-4 text-gray-600">{tx.accountNumber}</td>
                        <td className="px-6 py-4 text-gray-600">{tx.type}</td>
                        <td className="px-6 py-4 text-gray-600">{tx.amount}</td>
                        <td className="px-6 py-4 text-gray-600">{tx.status}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                          {new Date(tx.date).toLocaleDateString("en-TZ")}
                        </td>
                      </tr>
                    ))
                  )}

                </tbody>

              </table>

            </div>

          </>

        ) : null}

      </div>

    </div>
  );
}
