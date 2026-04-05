"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/wallet/wallet-provider";
import { VowenaLogo } from "@/components/vowena-logo";
import { Button } from "@/components/ui/button";

export default function AppHome() {
  const { isConnected, connect } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (isConnected) router.replace("/merchant");
  }, [isConnected, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      <VowenaLogo size="lg" />
      <p className="mt-4 text-sm text-muted text-center max-w-xs">
        Connect your Stellar wallet to access the dashboard.
      </p>
      <Button className="mt-6" onClick={connect}>
        Connect wallet
      </Button>
      <a
        href="https://vowena.xyz"
        className="mt-8 text-xs text-muted hover:text-accent transition-colors"
      >
        vowena.xyz
      </a>
    </div>
  );
}
