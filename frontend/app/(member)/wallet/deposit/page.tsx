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

function formatTsh(amount: number) {
  return `TSh ${amount.toLocaleString("en-TZ", { minimumFractionDigits: 2 })}`;
}

export default function WalletDepositPage() {
  const router = useRouter();

  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [phoneId, setPhoneId] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const token = getAccessToken();

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch("http://localhost:3002/members/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        const profile = await response.json();

        if (!response.ok) {
          throw new Error(profile.message || "Unable to load your phone numbers.");
        }

        const phones: PhoneNumber[] = profile.phoneNumbers || [];
        setPhoneNumbers(phones);

        if (phones.length) {
          const primary = phones.find((phone) => phone.isPrimary);
          setPhoneId(String((primary || phones[0]).phoneId));
        }
      } catch (err) {
        setLoadError(
          err instanceof Error ? err.message : "Unable to load your phone numbers."
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    const parsedAmount = Number(amount);

    if (!phoneId) {
      setError("Choose which phone number to deposit from.");
      return;
    }

    if (!parsedAmount || parsedAmount <= 0) {
      setError("Enter an amount greater than zero.");
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
        throw new Error(data.message || "Unable to deposit into your wallet.");
      }

      setSuccess(`${formatTsh(parsedAmount)} added to your wallet.`);
      setAmount("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to deposit into your wallet."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-12 px-4">

      <div className="max-w-lg mx-auto">

        <Link
          href="/wallet"
          className="text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          ← Back to Wallet
        </Link>

        <h1 className="mt-4 text-3xl font-bold text-gray-900">
          Deposit
        </h1>

        <p className="mt-2 text-sm text-gray-600">
          Add money to your wallet from a linked mobile money number.
        </p>

        {loadError && (
          <div className="mt-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {loadError}
          </div>
        )}

        {loading ? (

          <p className="mt-8 text-gray-500">Loading...</p>

        ) : (

          <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-md">

            {error && (
              <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 rounded-lg bg-blue-100 px-4 py-3 text-sm text-blue-700">
                {success}
              </div>
            )}

            {phoneNumbers.length === 0 ? (

              <p className="text-sm text-gray-500">
                Add a phone number in your{" "}
                <Link href="/profile" className="font-medium text-blue-700 hover:text-blue-800">
                  profile
                </Link>{" "}
                to deposit.
              </p>

            ) : (

              <form onSubmit={handleSubmit} className="space-y-4">

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
                    className="w-full rounded-lg border border-gray-300
                    px-4 py-3 text-gray-900 outline-none transition
                    focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-lg bg-blue-700 py-3
                  font-semibold text-white transition hover:bg-blue-800
                  disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Sending..." : "Confirm Deposit"}
                </button>

              </form>

            )}

          </div>

        )}

      </div>

    </div>
  );
}
