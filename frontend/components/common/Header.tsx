"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/hooks/useAuth";
import { getAccessToken } from "@/lib/utils/permissions";

export default function Header() {
  const router = useRouter();
  const { isAuthenticated, roles, firstName, logout } = useAuth();

  const [needsMembershipCompletion, setNeedsMembershipCompletion] =
    useState(false);

  // Registration only ever collects name/NIDA/phone/password — `region` is
  // set solely by the onboarding/mobile-money form's PATCH /members/me
  // (see MobileMoneyAccountForm.tsx), so its presence is a reliable signal
  // that a member has already been through onboarding at least once. A
  // Member who hasn't yet gets a "Complete Membership" entry here instead
  // of being redirected straight into that form after login.
  useEffect(() => {
    if (!isAuthenticated || !roles.includes("Member")) {
      setNeedsMembershipCompletion(false);
      return;
    }

    const token = getAccessToken();

    if (!token) {
      return;
    }

    fetch("http://localhost:3002/members/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((profile) => setNeedsMembershipCompletion(!!profile && !profile.region))
      .catch(() => setNeedsMembershipCompletion(false));
  }, [isAuthenticated, roles]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="bg-white shadow-md fixed top-0 left-0 w-full z-50">

      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Logo */}
        <div>
          <Link 
            href="/"
            className="text-2xl font-bold text-blue-700"
          >
            Tujitunze
          </Link>

          <p className="text-xs text-gray-500">
            Health Savings & Insurance Management System
          </p>
        </div>


        {/* Navigation Menu */}
        <nav className="hidden md:flex space-x-8">

          <Link 
            href="/"
            className="text-gray-700 hover:text-blue-700"
          >
            Home
          </Link>


          <Link 
            href="/about"
            className="text-gray-700 hover:text-blue-700"
          >
            About
          </Link>


          <Link
            href="/services"
            className="text-gray-700 hover:text-blue-700"
          >
            Services
          </Link>

        </nav>


        {/* Authentication Buttons */}
        <div className="flex gap-3">

          {isAuthenticated ? (

            <div className="relative group">

              <button
                type="button"
                className="
                flex
                items-center
                gap-2
                border
                border-blue-700
                text-blue-700
                px-5 py-2
                rounded-lg
                group-hover:bg-blue-700
                group-hover:text-white
                transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                  />
                </svg>
                {firstName || "Profile"}
              </button>

              {/* Hover dropdown — pt-2 (not the button's own margin) keeps
                  the hoverable area continuous down to the menu, so moving
                  the cursor from the button into the menu doesn't lose
                  :hover along the way. */}
              <div
                className="
                absolute
                right-0
                top-full
                w-48
                pt-2
                opacity-0
                invisible
                group-hover:opacity-100
                group-hover:visible
                transition"
              >

                <div className="rounded-lg border border-gray-100 bg-white py-2 shadow-xl">

                  {needsMembershipCompletion && (
                    <Link
                      href="/onboarding/mobile-money"
                      className="block px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50"
                    >
                      Complete Membership
                    </Link>
                  )}

                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-700"
                  >
                    Profile
                  </Link>

                  <Link
                    href="/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-700"
                  >
                    Settings
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-700"
                  >
                    Log Out
                  </button>

                </div>

              </div>

            </div>

          ) : (

            <Link
              href="/register"
              className="
              bg-blue-700
              text-white
              px-5 py-2
              rounded-lg
              hover:bg-blue-800
              transition"
            >
             Sign Up
            </Link>

          )}

        </div>

      </div>

    </header>
  );
}
