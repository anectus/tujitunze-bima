"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatisticCard from "@/components/cards/StatisticCard";

interface SuperAdminDashboardData {
  usersByRole: Record<string, number>;
  hospitalsByStatus: Record<string, number>;
  banksByStatus: Record<string, number>;
  operatorsByStatus: Record<string, number>;
  providersByStatus: Record<string, number>;
  roleCount: number;
  permissionCount: number;
  recentAuditLogCount: number;
}

function sumValues(record: Record<string, number>): number {
  return Object.values(record).reduce((sum, count) => sum + count, 0);
}

export default function SuperAdminDashboardPage() {
  const router = useRouter();

  const [data, setData] = useState<SuperAdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      const token = getAccessToken();

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:3002/super-admin/dashboard",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.status === 401 || response.status === 403) {
          router.push("/login");
          return;
        }

        const body = await response.json();

        if (!response.ok) {
          throw new Error(body.message || "Unable to load the dashboard.");
        }

        setData(body);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load the dashboard."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [router]);

  return (
    <div>

      <DashboardHeader title="Super-admin Dashboard" />

      <div className="p-4 sm:p-8">

        {error && (
          <div className="mb-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (

          <p className="text-gray-500">Loading dashboard...</p>

        ) : data ? (

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            <StatisticCard label="Members" value={data.usersByRole["Member"] ?? 0} />
            <StatisticCard label="Admins" value={data.usersByRole["Admin"] ?? 0} />
            <StatisticCard
              label="Hospital Staff"
              value={data.usersByRole["Hospital"] ?? 0}
            />
            <StatisticCard label="Bank Staff" value={data.usersByRole["Bank"] ?? 0} />
            <StatisticCard
              label="Telecom Staff"
              value={data.usersByRole["Telecom"] ?? 0}
            />
            <StatisticCard
              label="Insurance Staff"
              value={data.usersByRole["Insurance"] ?? 0}
            />

            <StatisticCard label="Hospitals" value={sumValues(data.hospitalsByStatus)} />
            <StatisticCard label="Banks" value={sumValues(data.banksByStatus)} />
            <StatisticCard
              label="Telecom Operators"
              value={sumValues(data.operatorsByStatus)}
            />
            <StatisticCard
              label="Insurance Providers"
              value={sumValues(data.providersByStatus)}
            />

            <StatisticCard label="Roles" value={data.roleCount} />
            <StatisticCard label="Permissions" value={data.permissionCount} />
            <StatisticCard
              label="Audit Log Entries (24h)"
              value={data.recentAuditLogCount}
            />

          </div>

        ) : null}

      </div>

    </div>
  );
}
