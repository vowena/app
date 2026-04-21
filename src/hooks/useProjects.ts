"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit/sdk";
import { Networks } from "@creit.tech/stellar-wallets-kit";
import { useWallet } from "@/components/wallet/wallet-provider";
import {
  readProjects,
  buildCreateProjectTx,
  buildTagAndNamePlanTx,
  buildDeleteProjectTx,
  submitToHorizon,
  type OnChainProject,
} from "@/lib/account-data";
import { getPlan, type ChainPlan } from "@/lib/chain";

/** Plan as used in the dashboard — augmented with the on-chain display name */
export type NamedPlan = ChainPlan & { name?: string };

export type ProjectConfig = OnChainProject & {
  /** Alias kept for back-compat; equals slugified name */
  id: string;
};

export type CreateStatus = "preparing" | "signing" | "submitting" | "done";

export function useProjects() {
  const { address } = useWallet();
  const queryClient = useQueryClient();

  const queryKey = ["projects", address];

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<ProjectConfig[]> => {
      if (!address) return [];
      const raw = await readProjects(address);
      return raw.map((w) => ({ ...w, id: String(w.slot) }));
    },
    enabled: !!address,
    staleTime: 5_000,
    refetchOnWindowFocus: true,
  });

  /**
   * Create a project on-chain. Onstatus callback gets fired with stages so
   * the UI can show granular progress. After submission, the new project is
   * optimistically inserted into the cache so the UI reflects it immediately
   * (a background refetch follows to confirm).
   */
  const createProject = useCallback(
    async (
      name: string,
      description: string | undefined,
      onStatus?: (s: CreateStatus) => void,
    ): Promise<ProjectConfig> => {
      if (!address) throw new Error("Wallet not connected");

      onStatus?.("preparing");
      const cached = (query.data || []) as OnChainProject[];
      const { xdr, slot } = await buildCreateProjectTx(
        address,
        name,
        description,
        cached,
      );

      onStatus?.("signing");
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
        networkPassphrase: Networks.TESTNET,
        address,
      });

      onStatus?.("submitting");
      await submitToHorizon(signedTxXdr);

      const newProject: ProjectConfig = {
        slot,
        id: String(slot),
        name,
        description,
        planIds: [],
        planNames: {},
        merchantAddress: address,
      };

      // Optimistic update — UI sees the new project instantly
      queryClient.setQueryData<ProjectConfig[]>(queryKey, (old = []) => {
        const next = [...old, newProject].sort((a, b) => a.slot - b.slot);
        return next;
      });

      // Background refetch to reconcile with chain (delayed to give Horizon a moment)
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey });
      }, 2000);

      onStatus?.("done");
      return newProject;
    },
    [address, queryClient, query.data, queryKey],
  );

  /**
   * Tag a plan to a project AND store its display name on chain in a single
   * Stellar tx (one wallet signature).
   */
  const tagAndNamePlan = useCallback(
    async (planId: number, slot: number, planName: string): Promise<void> => {
      if (!address) throw new Error("Wallet not connected");

      const xdr = await buildTagAndNamePlanTx(address, planId, slot, planName);
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
        networkPassphrase: Networks.TESTNET,
        address,
      });
      await submitToHorizon(signedTxXdr);

      // Optimistic: append planId to that project + record name
      queryClient.setQueryData<ProjectConfig[]>(queryKey, (old = []) =>
        old.map((w) =>
          w.slot === slot
            ? {
                ...w,
                planIds: [...w.planIds, planId],
                planNames: { ...w.planNames, [planId]: planName },
              }
            : w,
        ),
      );

      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey });
      }, 2000);
    },
    [address, queryClient, queryKey],
  );

  const deleteProject = useCallback(
    async (slot: number): Promise<void> => {
      if (!address) throw new Error("Wallet not connected");

      const xdr = await buildDeleteProjectTx(address, slot);
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
        networkPassphrase: Networks.TESTNET,
        address,
      });
      await submitToHorizon(signedTxXdr);

      queryClient.setQueryData<ProjectConfig[]>(queryKey, (old = []) =>
        old.filter((w) => w.slot !== slot),
      );

      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey });
      }, 2000);
    },
    [address, queryClient, queryKey],
  );

  return {
    projects: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createProject,
    tagAndNamePlan,
    deleteProject,
    refetch: query.refetch,
  };
}

/**
 * Fetch all plans for a project from the Vowena contract.
 *
 * The set of plan IDs comes from two sources, in priority order:
 *   1. planIds explicitly tagged to this project in account data
 *   2. all plans owned by the merchant (covers plans created in single-sig
 *      mode where the project tag write was skipped or hasn't propagated)
 *
 * For displayed names, the new contract carries `plan.name` directly — that
 * always wins. The legacy account-data planNames map is only used as a
 * fallback for plans created with the old contract (which had no name field).
 */
export async function getProjectPlansWithData(
  merchantAddress: string,
  planIds: number[] = [],
  planNames: Record<number, string> = {},
): Promise<NamedPlan[]> {
  try {
    const { getMerchantPlans } = await import("@/lib/chain");
    const allMerchantIds = await getMerchantPlans(merchantAddress);

    // Union of explicitly-tagged plan IDs and all-merchant plan IDs
    const ids = Array.from(new Set([...planIds, ...allMerchantIds]));
    if (ids.length === 0) return [];

    const plans = await Promise.all(
      ids.map((id) => getPlan(id, merchantAddress).catch(() => null)),
    );
    return plans
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .map((p) => ({
        ...p,
        // Prefer the on-chain name from the contract; fall back to legacy
        // account-data name; finally degrade to whatever the SDK returned.
        name: p.name && p.name.length > 0 ? p.name : planNames[p.id],
      }));
  } catch (error) {
    console.error("Failed to fetch project plans:", error);
    return [];
  }
}
