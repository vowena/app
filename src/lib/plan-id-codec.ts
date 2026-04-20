/**
 * Encode/decode Vowena plan IDs (u64) into short, URL-safe strings.
 *
 * The on-chain plan ID is a globally-incrementing integer (1, 2, 3, …),
 * but we never expose those raw values to merchants or subscribers — too
 * "beginner". Instead, every public surface uses an encoded form:
 *
 *   plan id 1   → "AAAB"
 *   plan id 42  → "AAAs"
 *   plan id 1000 → "AAR2"
 *   plan id 1M  → "AHJq"
 *
 * Properties:
 *   - Length scales gracefully: ~4 chars handles ~10M plans
 *   - Alphabet excludes ambiguous chars (I, O, l, 0, 1)
 *   - Padded to a minimum of 4 chars so very small IDs still look "designed"
 *   - Reversible: anyone with the encoded ID can fetch the plan from chain
 *   - Backward compatible: decode() also accepts plain numeric strings, so
 *     legacy /p/42 links keep working
 */

const ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
const BASE = ALPHABET.length; // 56
const MIN_LENGTH = 4;

export function encodePlanId(id: number): string {
  if (!Number.isFinite(id) || id < 0) return "";
  if (id === 0) return ALPHABET[0].repeat(MIN_LENGTH);

  let n = id;
  let s = "";
  while (n > 0) {
    s = ALPHABET[n % BASE] + s;
    n = Math.floor(n / BASE);
  }
  return s.padStart(MIN_LENGTH, ALPHABET[0]);
}

export function decodePlanId(input: string): number {
  if (!input) return NaN;

  // Back-compat: plain numeric strings (legacy URLs and direct copy/paste)
  if (/^\d+$/.test(input)) return parseInt(input, 10);

  let n = 0;
  for (const ch of input) {
    const i = ALPHABET.indexOf(ch);
    if (i < 0) return NaN;
    n = n * BASE + i;
  }
  return n;
}

/**
 * Build the canonical public checkout URL for a plan.
 */
export function planCheckoutUrl(planId: number, origin?: string): string {
  const path = `/p/${encodePlanId(planId)}`;
  if (typeof window !== "undefined" && !origin) {
    return `${window.location.origin}${path}`;
  }
  return `${origin ?? ""}${path}`;
}
