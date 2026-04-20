import { useQuery } from "@tanstack/react-query";
import {
  getSubscriberSubscriptions,
  getSubscription,
  getPlan,
} from "@/lib/chain";
import { readProjects } from "@/lib/account-data";

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
  /** Plan display name from the merchant's on-chain account data */
  planName?: string;
  /** Project (workspace) name from the merchant's on-chain account data */
  projectName?: string;
}

/**
 * Fetch all subscriptions for the connected subscriber, augmented with
 * the merchant's project + plan names so the UI can show
 * "Vowena Tips → Pro Monthly" instead of "Plan #2 from GDFI…".
 */
export function useSubscriptions(subscriberAddress: string | null) {
  return useQuery({
    queryKey: ["subscriptions", subscriberAddress],
    queryFn: async () => {
      if (!subscriberAddress) return [];

      const subIds = await getSubscriberSubscriptions(subscriberAddress);

      // Fetch each subscription + its plan in parallel
      const baseSubs = await Promise.all(
        subIds.map(async (subId) => {
          const sub = await getSubscription(subId, subscriberAddress);
          const plan = await getPlan(sub.planId, sub.subscriber);
          return { ...sub, plan } as Subscription;
        }),
      );

      // Fetch each unique merchant's account data once
      const uniqueMerchants = Array.from(
        new Set(baseSubs.map((s) => s.plan?.merchant).filter(Boolean)),
      ) as string[];

      const merchantMeta = new Map<
        string,
        { projectName: string; planNames: Record<number, string> }
      >();

      await Promise.all(
        uniqueMerchants.map(async (m) => {
          try {
            const projects = await readProjects(m);
            // For a given merchant, find which project owns each plan
            const planNames: Record<number, string> = {};
            let firstProjectName = "";
            for (const proj of projects) {
              if (!firstProjectName) firstProjectName = proj.name;
              for (const [pid, pname] of Object.entries(proj.planNames)) {
                planNames[Number(pid)] = pname;
              }
            }
            // Use the project name that contains the most plans, or first
            merchantMeta.set(m, {
              projectName: firstProjectName,
              planNames,
            });
          } catch {
            // metadata unavailable; subscription still works
          }
        }),
      );

      return baseSubs.map((sub) => {
        const merchantAddr = sub.plan?.merchant;
        const meta = merchantAddr ? merchantMeta.get(merchantAddr) : undefined;
        const planName = meta?.planNames[sub.planId];

        // For project name: try to find the specific project that owns this plan
        let projectName = meta?.projectName;
        if (merchantAddr) {
          // Find the project that owns this specific plan
          const allProjects = merchantMeta.get(merchantAddr);
          if (allProjects?.planNames[sub.planId]) {
            projectName = allProjects.projectName;
          }
        }

        return {
          ...sub,
          planName,
          projectName,
        };
      });
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

      // Best-effort metadata fetch
      let planName: string | undefined;
      let projectName: string | undefined;
      try {
        const projects = await readProjects(plan.merchant);
        for (const proj of projects) {
          if (proj.planNames[sub.planId]) {
            planName = proj.planNames[sub.planId];
            projectName = proj.name;
            break;
          }
        }
      } catch {
        // ignore
      }

      return { ...sub, plan, planName, projectName } as Subscription;
    },
    enabled: !!subId && !!subscriberAddress,
    staleTime: 5000,
    refetchInterval: 30000,
  });
}
