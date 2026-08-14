export const ACCESS_TOKEN_STORAGE_KEY = "tujitunze_access_token";

export interface AccessTokenPayload {
  sub: number;
  roles: string[];
  firstName: string;
  iat: number;
  exp: number;
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

// Decodes the JWT payload only — does not verify the signature. This is a
// client-side UX convenience (deciding what to render); the backend is the
// only place a token's authenticity/roles are actually trusted.
export function decodeAccessToken(token: string): AccessTokenPayload | null {
  try {
    const payloadSegment = token.split(".")[1];

    const base64 = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");

    const json = atob(base64);

    return JSON.parse(json) as AccessTokenPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(payload: AccessTokenPayload): boolean {
  return payload.exp * 1000 <= Date.now();
}

export function hasRole(roles: string[], allowedRoles: string[]): boolean {
  return allowedRoles.some((role) => roles.includes(role));
}

// Where each role lands right after login. Staff roles go straight to
// their own dashboard; Member keeps the existing onboarding funnel as the
// default (also the fallback for a token with no recognized role).
const ROLE_DASHBOARD_PATHS: Record<string, string> = {
  Admin: "/admin/dashboard",
  Hospital: "/hospital/dashboard",
  Bank: "/bank/dashboard",
  Telecom: "/telecom/dashboard",
  Insurance: "/insurance/dashboard",
  "Super-admin": "/super-admin/dashboard",
};

// Returns the staff dashboard for a role that has one, or null if the
// token holds no such role (in practice: a plain Member) — callers decide
// the Member-specific landing page themselves, since that one depends on
// whether onboarding is already complete, not just the role name.
export function getStaffDashboardPath(roles: string[]): string | null {
  const staffRole = roles.find((role) => role in ROLE_DASHBOARD_PATHS);

  return staffRole ? ROLE_DASHBOARD_PATHS[staffRole] : null;
}
