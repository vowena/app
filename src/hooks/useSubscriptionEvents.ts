"use client";

import { useQuery } from "@tanstack/react-query";
import { getEvents, type VowenaEvent } from "@vowena/sdk";
import { CONTRACT } from "@/lib/chain";

export interface SubscriptionEvent {
  /** Human-readable event type like 'charge_success', 'subscribed' */
  type: string;
  timestamp: number;
  ledger: number;
  amount?: number;
  raw: VowenaEvent;
}

/**
 * Fetch the event history for a single subscription by walking recent Soroban
 * events and filtering by sub_id.
 *
 * Note: Soroban RPC limits how far back you can query. For production use,
 * a dedicated indexer would be more scalable, but this works for subs
 * created within the last few hundred thousand ledgers.
 */
export function useSubscriptionEvents(subId: number | null) {
  return useQuery({
    queryKey: ["subscription-events", subId],
    queryFn: async (): Promise<SubscriptionEvent[]> => {
      if (subId == null) return [];

      // Query the last ~50,000 ledgers (roughly a few days on testnet)
      // Stellar testnet produces ~17,280 ledgers/day
      const { events, latestLedger } = await getEvents(
        CONTRACT.RPC_URL,
        CONTRACT.ID,
        Math.max(1, latestLedgerFallback() - 50_000),
        1000,
      );

      void latestLedger;

      const forSub: SubscriptionEvent[] = [];

      for (const ev of events) {
        if (!eventMentionsSubId(ev, subId)) continue;

        forSub.push({
          type: inferEventType(ev),
          timestamp: ev.timestamp,
          ledger: ev.ledger,
          amount: extractAmount(ev),
          raw: ev,
        });
      }

      // Most recent first
      return forSub.sort((a, b) => b.timestamp - a.timestamp);
    },
    enabled: subId != null,
    staleTime: 15_000,
  });
}

/**
 * Conservative ledger fallback. Soroban RPC startLedger can be >= 1; we just
 * want a recent-ish starting point. If we had a cached latestLedger we'd use
 * it, but for the initial query we pass a safe small positive so we query the
 * full recent history.
 */
function latestLedgerFallback(): number {
  // 1M ledgers back from some distant future point — safe for testnet today.
  return 3_000_000;
}

function eventMentionsSubId(ev: VowenaEvent, subId: number): boolean {
  // Topics typically include: [event_name, sub_id, subscriber_address]
  // The sub_id may be encoded as u64 / i128 / string depending on SDK path.
  const topics = ev.topics ?? [];
  for (const t of topics) {
    if (t == null) continue;
    if (typeof t === "number" && t === subId) return true;
    if (typeof t === "bigint" && Number(t) === subId) return true;
    if (typeof t === "string" && /^\d+$/.test(t) && Number(t) === subId) {
      return true;
    }
    // Stellar SDK ScVal — try to read .u64()
    const maybe = t as { u64?: () => bigint };
    try {
      if (typeof maybe?.u64 === "function" && Number(maybe.u64()) === subId) {
        return true;
      }
    } catch {
      // not a u64 ScVal
    }
  }
  // Fallback: scan data payload as JSON-ish
  try {
    const asString = JSON.stringify(ev.data);
    if (asString.includes(`"${subId}"`) || asString.includes(`:${subId}`)) {
      return true;
    }
  } catch {
    // not stringifiable
  }
  return false;
}

function inferEventType(ev: VowenaEvent): string {
  // The first topic is usually the event name (symbol)
  const firstTopic = ev.topics?.[0];
  if (typeof firstTopic === "string") return firstTopic;
  const maybe = firstTopic as { toString?: () => string };
  if (maybe?.toString) return maybe.toString();
  return ev.type || "event";
}

function extractAmount(ev: VowenaEvent): number | undefined {
  const data = ev.data as Record<string, unknown> | unknown;
  if (data && typeof data === "object" && "amount" in data) {
    const amt = (data as { amount: unknown }).amount;
    if (typeof amt === "number") return amt;
    if (typeof amt === "bigint") return Number(amt);
  }
  return undefined;
}
