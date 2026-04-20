"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit/sdk";
import { Networks } from "@creit.tech/stellar-wallets-kit";
import { useWallet } from "@/components/wallet/wallet-provider";
import {
  readProjects,
  buildCreateProjectTx,
  buildTagPlanTx,
  buildDeleteProjectTx,
  submitToHorizon,
  type OnChainProject,
} from "@/lib/account-data";
import { getPlan } from "@/lib/chain";

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

  const tagPlanToProject = useCallback(
    async (planId: number, slot: number): Promise<void> => {
      if (!address) throw new Error("Wallet not connected");

      const xdr = await buildTagPlanTx(address, planId, slot);
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
        networkPassphrase: Networks.TESTNET,
        address,
      });
      await submitToHorizon(signedTxXdr);

      // Optimistic: append planId to that project
      queryClient.setQueryData<ProjectConfig[]>(queryKey, (old = []) =>
        old.map((w) =>
          w.slot === slot ? { ...w, planIds: [...w.planIds, planId] } : w,
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
    tagPlanToProject,
    deleteProject,
    refetch: query.refetch,
  };
}

/**
 * Fetch all plans for a project from the Vowena contract.
 */
export async function getProjectPlansWithData(
  merchantAddress: string,
  planIds?: number[],
) {
  try {
    const ids = planIds ?? [];
    if (ids.length === 0) return [];

    const plans = await Promise.all(
      ids.map((id) => getPlan(id, merchantAddress).catch(() => null)),
    );
    return plans.filter((p): p is NonNullable<typeof p> => p !== null);
  } catch (error) {
    console.error("Failed to fetch project plans:", error);
    return [];
  }
}
