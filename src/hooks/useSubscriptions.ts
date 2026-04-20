import { useQuery } from "@tanstack/react-query";
import {
  getSubscriberSubscriptions,
  getSubscription,
  getPlan,
} from "@/lib/chain";

export interface Plan {
  id: number;
  merchant: string;
  token: string;
  amount: number;
  period: number;
  trialPeriods: number;
  maxPeriods: number;
  gracePeriod: number;
  priceCeiling: number;
  createdAt: number;
  active: boolean;
}

export interface Subscription {
  id: number;
  planId: number;
  subscriber: string;
  status: "Active" | "Paused" | "Cancelled" | "Expired" | string;
  createdAt: number;
  periodsBilled: number;
  nextBillingTime: number;
  failedAt: number;
  migrationTarget: number;
  cancelledAt: number;
  plan?: Plan;
}

export function useSubscriptions(subscriberAddress: string | null) {
  return useQuery({
    queryKey: ["subscriptions", subscriberAddress],
    queryFn: async () => {
      if (!subscriberAddress) return [];

      const subIds = await getSubscriberSubscriptions(subscriberAddress);

      const subscriptions = await Promise.all(
        subIds.map(async (subId) => {
          const sub = await getSubscription(subId, subscriberAddress);
          const plan = await getPlan(sub.planId, sub.subscriber);
          return { ...sub, plan };
        }),
      );

      return subscriptions;
    },
    enabled: !!subscriberAddress,
    staleTime: 10000,
    refetchInterval: 30000,
  });
}

export function useSubscription(
  subId: number | null,
  subscriberAddress: string | null,
) {
  return useQuery({
    queryKey: ["subscription", subId, subscriberAddress],
    queryFn: async () => {
      if (!subId || !subscriberAddress) return null;

      const sub = await getSubscription(subId, subscriberAddress);
      const plan = await getPlan(sub.planId, sub.subscriber);

      return { ...sub, plan };
    },
    enabled: !!subId && !!subscriberAddress,
    staleTime: 5000,
    refetchInterval: 30000,
  });
}
