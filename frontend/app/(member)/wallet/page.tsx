
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";

interface PhoneNumber {
  phoneId: number;
  phoneNumber: string;
  isPrimary: boolean;
}

interface Wallet {
  walletId: number;
  walletNumber: string;
  balance: number;
  walletStatus: string;
}

function formatTsh(amount: number) {
  return `TSh ${amount.toLocaleString("en-TZ", { minimumFractionDigits: 2 })}`;
}

export default function WalletPage() {
  const router = useRouter();

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showTopUp, setShowTopUp] = useState(false);
  const [phoneId, setPhoneId] = useState("");
  const [amount, setAmount] = useState("");
  const [topUpError, setTopUpError] = useState("");
  const [topUpSuccess, setTopUpSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const token = getAccessToken();

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const [walletResponse, profileResponse] = await Promise.all([
          fetch("http://localhost:3002/members/wallet", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:3002/members/me", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (walletResponse.status === 401 || profileResponse.status === 401) {
          router.push("/login");
          return;
        }

        const walletData = await walletResponse.json();
        const profileData = await profileResponse.json();

        if (!walletResponse.ok) {
          throw new Error(walletData.message || "Unable to load your wallet.");
        }

        setWallet(walletData);
        setPhoneNumbers(profileData.phoneNumbers || []);

        if (profileData.phoneNumbers?.length) {
          const primary = profileData.phoneNumbers.find(
            (p: PhoneNumber) => p.isPrimary
          );
          setPhoneId(String((primary || profileData.phoneNumbers[0]).phoneId));
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load your wallet."
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router]);

  const handleTopUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTopUpError("");
    setTopUpSuccess("");

    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }

    const parsedAmount = Number(amount);

    if (!phoneId) {
      setTopUpError("Choose which phone number to top up from.");
      return;
    }

    if (!parsedAmount || parsedAmount <= 0) {
      setTopUpError("Enter an amount greater than zero.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        "http://localhost:3002/members/wallet/topup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount: parsedAmount,
            sourceType: "phone",
            sourceId: Number(phoneId),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to top up your wallet.");
      }

      setWallet({
        walletId: data.walletId,
        walletNumber: data.walletNumber,
        balance: data.balance,
        walletStatus: data.walletStatus,
      });
      setTopUpSuccess(`${formatTsh(parsedAmount)} added to your wallet.`);
      setAmount("");
      setShowTopUp(false);
    } catch (err) {
      setTopUpError(
        err instanceof Error ? err.message : "Unable to top up your wallet."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-12 px-4">

      <div className="max-w-lg mx-auto">

        <Link
          href="/dashboard"
          className="text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          ← Back to Dashboard
        </Link>

        <h1 className="mt-4 text-3xl font-bold text-gray-900">
          Your Wallet
        </h1>

        <p className="mt-2 text-sm text-gray-600">
          Save a little at a time, straight from your phone — no bank
          account needed. Tujitunze is built for the{" "}
          <span className="italic">mtu wa kawaida</span>: top up whenever
          you can, however small.
        </p>

        {error && (
          <div className="mt-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (

          <p className="mt-8 text-gray-500">Loading your wallet...</p>

        ) : wallet ? (

          <>
            {/* One screen to check balance */}
            <div className="mt-8 rounded-2xl bg-blue-700 p-8 text-center text-white shadow-lg">

              <p className="text-sm font-medium text-blue-100">
                Available Balance
              </p>

              <p className="mt-2 text-4xl font-bold">
                {formatTsh(wallet.balance)}
              </p>

              <p className="mt-3 text-xs text-blue-100">
                Wallet {wallet.walletNumber}
              </p>

            </div>

            {topUpSuccess && !showTopUp && (
              <div className="mt-6 rounded-lg bg-blue-100 px-4 py-3 text-sm text-blue-700">
                {topUpSuccess}
              </div>
            )}

            {/* One button to top up */}
            {!showTopUp && (
              <button
                type="button"
                onClick={() => {
                  setShowTopUp(true);
                  setTopUpSuccess("");
                }}
                disabled={phoneNumbers.length === 0}
                className="mt-6 w-full rounded-lg bg-blue-700 py-4
                text-lg font-semibold text-white transition
                hover:bg-blue-800 disabled:cursor-not-allowed
                disabled:opacity-60"
              >
                Top Up
              </button>
            )}

            {phoneNumbers.length === 0 && !showTopUp && (
              <p className="mt-2 text-center text-xs text-gray-500">
                Add a phone number in your profile to top up.
              </p>
            )}

            {showTopUp && (
              <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-md">

                {topUpError && (
                  <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
                    {topUpError}
                  </div>
                )}

                <form onSubmit={handleTopUp} className="space-y-4">

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      From
                    </label>
                    <select
                      value={phoneId}
                      onChange={(e) => setPhoneId(e.target.value)}
                      className="w-full rounded-lg border border-gray-300
                      px-4 py-3 text-gray-900 outline-none transition
                      focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
                    >
                      {phoneNumbers.map((phone) => (
                        <option key={phone.phoneId} value={phone.phoneId}>
                          {phone.phoneNumber}
                          {phone.isPrimary ? " (Primary)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Amount (TSh)
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="e.g. 2000"
                      autoFocus
                      className="w-full rounded-lg border border-gray-300
                      px-4 py-3 text-gray-900 outline-none transition
                      focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
                    />
                  </div>

                  <div className="flex gap-3">

                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 rounded-lg bg-blue-700 py-3
                      font-semibold text-white transition hover:bg-blue-800
                      disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? "Sending..." : "Confirm Top Up"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowTopUp(false);
                        setTopUpError("");
                      }}
                      className="rounded-lg border border-gray-300 px-4
                      py-3 font-semibold text-gray-700 transition
                      hover:bg-gray-50"
                    >
                      Cancel
                    </button>

                  </div>

                </form>

              </div>
            )}

            <Link
              href="/wallet/transactions"
              className="mt-6 block text-center text-sm font-medium
              text-blue-700 hover:text-blue-800"
            >
              View transaction history →
            </Link>
          </>

        ) : null}

      </div>

    </div>
  );
}
