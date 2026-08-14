"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatisticCard from "@/components/cards/StatisticCard";
import StatusBadge from "@/components/common/StatusBadge";

interface InsuranceClaim {
  claimId: number;
  claimNumber: string;
  claimAmount: number;
  claimStatus: string;
  claimDate: string;
}

interface InsuranceDashboardData {
  provider: { name: string | null; status: string | null };
  planCount: number;
  activePolicyCount: number;
  totalClaims: number;
  claimsByStatus: Record<string, number>;
  recentClaims: InsuranceClaim[];
}

export default function InsuranceDashboardPage() {
  const router = useRouter();

  const [data, setData] = useState<InsuranceDashboardData | null>(null);
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
          "http://localhost:3002/insurance/dashboard",
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

      <DashboardHeader title="Insurance Dashboard" />

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
              {data.provider.name}{" "}
              <span className="text-sm font-normal text-gray-500">
                ({data.provider.status})
              </span>
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

              <StatisticCard label="Plans" value={data.planCount} />
              <StatisticCard label="Active Policies" value={data.activePolicyCount} />
              <StatisticCard label="Total Claims" value={data.totalClaims} />
              <StatisticCard
                label="Pending Claims"
                value={data.claimsByStatus["Pending"] ?? 0}
              />

            </div>

            <div className="mt-8 overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-md">

              <table className="w-full text-left text-sm">

                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Claim Number</th>
                    <th className="px-6 py-3 font-semibold">Amount</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold">Date</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">

                  {data.recentClaims.length === 0 ? (
                    <tr>
                      <td className="px-6 py-4 text-gray-500" colSpan={4}>
                        No claims routed yet.
                      </td>
                    </tr>
                  ) : (
                    data.recentClaims.map((claim) => (
                      <tr key={claim.claimId}>
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {claim.claimNumber}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {claim.claimAmount}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge domain="claim" status={claim.claimStatus} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                          {new Date(claim.claimDate).toLocaleDateString("en-TZ")}
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
