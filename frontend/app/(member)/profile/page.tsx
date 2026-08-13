
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

interface MemberProfile {
  userId: number;
  firstName: string;
  secondName: string | null;
  surname: string;
  email: string | null;
  nidaNumber: string;
  memberStatus: string;
  phoneNumbers: PhoneNumber[];
}

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [operators, setOperators] = useState<TelecomOperator[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      const token = getAccessToken();

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const [profileResponse, operatorsResponse] = await Promise.all([
          fetch("http://localhost:3002/members/me", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:3002/members/telecom-operators"),
        ]);

        if (profileResponse.status === 401) {
          router.push("/login");
          return;
        }

        const profileData = await profileResponse.json();

        if (!profileResponse.ok) {
          throw new Error(
            profileData.message || "Unable to load your profile."
          );
        }

        setProfile(profileData);

        if (operatorsResponse.ok) {
          setOperators(await operatorsResponse.json());
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Unable to load your profile. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  const operatorName = (operatorId: number) =>
    operators.find((operator) => operator.operator_id === operatorId)
      ?.operator_name ?? "Unknown network";

  const fullName = profile
    ? [profile.firstName, profile.secondName, profile.surname]
        .filter(Boolean)
        .join(" ")
    : "";

  const initials = profile
    ? `${profile.firstName[0] ?? ""}${profile.surname[0] ?? ""}`.toUpperCase()
    : "";

  return (
    <div className="min-h-screen bg-white py-12 px-4">

      <div className="max-w-2xl mx-auto">

        <Link
          href="/dashboard"
          className="text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          ← Back to Dashboard
        </Link>

        <h1 className="mt-4 text-3xl font-bold text-gray-900">
          My Profile
        </h1>

        {loading && (
          <p className="mt-8 text-gray-500">Loading your profile...</p>
        )}

        {error && (
          <div className="mt-8 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {profile && (
          <div className="mt-8 space-y-6">

            {/* Identity card */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">

              <div className="flex items-center gap-4">

                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">
                  {initials}
                </div>

                <div>
                  <p className="text-lg font-bold text-gray-900">
                    {fullName}
                  </p>

                  <div className="mt-1">
                    <StatusBadge domain="member" status={profile.memberStatus} />
                  </div>
                </div>

              </div>

              <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>
                  <dt className="text-xs font-semibold uppercase text-gray-500">
                    NIDA Number
                  </dt>
                  <dd className="mt-1 text-gray-900">{profile.nidaNumber}</dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold uppercase text-gray-500">
                    Email
                  </dt>
                  <dd className="mt-1 text-gray-900">
                    {profile.email || "Not provided"}
                  </dd>
                </div>

              </dl>

            </div>

            {/* Phone numbers */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">

              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-gray-900">
                  Phone Numbers
                </p>

                <Link
                  href="/onboarding/mobile-money"
                  className="text-sm font-semibold text-blue-700 hover:text-blue-800"
                >
                  + Add another
                </Link>
              </div>

              <ul className="mt-4 divide-y divide-gray-100">

                {profile.phoneNumbers.map((phone) => (

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

            </div>

          </div>
        )}

      </div>

    </div>
  );
}
