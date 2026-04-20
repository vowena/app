"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useWallet } from "@/components/wallet/wallet-provider";
import { VowenaLogo } from "@/components/vowena-logo";
import { Button } from "@/components/ui/button";

export default function ConnectPage() {
  const { isConnected, connect } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (isConnected) router.replace("/subscriptions");
  }, [isConnected, router]);

  return (
    <>
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: `
            linear-gradient(var(--border-default) 1px, transparent 1px),
            linear-gradient(90deg, var(--border-default) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
          opacity: 0.025,
        }}
      />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-12">
            <VowenaLogo size="lg" />
          </div>

          <div className="bg-elevated rounded-2xl border border-border p-8 backdrop-blur-xl">
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-semibold text-foreground mb-3 leading-tight">
                Your{" "}
                <span className="serif-italic text-accent text-[1.1em]">
                  subscriptions.
                </span>
              </h1>
              <p className="text-secondary text-base leading-relaxed">
                Connect your Stellar wallet to manage subscriptions or build with
                Vowena.
              </p>
            </div>

            <Button
              onClick={connect}
              size="lg"
              className="w-full mb-6 h-11 text-base"
            >
              Connect Wallet
            </Button>

            <p className="text-center text-muted text-sm">
              Learn more at{" "}
              <Link
                href="https://vowena.xyz"
                className="text-accent hover:text-accent-hover transition-colors"
              >
                vowena.xyz
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
