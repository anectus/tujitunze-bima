
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import StatusBadge from "@/components/common/StatusBadge";

interface Hospital {
  hospitalId: number;
  hospitalName: string;
  hospitalCode: string | null;
  location: string | null;
  region: string | null;
  district: string | null;
  contactPhone: string | null;
  licenseNumber: string | null;
  status: string;
  createdAt: string;
}

const STATUS_OPTIONS = ["Active", "Inactive", "Suspended"];

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

export default function AdminHospitalsPage() {
  const router = useRouter();
  const getAuthHeaders = useAuthHeaders();

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    hospitalName: "",
    hospitalCode: "",
    region: "",
    district: "",
    contactPhone: "",
    licenseNumber: "",
  });
  const [formError, setFormError] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const loadHospitals = async () => {
      const token = getAccessToken();

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:3002/admin/hospitals",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.status === 401 || response.status === 403) {
          router.push("/login");
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load hospitals.");
        }

        setHospitals(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load hospitals."
        );
      } finally {
        setLoading(false);
      }
    };

    loadHospitals();
  }, [router]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setFormError("");
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");

    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      setCreating(true);

      const response = await fetch("http://localhost:3002/admin/hospitals", {
        method: "POST",
        headers,
        body: JSON.stringify({
          hospitalName: form.hospitalName,
          hospitalCode: form.hospitalCode || undefined,
          region: form.region || undefined,
          district: form.district || undefined,
          contactPhone: form.contactPhone || undefined,
          licenseNumber: form.licenseNumber || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to add this hospital.");
      }

      setHospitals((previous) => [...previous, data]);
      setForm({
        hospitalName: "",
        hospitalCode: "",
        region: "",
        district: "",
        contactPhone: "",
        licenseNumber: "",
      });
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Unable to add this hospital."
      );
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (hospitalId: number, status: string) => {
    const headers = getAuthHeaders();
    if (!headers) return;

    setUpdatingId(hospitalId);
    setError("");

    try {
      const response = await fetch(
        `http://localhost:3002/admin/hospitals/${hospitalId}/status`,
        { method: "PATCH", headers, body: JSON.stringify({ status }) }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update status.");
      }

      setHospitals((previous) =>
        previous.map((hospital) =>
          hospital.hospitalId === hospitalId
            ? { ...hospital, status }
            : hospital
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-white py-12 px-4">

      <div className="max-w-5xl mx-auto">

        <h1 className="text-3xl font-bold text-gray-900">Hospitals</h1>

        <p className="mt-2 text-sm text-gray-600">
          Manage the directory of partner hospitals members can be
          verified and file claims at.
        </p>

        {/* Add hospital */}
        <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-md">

          <p className="text-lg font-bold text-gray-900">Add Hospital</p>

          {formError && (
            <div className="mt-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          <form
            onSubmit={handleCreate}
            className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2"
          >

            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Hospital Name
              </label>
              <input
                name="hospitalName"
                value={form.hospitalName}
                onChange={handleFormChange}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Hospital Code
                <span className="ml-2 text-xs font-normal text-gray-500">
                  (Optional)
                </span>
              </label>
              <input
                name="hospitalCode"
                value={form.hospitalCode}
                onChange={handleFormChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                License Number
                <span className="ml-2 text-xs font-normal text-gray-500">
                  (Optional)
                </span>
              </label>
              <input
                name="licenseNumber"
                value={form.licenseNumber}
                onChange={handleFormChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Region
              </label>
              <input
                name="region"
                value={form.region}
                onChange={handleFormChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                District
              </label>
              <input
                name="district"
                value={form.district}
                onChange={handleFormChange}
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Contact Phone
              </label>
              <input
                name="contactPhone"
                value={form.contactPhone}
                onChange={handleFormChange}
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={creating}
                className="rounded-lg bg-blue-700 px-6 py-3 font-semibold
                text-white transition hover:bg-blue-800
                disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creating ? "Adding..." : "Add Hospital"}
              </button>
            </div>

          </form>

        </div>

        {error && (
          <div className="mt-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (

          <p className="mt-8 text-gray-500">Loading hospitals...</p>

        ) : hospitals.length === 0 ? (

          <p className="mt-8 text-gray-500">No hospitals added yet.</p>

        ) : (

          <div className="mt-8 overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-md">

            <table className="w-full text-left text-sm">

              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-3 font-semibold">Name</th>
                  <th className="px-6 py-3 font-semibold">Region</th>
                  <th className="px-6 py-3 font-semibold">Contact</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Change Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">

                {hospitals.map((hospital) => (

                  <tr key={hospital.hospitalId}>

                    <td className="px-6 py-4 text-gray-900">
                      {hospital.hospitalName}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {[hospital.region, hospital.district]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {hospital.contactPhone || "—"}
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge domain="hospital" status={hospital.status} />
                    </td>

                    <td className="px-6 py-4">
                      <select
                        value={hospital.status}
                        disabled={updatingId === hospital.hospitalId}
                        onChange={(e) =>
                          handleStatusChange(
                            hospital.hospitalId,
                            e.target.value
                          )
                        }
                        className="
                          rounded-lg
                          border
                          border-gray-300
                          px-3
                          py-2
                          text-sm
                          text-gray-900
                          focus:outline-none
                          focus:ring-2
                          focus:ring-blue-600
                          focus:border-blue-600
                          disabled:opacity-60
                        "
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
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
