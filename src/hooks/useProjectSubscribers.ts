"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getPlanSubscribers,
  getSubscription,
  type ChainSubscription,
} from "@/lib/chain";
import type { NamedPlan } from "@/hooks/useProjects";

export interface SubscriberRow extends ChainSubscription {
  plan: NamedPlan;
}

/**
 * Fetch every subscriber across every plan in a project.
 * For each plan: list sub IDs from the contract, then fetch full sub data.
 */
export function useProjectSubscribers(
  merchantAddress: string | null,
  plans: NamedPlan[],
) {
  return useQuery({
    queryKey: [
      "project-subscribers",
      merchantAddress,
      plans
        .map((p) => p.id)
        .sort()
        .join(","),
    ],
    queryFn: async (): Promise<SubscriberRow[]> => {
      if (!merchantAddress || plans.length === 0) return [];

      // For each plan, get its subscribers' sub IDs
      const idsByPlan = await Promise.all(
        plans.map(async (plan) => {
          try {
            const subIds = await getPlanSubscribers(plan.id, merchantAddress);
            return subIds.map((subId) => ({ subId, plan }));
          } catch (err) {
            console.error(
              `getPlanSubscribers failed for plan ${plan.id}:`,
              err,
            );
            return [];
          }
        }),
      );

      // Flatten + dedupe (a sub can only belong to one plan, but defensive)
      const flat = idsByPlan.flat();

      // Fetch each subscription
      const subs = await Promise.all(
        flat.map(async ({ subId, plan }) => {
          try {
            const sub = await getSubscription(subId, merchantAddress);
            return { ...sub, plan };
          } catch (err) {
            console.error(`getSubscription failed for sub ${subId}:`, err);
            return null;
          }
        }),
      );

      return subs
        .filter((s): s is SubscriberRow => s !== null)
        .sort((a, b) => b.createdAt - a.createdAt);
    },
    enabled: !!merchantAddress && plans.length > 0,
    staleTime: 10_000,
    refetchOnWindowFocus: true,
  });
}
