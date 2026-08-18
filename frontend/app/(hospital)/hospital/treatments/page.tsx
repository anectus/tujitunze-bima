"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

interface Treatment {
  treatment_id: number;
  member_id: number;
  first_name: string;
  surname: string;
  services_provided: string;
  procedures: string | null;
  prescription: string | null;
  treatment_status: string;
  visit_date: string;
}

const PAGE_SIZE = 20;

const STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "Active", value: "Active" },
  { label: "Completed", value: "Completed" },
];

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

export default function HospitalTreatmentsPage() {
  const getAuthHeaders = useAuthHeaders();

  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const [memberId, setMemberId] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [servicesProvided, setServicesProvided] = useState("");
  const [procedures, setProcedures] = useState("");
  const [prescription, setPrescription] = useState("");
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

      const response = await fetch(
        `http://localhost:3002/hospital/treatments?${query.toString()}`,
        { headers }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load treatments.");
      }

      setTreatments(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load treatments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  const createTreatment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const headers = getAuthHeaders();
    if (!headers) return;

    const parsedMemberId = Number(memberId);

    if (!parsedMemberId || parsedMemberId <= 0) {
      setFormError("Enter a valid member ID.");
      return;
    }

    if (!servicesProvided.trim()) {
      setFormError("Describe the services provided.");
      return;
    }

    setCreating(true);
    setFormError("");

    try {
      const response = await fetch("http://localhost:3002/hospital/treatments", {
        method: "POST",
        headers,
        body: JSON.stringify({
          memberId: parsedMemberId,
          verificationId: verificationId ? Number(verificationId) : undefined,
          servicesProvided: servicesProvided.trim(),
          procedures: procedures.trim() || undefined,
          prescription: prescription.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to record this treatment.");
      }

      setMemberId("");
      setVerificationId("");
      setServicesProvided("");
      setProcedures("");
      setPrescription("");
      setPage(1);
      load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to record this treatment.");
    } finally {
      setCreating(false);
    }
  };

  const toggleStatus = async (treatment: Treatment) => {
    const headers = getAuthHeaders();
    if (!headers) return;

    const nextStatus = treatment.treatment_status === "Active" ? "Completed" : "Active";
    setUpdatingId(treatment.treatment_id);

    try {
      const response = await fetch(
        `http://localhost:3002/hospital/treatments/${treatment.treatment_id}/status`,
        { method: "PATCH", headers, body: JSON.stringify({ status: nextStatus }) }
      );

      if (response.ok) {
        setTreatments((current) =>
          current.map((t) =>
            t.treatment_id === treatment.treatment_id
              ? { ...t, treatment_status: nextStatus }
              : t
          )
        );
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>

      <DashboardHeader title="Treatment" />

      <div className="p-4 sm:p-8">

        {error && (
          <div className="mb-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Record a patient visit */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">

          <p className="text-lg font-bold text-gray-900">Record a Patient Visit</p>
          <p className="mt-1 text-sm text-gray-500">
            Link to a recent verification if one was performed at check-in.
          </p>

          {formError && (
            <div className="mt-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          <form onSubmit={createTreatment} className="mt-4 grid gap-4 sm:grid-cols-2">

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
                Verification ID <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input
                type="number"
                min="1"
                value={verificationId}
                onChange={(e) => setVerificationId(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-gray-700">Services Provided</label>
              <textarea
                value={servicesProvided}
                onChange={(e) => setServicesProvided(e.target.value)}
                rows={2}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Procedures <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <textarea
                value={procedures}
                onChange={(e) => setProcedures(e.target.value)}
                rows={2}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Prescription <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <textarea
                value={prescription}
                onChange={(e) => setPrescription(e.target.value)}
                rows={2}
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={creating}
                className="rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white
                transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creating ? "Recording..." : "Record Treatment"}
              </button>
            </div>

          </form>

        </div>

        {/* Treatment History */}
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

          ) : treatments.length === 0 ? (

            <p className="text-gray-500">No treatments recorded yet.</p>

          ) : (

            <>
              <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-md">

                <table className="w-full text-left text-sm">

                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Member</th>
                      <th className="px-6 py-3 font-semibold">Services Provided</th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                      <th className="px-6 py-3 font-semibold">Visit Date</th>
                      <th className="px-6 py-3 font-semibold"></th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">

                    {treatments.map((t) => (
                      <tr key={t.treatment_id}>
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {t.first_name} {t.surname}
                        </td>
                        <td className="px-6 py-4 text-gray-600">{t.services_provided}</td>
                        <td className="px-6 py-4">
                          <span
                            className={
                              t.treatment_status === "Active" ? "text-blue-700" : "text-green-700"
                            }
                          >
                            {t.treatment_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                          {new Date(t.visit_date).toLocaleString("en-TZ")}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            disabled={updatingId === t.treatment_id}
                            onClick={() => toggleStatus(t)}
                            className="text-xs font-semibold text-blue-700 hover:text-blue-800
                            disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {updatingId === t.treatment_id
                              ? "Updating..."
                              : t.treatment_status === "Active"
                              ? "Mark Completed"
                              : "Mark Active"}
                          </button>
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
