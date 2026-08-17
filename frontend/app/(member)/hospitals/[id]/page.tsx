"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";

interface Hospital {
  hospital_id: number;
  hospital_name: string;
  hospital_code: string | null;
  location: string | null;
  region: string | null;
  district: string | null;
  contact_phone: string | null;
  status: string;
}

export default function HospitalDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    fetch(`http://localhost:3002/members/hospitals/${params.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        if (response.status === 401) {
          router.push("/login");
          return null;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load this hospital.");
        }

        return data;
      })
      .then((data) => data && setHospital(data))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Unable to load this hospital.")
      )
      .finally(() => setLoading(false));
  }, [params.id, router]);

  return (
    <div className="min-h-screen bg-white py-12 px-4">

      <div className="max-w-2xl mx-auto">

        <Link
          href="/hospitals"
          className="text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          ← Back to Hospitals
        </Link>

        {error && (
          <div className="mt-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (

          <p className="mt-8 text-gray-500">Loading...</p>

        ) : hospital ? (

          <div className="mt-4">

            <h1 className="text-3xl font-bold text-gray-900">
              {hospital.hospital_name}
            </h1>

            {hospital.hospital_code && (
              <p className="mt-1 text-sm text-gray-500">
                Code {hospital.hospital_code}
              </p>
            )}

            <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-md">

              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>
                  <dt className="text-xs font-semibold uppercase text-gray-500">
                    Location
                  </dt>
                  <dd className="mt-1 text-gray-900">
                    {hospital.location || "Not on file"}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold uppercase text-gray-500">
                    Region / District
                  </dt>
                  <dd className="mt-1 text-gray-900">
                    {[hospital.district, hospital.region].filter(Boolean).join(", ") || "Not on file"}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold uppercase text-gray-500">
                    Contact Phone
                  </dt>
                  <dd className="mt-1 text-gray-900">
                    {hospital.contact_phone || "Not on file"}
                  </dd>
                </div>

              </dl>

            </div>

            <Link
              href="/hospitals/appointments"
              className="mt-6 block text-center text-sm font-medium
              text-blue-700 hover:text-blue-800"
            >
              Book an appointment →
            </Link>

          </div>

        ) : null}

      </div>

    </div>
  );
}
