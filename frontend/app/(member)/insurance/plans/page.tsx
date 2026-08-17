"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import StatusBadge from "@/components/common/StatusBadge";
import { COVERAGE_STATUS } from "@/constants/statuses";
import { getAccessToken } from "@/lib/utils/permissions";

type CoverageStatusKey = keyof typeof COVERAGE_STATUS;

interface Policy {
  member_insurance_id: number;
  policy_number: string;
  start_date: string;
  end_date: string | null;
  policy_status: CoverageStatusKey;
  plan_name: string;
  premium_amount: string | null;
  coverage_amount: string | null;
  provider_name: string;
}

function formatTsh(amount: number) {
  return `TSh ${amount.toLocaleString("en-TZ")}`;
}

export default function MyInsurancePage() {
  const router = useRouter();

  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    fetch("http://localhost:3002/members/insurance", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        if (response.status === 401) {
          router.push("/login");
          return null;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load your insurance.");
        }

        return data;
      })
      .then((data) => data && setPolicies(data))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Unable to load your insurance.")
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
            My Insurance
          </h1>

          <Link
            href="/insurance/claims"
            className="text-sm font-medium text-blue-700 hover:text-blue-800"
          >
            View claims →
          </Link>

        </div>

        {error && (
          <div className="mt-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (

          <p className="mt-8 text-gray-500">Loading...</p>

        ) : policies.length === 0 ? (

          <div className="mt-8 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center">
            <p className="text-gray-600">You have no insurance policy on file.</p>
          </div>

        ) : (

          <div className="mt-8 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md">

            <table className="w-full text-left text-sm">

              <thead className="bg-white text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-3 font-semibold">Provider</th>
                  <th className="px-6 py-3 font-semibold">Plan</th>
                  <th className="px-6 py-3 font-semibold">Policy #</th>
                  <th className="px-6 py-3 font-semibold">Coverage</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">

                {policies.map((policy) => (

                  <tr key={policy.member_insurance_id}>

                    <td className="px-6 py-4 text-gray-900">
                      {policy.provider_name}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {policy.plan_name}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {policy.policy_number}
                    </td>

                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {policy.coverage_amount ? formatTsh(Number(policy.coverage_amount)) : "—"}
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge domain="coverage" status={policy.policy_status} />
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
