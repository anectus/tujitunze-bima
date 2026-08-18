"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

interface Claim {
  claim_id: number;
  claim_number: string;
  claim_amount: string;
  approved_amount: string | null;
  claim_status: string;
  claim_date: string;
  processed_date: string | null;
  remarks: string | null;
  member_id: number;
  first_name: string;
  surname: string;
}

const PAGE_SIZE = 20;

const STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "Draft", value: "Draft" },
  { label: "Pending", value: "Pending" },
  { label: "Under Review", value: "Under Review" },
  { label: "Approved", value: "Approved" },
  { label: "Rejected", value: "Rejected" },
  { label: "Disputed", value: "Disputed" },
];

const NEXT_STATUS_OPTIONS = ["Under Review", "Approved", "Rejected", "Disputed"];

const STATUS_TEXT_CLASS: Record<string, string> = {
  Draft: "text-gray-500",
  Pending: "text-amber-700",
  "Under Review": "text-blue-700",
  Approved: "text-green-700",
  Rejected: "text-red-700",
  Disputed: "text-red-700",
};

function formatTsh(amount: number) {
  return `TSh ${amount.toLocaleString("en-TZ")}`;
}

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

export default function HospitalClaimsPage() {
  const getAuthHeaders = useAuthHeaders();

  const [claims, setClaims] = useState<Claim[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState<number | null>(null);
  const [nextStatusChoice, setNextStatusChoice] = useState<Record<number, string>>({});

  const [memberId, setMemberId] = useState("");
  const [treatmentId, setTreatmentId] = useState("");
  const [memberInsuranceId, setMemberInsuranceId] = useState("");
  const [claimAmount, setClaimAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [isDraft, setIsDraft] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");

  const load = async () => {
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      const query = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
        ...(status ? { status } : {}),
      });

      const response = await fetch(`http://localhost:3002/hospital/claims?${query.toString()}`, {
        headers,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load claims.");
      }

      setClaims(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load claims.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  const createClaim = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const headers = getAuthHeaders();
    if (!headers) return;

    const parsedMemberId = Number(memberId);
    const parsedAmount = Number(claimAmount);

    if (!parsedMemberId || parsedMemberId <= 0) {
      setFormError("Enter a valid member ID.");
      return;
    }

    if (!parsedAmount || parsedAmount <= 0) {
      setFormError("Enter a claim amount greater than zero.");
      return;
    }

    setCreating(true);
    setFormError("");

    try {
      const response = await fetch("http://localhost:3002/hospital/claims", {
        method: "POST",
        headers,
        body: JSON.stringify({
          memberId: parsedMemberId,
          treatmentId: treatmentId ? Number(treatmentId) : undefined,
          memberInsuranceId: memberInsuranceId ? Number(memberInsuranceId) : undefined,
          claimAmount: parsedAmount,
          remarks: remarks.trim() || undefined,
          isDraft,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to create this claim.");
      }

      setMemberId("");
      setTreatmentId("");
      setMemberInsuranceId("");
      setClaimAmount("");
      setRemarks("");
      setIsDraft(false);
      setPage(1);
      load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to create this claim.");
    } finally {
      setCreating(false);
    }
  };

  const submitDraft = async (claimId: number) => {
    const headers = getAuthHeaders();
    if (!headers) return;

    setActingId(claimId);

    try {
      const response = await fetch(
        `http://localhost:3002/hospital/claims/${claimId}/submit`,
        { method: "PATCH", headers }
      );

      if (response.ok) {
        setClaims((current) =>
          current.map((c) =>
            c.claim_id === claimId ? { ...c, claim_status: "Pending" } : c
          )
        );
      }
    } finally {
      setActingId(null);
    }
  };

  const updateStatus = async (claim: Claim) => {
    const headers = getAuthHeaders();
    if (!headers) return;

    const nextStatus = nextStatusChoice[claim.claim_id] || NEXT_STATUS_OPTIONS[0];
    const approvedAmount =
      nextStatus === "Approved" ? Number(claim.claim_amount) : undefined;

    setActingId(claim.claim_id);

    try {
      const response = await fetch(
        `http://localhost:3002/hospital/claims/${claim.claim_id}/status`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({ status: nextStatus, approvedAmount }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setClaims((current) =>
          current.map((c) =>
            c.claim_id === claim.claim_id
              ? {
                  ...c,
                  claim_status: data.status,
                  approved_amount:
                    data.approvedAmount != null ? String(data.approvedAmount) : c.approved_amount,
                }
              : c
          )
        );
      }
    } finally {
      setActingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>

      <DashboardHeader title="Claims" />

      <div className="p-4 sm:p-8">

        {error && (
          <div className="mb-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* New Claim */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">

          <p className="text-lg font-bold text-gray-900">New Claim</p>
          <p className="mt-1 text-sm text-gray-500">
            Link a treatment and insurance policy where available — both are optional.
          </p>

          {formError && (
            <div className="mt-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          <form onSubmit={createClaim} className="mt-4 grid gap-4 sm:grid-cols-4">

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Member ID</label>
              <input
                type="number"
                min="1"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Treatment ID <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input
                type="number"
                min="1"
                value={treatmentId}
                onChange={(e) => setTreatmentId(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Insurance ID <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input
                type="number"
                min="1"
                value={memberInsuranceId}
                onChange={(e) => setMemberInsuranceId(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Claim Amount (TSh)</label>
              <input
                type="number"
                min="1"
                value={claimAmount}
                onChange={(e) => setClaimAmount(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-3">
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Remarks <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 pb-3 text-sm font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={isDraft}
                  onChange={(e) => setIsDraft(e.target.checked)}
                />
                Save as draft
              </label>
            </div>

            <div className="sm:col-span-4">
              <button
                type="submit"
                disabled={creating}
                className="rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white
                transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creating ? "Saving..." : isDraft ? "Save Draft" : "Submit Claim"}
              </button>
            </div>

          </form>

        </div>

        {/* Claims list */}
        <div className="mt-6">

          <div className="mb-4 flex flex-wrap gap-2">
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

          {loading ? (

            <p className="text-gray-500">Loading...</p>

          ) : claims.length === 0 ? (

            <p className="text-gray-500">No claims yet.</p>

          ) : (

            <>
              <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-md">

                <table className="w-full text-left text-sm">

                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Claim</th>
                      <th className="px-6 py-3 font-semibold">Member</th>
                      <th className="px-6 py-3 font-semibold">Amount</th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                      <th className="px-6 py-3 font-semibold">Date</th>
                      <th className="px-6 py-3 font-semibold"></th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">

                    {claims.map((c) => (
                      <tr key={c.claim_id}>
                        <td className="px-6 py-4 font-medium text-gray-900">{c.claim_number}</td>
                        <td className="px-6 py-4 text-gray-600">
                          {c.first_name} {c.surname}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {formatTsh(Number(c.claim_amount))}
                          {c.approved_amount && (
                            <span className="block text-xs text-green-700">
                              Approved: {formatTsh(Number(c.approved_amount))}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={STATUS_TEXT_CLASS[c.claim_status] ?? "text-gray-600"}>
                            {c.claim_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                          {new Date(c.claim_date).toLocaleDateString("en-TZ")}
                        </td>
                        <td className="px-6 py-4">
                          {c.claim_status === "Draft" ? (
                            <button
                              type="button"
                              disabled={actingId === c.claim_id}
                              onClick={() => submitDraft(c.claim_id)}
                              className="text-xs font-semibold text-blue-700 hover:text-blue-800
                              disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {actingId === c.claim_id ? "Submitting..." : "Submit"}
                            </button>
                          ) : !["Approved", "Rejected"].includes(c.claim_status) ? (
                            <div className="flex items-center gap-2">
                              <select
                                value={nextStatusChoice[c.claim_id] ?? NEXT_STATUS_OPTIONS[0]}
                                onChange={(e) =>
                                  setNextStatusChoice((current) => ({
                                    ...current,
                                    [c.claim_id]: e.target.value,
                                  }))
                                }
                                className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs"
                              >
                                {NEXT_STATUS_OPTIONS.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                disabled={actingId === c.claim_id}
                                onClick={() => updateStatus(c)}
                                className="text-xs font-semibold text-blue-700 hover:text-blue-800
                                disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {actingId === c.claim_id ? "Updating..." : "Update"}
                              </button>
                            </div>
                          ) : null}
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

    </div>
  );
}
