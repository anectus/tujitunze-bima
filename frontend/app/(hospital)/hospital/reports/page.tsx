"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

type Period = "daily" | "weekly" | "monthly";

interface CountBucket {
  bucket: string;
  count: number;
}

interface ClaimBucket {
  bucket: string;
  count: number;
  total: string;
}

interface PaymentTotal {
  payment_status: string;
  count: number;
  total: string;
}

interface Report {
  period: Period;
  treatmentBuckets: CountBucket[];
  claimBuckets: ClaimBucket[];
  paymentTotals: PaymentTotal[];
  verificationBuckets: CountBucket[];
}

const PERIODS: { label: string; value: Period }[] = [
  { label: "Daily Report", value: "daily" },
  { label: "Weekly Report", value: "weekly" },
  { label: "Monthly Report", value: "monthly" },
];

function formatTsh(amount: number) {
  return `TSh ${amount.toLocaleString("en-TZ")}`;
}

export default function HospitalReportsPage() {
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

    fetch(`http://localhost:3002/hospital/reports?period=${period}`, {
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

            {/* Treatment Report */}
            <div>
              <p className="mb-2 text-sm font-semibold text-gray-700">Treatment Report</p>

              {report.treatmentBuckets.length === 0 ? (
                <p className="text-sm text-gray-500">No treatments in this period yet.</p>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-md">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-6 py-3 font-semibold">Period</th>
                        <th className="px-6 py-3 font-semibold">Treatments</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {report.treatmentBuckets.map((b) => (
                        <tr key={b.bucket}>
                          <td className="px-6 py-4 text-gray-900">
                            {new Date(b.bucket).toLocaleDateString("en-TZ")}
                          </td>
                          <td className="px-6 py-4 text-gray-600">{b.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Claims Report */}
            <div>
              <p className="mb-2 text-sm font-semibold text-gray-700">Claims Report</p>

              {report.claimBuckets.length === 0 ? (
                <p className="text-sm text-gray-500">No claims in this period yet.</p>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-md">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-6 py-3 font-semibold">Period</th>
                        <th className="px-6 py-3 font-semibold">Claims</th>
                        <th className="px-6 py-3 font-semibold">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {report.claimBuckets.map((b) => (
                        <tr key={b.bucket}>
                          <td className="px-6 py-4 text-gray-900">
                            {new Date(b.bucket).toLocaleDateString("en-TZ")}
                          </td>
                          <td className="px-6 py-4 text-gray-600">{b.count}</td>
                          <td className="px-6 py-4 font-semibold text-gray-900">
                            {formatTsh(Number(b.total))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Payment Report */}
            <div>
              <p className="mb-2 text-sm font-semibold text-gray-700">Payment Report</p>

              {report.paymentTotals.length === 0 ? (
                <p className="text-sm text-gray-500">No payments recorded yet.</p>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-md">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-6 py-3 font-semibold">Status</th>
                        <th className="px-6 py-3 font-semibold">Count</th>
                        <th className="px-6 py-3 font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {report.paymentTotals.map((row) => (
                        <tr key={row.payment_status}>
                          <td className="px-6 py-4 text-gray-900">{row.payment_status}</td>
                          <td className="px-6 py-4 text-gray-600">{row.count}</td>
                          <td className="px-6 py-4 font-semibold text-gray-900">
                            {formatTsh(Number(row.total))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Member Verification Report */}
            <div>
              <p className="mb-2 text-sm font-semibold text-gray-700">Member Verification Report</p>

              {report.verificationBuckets.length === 0 ? (
                <p className="text-sm text-gray-500">No verifications in this period yet.</p>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-md">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-6 py-3 font-semibold">Period</th>
                        <th className="px-6 py-3 font-semibold">Verifications</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {report.verificationBuckets.map((b) => (
                        <tr key={b.bucket}>
                          <td className="px-6 py-4 text-gray-900">
                            {new Date(b.bucket).toLocaleDateString("en-TZ")}
                          </td>
                          <td className="px-6 py-4 text-gray-600">{b.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

        ) : null}

      </div>

    </div>
  );
}
