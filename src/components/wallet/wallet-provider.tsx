"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";
import {
  StellarWalletsKit,
  WalletNetwork,
  FREIGHTER_ID,
  ALBEDO_ID,
  LOBSTR_ID,
  RABET_ID,
  XBULL_ID,
} from "@creit.tech/stellar-wallets-kit";

interface WalletContextValue {
  address: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  signTransaction: (xdr: string, networkPassphrase?: string) => Promise<string>;
  kit: StellarWalletsKit | null;
}

export const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [kit, setKit] = useState<StellarWalletsKit | null>(null);

  const isConnected = address !== null;

  // Initialize the Stellar Wallets Kit
  useEffect(() => {
    const initKit = new StellarWalletsKit({
      network: WalletNetwork.TESTNET,
      selectedWalletId: undefined,
      wallets: [FREIGHTER_ID, ALBEDO_ID, LOBSTR_ID, RABET_ID, XBULL_ID],
    });
    setKit(initKit);
  }, []);

  const connect = useCallback(async () => {
    if (!kit) {
      throw new Error("Wallet kit not initialized");
    }

    try {
      // Open the wallet selection modal
      await kit.openModal((selectedWalletId) => {
        // This callback is called when a wallet is selected
      });

      // Get the selected wallet and request access
      const selectedWalletId = kit.getWalletId();
      if (!selectedWalletId) {
        throw new Error("No wallet selected");
      }

      const selectedWallet = kit.getWallet();
      if (!selectedWallet) {
        throw new Error("Failed to get selected wallet");
      }

      // Get the public key/address
      const publicKey = await selectedWallet.getPublicKey();
      if (!publicKey) {
        throw new Error("Failed to get wallet address");
      }

      setAddress(publicKey);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("cancelled") === false
      ) {
        throw error;
      }
      // User cancelled the modal, silently fail
    }
  }, [kit]);

  const disconnect = useCallback(() => {
    setAddress(null);
    if (kit) {
      kit.disconnect();
    }
  }, [kit]);

  const signTransaction = useCallback(
    async (xdr: string, networkPassphrase?: string) => {
      if (!isConnected || !kit) {
        throw new Error("Wallet not connected");
      }

      const wallet = kit.getWallet();
      if (!wallet) {
        throw new Error("No wallet connected");
      }

      try {
        const signedXdr = await wallet.signTransaction(xdr, {
          networkPassphrase: networkPassphrase ?? "Test SDF Network ; September 2015",
        });
        return signedXdr;
      } catch (error) {
        throw new Error(
          `Transaction signing failed: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    },
    [isConnected, kit]
  );

  const value = useMemo<WalletContextValue>(
    () => ({
      address,
      isConnected,
      connect,
      disconnect,
      signTransaction,
      kit,
    }),
    [address, isConnected, connect, disconnect, signTransaction, kit]
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
