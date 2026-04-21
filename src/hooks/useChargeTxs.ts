"use client";

import { useQuery } from "@tanstack/react-query";

export interface ChargeTx {
  txHash: string;
  timestamp: number;
  amountStroops: number;
  from: string;
  to: string;
}

export interface ChargeHistoryRow {
  label: string;
  ts: number;
  amount?: number;
  href?: string;
  txHash?: string;
  exact: boolean;
  kind: "signup" | "charge" | "cancelled";
}

interface HorizonPaymentsResponse {
  _embedded?: {
    records?: Array<{
      type?: string;
      from?: string;
      to?: string;
      amount?: string;
      transaction_hash?: string;
      transaction_successful?: boolean;
      created_at?: string;
    }>;
  };
}

interface ChargeTxFilter {
  subscriber?: string | null;
  amountStroops?: number;
  since?: number;
  until?: number;
  expectedCount?: number;
}

interface ChargeHistorySource {
  createdAt: number;
  periodsBilled: number;
  cancelledAt?: number;
  plan?: {
    amount?: number;
    period?: number;
    trialPeriods?: number;
  };
}

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const EXPLORER_TX_URL = "https://stellar.expert/explorer/testnet/tx";
const MATCH_WINDOW_SECONDS = 5 * 60;

/**
 * Resolve the exact charge transaction hashes for a given subscriber → merchant
 * pair by walking Horizon's payments feed for the merchant account.
 *
 * Horizon surfaces Soroban SAC transfers of classic-issued assets (testnet
 * TUSDC, mainnet USDC, etc.) as classic-shaped payments under
 * `/accounts/{id}/payments`, each with its tx hash. That's how we upgrade
 * synthesized "Charge succeeded" rows from "link to merchant account" to
 * "link to the exact tx that billed this period".
 *
 * Returns matches newest-first so the UI can zip them into synthesized rows
 * (which are also newest-first) by index.
 */
