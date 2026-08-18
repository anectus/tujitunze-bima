"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

interface Verification {
  verification_id: number;
  verification_method: string;
  verification_result: string;
  member_status: string | null;
  verified_date: string;
  remarks: string | null;
  member_id: number;
  first_name: string;
  surname: string;
  nida_number: string;
}

const PAGE_SIZE = 20;

const inputClass =
  "w-full rounded-lg border border-gray-300 px-4 py-3 " +
  "text-gray-900 outline-none transition " +
  "focus:border-blue-700 focus:ring-2 focus:ring-blue-200";

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

export default function HospitalVerificationsPage() {
  const getAuthHeaders = useAuthHeaders();

  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [method, setMethod] = useState<"NIDA" | "MemberID">("NIDA");
  const [identifier, setIdentifier] = useState("");
  const [remarks, setRemarks] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [formError, setFormError] = useState("");
  const [result, setResult] = useState<{
    name: string;
    verificationResult: string;
  } | null>(null);

  const load = async (targetPage: number) => {
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      const response = await fetch(
        `http://localhost:3002/hospital/verifications?page=${targetPage}&pageSize=${PAGE_SIZE}`,
        { headers }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load verification history.");
      }

      setVerifications(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load verification history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const verifyMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const headers = getAuthHeaders();
    if (!headers) return;

    if (!identifier.trim()) {
      setFormError("Enter a NIDA number or member ID.");
      return;
    }

    setVerifying(true);
    setFormError("");
    setResult(null);

    try {
      const response = await fetch("http://localhost:3002/hospital/verifications", {
        method: "POST",
        headers,
        body: JSON.stringify({
          verificationMethod: method,
          identifier: identifier.trim(),
          remarks: remarks.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to verify this member.");
      }

      setResult({
        name: `${data.member.firstName} ${data.member.surname}`,
        verificationResult: data.verification_result,
      });
      setIdentifier("");
      setRemarks("");
      setPage(1);
      load(1);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to verify this member.");
    } finally {
      setVerifying(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>

      <DashboardHeader title="Member Verification" />

      <div className="p-4 sm:p-8">

        {error && (
          <div className="mb-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Verify a member */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">

          <p className="text-lg font-bold text-gray-900">Verify a Member</p>
          <p className="mt-1 text-sm text-gray-500">
            Check a patient&apos;s membership at check-in using their NIDA number or member ID.
          </p>

          {formError && (
            <div className="mt-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          {result && (
            <div
              className={`mt-4 rounded-lg px-4 py-3 text-sm ${
                result.verificationResult === "Eligible"
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {result.name} — {result.verificationResult}
            </div>
          )}

          <form onSubmit={verifyMember} className="mt-4 grid gap-4 sm:grid-cols-4">

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as "NIDA" | "MemberID")}
                className={inputClass}
              >
                <option value="NIDA">NIDA Number</option>
                <option value="MemberID">Member ID</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                {method === "NIDA" ? "NIDA Number" : "Member ID (e.g. TB000123)"}
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Remarks</label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-4">
              <button
                type="submit"
                disabled={verifying}
                className="rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white
                transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {verifying ? "Verifying..." : "Verify Member"}
              </button>
            </div>

          </form>

        </div>

        {/* Verification History */}
        <div className="mt-6">

          <p className="mb-2 text-sm font-semibold text-gray-700">Verification History</p>

          {loading ? (

            <p className="text-gray-500">Loading...</p>

          ) : verifications.length === 0 ? (

            <p className="text-gray-500">No verifications recorded yet.</p>

          ) : (

            <>
              <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-md">

                <table className="w-full text-left text-sm">

                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Member</th>
                      <th className="px-6 py-3 font-semibold">NIDA Number</th>
                      <th className="px-6 py-3 font-semibold">Method</th>
                      <th className="px-6 py-3 font-semibold">Result</th>
                      <th className="px-6 py-3 font-semibold">Date</th>
                      <th className="px-6 py-3 font-semibold">Remarks</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">

                    {verifications.map((v) => (
                      <tr key={v.verification_id}>
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {v.first_name} {v.surname}
                        </td>
                        <td className="px-6 py-4 text-gray-600">{v.nida_number}</td>
                        <td className="px-6 py-4 text-gray-600">{v.verification_method}</td>
                        <td className="px-6 py-4">
                          <span
                            className={
                              v.verification_result === "Eligible"
                                ? "text-green-700"
                                : "text-amber-700"
                            }
                          >
                            {v.verification_result}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                          {new Date(v.verified_date).toLocaleString("en-TZ")}
                        </td>
                        <td className="px-6 py-4 text-gray-600">{v.remarks ?? "—"}</td>
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

    </div>
  );
}
