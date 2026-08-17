"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

interface Settlement {
  settlement_id: number;
  counterparty_type: "Telecom" | "Hospital";
  counterparty_name: string;
  amount: string;
  settlement_status: "Pending" | "Completed";
  settlement_date: string;
}

const inputClass =
  "w-full rounded-lg border border-gray-300 px-4 py-3 " +
  "text-gray-900 outline-none transition " +
  "focus:border-blue-700 focus:ring-2 focus:ring-blue-200";

function formatTsh(amount: number) {
  return `TSh ${amount.toLocaleString("en-TZ")}`;
}

function useAuthHeaders() {
  const router = useRouter();

  return () => {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return null;
    }

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };
}

export default function SettlementsPage() {
  const getAuthHeaders = useAuthHeaders();

  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completingId, setCompletingId] = useState<number | null>(null);

  const [counterpartyType, setCounterpartyType] = useState<"Telecom" | "Hospital">("Telecom");
  const [counterpartyName, setCounterpartyName] = useState("");
  const [amount, setAmount] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const load = async () => {
      const headers = getAuthHeaders();
      if (!headers) return;

      try {
        const response = await fetch("http://localhost:3002/bank/settlements", { headers });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load settlements.");
        }

        setSettlements(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load settlements.");
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createSettlement = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const headers = getAuthHeaders();
    if (!headers) return;

    const parsedAmount = Number(amount);

    if (!counterpartyName.trim()) {
      setFormError("Enter the counterparty name.");
      return;
    }

    if (!parsedAmount || parsedAmount <= 0) {
      setFormError("Enter an amount greater than zero.");
      return;
    }

    setCreating(true);
    setFormError("");

    try {
      const response = await fetch("http://localhost:3002/bank/settlements", {
        method: "POST",
        headers,
        body: JSON.stringify({
          counterpartyType,
          counterpartyName: counterpartyName.trim(),
          amount: parsedAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to create the settlement.");
      }

      setCounterpartyName("");
      setAmount("");
      setSettlements((current) => [data, ...current]);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to create the settlement.");
    } finally {
      setCreating(false);
    }
  };

  const complete = async (settlementId: number) => {
    const headers = getAuthHeaders();
    if (!headers) return;

    setCompletingId(settlementId);

    try {
      const response = await fetch(
        `http://localhost:3002/bank/settlements/${settlementId}/complete`,
        { method: "PATCH", headers }
      );

      if (response.ok) {
        setSettlements((current) =>
          current.map((s) =>
            s.settlement_id === settlementId ? { ...s, settlement_status: "Completed" } : s
          )
        );
      }
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <div>

      <DashboardHeader title="Settlements" />

      <div className="p-4 sm:p-8">

        {error && (
          <div className="mb-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Record a settlement */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">

          <p className="text-lg font-bold text-gray-900">Record a Settlement</p>
          <p className="mt-1 text-sm text-gray-500">
            Reserves the amount from the Settlement account — completing it later
            deducts the balance and records the ledger entry.
          </p>

          {formError && (
            <div className="mt-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          <form onSubmit={createSettlement} className="mt-4 grid gap-4 sm:grid-cols-3">

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Counterparty</label>
              <select
                value={counterpartyType}
                onChange={(e) => setCounterpartyType(e.target.value as "Telecom" | "Hospital")}
                className={inputClass}
              >
                <option value="Telecom">Telecom</option>
                <option value="Hospital">Hospital</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Name</label>
              <input
                type="text"
                value={counterpartyName}
                onChange={(e) => setCounterpartyName(e.target.value)}
                placeholder="e.g. Yas Money"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Amount (TSh)</label>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-3">
              <button
                type="submit"
                disabled={creating}
                className="rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white
                transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creating ? "Recording..." : "Record Settlement"}
              </button>
            </div>

          </form>

        </div>

        {/* List */}
        <div className="mt-6">

          {loading ? (

            <p className="text-gray-500">Loading...</p>

          ) : settlements.length === 0 ? (

            <p className="text-gray-500">No settlements recorded yet.</p>

          ) : (

            <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-md">

              <table className="w-full text-left text-sm">

                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Counterparty</th>
                    <th className="px-6 py-3 font-semibold">Type</th>
                    <th className="px-6 py-3 font-semibold">Amount</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold">Date</th>
                    <th className="px-6 py-3 font-semibold"></th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">

                  {settlements.map((s) => (
                    <tr key={s.settlement_id}>
                      <td className="px-6 py-4 font-medium text-gray-900">{s.counterparty_name}</td>
                      <td className="px-6 py-4 text-gray-600">{s.counterparty_type}</td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {formatTsh(Number(s.amount))}
                      </td>
                      <td className="px-6 py-4">
                        <span className={s.settlement_status === "Completed" ? "text-green-700" : "text-amber-700"}>
                          {s.settlement_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {new Date(s.settlement_date).toLocaleDateString("en-TZ")}
                      </td>
                      <td className="px-6 py-4">
                        {s.settlement_status === "Pending" && (
                          <button
                            type="button"
                            disabled={completingId === s.settlement_id}
                            onClick={() => complete(s.settlement_id)}
                            className="text-xs font-semibold text-blue-700 hover:text-blue-800
                            disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {completingId === s.settlement_id ? "Completing..." : "Complete"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>

    </div>
  );
}
