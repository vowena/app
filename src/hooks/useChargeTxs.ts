"use client";

import { useQuery } from "@tanstack/react-query";
import { xdr, scValToNative } from "@stellar/stellar-sdk";
import { CONTRACT } from "@/lib/chain";

export interface ChargeTx {
  txHash: string;
  timestamp: number;
  amountStroops: number;
  from: string;
  to: string;
  subId?: number;
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
  subId?: number;
  subIds?: number[];
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

interface StellarExpertEventsResponse {
  _links?: {
    next?: {
      href?: string;
    };
  };
  _embedded?: {
    records?: StellarExpertEvent[];
  };
}

interface StellarExpertEvent {
  id?: string;
  ts?: number;
  topics?: string[];
  bodyXdr?: string;
}

interface StellarExpertLedgerTx {
  id?: string;
  hash?: string;
  ts?: number;
}

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const STELLAR_EXPERT_URL = "https://api.stellar.expert/explorer/testnet";
const EXPLORER_TX_URL = "https://stellar.expert/explorer/testnet/tx";
const MATCH_WINDOW_SECONDS = 5 * 60;
const EXPERT_EVENT_PAGE_LIMIT = 200;
const EXPERT_EVENT_MAX_PAGES = 30;
const TX_ID_STRIDE = 4096n;

/**
 * Resolve exact charge transaction hashes for a subscription. We use the
 * archived Vowena contract events first because charge rows are Soroban
 * contract events, then merge Horizon payment rows as a secondary fallback.
 *
 * Returns matches newest-first so the UI can zip them into synthesized rows
 * (which are also newest-first) by index.
 */
export function useChargeTxs(params: {
  subId?: number | null;
  subscriber: string | null | undefined;
  merchant: string | null | undefined;
  amountStroops: number;
  since?: number;
  until?: number;
  expectedCount?: number;
}) {
  const {
    subId,
    subscriber,
    merchant,
    amountStroops,
    since,
    until,
    expectedCount,
  } = params;

  return useQuery({
    queryKey: [
      "charge-txs",
      subId,
      subscriber,
      merchant,
      amountStroops,
      since,
      until,
      expectedCount,
    ],
    queryFn: async (): Promise<ChargeTx[]> => {
      if (!subscriber || !merchant || !amountStroops) return [];
      const [archived, horizon] = await Promise.all([
        fetchArchivedChargeTxs({
          subIds: typeof subId === "number" ? [subId] : undefined,
          subscriber,
          amountStroops,
          since,
          until,
          expectedCount,
        }),
        fetchHorizonMerchantPaymentTxs(merchant),
      ]);
      const txs = mergeChargeTxs([...archived, ...horizon]);
      return filterChargeTxs(txs, {
        subId: typeof subId === "number" ? subId : undefined,
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

export function useMerchantChargeTxs(
  merchant: string | null | undefined,
  subIds: number[] = [],
) {
  const stableSubIds = [...new Set(subIds)]
    .filter((id) => Number.isFinite(id))
    .sort((a, b) => a - b);

  return useQuery({
    queryKey: ["merchant-charge-txs", merchant, stableSubIds.join(",")],
    queryFn: async (): Promise<ChargeTx[]> => {
      if (!merchant) return [];
      const [archived, horizon] = await Promise.all([
        stableSubIds.length > 0
          ? fetchArchivedChargeTxs({ subIds: stableSubIds })
          : Promise.resolve([]),
        fetchHorizonMerchantPaymentTxs(merchant),
      ]);
      return mergeChargeTxs([...archived, ...horizon]);
    },
    enabled: !!merchant,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

async function fetchHorizonMerchantPaymentTxs(
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

async function fetchArchivedChargeTxs(
  filter: ChargeTxFilter,
): Promise<ChargeTx[]> {
  const subIdSet = new Set(filter.subIds ?? []);
  if (typeof filter.subId === "number") subIdSet.add(filter.subId);

  const txs: ChargeTx[] = [];
  const ledgerTxCache = new Map<number, Promise<StellarExpertLedgerTx[]>>();
  let href = `${STELLAR_EXPERT_URL}/contract/${CONTRACT.ID}/events?order=desc&limit=${EXPERT_EVENT_PAGE_LIMIT}`;
  let pages = 0;
  let shouldStop = false;

  while (href && pages < EXPERT_EVENT_MAX_PAGES && !shouldStop) {
    pages++;
    let data: StellarExpertEventsResponse;
    try {
      const res = await fetch(href, { cache: "no-store" });
      if (!res.ok) break;
      data = (await res.json()) as StellarExpertEventsResponse;
    } catch {
      break;
    }

    const records = data._embedded?.records ?? [];
    for (const record of records) {
      const ts = Number(record.ts || 0);
      if (filter.since && ts < filter.since - MATCH_WINDOW_SECONDS) {
        shouldStop = true;
        break;
      }
      if (filter.until && ts > filter.until + MATCH_WINDOW_SECONDS) continue;
      if (record.topics?.[0] !== "charge_ok") continue;
      if (filter.subscriber && record.topics?.[1] !== filter.subscriber) {
        continue;
      }

      const [eventSubId, eventAmount] = decodeExpertEventBody(record.bodyXdr);
      if (eventSubId == null || eventAmount == null || eventAmount <= 0) {
        continue;
      }
      if (subIdSet.size > 0 && !subIdSet.has(eventSubId)) continue;
      if (
        filter.amountStroops &&
        Math.abs(eventAmount - filter.amountStroops) > 1
      ) {
        continue;
      }

      const eventRef = parseExpertEventRef(record.id);
      if (!eventRef) continue;

      const ledgerTxs = await getExpertLedgerTxs(
        eventRef.ledger,
        ledgerTxCache,
      );
      const tx = ledgerTxs.find((candidate) => candidate.id === eventRef.txId);
      if (!tx?.hash) continue;

      txs.push({
        txHash: tx.hash,
        timestamp: ts || Number(tx.ts || 0),
        amountStroops: eventAmount,
        from: record.topics?.[1] ?? filter.subscriber ?? "",
        to: "",
        subId: eventSubId,
      });

      if (
        filter.expectedCount &&
        filter.expectedCount > 0 &&
        txs.length >= filter.expectedCount
      ) {
        shouldStop = true;
        break;
      }
    }

    const nextHref = data._links?.next?.href;
    href = nextHref
      ? nextHref.startsWith("http")
        ? nextHref
        : `${STELLAR_EXPERT_URL.replace("/explorer/testnet", "")}${nextHref}`
      : "";
  }

  return txs.sort((a, b) => b.timestamp - a.timestamp);
}

export function filterChargeTxs(
  txs: ChargeTx[],
  filter: ChargeTxFilter,
): ChargeTx[] {
  const from = filter.since ? filter.since - MATCH_WINDOW_SECONDS : undefined;
  const to = filter.until ? filter.until + MATCH_WINDOW_SECONDS : undefined;
  const subIdSet = new Set(filter.subIds ?? []);
  if (typeof filter.subId === "number") subIdSet.add(filter.subId);

  const matched = txs.filter((tx) => {
    if (subIdSet.size > 0 && tx.subId != null && !subIdSet.has(tx.subId)) {
      return false;
    }
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

function mergeChargeTxs(txs: ChargeTx[]): ChargeTx[] {
  const byHash = new Map<string, ChargeTx>();
  for (const tx of txs) {
    if (!tx.txHash) continue;
    const existing = byHash.get(tx.txHash);
    byHash.set(tx.txHash, {
      ...existing,
      ...tx,
      from: tx.from || existing?.from || "",
      to: tx.to || existing?.to || "",
      subId: tx.subId ?? existing?.subId,
    });
  }
  return [...byHash.values()].sort((a, b) => b.timestamp - a.timestamp);
}

function decodeExpertEventBody(bodyXdr: string | undefined): [number?, number?] {
  if (!bodyXdr) return [];
  try {
    const native = scValToNative(xdr.ScVal.fromXDR(bodyXdr, "base64"));
    if (!Array.isArray(native)) return [];
    return [toNumber(native[0]), toNumber(native[1])];
  } catch {
    return [];
  }
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);
  return undefined;
}

function parseExpertEventRef(id: string | undefined) {
  if (!id) return null;
  const source = id.split("-")[0];
  if (!/^\d+$/.test(source)) return null;

  const eventSourceId = BigInt(source);
  const ledger = Number(eventSourceId / 4294967296n);
  const txId = (eventSourceId - (eventSourceId % TX_ID_STRIDE)).toString();
  return { ledger, txId };
}

async function getExpertLedgerTxs(
  ledger: number,
  cache: Map<number, Promise<StellarExpertLedgerTx[]>>,
) {
  let promise = cache.get(ledger);
  if (!promise) {
    promise = fetch(`${STELLAR_EXPERT_URL}/ledger/${ledger}/tx?limit=200`, {
      cache: "no-store",
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => (Array.isArray(data) ? data : []))
      .catch(() => []);
    cache.set(ledger, promise);
  }
  return promise;
}

function parseAmountToStroops(amount: string | undefined): number | null {
  const value = Number.parseFloat(String(amount ?? ""));
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 1e7);
}
