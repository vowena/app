"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useWallet } from "@/components/wallet/wallet-provider";
import { VowenaLogo } from "@/components/vowena-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  LogoutIcon,
  CopyIcon,
  CheckIcon,
  ExternalLinkIcon,
} from "@/components/ui/icons";

interface TopNavProps {
  active?: "subscriptions" | "workspaces";
}

export function TopNav({ active }: TopNavProps) {
  const { address, disconnect } = useWallet();
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setWalletMenuOpen(false);
      }
    };
    if (walletMenuOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [walletMenuOpen]);

  const handleCopy = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
        {/* Left: Logo + nav */}
        <div className="flex items-center gap-4 sm:gap-8 min-w-0">
          <Link href="/subscriptions" className="flex items-center shrink-0">
            <VowenaLogo size="sm" />
          </Link>

          <nav className="flex items-center gap-1 -mx-1">
            <Link
              href="/subscriptions"
              className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
                active === "subscriptions"
                  ? "text-foreground bg-surface"
                  : "text-muted hover:text-foreground hover:bg-surface/50"
              }`}
            >
              Subscriptions
            </Link>
            <Link
              href="/workspaces"
              className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
                active === "workspaces"
                  ? "text-foreground bg-surface"
                  : "text-muted hover:text-foreground hover:bg-surface/50"
              }`}
            >
              Workspaces
            </Link>
          </nav>
        </div>

        {/* Right: Theme + wallet */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <ThemeToggle />

          {address && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setWalletMenuOpen(!walletMenuOpen)}
                className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-mono text-secondary hover:text-foreground hover:bg-surface transition-all border border-border"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                <span className="hidden sm:inline">
                  {address.slice(0, 4)}…{address.slice(-4)}
                </span>
                <span className="sm:hidden">{address.slice(0, 3)}…</span>
              </button>

              {walletMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-elevated shadow-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted mb-2">
                      Connected wallet
                    </p>
                    <p className="text-xs font-mono text-foreground break-all">
                      {address}
                    </p>
                  </div>
                  <div className="p-1">
                    <button
                      onClick={handleCopy}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-secondary hover:text-foreground hover:bg-surface transition-colors"
                    >
                      {copied ? (
                        <>
                          <CheckIcon size={14} className="text-success" />
                          Copied
                        </>
                      ) : (
                        <>
                          <CopyIcon size={14} />
                          Copy address
                        </>
                      )}
                    </button>
                    <a
                      href={`https://stellar.expert/explorer/testnet/account/${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-secondary hover:text-foreground hover:bg-surface transition-colors"
                    >
                      <ExternalLinkIcon size={14} />
                      View on Explorer
                    </a>
                    <button
                      onClick={() => {
                        disconnect();
                        setWalletMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-error hover:bg-error/5 transition-colors"
                    >
                      <LogoutIcon size={14} />
                      Disconnect
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
