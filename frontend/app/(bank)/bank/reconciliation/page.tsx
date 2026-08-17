"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

interface Run {
  run_id: number;
  total_uploaded: number;
  matched_count: number;
  unmatched_count: number;
  run_date: string;
}

interface UploadResult {
  runId: number;
  totalUploaded: number;
  matchedCount: number;
  unmatchedCount: number;
}

const inputClass =
  "w-full rounded-lg border border-gray-300 px-4 py-3 " +
  "text-gray-900 outline-none transition font-mono text-sm " +
  "focus:border-blue-700 focus:ring-2 focus:ring-blue-200";

const SAMPLE_PLACEHOLDER =
  "reference,amount,date\nBT-1001,5000,2026-08-17\nBT-1002,12000,2026-08-17";

export default function BankReconciliationPage() {
  const router = useRouter();

  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [csvText, setCsvText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [uploadError, setUploadError] = useState("");

  const loadRuns = () => {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    fetch("http://localhost:3002/bank/reconciliation/runs", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load reconciliation history.");
        }

        return data;
      })
      .then(setRuns)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Unable to load reconciliation history.")
      )
      .finally(() => setLoading(false));
  };

  useEffect(loadRuns, [router]);

  const parseCsv = (text: string) => {
    const lines = text.trim().split("\n").filter(Boolean);
    const dataLines = lines[0]?.toLowerCase().startsWith("reference") ? lines.slice(1) : lines;

    return dataLines.map((line) => {
      const [externalReference, amount, recordDate] = line.split(",").map((v) => v.trim());
      return {
        externalReference,
        amount: Number(amount),
        recordDate: recordDate || undefined,
      };
    });
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }

    setUploadError("");
    setUploadResult(null);

    const records = parseCsv(csvText).filter((r) => r.externalReference && !Number.isNaN(r.amount));

    if (records.length === 0) {
      setUploadError("Paste at least one valid row (reference,amount[,date]).");
      return;
    }

    setUploading(true);

    try {
      const response = await fetch("http://localhost:3002/bank/reconciliation/runs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ records }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to run reconciliation.");
      }

      setUploadResult(data);
      setCsvText("");
      loadRuns();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Unable to run reconciliation.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>

      <DashboardHeader title="Reconciliation" />

      <div className="p-4 sm:p-8">

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">

          <p className="text-lg font-bold text-gray-900">Upload Bank Records</p>
          <p className="mt-1 text-sm text-gray-500">
            Paste your own bank-side records (CSV: reference,amount,date) — each row is
            matched against HSIMS&apos;s transaction records by reference and amount. A
            reference that matches but with a different amount is flagged as a
            Discrepancy rather than simply Unmatched.
          </p>

          {uploadError && (
            <div className="mt-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
              {uploadError}
            </div>
          )}

          {uploadResult && (
            <div className="mt-4 rounded-lg bg-blue-100 px-4 py-3 text-sm text-blue-700">
              Run #{uploadResult.runId}: {uploadResult.matchedCount} matched,{" "}
              {uploadResult.unmatchedCount} unmatched/discrepant out of {uploadResult.totalUploaded}.
            </div>
          )}

          <form onSubmit={handleUpload} className="mt-4">

            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={SAMPLE_PLACEHOLDER}
              rows={6}
              className={inputClass}
            />

            <button
              type="submit"
              disabled={uploading}
              className="mt-4 rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white
              transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploading ? "Reconciling..." : "Run Reconciliation"}
            </button>

          </form>

        </div>

        <div className="mt-6">

          <p className="mb-2 text-sm font-semibold text-gray-700">Reconciliation History</p>

          {error && (
            <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (

            <p className="text-gray-500">Loading...</p>

          ) : runs.length === 0 ? (

            <p className="text-gray-500">No reconciliation runs yet.</p>

          ) : (

            <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-md">

              <table className="w-full text-left text-sm">

                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Run</th>
                    <th className="px-6 py-3 font-semibold">Uploaded</th>
                    <th className="px-6 py-3 font-semibold">Matched</th>
                    <th className="px-6 py-3 font-semibold">Unmatched/Discrepant</th>
                    <th className="px-6 py-3 font-semibold">Date</th>
                    <th className="px-6 py-3 font-semibold"></th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">

                  {runs.map((run) => (
                    <tr key={run.run_id}>
                      <td className="px-6 py-4 font-medium text-gray-900">#{run.run_id}</td>
                      <td className="px-6 py-4 text-gray-600">{run.total_uploaded}</td>
                      <td className="px-6 py-4 text-green-700">{run.matched_count}</td>
                      <td className="px-6 py-4 text-red-700">{run.unmatched_count}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {new Date(run.run_date).toLocaleString("en-TZ")}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/bank/reconciliation/${run.run_id}`}
                          className="text-sm font-semibold text-blue-700 hover:text-blue-800"
                        >
                          View →
                        </Link>
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
