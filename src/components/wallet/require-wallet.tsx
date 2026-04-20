"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/wallet/wallet-provider";

/**
 * Wraps protected routes. Redirects to / if no wallet is connected.
 * Renders nothing during the brief initialization window so we don't flash
 * authenticated UI to a disconnected user.
 */
export function RequireWallet({ children }: { children: React.ReactNode }) {
  const { isConnected, isInitializing } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (!isInitializing && !isConnected) {
      router.replace("/");
    }
  }, [isInitializing, isConnected, router]);

  if (isInitializing || !isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-border border-t-accent animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
