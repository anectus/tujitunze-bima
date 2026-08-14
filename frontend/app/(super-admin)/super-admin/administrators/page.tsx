"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import { formatNidaNumber } from "@/lib/utils/nida";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatusBadge from "@/components/common/StatusBadge";

const STAFF_ROLES = [
  "Admin",
  "Hospital",
  "Bank",
  "Telecom",
  "Insurance",
  "Super-admin",
] as const;

type StaffRole = (typeof STAFF_ROLES)[number];

const TENANT_ROLE_KEY: Partial<Record<StaffRole, keyof TenantOptions>> = {
  Hospital: "hospitals",
  Bank: "banks",
  Telecom: "telecomOperators",
  Insurance: "insuranceProviders",
};

interface Administrator {
  userId: number;
  firstName: string;
  secondName: string | null;
  surname: string;
  email: string | null;
  status: string;
  createdAt: string;
  role: string;
  tenantName: string | null;
}

interface TenantOption {
  id: number;
  name: string;
}

interface TenantOptions {
  hospitals: TenantOption[];
  banks: TenantOption[];
  telecomOperators: TenantOption[];
  insuranceProviders: TenantOption[];
}

const EMPTY_TENANTS: TenantOptions = {
  hospitals: [],
  banks: [],
  telecomOperators: [],
  insuranceProviders: [],
};

const EMPTY_FORM = {
  firstName: "",
  secondName: "",
  surname: "",
  email: "",
  nidaNumber: "",
  password: "",
  role: "Hospital" as StaffRole,
  tenantId: "",
};

function extractMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "message" in body) {
    const message = (body as { message: unknown }).message;
    if (Array.isArray(message)) return message.join(" ");
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function SuperAdminAdministratorsPage() {
  const router = useRouter();

  const [administrators, setAdministrators] = useState<Administrator[]>([]);
  const [tenants, setTenants] = useState<TenantOptions>(EMPTY_TENANTS);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      const token = getAccessToken();

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const [administratorsRes, tenantsRes] = await Promise.all([
          fetch("http://localhost:3002/super-admin/administrators", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:3002/super-admin/tenants", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (administratorsRes.status === 401 || tenantsRes.status === 401) {
          router.push("/login");
          return;
        }

        const administratorsBody = await administratorsRes.json();
        const tenantsBody = await tenantsRes.json();

        if (!administratorsRes.ok) {
          throw new Error(
            extractMessage(administratorsBody, "Unable to load administrators.")
          );
        }

        if (!tenantsRes.ok) {
          throw new Error(extractMessage(tenantsBody, "Unable to load tenants."));
        }

        setAdministrators(administratorsBody);
        setTenants(tenantsBody);
      } catch (err) {
        setLoadError(
          err instanceof Error ? err.message : "Unable to load this page."
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const tenantOptionsForRole = (role: StaffRole): TenantOption[] => {
    const key = TENANT_ROLE_KEY[role];
    return key ? tenants[key] : [];
  };

  const requiresTenant = Boolean(TENANT_ROLE_KEY[form.role]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");

    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }

    if (requiresTenant && !form.tenantId) {
      setFormError(`Select which ${form.role} this account belongs to.`);
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        "http://localhost:3002/super-admin/administrators",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            firstName: form.firstName,
            secondName: form.secondName || undefined,
            surname: form.surname,
            email: form.email,
            nidaNumber: form.nidaNumber,
            password: form.password,
            role: form.role,
            tenantId: requiresTenant ? Number(form.tenantId) : undefined,
          }),
        }
      );

      const body = await response.json();

      if (!response.ok) {
        throw new Error(extractMessage(body, "Unable to create this account."));
      }

      setAdministrators((prev) => [
        {
          userId: body.userId,
          firstName: body.firstName,
          secondName: body.secondName,
          surname: body.surname,
          email: body.email,
          status: body.memberStatus,
          createdAt: body.createdAt,
          role: body.role,
          tenantName:
            tenantOptionsForRole(form.role).find(
              (option) => option.id === Number(form.tenantId)
            )?.name ?? null,
        },
        ...prev,
      ]);

      setForm(EMPTY_FORM);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Unable to create this account."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>

      <DashboardHeader title="Administrators" />

      <div className="p-4 sm:p-8">

        {loadError && (
          <div className="mb-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {loadError}
          </div>
        )}

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">

          <h2 className="text-lg font-bold text-gray-900">Create Administrator</h2>
          <p className="mt-1 text-sm text-gray-600">
            Provision a staff account for Admin, Hospital, Bank, Telecom,
            Insurance, or Super-admin. Member accounts are created only
            through registration.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">

            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Surname</label>
              <input
                required
                value={form.surname}
                onChange={(e) => setForm({ ...form, surname: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">NIDA Number</label>
              <input
                required
                value={form.nidaNumber}
                onChange={(e) =>
                  setForm({ ...form, nidaNumber: formatNidaNumber(e.target.value) })
                }
                placeholder="00000000-00000-00000-00"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                required
                type="password"
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select
                value={form.role}
                onChange={(e) =>
                  setForm({
                    ...form,
                    role: e.target.value as StaffRole,
                    tenantId: "",
                  })
                }
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                {STAFF_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            {requiresTenant && (
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  {form.role}
                </label>
                <select
                  required
                  value={form.tenantId}
                  onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                >
                  <option value="">Select {form.role.toLowerCase()}...</option>
                  {tenantOptionsForRole(form.role).map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formError && (
              <div className="sm:col-span-2 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            )}

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Create Administrator"}
              </button>
            </div>

          </form>

        </div>

        <div className="mt-8 overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-md">

          <table className="w-full text-left text-sm">

            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-6 py-3 font-semibold">Name</th>
                <th className="px-6 py-3 font-semibold">Email</th>
                <th className="px-6 py-3 font-semibold">Role</th>
                <th className="px-6 py-3 font-semibold">Tenant</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Created</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">

              {loading ? (
                <tr>
                  <td className="px-6 py-4 text-gray-500" colSpan={6}>
                    Loading...
                  </td>
                </tr>
              ) : administrators.length === 0 ? (
                <tr>
                  <td className="px-6 py-4 text-gray-500" colSpan={6}>
                    No staff accounts yet.
                  </td>
                </tr>
              ) : (
                administrators.map((admin) => (
                  <tr key={admin.userId}>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {admin.firstName} {admin.surname}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{admin.email}</td>
                    <td className="px-6 py-4 text-gray-600">{admin.role}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {admin.tenantName ?? "—"}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge domain="member" status={admin.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {new Date(admin.createdAt).toLocaleDateString("en-TZ")}
                    </td>
                  </tr>
                ))
              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}
