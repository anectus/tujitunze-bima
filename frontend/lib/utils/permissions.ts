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
