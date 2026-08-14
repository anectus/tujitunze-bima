"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatisticCard from "@/components/cards/StatisticCard";

interface TelecomContribution {
  contributionId: number;
  reference: string | null;
  amount: number;
  source: string;
  status: string;
  date: string;
}

interface TelecomDashboardData {
  operator: { name: string | null; status: string | null };
  linkedPhoneCount: number;
  contributionCount: number;
  contributionTotal: number;
  recentContributions: TelecomContribution[];
}

export default function TelecomDashboardPage() {
  const router = useRouter();

  const [data, setData] = useState<TelecomDashboardData | null>(null);
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
        const response = await fetch(
          "http://localhost:3002/telecom/dashboard",
          { headers: { Authorization: `Bearer ${token}` } }
        );

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

      <DashboardHeader title="Telecom Dashboard" />

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
              {data.operator.name}{" "}
              <span className="text-sm font-normal text-gray-500">
                ({data.operator.status})
              </span>
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

              <StatisticCard label="Linked Phone Numbers" value={data.linkedPhoneCount} />
              <StatisticCard label="Total Contributions" value={data.contributionCount} />
              <StatisticCard
                label="Contribution Volume"
                value={`TSh ${Number(data.contributionTotal).toLocaleString("en-TZ")}`}
              />

            </div>

            <div className="mt-8 overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-md">

              <table className="w-full text-left text-sm">

                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Reference</th>
                    <th className="px-6 py-3 font-semibold">Source</th>
                    <th className="px-6 py-3 font-semibold">Amount</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold">Date</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">

                  {data.recentContributions.length === 0 ? (
                    <tr>
                      <td className="px-6 py-4 text-gray-500" colSpan={5}>
                        No contributions yet.
                      </td>
                    </tr>
                  ) : (
                    data.recentContributions.map((c) => (
                      <tr key={c.contributionId}>
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {c.reference ?? "—"}
                        </td>
                        <td className="px-6 py-4 text-gray-600">{c.source}</td>
                        <td className="px-6 py-4 text-gray-600">{c.amount}</td>
                        <td className="px-6 py-4 text-gray-600">{c.status}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                          {new Date(c.date).toLocaleDateString("en-TZ")}
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
