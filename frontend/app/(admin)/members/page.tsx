
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import StatusBadge from "@/components/common/StatusBadge";

interface AdminMember {
  userId: number;
  firstName: string;
  secondName: string | null;
  surname: string;
  email: string | null;
  nidaNumber: string;
  memberStatus: string;
  createdAt: string;
}

const STATUS_OPTIONS = ["Pending", "Active", "Suspended", "Inactive"];

export default function AdminMembersPage() {
  const router = useRouter();

  const [members, setMembers] = useState<AdminMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    const loadMembers = async () => {
      const token = getAccessToken();

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch("http://localhost:3002/admin/members", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 401 || response.status === 403) {
          router.push("/login");
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load members.");
        }

        setMembers(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load members."
        );
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, [router]);

  const handleStatusChange = async (userId: number, status: string) => {
    const token = getAccessToken();
    if (!token) return;

    setUpdatingId(userId);
    setError("");

    try {
      const response = await fetch(
        `http://localhost:3002/admin/members/${userId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update status.");
      }

      setMembers((previous) =>
        previous.map((member) =>
          member.userId === userId
            ? { ...member, memberStatus: status }
            : member
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

        <h1 className="text-3xl font-bold text-gray-900">Members</h1>

        <p className="mt-2 text-sm text-gray-600">
          Operational oversight of registered Tujitunze members.
        </p>

        {error && (
          <div className="mt-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (

          <p className="mt-8 text-gray-500">Loading members...</p>

        ) : members.length === 0 ? (

          <p className="mt-8 text-gray-500">No members registered yet.</p>

        ) : (

          <div className="mt-8 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md">

            <table className="w-full text-left text-sm">

              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-3 font-semibold">Name</th>
                  <th className="px-6 py-3 font-semibold">NIDA Number</th>
                  <th className="px-6 py-3 font-semibold">Email</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Change Status</th>
                  <th className="px-6 py-3 font-semibold"></th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">

                {members.map((member) => (

                  <tr key={member.userId}>

                    <td className="px-6 py-4 text-gray-900">
                      {[member.firstName, member.secondName, member.surname]
                        .filter(Boolean)
                        .join(" ")}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {member.nidaNumber}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {member.email || "—"}
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge
                        domain="member"
                        status={member.memberStatus}
                      />
                    </td>

                    <td className="px-6 py-4">
                      <select
                        value={member.memberStatus}
                        disabled={updatingId === member.userId}
                        onChange={(e) =>
                          handleStatusChange(member.userId, e.target.value)
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

                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/members/${member.userId}`}
                        className="text-sm font-semibold text-blue-700 hover:text-blue-800"
                      >
                        View
                      </Link>
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
