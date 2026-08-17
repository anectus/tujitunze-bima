"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";

interface Verification {
  verification_id: number;
  verification_method: string;
  verification_result: string;
  member_status: string | null;
  verified_date: string;
  remarks: string | null;
  hospital_id: number;
  hospital_name: string;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-TZ", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function VerificationsPage() {
  const router = useRouter();

  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    fetch("http://localhost:3002/members/verifications", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        if (response.status === 401) {
          router.push("/login");
          return null;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load verification history.");
        }

        return data;
      })
      .then((data) => data && setVerifications(data))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Unable to load verification history.")
      )
      .finally(() => setLoading(false));
  }, [router]);

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
          Hospital Verification
        </h1>

        <p className="mt-2 text-sm text-gray-600">
          A record of every time a hospital verified your membership at check-in.
        </p>

        {error && (
          <div className="mt-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (

          <p className="mt-8 text-gray-500">Loading...</p>

        ) : verifications.length === 0 ? (

          <div className="mt-8 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center">
            <p className="text-gray-600">
              No hospital has verified your membership yet.
            </p>
            <p className="mt-2 text-sm text-gray-400">
              This fills in the first time you check in at a partner hospital.
            </p>
          </div>

        ) : (

          <div className="mt-8 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md">

            <table className="w-full text-left text-sm">

              <thead className="bg-white text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-3 font-semibold">Date</th>
                  <th className="px-6 py-3 font-semibold">Hospital</th>
                  <th className="px-6 py-3 font-semibold">Method</th>
                  <th className="px-6 py-3 font-semibold">Result</th>
                  <th className="px-6 py-3 font-semibold">Remarks</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">

                {verifications.map((verification) => (

                  <tr key={verification.verification_id}>
                    <td className="px-6 py-4 text-gray-600">
                      {formatDate(verification.verified_date)}
                    </td>
                    <td className="px-6 py-4 text-gray-900">
                      {verification.hospital_name}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {verification.verification_method}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {verification.verification_result}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {verification.remarks || "—"}
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
