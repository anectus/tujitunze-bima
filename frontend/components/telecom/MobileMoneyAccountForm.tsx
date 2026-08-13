
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ACCESS_TOKEN_STORAGE_KEY } from "@/lib/utils/permissions";

interface TelecomOperator {
  operator_id: number;
  operator_name: string;
}

interface Bank {
  bank_id: number;
  bank_name: string;
}

interface MobileMoneyAccountEntry {
  operatorId: string;
  phoneNumber: string;
  accountNumber: string;
}

interface BankAccountEntry {
  bankId: string;
  accountNumber: string;
  accountType: string;
}

const inputClass =
  "w-full rounded-lg border border-gray-300 px-4 py-3 " +
  "text-gray-900 outline-none transition " +
  "focus:border-blue-700 focus:ring-2 focus:ring-blue-200";

const emptyEntry: MobileMoneyAccountEntry = {
  operatorId: "",
  phoneNumber: "",
  accountNumber: "",
};

export default function MobileMoneyAccountForm() {
  const router = useRouter();

  const [operators, setOperators] = useState<TelecomOperator[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);

  const [profile, setProfile] = useState({
    gender: "",
    dateOfBirth: "",
    region: "",
    district: "",
  });

  // The first mobile money account is required (the whole point of this
  // page); each further one only appears once the entry before it is
  // complete, so accounts are filled one at a time rather than all at once.
  const [accounts, setAccounts] = useState<MobileMoneyAccountEntry[]>([
    { ...emptyEntry },
  ]);

  // Bank accounts are entirely optional — none are shown until the user
  // chooses to add one.
  const [bankAccounts, setBankAccounts] = useState<BankAccountEntry[]>([]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadLookups = async () => {
      try {
        const [operatorsResponse, banksResponse] = await Promise.all([
          fetch("http://localhost:3002/members/telecom-operators"),
          fetch("http://localhost:3002/members/banks"),
        ]);

        if (operatorsResponse.ok) {
          setOperators(await operatorsResponse.json());
        }

        if (banksResponse.ok) {
          setBanks(await banksResponse.json());
        }
      } catch {
        setError("Unable to load network/bank options. Please try again.");
      }
    };

    loadLookups();
  }, []);

  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setProfile((previous) => ({ ...previous, [name]: value }));

    setError("");
    setSuccess("");
  };

  // =====================================================
  // Mobile money accounts
  // =====================================================

  const canAddAccount = accounts.every(
    (entry) => entry.operatorId && entry.phoneNumber.trim().length > 0
  );

  const addAccountEntry = () => {
    setAccounts((previous) => [...previous, { ...emptyEntry }]);
    setError("");
    setSuccess("");
  };

  const removeAccountEntry = (index: number) => {
    setAccounts((previous) => previous.filter((_, i) => i !== index));
  };

  const updateAccountEntry = (
    index: number,
    field: keyof MobileMoneyAccountEntry,
    value: string
  ) => {
    setAccounts((previous) =>
      previous.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry
      )
    );

    setError("");
    setSuccess("");
  };

  // =====================================================
  // Bank accounts — optional. Each entry reveals "Account Type" only
  // after its account number is filled, and "+ Add another" only
  // appears once every prior entry (bank + number + type) is complete.
  // =====================================================

  const canAddBankAccount = bankAccounts.every(
    (entry) =>
      entry.bankId && entry.accountNumber.trim().length > 0 && entry.accountType
  );

  const addBankAccountEntry = () => {
    setBankAccounts((previous) => [
      ...previous,
      { bankId: "", accountNumber: "", accountType: "" },
    ]);
    setError("");
    setSuccess("");
  };

  const removeBankAccountEntry = (index: number) => {
    setBankAccounts((previous) => previous.filter((_, i) => i !== index));
  };

  const updateBankAccountEntry = (
    index: number,
    field: keyof BankAccountEntry,
    value: string
  ) => {
    setBankAccounts((previous) =>
      previous.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry
      )
    );

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const token = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);

    if (!token) {
      router.push("/login");
      return;
    }

    const authHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    try {
      setLoading(true);

      // 1. Profile details
      const profileResponse = await fetch(
        "http://localhost:3002/members/me",
        {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify({
            gender: profile.gender,
            dateOfBirth: profile.dateOfBirth || undefined,
            region: profile.region,
            district: profile.district || undefined,
          }),
        }
      );

      const profileData = await profileResponse.json();

      if (!profileResponse.ok) {
        throw new Error(
          profileData.message || "Unable to save your profile details."
        );
      }

      // 2. Mobile money accounts — linked one at a time, in the order
      // the user filled them in.
      for (let index = 0; index < accounts.length; index += 1) {
        const entry = accounts[index];

        const response = await fetch(
          "http://localhost:3002/members/phone-numbers",
          {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
              operatorId: Number(entry.operatorId),
              phoneNumber: entry.phoneNumber,
              accountNumber: entry.accountNumber || undefined,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            accounts.length > 1
              ? `Mobile Money Account ${index + 1}: ${
                  data.message || "Unable to link this account."
                }`
              : data.message || "Unable to link this mobile money account."
          );
        }
      }

      // 3. Bank accounts — optional, also linked one at a time.
      for (let index = 0; index < bankAccounts.length; index += 1) {
        const entry = bankAccounts[index];

        const response = await fetch(
          "http://localhost:3002/members/bank-accounts",
          {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
              bankId: Number(entry.bankId),
              accountNumber: entry.accountNumber,
              accountType: entry.accountType,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            bankAccounts.length > 1
              ? `Bank Account ${index + 1}: ${
                  data.message || "Unable to link this bank account."
                }`
              : data.message || "Unable to link this bank account."
          );
        }
      }

      setSuccess("Your details were saved successfully.");

      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-12 px-4">

      <div className="max-w-2xl mx-auto">

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-10">

          <div className="text-center mb-8">

            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <span className="text-3xl">📱</span>
            </div>

            <h1 className="text-3xl font-bold text-gray-900">
              Complete Your Membership
            </h1>

            <p className="mt-2 text-gray-600">
              A few more details, then link a mobile money account so we can
              attribute your contributions.
            </p>

          </div>

          {error && (
            <div className="mb-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-lg bg-blue-100 px-4 py-3 text-sm text-blue-700">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Gender */}
            <div>
              <label
                htmlFor="gender"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Gender
              </label>

              <select
                id="gender"
                name="gender"
                value={profile.gender}
                onChange={handleProfileChange}
                required
                className={inputClass}
              >
                <option value="" disabled>
                  Select your gender
                </option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            {/* Date of Birth - Optional */}
            <div>
              <label
                htmlFor="dateOfBirth"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Date of Birth
                <span className="ml-2 text-xs font-normal text-gray-500">
                  (Optional)
                </span>
              </label>

              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={profile.dateOfBirth}
                onChange={handleProfileChange}
                autoComplete="bday"
                className={inputClass}
              />
            </div>

            {/* Mobile Money Accounts */}
            {accounts.map((entry, index) => (
              <div
                key={index}
                className={
                  accounts.length > 1
                    ? "rounded-lg border border-gray-200 p-4 space-y-6"
                    : "space-y-6"
                }
              >
                {accounts.length > 1 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700">
                      Mobile Money Account {index + 1}
                    </p>

                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeAccountEntry(index)}
                        className="text-xs font-medium text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                )}

                {/* Network */}
                <div>
                  <label
                    htmlFor={`operatorId-${index}`}
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Network
                  </label>

                  <select
                    id={`operatorId-${index}`}
                    value={entry.operatorId}
                    onChange={(e) =>
                      updateAccountEntry(index, "operatorId", e.target.value)
                    }
                    required
                    className={inputClass}
                  >
                    <option value="" disabled>
                      Select your network
                    </option>

                    {operators.map((operator) => (
                      <option
                        key={operator.operator_id}
                        value={operator.operator_id}
                      >
                        {operator.operator_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Phone Number */}
                <div>
                  <label
                    htmlFor={`phoneNumber-${index}`}
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Phone Number
                  </label>

                  <input
                    id={`phoneNumber-${index}`}
                    type="tel"
                    value={entry.phoneNumber}
                    onChange={(e) =>
                      updateAccountEntry(index, "phoneNumber", e.target.value)
                    }
                    placeholder="0626881149"
                    required
                    autoComplete="tel"
                    className={inputClass}
                  />

                  <p className="mt-1 text-xs text-gray-500">
                    Must match the network you selected above.
                  </p>
                </div>

                {/* Account Number - Optional, only once the number above is filled */}
                {entry.phoneNumber.trim().length > 0 && (
                  <div>
                    <label
                      htmlFor={`accountNumber-${index}`}
                      className="mb-2 block text-sm font-semibold text-gray-700"
                    >
                      Account Number
                      <span className="ml-2 text-xs font-normal text-gray-500">
                        (Optional)
                      </span>
                    </label>

                    <input
                      id={`accountNumber-${index}`}
                      type="text"
                      value={entry.accountNumber}
                      onChange={(e) =>
                        updateAccountEntry(
                          index,
                          "accountNumber",
                          e.target.value
                        )
                      }
                      placeholder="Enter your mobile money account number"
                      className={inputClass}
                    />
                  </div>
                )}
              </div>
            ))}

            {canAddAccount && (
              <button
                type="button"
                onClick={addAccountEntry}
                className="text-sm font-semibold text-blue-700 hover:text-blue-800"
              >
                + Add another mobile money account
              </button>
            )}

            {/* Region */}
            <div>
              <label
                htmlFor="region"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Region
              </label>

              <input
                id="region"
                name="region"
                type="text"
                value={profile.region}
                onChange={handleProfileChange}
                placeholder="Enter your region"
                required
                autoComplete="address-level1"
                className={inputClass}
              />
            </div>

            {/* District - Optional */}
            <div>
              <label
                htmlFor="district"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                District
                <span className="ml-2 text-xs font-normal text-gray-500">
                  (Optional)
                </span>
              </label>

              <input
                id="district"
                name="district"
                type="text"
                value={profile.district}
                onChange={handleProfileChange}
                placeholder="Enter your district"
                autoComplete="address-level2"
                className={inputClass}
              />
            </div>

            {/* Bank Accounts - Optional */}
            <div className="space-y-4">
              <p className="text-sm font-semibold text-gray-700">
                Bank Account
                <span className="ml-2 text-xs font-normal text-gray-500">
                  (Optional)
                </span>
              </p>

              {bankAccounts.map((entry, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-gray-200 p-4 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700">
                      Bank Account {index + 1}
                    </p>

                    <button
                      type="button"
                      onClick={() => removeBankAccountEntry(index)}
                      className="text-xs font-medium text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>

                  <div>
                    <label
                      htmlFor={`bank-${index}-bank`}
                      className="mb-2 block text-sm font-semibold text-gray-700"
                    >
                      Bank
                    </label>

                    <select
                      id={`bank-${index}-bank`}
                      value={entry.bankId}
                      onChange={(e) =>
                        updateBankAccountEntry(index, "bankId", e.target.value)
                      }
                      required
                      className={inputClass}
                    >
                      <option value="" disabled>
                        Select your bank
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
                      htmlFor={`bank-${index}-account-number`}
                      className="mb-2 block text-sm font-semibold text-gray-700"
                    >
                      Account Number
                    </label>

                    <input
                      id={`bank-${index}-account-number`}
                      type="text"
                      value={entry.accountNumber}
                      onChange={(e) =>
                        updateBankAccountEntry(
                          index,
                          "accountNumber",
                          e.target.value
                        )
                      }
                      placeholder="Enter your bank account number"
                      required
                      className={inputClass}
                    />
                  </div>

                  {entry.accountNumber.trim().length > 0 && (
                    <div>
                      <label
                        htmlFor={`bank-${index}-account-type`}
                        className="mb-2 block text-sm font-semibold text-gray-700"
                      >
                        Account Type
                      </label>

                      <select
                        id={`bank-${index}-account-type`}
                        value={entry.accountType}
                        onChange={(e) =>
                          updateBankAccountEntry(
                            index,
                            "accountType",
                            e.target.value
                          )
                        }
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
                  )}
                </div>
              ))}

              {canAddBankAccount && (
                <button
                  type="button"
                  onClick={addBankAccountEntry}
                  className="text-sm font-semibold text-blue-700 hover:text-blue-800"
                >
                  + Add {bankAccounts.length > 0 ? "another" : "a"} bank account
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-700 px-6 py-3.5
              text-lg font-semibold text-white transition
              hover:bg-blue-800 disabled:cursor-not-allowed
              disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save and Continue"}
            </button>

          </form>

        </div>

      </div>

    </div>
  );
}
