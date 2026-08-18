"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatusBadge from "@/components/common/StatusBadge";

interface HospitalProfile {
  hospital_id: number;
  hospital_name: string;
  hospital_code: string | null;
  location: string | null;
  region: string | null;
  district: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  license_number: string | null;
  status: string;
  facility_type: string | null;
  bed_capacity: number | null;
  services_offered: string | null;
  created_at: string;
}

interface StaffMember {
  user_id: number;
  first_name: string;
  surname: string;
  email: string | null;
  member_status: string;
  created_at: string;
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

export default function HospitalProfilePage() {
  const getAuthHeaders = useAuthHeaders();

  const [profile, setProfile] = useState<HospitalProfile | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [facilityType, setFacilityType] = useState("");
  const [bedCapacity, setBedCapacity] = useState("");
  const [servicesOffered, setServicesOffered] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      const headers = getAuthHeaders();
      if (!headers) return;

      try {
        const [profileRes, staffRes] = await Promise.all([
          fetch("http://localhost:3002/hospital/profile", { headers }),
          fetch("http://localhost:3002/hospital/staff", { headers }),
        ]);

        const profileData = await profileRes.json();
        const staffData = await staffRes.json();

        if (!profileRes.ok) {
          throw new Error(profileData.message || "Unable to load the hospital profile.");
        }

        setProfile(profileData);
        setContactPhone(profileData.contact_phone || "");
        setContactEmail(profileData.contact_email || "");
        setFacilityType(profileData.facility_type || "");
        setBedCapacity(profileData.bed_capacity ? String(profileData.bed_capacity) : "");
        setServicesOffered(profileData.services_offered || "");
        setStaff(staffRes.ok ? staffData : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load the hospital profile.");
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const headers = getAuthHeaders();
    if (!headers) return;

    setSaving(true);
    setFormError("");
    setSaved(false);

    try {
      const response = await fetch("http://localhost:3002/hospital/profile", {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          contactPhone: contactPhone.trim() || undefined,
          contactEmail: contactEmail.trim() || undefined,
          facilityType: facilityType.trim() || undefined,
          bedCapacity: bedCapacity ? Number(bedCapacity) : undefined,
          servicesOffered: servicesOffered.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update the hospital profile.");
      }

      setProfile(data);
      setSaved(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to update the hospital profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>

      <DashboardHeader title="Hospital Profile" />

      <div className="p-4 sm:p-8">

        {error && (
          <div className="mb-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (

          <p className="text-gray-500">Loading...</p>

        ) : profile ? (

          <div className="space-y-6">

            {/* Hospital Information + Registration Details */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">

              <div className="flex flex-wrap items-center gap-3">
                <p className="text-lg font-bold text-gray-900">{profile.hospital_name}</p>
                <StatusBadge domain="hospital" status={profile.status} />
              </div>

              <div className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-gray-500">Hospital Code</p>
                  <p className="font-semibold text-gray-900">{profile.hospital_code ?? "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500">License Number</p>
                  <p className="font-semibold text-gray-900">{profile.license_number ?? "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Registered</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(profile.created_at).toLocaleDateString("en-TZ")}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Location</p>
                  <p className="font-semibold text-gray-900">{profile.location ?? "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Region</p>
                  <p className="font-semibold text-gray-900">{profile.region ?? "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500">District</p>
                  <p className="font-semibold text-gray-900">{profile.district ?? "—"}</p>
                </div>
              </div>

            </div>

            {/* Facility Information — editable */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">

              <p className="text-lg font-bold text-gray-900">Facility Information</p>
              <p className="mt-1 text-sm text-gray-500">
                Contact details and facility info shown to Admin and used for member-facing listings.
              </p>

              {formError && (
                <div className="mt-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              {saved && (
                <div className="mt-4 rounded-lg bg-green-100 px-4 py-3 text-sm text-green-700">
                  Profile updated.
                </div>
              )}

              <form onSubmit={saveProfile} className="mt-4 grid gap-4 sm:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Contact Phone</label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Contact Email</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Facility Type</label>
                  <input
                    type="text"
                    value={facilityType}
                    onChange={(e) => setFacilityType(e.target.value)}
                    placeholder="e.g. General Hospital"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Bed Capacity</label>
                  <input
                    type="number"
                    min="1"
                    value={bedCapacity}
                    onChange={(e) => setBedCapacity(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Services Offered</label>
                  <textarea
                    value={servicesOffered}
                    onChange={(e) => setServicesOffered(e.target.value)}
                    rows={3}
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white
                    transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>

              </form>

            </div>

            {/* Authorized Users */}
            <div>
              <p className="mb-2 text-sm font-semibold text-gray-700">Authorized Users</p>

              {staff.length === 0 ? (

                <p className="text-sm text-gray-500">No staff accounts linked to this hospital yet.</p>

              ) : (

                <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-md">

                  <table className="w-full text-left text-sm">

                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-6 py-3 font-semibold">Name</th>
                        <th className="px-6 py-3 font-semibold">Email</th>
                        <th className="px-6 py-3 font-semibold">Status</th>
                        <th className="px-6 py-3 font-semibold">Added</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">

                      {staff.map((s) => (
                        <tr key={s.user_id}>
                          <td className="px-6 py-4 font-medium text-gray-900">
                            {s.first_name} {s.surname}
                          </td>
                          <td className="px-6 py-4 text-gray-600">{s.email ?? "—"}</td>
                          <td className="px-6 py-4 text-gray-600">{s.member_status}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                            {new Date(s.created_at).toLocaleDateString("en-TZ")}
                          </td>
                        </tr>
                      ))}

                    </tbody>

                  </table>

                </div>

              )}
            </div>

            {/* Security Settings — honest gap, same as Telecom/Bank's API section */}
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
              <p className="text-gray-600">Security Settings</p>
              <p className="mt-2 text-sm text-gray-400">
                Hospital has no API/webhook integration section like Bank and Telecom do — there&apos;s
                no external system calling into HSIMS on Hospital&apos;s behalf, so there&apos;s nothing
                to configure here yet.
              </p>
            </div>

          </div>

        ) : null}

      </div>

    </div>
  );
}
