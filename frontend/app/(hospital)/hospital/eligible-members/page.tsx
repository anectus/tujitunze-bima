"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

interface EligibleMember {
  member_id: number;
  first_name: string;
  surname: string;
  member_status: string;
  policy_number: string | null;
  policy_status: string | null;
  plan_name: string | null;
  coverage_amount: string | null;
  last_verified_date: string;
}

export default function HospitalEligibleMembersPage() {
  const router = useRouter();

  const [members, setMembers] = useState<EligibleMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    fetch("http://localhost:3002/hospital/eligible-members", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load eligible members.");
        }

        return data;
      })
      .then(setMembers)
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load eligible members."))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div>

      <DashboardHeader title="Eligible Members" />

      <div className="p-4 sm:p-8">

        {error && (
          <div className="mb-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <p className="mb-4 text-sm text-gray-500">
          Members this hospital has already verified as &quot;Eligible&quot;, with their active
          insurance coverage where one exists. Verify a new member from{" "}
          <span className="font-semibold text-gray-700">Member Verification</span> to add them here.
        </p>

        {loading ? (

          <p className="text-gray-500">Loading...</p>

        ) : members.length === 0 ? (

          <p className="text-gray-500">No eligible members yet.</p>

        ) : (

          <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-md">

            <table className="w-full text-left text-sm">

              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-3 font-semibold">Member</th>
                  <th className="px-6 py-3 font-semibold">Account Status</th>
                  <th className="px-6 py-3 font-semibold">Policy Number</th>
                  <th className="px-6 py-3 font-semibold">Plan</th>
                  <th className="px-6 py-3 font-semibold">Coverage</th>
                  <th className="px-6 py-3 font-semibold">Last Verified</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">

                {members.map((m) => (
                  <tr key={m.member_id}>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {m.first_name} {m.surname}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{m.member_status}</td>
                    <td className="px-6 py-4 text-gray-600">{m.policy_number ?? "—"}</td>
                    <td className="px-6 py-4 text-gray-600">{m.plan_name ?? "—"}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {m.coverage_amount
                        ? `TSh ${Number(m.coverage_amount).toLocaleString("en-TZ")}`
                        : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {new Date(m.last_verified_date).toLocaleDateString("en-TZ")}
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
