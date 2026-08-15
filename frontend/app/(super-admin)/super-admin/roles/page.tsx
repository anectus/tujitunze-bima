"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

interface Permission {
  id: number;
  name: string;
  description: string | null;
}

interface Role {
  roleId: number;
  roleName: string;
  description: string | null;
  userCount: number;
  permissions: Permission[];
}

const EMPTY_FORM = {
  roleName: "",
  description: "",
};

// Mirrors CORE_ROLE_NAMES in super-admin-roles.service.ts — the backend is
// the real guard (returns 403), this only keeps the UI from offering an
// action that would just fail.
const CORE_ROLE_NAMES = [
  "Member",
  "Admin",
  "Hospital",
  "Bank",
  "Telecom",
  "Insurance",
  "Super-admin",
];

function extractMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "message" in body) {
    const message = (body as { message: unknown }).message;
    if (Array.isArray(message)) return message.join(" ");
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function SuperAdminRolesPage() {
  const router = useRouter();

  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [savingRoleId, setSavingRoleId] = useState<number | null>(null);
  const [saveError, setSaveError] = useState("");

  const [savingDetailsRoleId, setSavingDetailsRoleId] = useState<
    number | null
  >(null);
  const [detailsError, setDetailsError] = useState("");

  const [deletingRoleId, setDeletingRoleId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      const token = getAccessToken();

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const [rolesRes, permissionsRes] = await Promise.all([
          fetch("http://localhost:3002/super-admin/roles", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:3002/super-admin/permissions", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (rolesRes.status === 401 || permissionsRes.status === 401) {
          router.push("/login");
          return;
        }

        const rolesBody = await rolesRes.json();
        const permissionsBody = await permissionsRes.json();

        if (!rolesRes.ok) {
          throw new Error(extractMessage(rolesBody, "Unable to load roles."));
        }

        if (!permissionsRes.ok) {
          throw new Error(
            extractMessage(permissionsBody, "Unable to load permissions.")
          );
        }

        setRoles(rolesBody);
        setPermissions(permissionsBody);
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

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreateError("");

    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }

    setCreating(true);

    try {
      const response = await fetch("http://localhost:3002/super-admin/roles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          roleName: form.roleName,
          description: form.description || undefined,
        }),
      });

      const body = await response.json();

      if (!response.ok) {
        throw new Error(extractMessage(body, "Unable to create this role."));
      }

      setRoles((prev) => [...prev, body as Role]);
      setForm(EMPTY_FORM);
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "Unable to create this role."
      );
    } finally {
      setCreating(false);
    }
  };

  const togglePermission = (role: Role, permissionId: number) => {
    const has = role.permissions.some((p) => p.id === permissionId);
    const nextPermissionIds = has
      ? role.permissions.filter((p) => p.id !== permissionId).map((p) => p.id)
      : [...role.permissions.map((p) => p.id), permissionId];

    setRoles((prev) =>
      prev.map((r) =>
        r.roleId === role.roleId
          ? {
              ...r,
              permissions: permissions.filter((p) =>
                nextPermissionIds.includes(p.id)
              ),
            }
          : r
      )
    );
  };

  const saveRolePermissions = async (role: Role) => {
    setSaveError("");
    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }

    setSavingRoleId(role.roleId);

    try {
      const response = await fetch(
        `http://localhost:3002/super-admin/roles/${role.roleId}/permissions`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            permissionIds: role.permissions.map((p) => p.id),
          }),
        }
      );

      const body = await response.json();

      if (!response.ok) {
        throw new Error(extractMessage(body, "Unable to save permissions."));
      }

      setRoles((prev) =>
        prev.map((r) => (r.roleId === role.roleId ? (body as Role) : r))
      );
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Unable to save permissions."
      );
    } finally {
      setSavingRoleId(null);
    }
  };

  const updateRoleField = (
    roleId: number,
    field: "roleName" | "description",
    value: string
  ) => {
    setRoles((prev) =>
      prev.map((r) => (r.roleId === roleId ? { ...r, [field]: value } : r))
    );
  };

  const saveRoleDetails = async (role: Role) => {
    setDetailsError("");
    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }

    setSavingDetailsRoleId(role.roleId);

    try {
      const response = await fetch(
        `http://localhost:3002/super-admin/roles/${role.roleId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            roleName: role.roleName,
            description: role.description || undefined,
          }),
        }
      );

      const body = await response.json();

      if (!response.ok) {
        throw new Error(extractMessage(body, "Unable to save this role."));
      }

      setRoles((prev) =>
        prev.map((r) =>
          r.roleId === role.roleId ? { ...r, ...(body as Role) } : r
        )
      );
    } catch (err) {
      setDetailsError(
        err instanceof Error ? err.message : "Unable to save this role."
      );
    } finally {
      setSavingDetailsRoleId(null);
    }
  };

  const deleteRole = async (role: Role) => {
    setDeleteError("");

    if (
      !window.confirm(
        `Delete the "${role.roleName}" role? This cannot be undone.`
      )
    ) {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }

    setDeletingRoleId(role.roleId);

    try {
      const response = await fetch(
        `http://localhost:3002/super-admin/roles/${role.roleId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        const body = await response.json();
        throw new Error(extractMessage(body, "Unable to delete this role."));
      }

      setRoles((prev) => prev.filter((r) => r.roleId !== role.roleId));
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Unable to delete this role."
      );
    } finally {
      setDeletingRoleId(null);
    }
  };

  return (
    <div>

      <DashboardHeader title="Roles & Permissions" />

      <div className="p-4 sm:p-8">

        {loadError && (
          <div className="mb-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {loadError}
          </div>
        )}

        {saveError && (
          <div className="mb-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {saveError}
          </div>
        )}

        {detailsError && (
          <div className="mb-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {detailsError}
          </div>
        )}

        {deleteError && (
          <div className="mb-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {deleteError}
          </div>
        )}

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">

          <h2 className="text-lg font-bold text-gray-900">Create Role</h2>
          <p className="mt-1 text-sm text-gray-600">
            New roles start with no permissions — assign them below once created.
          </p>

          <form onSubmit={handleCreate} className="mt-6 grid gap-4 sm:grid-cols-2">

            <div>
              <label className="block text-sm font-medium text-gray-700">Role Name</label>
              <input
                required
                maxLength={50}
                value={form.roleName}
                onChange={(e) => setForm({ ...form, roleName: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <input
                maxLength={255}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>

            {createError && (
              <div className="sm:col-span-2 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
                {createError}
              </div>
            )}

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={creating}
                className="rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Role"}
              </button>
            </div>

          </form>

        </div>

        <div className="mt-8 space-y-6">

          {loading ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 text-sm text-gray-500 shadow-md">
              Loading...
            </div>
          ) : (
            roles.map((role) => {
              const isCoreRole = CORE_ROLE_NAMES.includes(role.roleName);

              return (
              <div
                key={role.roleId}
                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md"
              >

                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-[240px]">
                    {isCoreRole ? (
                      <>
                        <h3 className="text-base font-bold text-gray-900">
                          {role.roleName}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">
                          {role.description ?? "No description."}
                        </p>
                      </>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-2">
                        <input
                          value={role.roleName}
                          maxLength={50}
                          onChange={(e) =>
                            updateRoleField(
                              role.roleId,
                              "roleName",
                              e.target.value
                            )
                          }
                          className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-bold text-gray-900"
                        />
                        <input
                          value={role.description ?? ""}
                          maxLength={255}
                          placeholder="Description"
                          onChange={(e) =>
                            updateRoleField(
                              role.roleId,
                              "description",
                              e.target.value
                            )
                          }
                          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600"
                        />
                      </div>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      {role.userCount} account{role.userCount === 1 ? "" : "s"}
                      {isCoreRole && " · core platform role"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {!isCoreRole && (
                      <>
                        <button
                          type="button"
                          onClick={() => saveRoleDetails(role)}
                          disabled={savingDetailsRoleId === role.roleId}
                          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                        >
                          {savingDetailsRoleId === role.roleId
                            ? "Saving..."
                            : "Save Details"}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteRole(role)}
                          disabled={deletingRoleId === role.roleId}
                          className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          {deletingRoleId === role.roleId
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => saveRolePermissions(role)}
                      disabled={savingRoleId === role.roleId}
                      className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-50"
                    >
                      {savingRoleId === role.roleId ? "Saving..." : "Save Permissions"}
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {permissions.map((permission) => {
                    const checked = role.permissions.some(
                      (p) => p.id === permission.id
                    );
                    return (
                      <label
                        key={permission.id}
                        className="flex items-start gap-2 rounded-lg border border-gray-100 px-3 py-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePermission(role, permission.id)}
                          className="mt-0.5"
                        />
                        <span>
                          <span className="block font-medium text-gray-900">
                            {permission.name}
                          </span>
                          {permission.description && (
                            <span className="block text-xs text-gray-500">
                              {permission.description}
                            </span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>

              </div>
              );
            })
          )}

        </div>

      </div>

    </div>
  );
}
