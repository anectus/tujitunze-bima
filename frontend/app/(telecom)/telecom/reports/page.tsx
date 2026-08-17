"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

type Period = "daily" | "weekly" | "monthly";

interface Bucket {
  bucket: string;
  count: number;
  total: string;
}

interface FailedReason {
  processing_status: string;
  count: number;
}

interface Report {
  period: Period;
  buckets: Bucket[];
  failedByReason: FailedReason[];
}

const PERIODS: { label: string; value: Period }[] = [
  { label: "Daily Report", value: "daily" },
  { label: "Weekly Report", value: "weekly" },
  { label: "Monthly Report", value: "monthly" },
];

export default function TelecomReportsPage() {
  const router = useRouter();

  const [period, setPeriod] = useState<Period>("daily");
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    fetch(`http://localhost:3002/telecom/reports?period=${period}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load reports.");
        }

        return data;
      })
      .then(setReport)
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load reports."))
      .finally(() => setLoading(false));
  }, [router, period]);

  return (
    <div>

      <DashboardHeader title="Reports" />

      <div className="p-4 sm:p-8">

        <div className="mb-6 flex flex-wrap gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPeriod(p.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                period === p.value
                  ? "bg-blue-700 text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (

          <p className="text-gray-500">Loading...</p>

        ) : report ? (

          <div className="space-y-6">

            {/* Contribution Report */}
            <div>
              <p className="mb-2 text-sm font-semibold text-gray-700">Contribution Report</p>

              {report.buckets.length === 0 ? (

                <p className="text-sm text-gray-500">No contributions in this period yet.</p>

              ) : (

                <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-md">

                  <table className="w-full text-left text-sm">

                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-6 py-3 font-semibold">Period</th>
                        <th className="px-6 py-3 font-semibold">Transactions</th>
                        <th className="px-6 py-3 font-semibold">Total</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">

                      {report.buckets.map((bucket) => (
                        <tr key={bucket.bucket}>
                          <td className="px-6 py-4 text-gray-900">
                            {new Date(bucket.bucket).toLocaleDateString("en-TZ")}
                          </td>
                          <td className="px-6 py-4 text-gray-600">{bucket.count}</td>
                          <td className="px-6 py-4 font-semibold text-gray-900">
                            TSh {Number(bucket.total).toLocaleString("en-TZ")}
                          </td>
                        </tr>
                      ))}

                    </tbody>

                  </table>

                </div>

              )}
            </div>

            {/* Failed Transaction Report */}
            <div>
              <p className="mb-2 text-sm font-semibold text-gray-700">Failed Transaction Report</p>

              {report.failedByReason.length === 0 ? (

                <p className="text-sm text-gray-500">No failed or pending transactions.</p>

              ) : (

                <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-md">

                  <table className="w-full text-left text-sm">

                    <tbody className="divide-y divide-gray-100">

                      {report.failedByReason.map((row) => (
                        <tr key={row.processing_status}>
                          <td className="px-6 py-4 text-gray-900">{row.processing_status}</td>
                          <td className="px-6 py-4 text-gray-600">{row.count}</td>
                        </tr>
                      ))}

                    </tbody>

                  </table>

                </div>

              )}
            </div>

            {/* Reconciliation Report */}
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
              <p className="text-gray-600">Reconciliation Report</p>
              <p className="mt-2 text-sm text-gray-400">
                See the{" "}
                <Link href="/telecom/reconciliation" className="font-semibold text-blue-700">
                  Reconciliation
                </Link>{" "}
                page for run-by-run history — a rolled-up trend report over multiple runs isn&apos;t built yet.
              </p>
            </div>

          </div>

        ) : null}

      </div>

    </div>
  );
}
