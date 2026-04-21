"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@/components/wallet/wallet-provider";

const KEY = "vowena:pro";

interface ProState {
  [walletAddress: string]: { activatedAt: number };
}

function readState(): ProState {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeState(state: ProState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}

export function usePro() {
  const { address } = useWallet();
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    queueMicrotask(() => {
      if (!mounted) return;

      if (!address) {
        setIsPro(false);
        setIsLoading(false);
        return;
      }

      const state = readState();
      setIsPro(!!state[address]);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [address]);

  const activate = useCallback(() => {
    if (!address) return;
    const state = readState();
    state[address] = { activatedAt: Date.now() };
    writeState(state);
    setIsPro(true);
  }, [address]);

  const deactivate = useCallback(() => {
    if (!address) return;
    const state = readState();
    delete state[address];
    writeState(state);
    setIsPro(false);
  }, [address]);

  return { isPro, isLoading, activate, deactivate };
}
