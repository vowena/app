import { useQuery } from "@tanstack/react-query";
import {
  getSubscriberSubscriptions,
  getSubscription,
  getPlan,
} from "@/lib/chain";

export type Subscription = Awaited<
  ReturnType<typeof getSubscription>
> & {
  plan?: Awaited<ReturnType<typeof getPlan>>;
};

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
        })
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
  subscriberAddress: string | null
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
