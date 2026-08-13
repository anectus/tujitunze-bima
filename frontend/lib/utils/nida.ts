// Tanzania NIDA number: 20 digits, grouped 8-5-5-2 with dashes
// (e.g. 20030707-35805-00002-26). The user only ever types digits — this
// inserts the dashes automatically as they type, and strips anything that
// isn't a digit (pasted dashes/spaces included).

export const NIDA_DIGIT_COUNT = 20;

export const NIDA_FORMATTED_LENGTH = 23; // 20 digits + 3 dashes

export const NIDA_PATTERN = /^\d{8}-\d{5}-\d{5}-\d{2}$/;

export function formatNidaNumber(rawValue: string): string {
  const digits = rawValue.replace(/\D/g, "").slice(0, NIDA_DIGIT_COUNT);

  const groups = [
    digits.slice(0, 8),
    digits.slice(8, 13),
    digits.slice(13, 18),
    digits.slice(18, 20),
  ].filter((group) => group.length > 0);

  return groups.join("-");
}
