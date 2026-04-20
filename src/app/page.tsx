"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useWallet } from "@/components/wallet/wallet-provider";
import { VowenaLogo } from "@/components/vowena-logo";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "@/components/ui/icons";

export default function ConnectPage() {
  const { isConnected, connect } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (isConnected) router.replace("/subscriptions");
  }, [isConnected, router]);

  return (
    <>
      {/* Background grid */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: `
            linear-gradient(var(--border-default) 1px, transparent 1px),
            linear-gradient(90deg, var(--border-default) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
          opacity: 0.04,
        }}
      />
      {/* Top accent hairline */}
      <div className="fixed inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
      {/* Soft radial glow */}
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 pointer-events-none">
        <div className="w-[600px] h-[400px] rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Logo above card */}
          <div className="flex justify-center mb-10">
            <Link href="https://vowena.xyz" className="inline-flex">
              <VowenaLogo size="default" />
            </Link>
          </div>

          {/* Main card */}
          <div className="rounded-2xl border border-border bg-elevated/80 backdrop-blur-xl p-8 sm:p-10 shadow-2xl">
            <div className="text-center mb-8">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 mb-6">
                <span className="h-px w-6 bg-accent/40" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
                  Welcome
                </span>
                <span className="h-px w-6 bg-accent/40" />
              </div>

              <h1 className="text-3xl sm:text-[2.25rem] font-semibold text-foreground mb-4 leading-[1.1] tracking-tight">
                Recurring payments,{" "}
                <span className="serif-italic text-accent text-[1.08em]">
                  reimagined.
                </span>
              </h1>
              <p className="text-secondary text-sm leading-relaxed max-w-sm mx-auto">
                Connect your Stellar wallet to manage your subscriptions or
                start accepting recurring payments for your product.
              </p>
            </div>

            <Button
              onClick={connect}
              size="lg"
              className="w-full h-11 text-sm gap-2"
            >
              Connect wallet
              <ArrowRightIcon size={14} />
            </Button>

            {/* Supported wallets indicator */}
            <p className="text-center text-[11px] text-muted mt-6">
              Supports Freighter, LOBSTR, Albedo, Rabet & xBull
            </p>
          </div>

          {/* Footer link */}
          <p className="text-center text-xs text-muted mt-8">
            New to Vowena?{" "}
            <Link
              href="https://vowena.xyz"
              className="text-secondary hover:text-foreground transition-colors"
            >
              Read the docs →
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
