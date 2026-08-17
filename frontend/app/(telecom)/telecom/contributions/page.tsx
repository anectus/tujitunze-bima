"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

interface Contribution {
  contribution_id: number;
  reference_number: string | null;
  contribution_amount: string;
  contribution_source: string;
  processing_status: string;
  contribution_date: string;
}

const PAGE_SIZE = 20;

const STATUS_FILTERS = [
  { label: "All Transactions", value: "" },
  { label: "Successful", value: "Completed" },
  { label: "Pending", value: "Pending" },
  { label: "Failed", value: "Failed" },
];

function formatTsh(amount: number) {
  return `TSh ${amount.toLocaleString("en-TZ")}`;
}

export default function TelecomContributionsPage() {
  const router = useRouter();

  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    const query = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
      ...(status ? { status } : {}),
    });

    fetch(`http://localhost:3002/telecom/contributions?${query.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load contribution transactions.");
        }

        return data;
      })
      .then((data) => {
        setContributions(data.items);
        setTotal(data.total);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Unable to load contribution transactions.")
      )
      .finally(() => setLoading(false));
  }, [router, page, status]);

  const exportCsv = () => {
    const token = getAccessToken();
    if (!token) return;

    const query = status ? `?status=${status}` : "";

    fetch(`http://localhost:3002/telecom/contributions/export${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => response.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "contributions.csv";
        link.click();
        URL.revokeObjectURL(url);
      });
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>

      <DashboardHeader title="Contribution Transactions" />

      <div className="p-4 sm:p-8">

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">

          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => {
                  setStatus(filter.value);
                  setPage(1);
                }}
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

          <button
            type="button"
            onClick={exportCsv}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm
            font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Export CSV
          </button>

        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (

          <p className="text-gray-500">Loading...</p>

        ) : contributions.length === 0 ? (

          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
            <p className="text-gray-600">No contribution transactions yet.</p>
            <p className="mt-2 text-sm text-gray-400">
              This fills in once the levy engine writes to telecom_contributions — see
              CLAUDE.md&apos;s known gaps. Failed transactions currently have no
              retry mechanism since nothing generates a failure yet.
            </p>
          </div>

        ) : (

          <>
            <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-md">

              <table className="w-full text-left text-sm">

                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Transaction ID</th>
                    <th className="px-6 py-3 font-semibold">Reference</th>
                    <th className="px-6 py-3 font-semibold">Amount</th>
                    <th className="px-6 py-3 font-semibold">Source</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold">Date &amp; Time</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">

                  {contributions.map((c) => (

                    <tr key={c.contribution_id}>
                      <td className="px-6 py-4 text-gray-600">{c.contribution_id}</td>
                      <td className="px-6 py-4 text-gray-900">{c.reference_number ?? "—"}</td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {formatTsh(Number(c.contribution_amount))}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{c.contribution_source}</td>
                      <td className="px-6 py-4 text-gray-600">{c.processing_status}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {new Date(c.contribution_date).toLocaleString("en-TZ")}
                      </td>
                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between text-sm">

                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-gray-300 px-4 py-2
                  font-semibold text-gray-700 transition hover:bg-white
                  disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>

                <span className="text-gray-500">Page {page} of {totalPages}</span>

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-gray-300 px-4 py-2
                  font-semibold text-gray-700 transition hover:bg-white
                  disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>

              </div>
            )}
          </>

        )}

      </div>

    </div>
  );
}
