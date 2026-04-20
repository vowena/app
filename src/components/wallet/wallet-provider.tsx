"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit/sdk";
import { defaultModules } from "@creit.tech/stellar-wallets-kit/modules/utils";
import { Networks, KitEventType } from "@creit.tech/stellar-wallets-kit";

interface WalletContextValue {
  address: string | null;
  isConnected: boolean;
  isInitializing: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signTransaction: (
    xdr: string,
    networkPassphrase?: string,
  ) => Promise<string>;
}

export const WalletContext = createContext<WalletContextValue | null>(null);

let kitInitialized = false;

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const router = useRouter();

  // Initialize kit + restore prior session from localStorage
  useEffect(() => {
    let mounted = true;

    const restore = async () => {
      try {
        if (!kitInitialized) {
          StellarWalletsKit.init({
            modules: defaultModules(),
            network: Networks.TESTNET,
          });
          kitInitialized = true;
        }

        // Try to read the persisted address (kit auto-restores from localStorage)
        try {
          const result = await StellarWalletsKit.getAddress();
          if (mounted && result?.address) {
            setAddress(result.address);
          }
        } catch {
          // No persisted session
        }
      } catch (error) {
        console.error("Failed to initialize wallet kit:", error);
      } finally {
        if (mounted) setIsInitializing(false);
      }
    };

    restore();

    // Listen for disconnect events from the kit
    const unsubscribe = StellarWalletsKit.on(
      KitEventType.DISCONNECT,
      () => {
        if (mounted) setAddress(null);
      },
    );

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, []);

  const connect = useCallback(async () => {
    try {
      const result = await StellarWalletsKit.authModal();
      setAddress(result.address);
    } catch (error) {
      // User cancelled or modal closed — don't throw
      console.warn("Wallet connection cancelled:", error);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await StellarWalletsKit.disconnect();
    } catch (error) {
      console.error("Disconnect error:", error);
    }
    setAddress(null);
    router.push("/");
  }, [router]);

  const signTransaction = useCallback(
    async (xdr: string, networkPassphrase?: string) => {
      if (!address) throw new Error("Wallet not connected");
      const result = await StellarWalletsKit.signTransaction(xdr, {
        networkPassphrase:
          networkPassphrase ?? "Test SDF Network ; September 2015",
        address,
      });
      return result.signedTxXdr;
    },
    [address],
  );

  const value = useMemo<WalletContextValue>(
    () => ({
      address,
      isConnected: address !== null,
      isInitializing,
      connect,
      disconnect,
      signTransaction,
    }),
    [address, isInitializing, connect, disconnect, signTransaction],
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
