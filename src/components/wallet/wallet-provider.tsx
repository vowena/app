"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";
import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit/sdk";
import { defaultModules } from "@creit.tech/stellar-wallets-kit/modules/utils";
import { Networks } from "@creit.tech/stellar-wallets-kit";

interface WalletContextValue {
  address: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  signTransaction: (xdr: string, networkPassphrase?: string) => Promise<string>;
}

export const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const isConnected = address !== null;

  // Initialize the Stellar Wallets Kit once on mount
  useEffect(() => {
    try {
      StellarWalletsKit.init({
        modules: defaultModules(),
      });
      StellarWalletsKit.setNetwork(Networks.TESTNET);
      setIsInitialized(true);
    } catch (error) {
      console.error("Failed to initialize StellarWalletsKit:", error);
    }
  }, []);

  const connect = useCallback(async () => {
    if (!isInitialized) {
      throw new Error("Wallet kit not initialized");
    }

    try {
      const result = await StellarWalletsKit.authModal();
      setAddress(result.address);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      // User likely cancelled the modal
      throw error;
    }
  }, [isInitialized]);

  const disconnect = useCallback(async () => {
    try {
      await StellarWalletsKit.disconnect();
      setAddress(null);
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
      setAddress(null);
    }
  }, []);

  const signTransaction = useCallback(
    async (xdr: string, networkPassphrase?: string) => {
      if (!isConnected) {
        throw new Error("Wallet not connected");
      }

      if (!isInitialized) {
        throw new Error("Wallet kit not initialized");
      }

      try {
        const result = await StellarWalletsKit.signTransaction(xdr, {
          networkPassphrase: networkPassphrase ?? "Test SDF Network ; September 2015",
          address,
        });
        return result.signedTxXdr;
      } catch (error) {
        throw new Error(
          `Transaction signing failed: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    },
    [isConnected, isInitialized, address]
  );

  const value = useMemo<WalletContextValue>(
    () => ({
      address,
      isConnected,
      connect,
      disconnect,
      signTransaction,
    }),
    [address, isConnected, connect, disconnect, signTransaction]
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
