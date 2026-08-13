
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";

interface AuditLogEntry {
  auditId: number;
  memberId: number | null;
  actionType: string;
  affectedTable: string | null;
  affectedRecordId: number | null;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

export default function AdminAuditLogsPage() {
  const router = useRouter();

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadLogs = async () => {
      const token = getAccessToken();

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:3002/admin/audit-logs",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.status === 401 || response.status === 403) {
          router.push("/login");
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load audit logs.");
        }

        setLogs(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load audit logs."
        );
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, [router]);

  return (
    <div className="min-h-screen bg-white py-12 px-4">

      <div className="max-w-6xl mx-auto">

        <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>

        <p className="mt-2 text-sm text-gray-600">
          A record of sensitive writes across the platform — phone number
          and bank account linking, password changes, and Admin actions
          on member accounts.
        </p>

        {error && (
          <div className="mt-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (

          <p className="mt-8 text-gray-500">Loading audit logs...</p>

        ) : logs.length === 0 ? (

          <p className="mt-8 text-gray-500">No audit log entries yet.</p>

        ) : (

          <div className="mt-8 overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-md">

            <table className="w-full text-left text-sm">

              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-3 font-semibold">When</th>
                  <th className="px-6 py-3 font-semibold">Action</th>
                  <th className="px-6 py-3 font-semibold">Table</th>
                  <th className="px-6 py-3 font-semibold">Record ID</th>
                  <th className="px-6 py-3 font-semibold">Actor (User ID)</th>
                  <th className="px-6 py-3 font-semibold">IP Address</th>
                  <th className="px-6 py-3 font-semibold">Change</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">

                {logs.map((log) => (

                  <tr key={log.auditId}>

                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {new Date(log.createdAt).toLocaleString("en-TZ")}
                    </td>

                    <td className="px-6 py-4 font-medium text-gray-900">
                      {log.actionType}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {log.affectedTable || "—"}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {log.affectedRecordId ?? "—"}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {log.memberId ?? "—"}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {log.ipAddress || "—"}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {(log.oldValue || log.newValue) && (
                        <details>
                          <summary className="cursor-pointer text-blue-700 hover:text-blue-800">
                            View
                          </summary>
                          <pre className="mt-2 max-w-xs whitespace-pre-wrap break-words text-xs text-gray-500">
                            {log.oldValue &&
                              `old: ${JSON.stringify(log.oldValue)}\n`}
                            {log.newValue &&
                              `new: ${JSON.stringify(log.newValue)}`}
                          </pre>
                        </details>
                      )}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
}
