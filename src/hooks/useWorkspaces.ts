"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit/sdk";
import { Networks } from "@creit.tech/stellar-wallets-kit";
import { useWallet } from "@/components/wallet/wallet-provider";
import {
  readWorkspaces,
  buildCreateWorkspaceTx,
  buildTagPlanTx,
  buildDeleteWorkspaceTx,
  submitToHorizon,
  type OnChainWorkspace,
} from "@/lib/account-data";
import { getPlan } from "@/lib/chain";

export type WorkspaceConfig = OnChainWorkspace & {
  /** Alias kept for back-compat; equals slugified name */
  id: string;
};

export type CreateStatus = "preparing" | "signing" | "submitting" | "done";

export function useWorkspaces() {
  const { address } = useWallet();
  const queryClient = useQueryClient();

  const queryKey = ["workspaces", address];

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<WorkspaceConfig[]> => {
      if (!address) return [];
      const raw = await readWorkspaces(address);
      return raw.map((w) => ({ ...w, id: String(w.slot) }));
    },
    enabled: !!address,
    staleTime: 5_000,
    refetchOnWindowFocus: true,
  });

  /**
   * Create a workspace on-chain. Onstatus callback gets fired with stages so
   * the UI can show granular progress. After submission, the new workspace is
   * optimistically inserted into the cache so the UI reflects it immediately
   * (a background refetch follows to confirm).
   */
  const createWorkspace = useCallback(
    async (
      name: string,
      description: string | undefined,
      onStatus?: (s: CreateStatus) => void,
    ): Promise<WorkspaceConfig> => {
      if (!address) throw new Error("Wallet not connected");

      onStatus?.("preparing");
      const cached = (query.data || []) as OnChainWorkspace[];
      const { xdr, slot } = await buildCreateWorkspaceTx(
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

      const newWorkspace: WorkspaceConfig = {
        slot,
        id: String(slot),
        name,
        description,
        planIds: [],
        merchantAddress: address,
      };

      // Optimistic update — UI sees the new workspace instantly
      queryClient.setQueryData<WorkspaceConfig[]>(queryKey, (old = []) => {
        const next = [...old, newWorkspace].sort((a, b) => a.slot - b.slot);
        return next;
      });

      // Background refetch to reconcile with chain (delayed to give Horizon a moment)
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey });
      }, 2000);

      onStatus?.("done");
      return newWorkspace;
    },
    [address, queryClient, query.data, queryKey],
  );

  const tagPlanToWorkspace = useCallback(
    async (planId: number, slot: number): Promise<void> => {
      if (!address) throw new Error("Wallet not connected");

      const xdr = await buildTagPlanTx(address, planId, slot);
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
        networkPassphrase: Networks.TESTNET,
        address,
      });
      await submitToHorizon(signedTxXdr);

      // Optimistic: append planId to that workspace
      queryClient.setQueryData<WorkspaceConfig[]>(queryKey, (old = []) =>
        old.map((w) =>
          w.slot === slot
            ? { ...w, planIds: [...w.planIds, planId] }
            : w,
        ),
      );

      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey });
      }, 2000);
    },
    [address, queryClient, queryKey],
  );

  const deleteWorkspace = useCallback(
    async (slot: number): Promise<void> => {
      if (!address) throw new Error("Wallet not connected");

      const xdr = await buildDeleteWorkspaceTx(address, slot);
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
        networkPassphrase: Networks.TESTNET,
        address,
      });
      await submitToHorizon(signedTxXdr);

      queryClient.setQueryData<WorkspaceConfig[]>(queryKey, (old = []) =>
        old.filter((w) => w.slot !== slot),
      );

      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey });
      }, 2000);
    },
    [address, queryClient, queryKey],
  );

  return {
    workspaces: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createWorkspace,
    tagPlanToWorkspace,
    deleteWorkspace,
    refetch: query.refetch,
  };
}

/**
 * Fetch all plans for a workspace from the Vowena contract.
 */
export async function getWorkspacePlansWithData(
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
    console.error("Failed to fetch workspace plans:", error);
    return [];
  }
}
