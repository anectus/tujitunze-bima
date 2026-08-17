"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";

interface Hospital {
  hospital_id: number;
  hospital_name: string;
  hospital_code: string | null;
  location: string | null;
  region: string | null;
  district: string | null;
  contact_phone: string | null;
}

export default function HospitalsPage() {
  const router = useRouter();

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    const controller = new AbortController();

    const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";

    fetch(`http://localhost:3002/members/hospitals${query}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (response.status === 401) {
          router.push("/login");
          return null;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load hospitals.");
        }

        return data;
      })
      .then((data) => data && setHospitals(data))
      .catch((err) => {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message || "Unable to load hospitals.");
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [router, search]);

  return (
    <div className="min-h-screen bg-white py-12 px-4">

      <div className="max-w-3xl mx-auto">

        <Link
          href="/dashboard"
          className="text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          ← Back to Dashboard
        </Link>

        <h1 className="mt-4 text-3xl font-bold text-gray-900">
          Partner Hospitals
        </h1>

        <p className="mt-2 text-sm text-gray-600">
          Hospitals in the Tujitunze network.
        </p>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, region, or district"
          className="mt-6 w-full rounded-lg border border-gray-300 px-4 py-3
          text-gray-900 outline-none transition focus:border-blue-700
          focus:ring-2 focus:ring-blue-200"
        />

        {error && (
          <div className="mt-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (

          <p className="mt-8 text-gray-500">Loading...</p>

        ) : hospitals.length === 0 ? (

          <p className="mt-8 text-gray-500">No hospitals found.</p>

        ) : (

          <ul className="mt-6 divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md">

            {hospitals.map((hospital) => (

              <li key={hospital.hospital_id}>
                <Link
                  href={`/hospitals/${hospital.hospital_id}`}
                  className="block px-6 py-4 transition hover:bg-gray-50"
                >
                  <p className="font-semibold text-gray-900">
                    {hospital.hospital_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {[hospital.district, hospital.region].filter(Boolean).join(", ") || "Location not on file"}
                  </p>
                </Link>
              </li>

            ))}

          </ul>

        )}

      </div>

    </div>
  );
}
