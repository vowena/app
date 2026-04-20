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

// Kept for backwards compatibility — now the workspace IS on-chain.
export type WorkspaceConfig = OnChainWorkspace & {
  /** Alias for slot, used in URLs like /workspaces/[id] */
  id: string;
};

export function useWorkspaces() {
  const { address } = useWallet();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["workspaces", address],
    queryFn: async (): Promise<WorkspaceConfig[]> => {
      if (!address) return [];
      const raw = await readWorkspaces(address);
      return raw.map((w) => ({ ...w, id: String(w.slot) }));
    },
    enabled: !!address,
    staleTime: 5_000,
    refetchOnWindowFocus: true,
  });

  const createWorkspace = useCallback(
    async (name: string, description?: string): Promise<WorkspaceConfig> => {
      if (!address) throw new Error("Wallet not connected");

      const { xdr, slot } = await buildCreateWorkspaceTx(
        address,
        name,
        description,
      );

      const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
        networkPassphrase: Networks.TESTNET,
        address,
      });

      await submitToHorizon(signedTxXdr);

      // Refresh the workspace list
      await queryClient.invalidateQueries({
        queryKey: ["workspaces", address],
      });

      return {
        slot,
        id: String(slot),
        name,
        description,
        planIds: [],
        merchantAddress: address,
      };
    },
    [address, queryClient],
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

      await queryClient.invalidateQueries({
        queryKey: ["workspaces", address],
      });
    },
    [address, queryClient],
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

      await queryClient.invalidateQueries({
        queryKey: ["workspaces", address],
      });
    },
    [address, queryClient],
  );

  const getWorkspace = useCallback(
    (id: string): WorkspaceConfig | undefined => {
      return query.data?.find((w) => w.id === id);
    },
    [query.data],
  );

  return {
    workspaces: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createWorkspace,
    tagPlanToWorkspace,
    deleteWorkspace,
    getWorkspace,
    refetch: query.refetch,
  };
}

/**
 * Fetch all plans for a workspace (reads plan tags from account data, then
 * fetches each plan from the Vowena contract).
 */
export async function getWorkspacePlansWithData(
  merchantAddress: string,
  planIds?: number[],
) {
  try {
    // If planIds are passed (from workspace.planIds), just fetch those.
    // Otherwise fall back to fetching all merchant plans (legacy path).
    const ids = planIds ?? [];
    if (ids.length === 0) return [];

    const plans = await Promise.all(
      ids.map((id) => getPlan(id, merchantAddress).catch(() => null)),
    );
    return plans.filter((p) => p !== null);
  } catch (error) {
    console.error("Failed to fetch workspace plans:", error);
    return [];
  }
}
