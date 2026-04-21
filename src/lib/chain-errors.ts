/**
 * Translate cryptic Soroban / Stellar chain errors into one-line, user-facing
 * messages. Anywhere the dashboard catches an error from the chain it should
 * pass it through `formatChainError(err)` before surfacing to the UI.
 *
 * Three classes of errors are normalized:
 *   1. Vowena contract errors (Error(Contract, #N) where N is a VowenaError code)
 *   2. Stellar Asset Contract (SAC) errors (token transfers, allowances, etc.)
 *   3. Network/Horizon/RPC errors (timeouts, account-not-found, etc.)
 *
 * Anything we can't classify falls back to a single short sentence rather
 * than dumping the raw HostError stack into the UI.
 */

/** Vowena contract error codes — must match protocol/src/errors.rs */
const VOWENA_ERRORS: Record<number, string> = {
  1: "Vowena is already initialized.",
  2: "Vowena hasn't been initialized yet.",
  3: "Amount must be greater than zero.",
  4: "Period must be greater than zero.",
  5: "Price ceiling can't be less than the plan's amount.",
  6: "Plan not found. The link may be outdated or the plan was deleted.",
  7: "This plan is no longer active.",
  8: "Subscription not found.",
  9: "You're not authorized to do that.",
  10: "The new amount exceeds the plan's price ceiling.",
  11: "Merchant mismatch — this plan belongs to a different account.",
  12: "There's no pending migration to act on.",
  13: "This subscription isn't paused.",
};

/** Patterns from the Stellar Asset Contract / Stellar core */
const PATTERN_MAP: Array<{
  match: RegExp;
  message: string;
}> = [
  // Token contract errors
  {
    match: /trustline entry is missing/i,
    message:
      "Your wallet doesn't have a USDC trustline yet. Establish one and try again.",
  },
  {
    match: /resulting balance is not within the allowed range/i,
    message: "Your USDC balance is too low for this charge.",
  },
  {
    match: /allowance is below|insufficient allowance/i,
    message: "The token allowance is too low. Re-subscribe to refresh it.",
  },
  // Account / network errors
  {
    match: /account not found|account_not_found/i,
    message:
      "Your wallet hasn't been activated on Stellar yet. Activate it with free testnet XLM and try again.",
  },
  {
    match: /tx_bad_seq|tx_too_late|tx_too_early/i,
    message:
      "Stellar rejected the transaction (bad sequence or timing). Try again in a moment.",
  },
  {
    match: /tx_insufficient_balance|tx_insufficient_fee/i,
    message: "Your wallet doesn't have enough XLM for the network fee.",
  },
  {
    match: /op_underfunded/i,
    message:
      "Your wallet doesn't have enough balance to complete this operation.",
  },
  // RPC / network
  {
    match: /failed to fetch|networkerror|network error|fetch failed/i,
    message: "Network error reaching Stellar. Check your connection.",
  },
  {
    match: /timeout|timed out/i,
    message: "Request timed out. Try again.",
  },
  {
    match: /horizon fetch failed: 404|not found - get/i,
    message: "Account not found on Stellar testnet.",
  },
  // User cancelled wallet prompt
  {
    match: /user (rejected|denied|declined|cancelled|canceled)/i,
    message: "You cancelled the wallet prompt.",
  },
];

/**
 * Convert any thrown thing into a clean user-facing string.
 */
export function formatChainError(err: unknown, fallback?: string): string {
  const raw = errorToString(err);

  // 1) Vowena contract errors — Error(Contract, #N)
  const vowenaMatch = raw.match(/Error\(Contract, #(\d+)\)/);
  if (vowenaMatch) {
    const code = parseInt(vowenaMatch[1], 10);
    // Heuristic: distinguish Vowena from token contract by surrounding context.
    // Token contract errors typically include words like "trustline", "balance",
    // "allowance" which we catch in PATTERN_MAP first. Anything else with
    // a Contract,#N tag is Vowena (since our contract is the only other one
    // the dashboard talks to directly).
    const tokenSignal =
      /trustline|balance|allowance|transfer_from|approve/i.test(raw);
    if (!tokenSignal && VOWENA_ERRORS[code]) {
      return VOWENA_ERRORS[code];
    }
  }

  // 2) Pattern-based mapping (token + network errors)
  for (const { match, message } of PATTERN_MAP) {
    if (match.test(raw)) return message;
  }

  // 3) Fallback: a short generic sentence, not the chain dump
  if (fallback) return fallback;

  // Try to grab the first short sentence from the raw error
  const firstSentence = raw
    .split(/\n|\. /)[0]
    .replace(/^\s*Stellar:\s*/i, "")
    .trim();
  if (firstSentence.length > 0 && firstSentence.length < 140) {
    return firstSentence;
  }

  return "Something went wrong on the network. Try again in a moment.";
}

function errorToString(err: unknown): string {
  if (err == null) return "";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

/**
 * Convenience: returns true when the error indicates a missing trustline.
 * Lets the checkout page swap to the trustline-fix panel.
 */
export function isTrustlineMissing(err: unknown): boolean {
  const raw = errorToString(err);
  return /trustline entry is missing/i.test(raw);
}

/**
 * Convenience: returns true when the error indicates insufficient token balance.
 */
export function isInsufficientBalance(err: unknown): boolean {
  const raw = errorToString(err);
  return /resulting balance is not within the allowed range/i.test(raw);
}

/**
 * Convenience: returns true when the source account isn't funded on Stellar.
 */
export function isAccountNotFound(err: unknown): boolean {
  const raw = errorToString(err);
  return /account not found|account_not_found|404/i.test(raw);
}
