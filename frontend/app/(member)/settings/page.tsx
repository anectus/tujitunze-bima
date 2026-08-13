
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";

interface TelecomOperator {
  operator_id: number;
  operator_name: string;
}

interface Bank {
  bank_id: number;
  bank_name: string;
}

const inputClass =
  "w-full rounded-lg border border-gray-300 px-4 py-3 " +
  "text-gray-900 outline-none transition " +
  "focus:border-blue-700 focus:ring-2 focus:ring-blue-200";

function useAuthHeaders() {
  const router = useRouter();

  return () => {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return null;
    }

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };
}

// =====================================================
// Change Password
// =====================================================

function ChangePasswordSection() {
  const getAuthHeaders = useAuthHeaders();

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.newPassword !== form.confirmNewPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (form.newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:3002/members/me/password",
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            currentPassword: form.currentPassword,
            newPassword: form.newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to change your password.");
      }

      setSuccess("Password changed successfully.");
      setForm({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">

      <p className="text-lg font-bold text-gray-900">Change Password</p>

      {error && (
        <div className="mt-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-lg bg-blue-100 px-4 py-3 text-sm text-blue-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">

        <div>
          <label
            htmlFor="currentPassword"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Current Password
          </label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            value={form.currentPassword}
            onChange={handleChange}
            autoComplete="current-password"
            required
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="newPassword"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            New Password
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            value={form.newPassword}
            onChange={handleChange}
            autoComplete="new-password"
            minLength={8}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="confirmNewPassword"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Confirm New Password
          </label>
          <input
            id="confirmNewPassword"
            name="confirmNewPassword"
            type="password"
            value={form.confirmNewPassword}
            onChange={handleChange}
            autoComplete="new-password"
            minLength={8}
            required
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-700 px-6 py-3 font-semibold
          text-white transition hover:bg-blue-800
          disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Saving..." : "Change Password"}
        </button>

      </form>

    </div>
  );
}

// =====================================================
// Add Phone Number — an income source for the wallet
// (mobile money). The registration number can be re-entered here too;
// the backend treats that as already-linked instead of an error.
// =====================================================

function AddPhoneNumberSection() {
  const getAuthHeaders = useAuthHeaders();

  const [operators, setOperators] = useState<TelecomOperator[]>([]);
  const [form, setForm] = useState({ operatorId: "", phoneNumber: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadOperators = async () => {
      try {
        const response = await fetch(
          "http://localhost:3002/members/telecom-operators"
        );
        if (response.ok) setOperators(await response.json());
      } catch {
        // Options list is a nice-to-have here; the form still submits.
      }
    };
    loadOperators();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:3002/members/phone-numbers",
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            operatorId: Number(form.operatorId),
            phoneNumber: form.phoneNumber,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to add this phone number.");
      }

      setSuccess(`${data.phoneNumber} was added to your account.`);
      setForm({ operatorId: "", phoneNumber: "" });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">

      <p className="text-lg font-bold text-gray-900">Add Phone Number</p>
      <p className="mt-1 text-sm text-gray-500">
        Link another mobile money number as a source for your wallet.
      </p>

      {error && (
        <div className="mt-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-lg bg-blue-100 px-4 py-3 text-sm text-blue-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">

        <div>
          <label
            htmlFor="operatorId"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Network
          </label>
          <select
            id="operatorId"
            name="operatorId"
            value={form.operatorId}
            onChange={handleChange}
            required
            className={inputClass}
          >
            <option value="" disabled>
              Select network
            </option>
            {operators.map((operator) => (
              <option key={operator.operator_id} value={operator.operator_id}>
                {operator.operator_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="phoneNumber"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Phone Number
          </label>
          <input
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            value={form.phoneNumber}
            onChange={handleChange}
            placeholder="0626881149"
            required
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-700 px-6 py-3 font-semibold
          text-white transition hover:bg-blue-800
          disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Adding..." : "Add Phone Number"}
        </button>

      </form>

    </div>
  );
}

// =====================================================
// Add Bank Account — another income source for the wallet.
// =====================================================

function AddBankAccountSection() {
  const getAuthHeaders = useAuthHeaders();

  const [banks, setBanks] = useState<Bank[]>([]);
  const [form, setForm] = useState({
    bankId: "",
    accountNumber: "",
    accountType: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadBanks = async () => {
      try {
        const response = await fetch("http://localhost:3002/members/banks");
        if (response.ok) setBanks(await response.json());
      } catch {
        // Options list is a nice-to-have here; the form still submits.
      }
    };
    loadBanks();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:3002/members/bank-accounts",
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            bankId: Number(form.bankId),
            accountNumber: form.accountNumber,
            accountType: form.accountType,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to add this bank account.");
      }

      setSuccess(`Account ${data.accountNumber} was added to your account.`);
      setForm({ bankId: "", accountNumber: "", accountType: "" });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">

      <p className="text-lg font-bold text-gray-900">Add Bank Account</p>
      <p className="mt-1 text-sm text-gray-500">
        Link another bank account as a source for your wallet.
      </p>

      {error && (
        <div className="mt-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-lg bg-blue-100 px-4 py-3 text-sm text-blue-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">

        <div>
          <label
            htmlFor="bankId"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Bank
          </label>
          <select
            id="bankId"
            name="bankId"
            value={form.bankId}
            onChange={handleChange}
            required
            className={inputClass}
          >
            <option value="" disabled>
              Select bank
            </option>
            {banks.map((bank) => (
              <option key={bank.bank_id} value={bank.bank_id}>
                {bank.bank_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="accountNumber"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Account Number
          </label>
          <input
            id="accountNumber"
            name="accountNumber"
            type="text"
            value={form.accountNumber}
            onChange={handleChange}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="accountType"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Account Type
          </label>
          <select
            id="accountType"
            name="accountType"
            value={form.accountType}
            onChange={handleChange}
            required
            className={inputClass}
          >
            <option value="" disabled>
              Select account type
            </option>
            <option value="Savings">Savings</option>
            <option value="Current">Current</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-700 px-6 py-3 font-semibold
          text-white transition hover:bg-blue-800
          disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Adding..." : "Add Bank Account"}
        </button>

      </form>

    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-white py-12 px-4">

      <div className="max-w-2xl mx-auto">

        <Link
          href="/profile"
          className="text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          ← Back to Profile
        </Link>

        <h1 className="mt-4 text-3xl font-bold text-gray-900">
          Settings
        </h1>

        <p className="mt-2 text-sm text-gray-600">
          Change your password, or add more phone numbers and bank
          accounts as income sources for your wallet. Your name, NIDA
          number, and email can&apos;t be changed here.
        </p>

        <div className="mt-8 space-y-6">
          <ChangePasswordSection />
          <AddPhoneNumberSection />
          <AddBankAccountSection />
        </div>

      </div>

    </div>
  );
}
