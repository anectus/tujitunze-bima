// Semantic status-color reference. Health-status colors (green/amber/red)
// are the same pattern WHO dashboards and most health-sector systems use,
// so reusing it here means a claim/coverage status is understandable at a
// glance without any legend. Domain status maps below are the single
// source of truth — components should never hardcode a status color
// inline, they should look it up here.

export type StatusTone = "success" | "warning" | "danger" | "neutral" | "info";

export interface StatusStyle {
  label: string;
  tone: StatusTone;
}

// The one place every tone's Tailwind classes are defined — Badge and
// StatusDot both read from this instead of hardcoding colors themselves.
export const STATUS_TONE_CLASSES: Record<
  StatusTone,
  { badgeClass: string; dotClass: string; textClass: string }
> = {
  success: {
    badgeClass: "bg-green-100 text-green-800 border border-green-200",
    dotClass: "bg-green-500",
    textClass: "text-green-700",
  },
  warning: {
    badgeClass: "bg-amber-100 text-amber-800 border border-amber-200",
    dotClass: "bg-amber-500",
    textClass: "text-amber-700",
  },
  danger: {
    badgeClass: "bg-red-100 text-red-800 border border-red-200",
    dotClass: "bg-red-500",
    textClass: "text-red-700",
  },
  neutral: {
    badgeClass: "bg-gray-100 text-gray-700 border border-gray-200",
    dotClass: "bg-gray-400",
    textClass: "text-gray-600",
  },
  info: {
    badgeClass: "bg-blue-100 text-blue-800 border border-blue-200",
    dotClass: "bg-blue-500",
    textClass: "text-blue-700",
  },
};

function statusStyle(label: string, tone: StatusTone): StatusStyle {
  return { label, tone };
}

// Insurance claim status
export const CLAIM_STATUS: Record<string, StatusStyle> = {
  draft: statusStyle("Draft", "neutral"),
  submitted: statusStyle("Submitted", "info"),
  under_review: statusStyle("Under Review", "warning"),
  pending: statusStyle("Pending", "warning"),
  approved: statusStyle("Approved", "success"),
  rejected: statusStyle("Rejected", "danger"),
  disputed: statusStyle("Disputed", "danger"),
};

// Insurance coverage / policy status
export const COVERAGE_STATUS: Record<string, StatusStyle> = {
  active: statusStyle("Active", "success"),
  pending_activation: statusStyle("Pending Activation", "info"),
  suspended: statusStyle("Suspended", "warning"),
  expired: statusStyle("Expired", "danger"),
};

// Wallet / bank / telecom transaction status
export const TRANSACTION_STATUS: Record<string, StatusStyle> = {
  completed: statusStyle("Completed", "success"),
  pending: statusStyle("Pending", "warning"),
  failed: statusStyle("Failed", "danger"),
  reversed: statusStyle("Reversed", "neutral"),
};

// Member account status — new registrations start "Pending" until
// verified (see backend members.service.ts register()).
export const MEMBER_STATUS: Record<string, StatusStyle> = {
  pending: statusStyle("Pending Verification", "warning"),
  active: statusStyle("Active", "success"),
  inactive: statusStyle("Inactive", "neutral"),
  suspended: statusStyle("Suspended", "danger"),
};

// Partner hospital operational status (Admin-managed directory).
export const HOSPITAL_STATUS: Record<string, StatusStyle> = {
  active: statusStyle("Active", "success"),
  inactive: statusStyle("Inactive", "neutral"),
  suspended: statusStyle("Suspended", "danger"),
};

export type StatusDomain =
  | "claim"
  | "coverage"
  | "transaction"
  | "member"
  | "hospital";

const STATUS_MAPS: Record<StatusDomain, Record<string, StatusStyle>> = {
  claim: CLAIM_STATUS,
  coverage: COVERAGE_STATUS,
  transaction: TRANSACTION_STATUS,
  member: MEMBER_STATUS,
  hospital: HOSPITAL_STATUS,
};

const FALLBACK_STATUS: StatusStyle = statusStyle("Unknown", "neutral");

// Falls back to a neutral "Unknown" style rather than throwing, since
// status values come from API responses and shouldn't ever crash a page.
// Lookup is case-insensitive because the backend stores statuses
// capitalized (e.g. "Active", "Pending") while the maps above are
// lowercase keys.
export function getStatusStyle(
  domain: StatusDomain,
  status: string
): StatusStyle {
  return STATUS_MAPS[domain][status.toLowerCase()] ?? FALLBACK_STATUS;
}
