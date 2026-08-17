"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import StatusBadge from "@/components/common/StatusBadge";
import { CLAIM_STATUS } from "@/constants/statuses";
import { getAccessToken } from "@/lib/utils/permissions";

type ClaimStatusKey = keyof typeof CLAIM_STATUS;

interface Claim {
  claim_id: number;
  claim_number: string;
  claim_amount: string;
  approved_amount: string | null;
  claim_status: ClaimStatusKey;
  claim_date: string;
  processed_date: string | null;
  remarks: string | null;
  hospital_id: number;
  hospital_name: string;
}

function formatTsh(amount: number) {
  return `TSh ${amount.toLocaleString("en-TZ")}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-TZ", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function InsuranceClaimsPage() {
  const router = useRouter();

  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    fetch("http://localhost:3002/members/claims", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        if (response.status === 401) {
          router.push("/login");
          return null;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load your claims.");
        }

        return data;
      })
      .then((data) => data && setClaims(data))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Unable to load your claims.")
      )
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="min-h-screen bg-white py-12 px-4">

      <div className="max-w-4xl mx-auto">

        <Link
          href="/dashboard"
          className="text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          ← Back to Dashboard
        </Link>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">

          <h1 className="text-3xl font-bold text-gray-900">
            Insurance Claims
          </h1>

          <Link
            href="/insurance/plans"
            className="text-sm font-medium text-blue-700 hover:text-blue-800"
          >
            View my insurance →
          </Link>

        </div>

        {error && (
          <div className="mt-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (

          <p className="mt-8 text-gray-500">Loading...</p>

        ) : claims.length === 0 ? (

          <div className="mt-8 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center">
            <p className="text-gray-600">You have no claims on file.</p>
            <p className="mt-2 text-sm text-gray-400">
              A claim appears here once a partner hospital submits one on your behalf.
            </p>
          </div>

        ) : (

          <div className="mt-8 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md">

            <table className="w-full text-left text-sm">

              <thead className="bg-white text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-3 font-semibold">Date</th>
                  <th className="px-6 py-3 font-semibold">Hospital</th>
                  <th className="px-6 py-3 font-semibold">Claim #</th>
                  <th className="px-6 py-3 font-semibold">Amount</th>
                  <th className="px-6 py-3 font-semibold">Approved</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">

                {claims.map((claim) => (

                  <tr key={claim.claim_id}>

                    <td className="px-6 py-4 text-gray-600">
                      {formatDate(claim.claim_date)}
                    </td>

                    <td className="px-6 py-4 text-gray-900">
                      {claim.hospital_name}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {claim.claim_number}
                    </td>

                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {formatTsh(Number(claim.claim_amount))}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {claim.approved_amount ? formatTsh(Number(claim.approved_amount)) : "—"}
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge domain="claim" status={claim.claim_status} />
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
