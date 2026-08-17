"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatusBadge from "@/components/common/StatusBadge";

interface Branch {
  branch_id: number;
  branch_code: string;
  branch_name: string;
  region: string | null;
  district: string | null;
  status: string;
}

interface BankProfile {
  bankId: number;
  bankName: string;
  bankCode: string | null;
  swiftCode: string | null;
  countryCode: string;
  apiEndpoint: string | null;
  status: string;
  contactPhone: string | null;
  contactEmail: string | null;
  branches: Branch[];
  apiKey: { hasKey: boolean; preview: string | null; generatedAt: string | null };
  webhook: { hasWebhook: boolean; url: string | null; secretGeneratedAt: string | null };
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

export default function BankProfilePage() {
  const getAuthHeaders = useAuthHeaders();

  const [profile, setProfile] = useState<BankProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [savingContact, setSavingContact] = useState(false);

  const [webhookUrl, setWebhookUrl] = useState("");
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [revealedSecret, setRevealedSecret] = useState<{ label: string; value: string } | null>(null);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      const headers = getAuthHeaders();
      if (!headers) return;

      try {
        const response = await fetch("http://localhost:3002/bank/profile", { headers });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load bank profile.");
        }

        setProfile(data);
        setContactPhone(data.contactPhone || "");
        setContactEmail(data.contactEmail || "");
        setWebhookUrl(data.webhook.url || "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load bank profile.");
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveContact = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const headers = getAuthHeaders();
    if (!headers) return;

    setSavingContact(true);
    setError("");

    try {
      const response = await fetch("http://localhost:3002/bank/profile/contact", {
        method: "PATCH",
        headers,
        body: JSON.stringify({ contactPhone, contactEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update contact information.");
      }

      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update contact information.");
    } finally {
      setSavingContact(false);
    }
  };

  const regenerateApiKey = async () => {
    const headers = getAuthHeaders();
    if (!headers) return;

    setError("");
    setRevealedSecret(null);

    try {
      const response = await fetch("http://localhost:3002/bank/profile/api-key/regenerate", {
        method: "POST",
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to regenerate the API key.");
      }

      setRevealedSecret({ label: "New API Key", value: data.apiKey });

      setProfile((current) =>
        current
          ? { ...current, apiKey: { hasKey: true, preview: data.preview, generatedAt: new Date().toISOString() } }
          : current
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to regenerate the API key.");
    }
  };

  const saveWebhook = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const headers = getAuthHeaders();
    if (!headers) return;

    setSavingWebhook(true);
    setError("");
    setRevealedSecret(null);

    try {
      const response = await fetch("http://localhost:3002/bank/profile/webhook", {
        method: "POST",
        headers,
        body: JSON.stringify({ webhookUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to configure the webhook.");
      }

      setRevealedSecret({ label: "Webhook Signing Secret", value: data.webhookSecret });

      setProfile((current) =>
        current
          ? {
              ...current,
              webhook: { hasWebhook: true, url: data.webhookUrl, secretGeneratedAt: new Date().toISOString() },
            }
          : current
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to configure the webhook.");
    } finally {
      setSavingWebhook(false);
    }
  };

  const testConnection = async () => {
    const headers = getAuthHeaders();
    if (!headers) return;

    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch("http://localhost:3002/bank/profile/connection-test", {
        method: "POST",
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        setTestResult({ success: false, message: data.message || "Connection test failed." });
        return;
      }

      setTestResult(data);
    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : "Connection test failed.",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div>

      <DashboardHeader title="Bank Profile" />

      <div className="p-4 sm:p-8">

        {error && (
          <div className="mb-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {revealedSecret && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p className="font-semibold">{revealedSecret.label} — shown once, store it now:</p>
            <code className="mt-1 block break-all rounded bg-white px-3 py-2 text-xs text-gray-900">
              {revealedSecret.value}
            </code>
          </div>
        )}

        {loading ? (

          <p className="text-gray-500">Loading...</p>

        ) : profile ? (

          <div className="space-y-6">

            {/* Bank Information */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">

              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-gray-900">{profile.bankName}</p>
                <StatusBadge domain="hospital" status={profile.status} />
              </div>

              <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>
                  <dt className="text-xs font-semibold uppercase text-gray-500">Bank Code</dt>
                  <dd className="mt-1 text-gray-900">{profile.bankCode || "—"}</dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold uppercase text-gray-500">SWIFT Code</dt>
                  <dd className="mt-1 text-gray-900">{profile.swiftCode || "—"}</dd>
                </div>

                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase text-gray-500">API Endpoint</dt>
                  <dd className="mt-1 text-gray-900">{profile.apiEndpoint || "Not configured"}</dd>
                </div>

              </dl>

            </div>

            {/* Branch Information */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">

              <p className="text-lg font-bold text-gray-900">Branch Information</p>

              {profile.branches.length === 0 ? (
                <p className="mt-2 text-sm text-gray-500">No branches on file.</p>
              ) : (
                <ul className="mt-4 divide-y divide-gray-100">
                  {profile.branches.map((branch) => (
                    <li key={branch.branch_id} className="py-3">
                      <p className="font-semibold text-gray-900">{branch.branch_name}</p>
                      <p className="text-sm text-gray-500">
                        {branch.branch_code} · {[branch.district, branch.region].filter(Boolean).join(", ") || "Location not on file"}
                      </p>
                    </li>
                  ))}
                </ul>
              )}

            </div>

            {/* Contact Information */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">

              <p className="text-lg font-bold text-gray-900">Contact Information</p>

              <form onSubmit={saveContact} className="mt-4 grid gap-4 sm:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Contact Phone</label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="0700000000"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Contact Email</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="ops@bank.co.tz"
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={savingContact}
                    className="rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white
                    transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingContact ? "Saving..." : "Save Contact Information"}
                  </button>
                </div>

              </form>

            </div>

            {/* Integration Status: API Credentials + Webhook + Connection Testing */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">

              <p className="text-lg font-bold text-gray-900">Integration Status</p>

              <div className="mt-4 flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                <span className="text-sm text-gray-700">
                  {profile.apiKey.hasKey
                    ? `Active API key ending •••• ${profile.apiKey.preview}`
                    : "No API key generated yet"}
                </span>

                <button
                  type="button"
                  onClick={regenerateApiKey}
                  className="text-sm font-semibold text-blue-700 hover:text-blue-800"
                >
                  {profile.apiKey.hasKey ? "Regenerate" : "Generate"}
                </button>
              </div>

              <div className="mt-4">
                <p className="text-sm font-semibold text-gray-700">Webhook</p>

                <form onSubmit={saveWebhook} className="mt-2 flex flex-wrap gap-3">
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://your-system.example.com/webhooks/tujitunze"
                    className={`${inputClass} flex-1 min-w-[240px]`}
                    required
                  />
                  <button
                    type="submit"
                    disabled={savingWebhook}
                    className="rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white
                    transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingWebhook ? "Saving..." : profile.webhook.hasWebhook ? "Update" : "Configure"}
                  </button>
                </form>
              </div>

              <div className="mt-6 border-t border-gray-100 pt-4">
                <p className="text-sm font-semibold text-gray-700">Connection Testing</p>

                <button
                  type="button"
                  onClick={testConnection}
                  disabled={testing || !profile.apiEndpoint}
                  className="mt-3 rounded-lg border border-gray-300 px-4 py-2 text-sm
                  font-semibold text-gray-700 transition hover:bg-gray-50
                  disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {testing ? "Testing..." : "Test Connection"}
                </button>

                {!profile.apiEndpoint && (
                  <p className="mt-2 text-xs text-gray-400">
                    No API endpoint configured — nothing to test yet.
                  </p>
                )}

                {testResult && (
                  <p className={`mt-3 text-sm ${testResult.success ? "text-green-700" : "text-red-700"}`}>
                    {testResult.success ? "✓" : "✗"} {testResult.message}
                  </p>
                )}
              </div>

            </div>

            {/* Security Settings */}
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
              <p className="text-gray-600">Security Settings</p>
              <p className="mt-2 text-sm text-gray-400">
                Coming soon — two-factor auth and session policy for staff accounts don&apos;t
                exist yet system-wide, not just for Bank.
              </p>
            </div>

          </div>

        ) : null}

      </div>

    </div>
  );
}
