"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

interface Payment {
  payment_id: number;
  claim_id: number;
  claim_number: string;
  amount: string;
  payment_status: string;
  payment_date: string | null;
  created_at: string;
}

const STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "Pending", value: "Pending" },
  { label: "Approved", value: "Approved" },
  { label: "Completed", value: "Completed" },
];

const STATUS_TEXT_CLASS: Record<string, string> = {
  Pending: "text-amber-700",
  Approved: "text-blue-700",
  Completed: "text-green-700",
};

function formatTsh(amount: number) {
  return `TSh ${amount.toLocaleString("en-TZ")}`;
}

export default function HospitalPaymentsPage() {
  const router = useRouter();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    const query = status ? `?status=${status}` : "";

    fetch(`http://localhost:3002/hospital/payments${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load payments.");
        }

        return data;
      })
      .then(setPayments)
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load payments."))
      .finally(() => setLoading(false));
  }, [router, status]);

  return (
    <div>

      <DashboardHeader title="Payments" />

      <div className="p-4 sm:p-8">

        <p className="mb-4 text-sm text-gray-500">
          Read-only — a Pending row is created automatically when a claim is approved. A
          hospital approving its own payment would be a conflict of interest, so there&apos;s
          no action to take here. Nothing yet moves a payment past Pending
          (Approved/Completed) — that&apos;s a Bank/Admin-side payout step not built yet.
        </p>

        <div className="mb-4 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatus(filter.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                status === filter.value
                  ? "bg-blue-700 text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {filter.label}
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

        ) : payments.length === 0 ? (

          <p className="text-gray-500">No payments recorded yet.</p>

        ) : (

          <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-md">

            <table className="w-full text-left text-sm">

              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-3 font-semibold">Claim</th>
                  <th className="px-6 py-3 font-semibold">Amount</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Payment Date</th>
                  <th className="px-6 py-3 font-semibold">Created</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">

                {payments.map((p) => (
                  <tr key={p.payment_id}>
                    <td className="px-6 py-4 font-medium text-gray-900">{p.claim_number}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {formatTsh(Number(p.amount))}
                    </td>
                    <td className="px-6 py-4">
                      <span className={STATUS_TEXT_CLASS[p.payment_status] ?? "text-gray-600"}>
                        {p.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {p.payment_date ? new Date(p.payment_date).toLocaleDateString("en-TZ") : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {new Date(p.created_at).toLocaleDateString("en-TZ")}
                    </td>
                  </tr>
                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
}