export function useChargeTxs(params: {
  subscriber: string | null | undefined;
  merchant: string | null | undefined;
  amountStroops: number;
  since?: number;
  until?: number;
  expectedCount?: number;
}) {
  const { subscriber, merchant, amountStroops, since, until, expectedCount } =
    params;

  return useQuery({
    queryKey: [
      "charge-txs",
      subscriber,
      merchant,
      amountStroops,
      since,
      until,
      expectedCount,
    ],
    queryFn: async (): Promise<ChargeTx[]> => {
      if (!subscriber || !merchant || !amountStroops) return [];
      const txs = await fetchMerchantChargeTxs(merchant);
      return filterChargeTxs(txs, {
        subscriber,
        amountStroops,
        since,
        until,
        expectedCount,
      });
    },
    enabled: !!subscriber && !!merchant && amountStroops > 0,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useMerchantChargeTxs(merchant: string | null | undefined) {
  return useQuery({
    queryKey: ["merchant-charge-txs", merchant],
    queryFn: async (): Promise<ChargeTx[]> => {
      if (!merchant) return [];
      return fetchMerchantChargeTxs(merchant);
    },
    enabled: !!merchant,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export async function fetchMerchantChargeTxs(
  merchant: string,
): Promise<ChargeTx[]> {
  const url = `${HORIZON_URL}/accounts/${merchant}/payments?limit=200&order=desc&include_failed=false`;
  let res: Response;
  try {
    res = await fetch(url, { cache: "no-store" });
  } catch {
    return [];
  }
  if (!res.ok) return [];

  let data: HorizonPaymentsResponse;
  try {
    data = (await res.json()) as HorizonPaymentsResponse;
  } catch {
    return [];
  }

  const records = data?._embedded?.records ?? [];
  const txs: ChargeTx[] = [];

  for (const r of records) {
    if (!r || r.transaction_successful === false) continue;
    if (!r.from || !r.to || r.to !== merchant) continue;
    if (!r.transaction_hash || !r.created_at) continue;

    const amountStroops = parseAmountToStroops(r.amount);
    if (amountStroops == null) continue;

    txs.push({
      txHash: r.transaction_hash,
      timestamp: Math.floor(new Date(r.created_at).getTime() / 1000),
      amountStroops,
      from: r.from,
      to: r.to,
    });
  }

  return txs.sort((a, b) => b.timestamp - a.timestamp);
}

export function filterChargeTxs(
  txs: ChargeTx[],
  filter: ChargeTxFilter,
): ChargeTx[] {
  const from = filter.since ? filter.since - MATCH_WINDOW_SECONDS : undefined;
  const to = filter.until ? filter.until + MATCH_WINDOW_SECONDS : undefined;

  const matched = txs.filter((tx) => {
    if (filter.subscriber && tx.from !== filter.subscriber) return false;
    if (from != null && tx.timestamp < from) return false;
    if (to != null && tx.timestamp > to) return false;
    if (
      filter.amountStroops &&
      Math.abs(tx.amountStroops - filter.amountStroops) > 1
    ) {
      return false;
    }
    return true;
  });

  return typeof filter.expectedCount === "number" && filter.expectedCount > 0
    ? matched.slice(0, filter.expectedCount)
    : matched;
}

export function buildChargeHistoryRows(
  source: ChargeHistorySource,
  chargeTxs: ChargeTx[] = [],
): ChargeHistoryRow[] {
  const amount = Number(source.plan?.amount || 0);
  const period = Number(source.plan?.period || 0);
  const trialPeriods = Number(source.plan?.trialPeriods ?? 0);
  const periodsBilled = Math.max(0, Number(source.periodsBilled || 0));
  const signupBilled = periodsBilled > 0 && trialPeriods === 0;
  const exactTxs = chargeTxs
    .slice(0, periodsBilled)
    .sort((a, b) => b.timestamp - a.timestamp);
  const missingCount = Math.max(0, periodsBilled - exactTxs.length);
  const allExactChargesPresent =
    periodsBilled > 0 && exactTxs.length === periodsBilled;

  const rows: ChargeHistoryRow[] = exactTxs.map((tx, index) => {
    const isEarliestExactTx = index === exactTxs.length - 1;
    const isSignupCharge =
      signupBilled && allExactChargesPresent && isEarliestExactTx;

    return {
      label: isSignupCharge ? "Subscribed & charged" : "Charge succeeded",
      ts: tx.timestamp,
      amount: tx.amountStroops || amount,
      href: `${EXPLORER_TX_URL}/${tx.txHash}`,
      txHash: tx.txHash,
      exact: true,
      kind: isSignupCharge ? "signup" : "charge",
    };
  });

  const expectedCharges: ChargeHistoryRow[] = [];
  if (signupBilled) {
    expectedCharges.push({
      label: "Subscribed & charged",
      ts: source.createdAt,
      amount,
      exact: false,
      kind: "signup",
    });
  }

  const extraCharges = Math.max(0, periodsBilled - (signupBilled ? 1 : 0));
  for (let i = 0; i < extraCharges; i++) {
    expectedCharges.push({
      label: "Charge succeeded",
      ts: source.createdAt + (i + 1) * period,
      amount,
      exact: false,
      kind: "charge",
    });
  }

  rows.push(...expectedCharges.slice(0, missingCount));

  if (!signupBilled) {
    rows.push({
      label: "Subscribed",
      ts: source.createdAt,
      exact: false,
      kind: "signup",
    });
  }

  if (source.cancelledAt && source.cancelledAt > 0) {
    rows.push({
      label: "Cancelled",
      ts: source.cancelledAt,
      exact: false,
      kind: "cancelled",
    });
  }

  return rows.sort((a, b) => b.ts - a.ts);
}

function parseAmountToStroops(amount: string | undefined): number | null {
  const value = Number.parseFloat(String(amount ?? ""));
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 1e7);
}
