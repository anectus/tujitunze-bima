"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import StatusBadge from "@/components/common/StatusBadge";

interface Coverage {
  policyNumber: string;
  status: string;
  planName: string;
  providerName: string;
  coverageAmount: number | null;
}

interface Membership {
  memberId: string;
  memberStatus: string;
  registrationDate: string;
  onboardingComplete: boolean;
  healthcareEligible: boolean;
  fundStatus: {
    balance: number;
    walletStatus: string;
  };
  contributionStatus: {
    hasContributed: boolean;
    lastContributionDate: string | null;
    totalContributed: number;
  };
  coverage: Coverage | null;
}

function formatTsh(amount: number) {
  return `TSh ${amount.toLocaleString("en-TZ", { minimumFractionDigits: 2 })}`;
}

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString("en-TZ", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function MembershipPage() {
  const router = useRouter();

  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    fetch("http://localhost:3002/members/membership", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        if (response.status === 401) {
          router.push("/login");
          return null;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load your membership.");
        }

        return data;
      })
      .then((data) => data && setMembership(data))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Unable to load your membership.")
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
          My Membership
        </h1>

        {error && (
          <div className="mt-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (

          <p className="mt-8 text-gray-500">Loading...</p>

        ) : membership ? (

          <div className="mt-8 space-y-6">

            {/* Membership card */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    Member ID
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {membership.memberId}
                  </p>
                </div>

                <StatusBadge domain="member" status={membership.memberStatus} />
              </div>

              <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>
                  <dt className="text-xs font-semibold uppercase text-gray-500">
                    Registration Date
                  </dt>
                  <dd className="mt-1 text-gray-900">
                    {formatDate(membership.registrationDate)}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold uppercase text-gray-500">
                    Onboarding
                  </dt>
                  <dd className="mt-1 text-gray-900">
                    {membership.onboardingComplete ? "Complete" : "Not complete"}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold uppercase text-gray-500">
                    Healthcare Eligibility
                  </dt>
                  <dd className="mt-1 text-gray-900">
                    {membership.healthcareEligible
                      ? "Eligible — your membership is Active"
                      : "Not yet eligible — membership must be Active"}
                  </dd>
                </div>

              </dl>

            </div>

            {/* Health Fund Status card */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">

              <p className="text-lg font-bold text-gray-900">
                Health Fund Status
              </p>

              <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>
                  <dt className="text-xs font-semibold uppercase text-gray-500">
                    Health Wallet Balance
                  </dt>
                  <dd className="mt-1 text-xl font-bold text-gray-900">
                    {formatTsh(membership.fundStatus.balance)}
                  </dd>
                  <dd className="text-xs text-gray-500">
                    {membership.fundStatus.walletStatus}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold uppercase text-gray-500">
                    Total Contributed
                  </dt>
                  <dd className="mt-1 text-xl font-bold text-gray-900">
                    {formatTsh(membership.contributionStatus.totalContributed)}
                  </dd>
                  <dd className="text-xs text-gray-500">
                    {membership.contributionStatus.hasContributed
                      ? `Last contribution ${formatDate(membership.contributionStatus.lastContributionDate)}`
                      : "No contributions yet"}
                  </dd>
                </div>

              </dl>

              <div className="mt-6 border-t border-gray-100 pt-4">

                <p className="text-xs font-semibold uppercase text-gray-500">
                  Insurance Coverage
                </p>

                {membership.coverage ? (
                  <div className="mt-2 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {membership.coverage.planName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {membership.coverage.providerName} · Policy{" "}
                        {membership.coverage.policyNumber}
                      </p>
                    </div>
                    <StatusBadge domain="coverage" status={membership.coverage.status} />
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-gray-500">
                    No active insurance policy on file.
                  </p>
                )}

              </div>

              <Link
                href="/wallet"
                className="mt-6 block text-center text-sm font-medium
                text-blue-700 hover:text-blue-800"
              >
                Make a contribution →
              </Link>

            </div>

          </div>

        ) : null}

      </div>

    </div>
  );
}
