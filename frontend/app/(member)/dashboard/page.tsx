
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { getAccessToken } from "@/lib/utils/permissions";
import Header from "@/components/common/Header";
import StatusBadge from "@/components/common/StatusBadge";

interface DashboardSection {
  href: string;
  title: string;
  description: string;
}

// Mirrors the 9-section Member Dashboard spec: My Profile, My Membership,
// Contribution, Health Fund Status, Healthcare Services, Hospital
// Verification, Claims, Notifications, Transaction History. "My
// Membership" and "Health Fund Status" both land on /membership since
// GET /members/membership already combines them into one summary.
const SECTIONS: DashboardSection[] = [
  {
    href: "/profile",
    title: "My Profile",
    description: "Personal information, phone numbers, and bank accounts.",
  },
  {
    href: "/membership",
    title: "My Membership",
    description: "Member ID, status, registration date, and eligibility.",
  },
  {
    href: "/wallet",
    title: "Contribution",
    description: "Make a contribution and see how much you've saved in total.",
  },
  
  {
    href: "/wallet/transactions",
    title: "Transaction History",
    description: "Every contribution and wallet transaction, filterable.",
  },
];

export default function DashboardPage() {
  // null while loading — a Member who hasn't submitted the
  // onboarding/mobile-money form yet (no `region` on their profile) shows
  // as Inactive here instead of being redirected straight into that form;
  // completing it lives in the account menu (top right) now.
  const [membershipComplete, setMembershipComplete] = useState<boolean | null>(
    null
  );

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      return;
    }

    fetch("http://localhost:3002/members/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((profile) => setMembershipComplete(!!profile && !!profile.region))
      .catch(() => setMembershipComplete(false));
  }, []);

  return (
    <>
      <Header />

      <div className="min-h-screen bg-white pt-32 pb-12 px-4">

        <div className="max-w-4xl mx-auto text-center">

          <div className="flex items-center justify-center gap-2">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome to Tujitunze
            </h1>

            {membershipComplete !== null && (
              <StatusBadge
                domain="member"
                status={membershipComplete ? "active" : "inactive"}
              />
            )}
          </div>

          {membershipComplete === false && (
            <p className="mt-2 text-gray-600">
              Your membership isn&apos;t complete yet. Finish it anytime from
              your account menu (top right) →{" "}
              <span className="font-semibold text-gray-800">
                Complete Membership
              </span>
              .
            </p>
          )}

          <div className="mt-8 grid gap-4 text-left sm:grid-cols-2 lg:grid-cols-3">

            {SECTIONS.map((section) => (

              <Link
                key={section.title}
                href={section.href}
                className="rounded-2xl border border-gray-100 bg-white p-6
                shadow-md transition hover:shadow-xl hover:-translate-y-1"
              >
                <p className="text-lg font-bold text-gray-900">
                  {section.title}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {section.description}
                </p>
              </Link>

            ))}

          </div>

        </div>

      </div>
    </>
  );
}
