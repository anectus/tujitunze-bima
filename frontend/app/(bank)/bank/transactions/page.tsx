"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

interface Transaction {
  bank_transaction_id: number;
  transaction_reference: string;
  transaction_type: string;
  amount: string;
  transaction_status: string;
  transaction_date: string;
  account_number: string;
}

const PAGE_SIZE = 20;

const TYPE_FILTERS = [
  { label: "All Transactions", value: "" },
  { label: "Deposits", value: "Deposit" },
  { label: "Withdrawals", value: "Withdrawal" },
];

const STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "Pending", value: "Pending" },
  { label: "Approved", value: "Approved" },
  { label: "Completed", value: "Completed" },
  { label: "Failed", value: "Failed" },
];

function formatTsh(amount: number) {
  return `TSh ${amount.toLocaleString("en-TZ")}`;
}

export default function BankTransactionsPage() {
  const router = useRouter();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const load = () => {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    const query = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
    });

    fetch(`http://localhost:3002/bank/transactions?${query.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load transactions.");
        }

        return data;
      })
      .then((data) => {
        setTransactions(data.items);
        setTotal(data.total);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load transactions."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [router, page, type, status]);

  const approve = async (transactionId: number, nextStatus: string) => {
    const token = getAccessToken();
    if (!token) return;

    setUpdatingId(transactionId);

    try {
      const response = await fetch(
        `http://localhost:3002/bank/transactions/${transactionId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: nextStatus }),
        }
      );

      if (response.ok) {
        setTransactions((items) =>
          items.map((t) =>
            t.bank_transaction_id === transactionId
              ? { ...t, transaction_status: nextStatus }
              : t
          )
        );
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const exportCsv = () => {
    const token = getAccessToken();
    if (!token) return;

    const query = new URLSearchParams({
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
    });

    fetch(`http://localhost:3002/bank/transactions/export?${query.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => response.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "transactions.csv";
        link.click();
        URL.revokeObjectURL(url);
      });
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>

      <DashboardHeader title="Transactions" />

      <div className="p-4 sm:p-8">

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">

          <div className="flex flex-wrap gap-2">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => { setType(f.value); setPage(1); }}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  type === f.value ? "bg-blue-700 text-white" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {f.label}
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

        <div className="mb-4 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => { setStatus(f.value); setPage(1); }}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                status === f.value ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f.label}
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

        ) : transactions.length === 0 ? (

          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
            <p className="text-gray-600">No transactions yet.</p>
            <p className="mt-2 text-sm text-gray-400">
              This fills in once members can deposit/withdraw against a linked bank account
              — that flow isn&apos;t built on the Member side yet.
            </p>
          </div>

        ) : (

          <>
            <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-md">

              <table className="w-full text-left text-sm">

                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Reference</th>
                    <th className="px-6 py-3 font-semibold">Account</th>
                    <th className="px-6 py-3 font-semibold">Type</th>
                    <th className="px-6 py-3 font-semibold">Amount</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold">Date</th>
                    <th className="px-6 py-3 font-semibold"></th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">

                  {transactions.map((t) => (
                    <tr key={t.bank_transaction_id}>
                      <td className="px-6 py-4 text-gray-900">{t.transaction_reference}</td>
                      <td className="px-6 py-4 text-gray-600">{t.account_number}</td>
                      <td className="px-6 py-4 text-gray-600">{t.transaction_type}</td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {formatTsh(Number(t.amount))}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{t.transaction_status}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {new Date(t.transaction_date).toLocaleString("en-TZ")}
                      </td>
                      <td className="px-6 py-4">
                        {t.transaction_status === "Pending" && t.transaction_type === "Withdrawal" && (
                          <button
                            type="button"
                            disabled={updatingId === t.bank_transaction_id}
                            onClick={() => approve(t.bank_transaction_id, "Approved")}
                            className="text-xs font-semibold text-blue-700 hover:text-blue-800
                            disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Approve
                          </button>
                        )}
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
