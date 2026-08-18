"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

interface ActivityLog {
  audit_id: number;
  action_type: string;
  affected_table: string | null;
  affected_record_id: number | null;
  ip_address: string | null;
  created_at: string;
}

export default function HospitalAuditLogsPage() {
  const router = useRouter();

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    fetch("http://localhost:3002/hospital/activity-logs", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load audit logs.");
        }

        return data;
      })
      .then(setLogs)
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load audit logs."))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div>

      <DashboardHeader title="Audit & Security" />

      <div className="p-4 sm:p-8">

        {error && (
          <div className="mb-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (

          <p className="text-gray-500">Loading...</p>

        ) : (

          <div className="space-y-6">

            {/* User Activity, Verification Logs, and Claim Audit Trail all come from audit_logs */}
            <div>
              <p className="mb-2 text-sm font-semibold text-gray-700">
                User Activity &amp; Audit Trail
              </p>
              <p className="mb-2 text-sm text-gray-400">
                Covers member verifications, treatments, claim submissions/status changes, and
                profile updates by this hospital&apos;s own staff.
              </p>

              {logs.length === 0 ? (

                <p className="text-sm text-gray-500">No activity recorded yet.</p>

              ) : (

                <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-md">

                  <table className="w-full text-left text-sm">

                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-6 py-3 font-semibold">Action</th>
                        <th className="px-6 py-3 font-semibold">Table</th>
                        <th className="px-6 py-3 font-semibold">Record ID</th>
                        <th className="px-6 py-3 font-semibold">IP Address</th>
                        <th className="px-6 py-3 font-semibold">Date</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">

                      {logs.map((log) => (
                        <tr key={log.audit_id}>
                          <td className="px-6 py-4 font-medium text-gray-900">{log.action_type}</td>
                          <td className="px-6 py-4 text-gray-600">{log.affected_table ?? "—"}</td>
                          <td className="px-6 py-4 text-gray-600">{log.affected_record_id ?? "—"}</td>
                          <td className="px-6 py-4 text-gray-600">{log.ip_address ?? "—"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                            {new Date(log.created_at).toLocaleString("en-TZ")}
                          </td>
                        </tr>
                      ))}

                    </tbody>

                  </table>

                </div>

              )}
            </div>

            {/* Security Events — honest gap, same as Telecom/Bank's auth-log note */}
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
              <p className="text-gray-600">Security Events</p>
              <p className="mt-2 text-sm text-gray-400">
                Coming soon — login attempts aren&apos;t tracked anywhere in the system yet
                (the `sessions` table exists in the schema but nothing writes to it), so
                there&apos;s nothing hospital-specific to show here until that&apos;s built.
              </p>
            </div>

          </div>

        )}

      </div>

    </div>
  );
}
