"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatusBadge from "@/components/common/StatusBadge";

interface MemberPhone {
  phoneId: number;
  phoneNumber: string;
  isPrimary: boolean;
  phoneStatus: string;
}

interface Member {
  user_id: number;
  first_name: string;
  surname: string;
  member_status: string;
  phone_verified: boolean;
  phone_numbers: MemberPhone[];
}

const PAGE_SIZE = 20;

export default function TelecomMembersPage() {
  const router = useRouter();

  const [members, setMembers] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    fetch(`http://localhost:3002/telecom/members?page=${page}&pageSize=${PAGE_SIZE}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load registered members.");
        }

        return data;
      })
      .then((data) => {
        setMembers(data.items);
        setTotal(data.total);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Unable to load registered members.")
      )
      .finally(() => setLoading(false));
  }, [router, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>

      <DashboardHeader title="Registered Members" />

      <div className="p-4 sm:p-8">

        <p className="mb-4 text-sm text-gray-500">
          Members with at least one phone number on this operator&apos;s network.
        </p>

        {error && (
          <div className="mb-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (

          <p className="text-gray-500">Loading...</p>

        ) : members.length === 0 ? (

          <p className="text-gray-500">No members found on this network.</p>

        ) : (

          <>
            <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-md">

              <table className="w-full text-left text-sm">

                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Name</th>
                    <th className="px-6 py-3 font-semibold">Member Status</th>
                    <th className="px-6 py-3 font-semibold">Phone Numbers</th>
                    <th className="px-6 py-3 font-semibold">Membership Verification</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">

                  {members.map((member) => (

                    <tr key={member.user_id}>

                      <td className="px-6 py-4 font-medium text-gray-900">
                        {member.first_name} {member.surname}
                      </td>

                      <td className="px-6 py-4">
                        <StatusBadge domain="member" status={member.member_status} />
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {member.phone_numbers.map((phone) => (
                          <div key={phone.phoneId}>
                            {phone.phoneNumber}
                            {phone.isPrimary && (
                              <span className="ml-1 text-xs text-blue-700">(Primary)</span>
                            )}
                          </div>
                        ))}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {member.phone_verified ? "Verified" : "Not verified"}
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
  );
}
