
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import StatusBadge from "@/components/common/StatusBadge";

interface TelecomOperator {
  operator_id: number;
  operator_name: string;
}

interface PhoneNumber {
  phoneId: number;
  phoneNumber: string;
  operatorId: number;
  accountNumber: string | null;
  isPrimary: boolean;
  phoneStatus: string;
}

interface AdminMemberDetail {
  userId: number;
  firstName: string;
  secondName: string | null;
  surname: string;
  email: string | null;
  nidaNumber: string;
  gender: string | null;
  dateOfBirth: string | null;
  address: string | null;
  region: string | null;
  district: string | null;
  memberStatus: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
  phoneNumbers: PhoneNumber[];
}

const STATUS_OPTIONS = ["Pending", "Active", "Suspended", "Inactive"];

export default function AdminMemberDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [member, setMember] = useState<AdminMemberDetail | null>(null);
  const [operators, setOperators] = useState<TelecomOperator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    const loadMember = async () => {
      const token = getAccessToken();

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const [memberResponse, operatorsResponse] = await Promise.all([
          fetch(`http://localhost:3002/admin/members/${params.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:3002/members/telecom-operators"),
        ]);

        if (memberResponse.status === 401 || memberResponse.status === 403) {
          router.push("/login");
          return;
        }

        const memberData = await memberResponse.json();

        if (!memberResponse.ok) {
          throw new Error(memberData.message || "Unable to load this member.");
        }

        setMember(memberData);

        if (operatorsResponse.ok) {
          setOperators(await operatorsResponse.json());
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load this member."
        );
      } finally {
        setLoading(false);
      }
    };

    loadMember();
  }, [params.id, router]);

  const handleStatusChange = async (status: string) => {
    const token = getAccessToken();
    if (!token || !member) return;

    setUpdatingStatus(true);
    setError("");

    try {
      const response = await fetch(
        `http://localhost:3002/admin/members/${member.userId}/status`,
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

      setMember((previous) =>
        previous ? { ...previous, memberStatus: status } : previous
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update status."
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const operatorName = (operatorId: number) =>
    operators.find((operator) => operator.operator_id === operatorId)
      ?.operator_name ?? "Unknown network";

  const fullName = member
    ? [member.firstName, member.secondName, member.surname]
        .filter(Boolean)
        .join(" ")
    : "";

  const initials = member
    ? `${member.firstName[0] ?? ""}${member.surname[0] ?? ""}`.toUpperCase()
    : "";

  return (
    <div className="min-h-screen bg-white py-12 px-4">

      <div className="max-w-2xl mx-auto">

        <Link
          href="/admin/members"
          className="text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          ← Back to Members
        </Link>

        <h1 className="mt-4 text-3xl font-bold text-gray-900">
          Member Details
        </h1>

        {loading && (
          <p className="mt-8 text-gray-500">Loading member...</p>
        )}

        {error && (
          <div className="mt-8 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {member && (
          <div className="mt-8 space-y-6">

            {/* Identity card */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">

              <div className="flex items-center justify-between gap-4">

                <div className="flex items-center gap-4">

                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">
                    {initials}
                  </div>

                  <div>
                    <p className="text-lg font-bold text-gray-900">
                      {fullName}
                    </p>

                    <div className="mt-1">
                      <StatusBadge domain="member" status={member.memberStatus} />
                    </div>
                  </div>

                </div>

                <select
                  value={member.memberStatus}
                  disabled={updatingStatus}
                  onChange={(e) => handleStatusChange(e.target.value)}
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

              </div>

              <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>
                  <dt className="text-xs font-semibold uppercase text-gray-500">
                    NIDA Number
                  </dt>
                  <dd className="mt-1 text-gray-900">{member.nidaNumber}</dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold uppercase text-gray-500">
                    Email
                  </dt>
                  <dd className="mt-1 text-gray-900">
                    {member.email || "Not provided"}
                    {member.email && (
                      <span className="ml-2 text-xs text-gray-500">
                        ({member.emailVerified ? "Verified" : "Unverified"})
                      </span>
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold uppercase text-gray-500">
                    Gender
                  </dt>
                  <dd className="mt-1 text-gray-900">
                    {member.gender || "Not provided"}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold uppercase text-gray-500">
                    Date of Birth
                  </dt>
                  <dd className="mt-1 text-gray-900">
                    {member.dateOfBirth || "Not provided"}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold uppercase text-gray-500">
                    Region
                  </dt>
                  <dd className="mt-1 text-gray-900">
                    {member.region || "Not provided"}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold uppercase text-gray-500">
                    District
                  </dt>
                  <dd className="mt-1 text-gray-900">
                    {member.district || "Not provided"}
                  </dd>
                </div>

                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase text-gray-500">
                    Address
                  </dt>
                  <dd className="mt-1 text-gray-900">
                    {member.address || "Not provided"}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold uppercase text-gray-500">
                    Registered
                  </dt>
                  <dd className="mt-1 text-gray-900">
                    {new Date(member.createdAt).toLocaleString("en-TZ")}
                  </dd>
                </div>

              </dl>

            </div>

            {/* Phone numbers */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">

              <p className="text-lg font-bold text-gray-900">
                Phone Numbers
              </p>

              {member.phoneNumbers.length === 0 ? (

                <p className="mt-4 text-sm text-gray-500">
                  No phone numbers linked.
                </p>

              ) : (

                <ul className="mt-4 divide-y divide-gray-100">

                  {member.phoneNumbers.map((phone) => (

                    <li
                      key={phone.phoneId}
                      className="flex items-center justify-between py-3"
                    >

                      <div>
                        <p className="font-semibold text-gray-900">
                          {phone.phoneNumber}
                          {phone.isPrimary && (
                            <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                              Primary
                            </span>
                          )}
                        </p>

                        <p className="text-sm text-gray-500">
                          {operatorName(phone.operatorId)}
                        </p>
                      </div>

                      <span className="text-sm text-gray-500">
                        {phone.phoneStatus}
                      </span>

                    </li>

                  ))}

                </ul>

              )}

            </div>

          </div>
        )}

      </div>

    </div>
  );
}
