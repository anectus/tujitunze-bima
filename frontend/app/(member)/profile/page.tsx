
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

interface Bank {
  bank_id: number;
  bank_name: string;
}

interface PhoneNumber {
  phoneId: number;
  phoneNumber: string;
  operatorId: number;
  accountNumber: string | null;
  isPrimary: boolean;
  phoneStatus: string;
}

interface BankAccount {
  memberBankAccountId: number;
  bankId: number;
  accountNumber: string;
  accountHolderName: string;
  accountType: string | null;
  isPrimary: boolean;
  accountStatus: string;
  verificationStatus: string;
}

interface MemberProfile {
  userId: number;
  firstName: string;
  secondName: string | null;
  surname: string;
  email: string | null;
  nidaNumber: string;
  memberStatus: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  phoneNumbers: PhoneNumber[];
  bankAccounts: BankAccount[];
}

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [operators, setOperators] = useState<TelecomOperator[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [settingPrimaryId, setSettingPrimaryId] = useState<number | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const token = getAccessToken();

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const [profileResponse, operatorsResponse, banksResponse] = await Promise.all([
          fetch("http://localhost:3002/members/me", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:3002/members/telecom-operators"),
          fetch("http://localhost:3002/members/banks"),
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

        if (banksResponse.ok) {
          setBanks(await banksResponse.json());
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

  // Update local state directly rather than refetching the whole profile —
  // the new primary is already known from a successful PATCH.
  const setPrimaryPhone = async (phoneId: number) => {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    setSettingPrimaryId(phoneId);

    try {
      await fetch(`http://localhost:3002/members/phone-numbers/${phoneId}/primary`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      setProfile((current) =>
        current
          ? {
              ...current,
              phoneNumbers: current.phoneNumbers.map((phone) => ({
                ...phone,
                isPrimary: phone.phoneId === phoneId,
              })),
            }
          : current
      );
    } finally {
      setSettingPrimaryId(null);
    }
  };

  const operatorName = (operatorId: number) =>
    operators.find((operator) => operator.operator_id === operatorId)
      ?.operator_name ?? "Unknown network";

  const bankName = (bankId: number) =>
    banks.find((bank) => bank.bank_id === bankId)?.bank_name ?? "Unknown bank";

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

                <div>
                  <dt className="text-xs font-semibold uppercase text-gray-500">
                    Email Verification
                  </dt>
                  <dd className="mt-1 text-gray-900">
                    {profile.emailVerified ? "Verified" : "Not verified"}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold uppercase text-gray-500">
                    Phone Verification
                  </dt>
                  <dd className="mt-1 text-gray-900">
                    {profile.phoneVerified ? "Verified" : "Not verified"}
                  </dd>
                </div>

              </dl>

              <Link
                href="/onboarding/mobile-money"
                className="mt-6 inline-block text-sm font-semibold text-blue-700 hover:text-blue-800"
              >
                Update permitted information →
              </Link>

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

                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">
                        {phone.phoneStatus}
                      </span>

                      {!phone.isPrimary && (
                        <button
                          type="button"
                          onClick={() => setPrimaryPhone(phone.phoneId)}
                          disabled={settingPrimaryId === phone.phoneId}
                          className="text-xs font-semibold text-blue-700
                          hover:text-blue-800 disabled:cursor-not-allowed
                          disabled:opacity-50"
                        >
                          {settingPrimaryId === phone.phoneId ? "Setting..." : "Set as primary"}
                        </button>
                      )}
                    </div>

                  </li>

                ))}

              </ul>

            </div>

            {/* Bank accounts */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">

              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-gray-900">
                  Bank Accounts
                </p>

                <Link
                  href="/onboarding/mobile-money"
                  className="text-sm font-semibold text-blue-700 hover:text-blue-800"
                >
                  + Add another
                </Link>
              </div>

              {profile.bankAccounts.length === 0 ? (

                <p className="mt-4 text-sm text-gray-500">
                  No bank account linked yet.
                </p>

              ) : (

                <ul className="mt-4 divide-y divide-gray-100">

                  {profile.bankAccounts.map((account) => (

                    <li
                      key={account.memberBankAccountId}
                      className="flex items-center justify-between py-3"
                    >

                      <div>
                        <p className="font-semibold text-gray-900">
                          {bankName(account.bankId)} · ····{account.accountNumber.slice(-4)}
                          {account.isPrimary && (
                            <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                              Primary
                            </span>
                          )}
                        </p>

                        <p className="text-sm text-gray-500">
                          {account.accountHolderName}
                        </p>
                      </div>

                      <span className="text-sm text-gray-500">
                        {account.verificationStatus}
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
