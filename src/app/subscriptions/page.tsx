"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useWallet } from "@/components/wallet/wallet-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";

type SubscriptionStatus = "Active" | "Paused" | "Cancelled" | "Expired";

interface BillingRecord {
  id: number;
  period: number;
  amount: string;
  date: string;
  txHash: string;
}

interface SubscriptionEntry {
  id: number;
  planId: number;
  planName: string;
  merchantAddress: string;
  token: string;
  amount: string;
  period: string;
  status: SubscriptionStatus;
  nextBillingDate: string;
  totalPaid: string;
  periodsBilled: number;
  migrationTarget: number;
  migrationPlanName?: string;
  billingHistory: BillingRecord[];
}

const PLACEHOLDER_SUBSCRIPTIONS: SubscriptionEntry[] = [
  {
    id: 1, planId: 101, planName: "Pro Monthly",
    merchantAddress: "GBXYZ...Q4R7MERCHANT1AAAAAAAAAAAAAAAAAAAAAA",
    token: "USDC", amount: "9.99", period: "Monthly", status: "Active",
    nextBillingDate: "2026-05-01", totalPaid: "29.97", periodsBilled: 3,
    migrationTarget: 0, billingHistory: [
      { id: 1, period: 1, amount: "9.99", date: "2026-02-01", txHash: "abc123...def" },
      { id: 2, period: 2, amount: "9.99", date: "2026-03-01", txHash: "ghi456...jkl" },
      { id: 3, period: 3, amount: "9.99", date: "2026-04-01", txHash: "mno789...pqr" },
    ],
  },
  {
    id: 2, planId: 202, planName: "Storage Basic",
    merchantAddress: "GCABC...D5E6MERCHANT2BBBBBBBBBBBBBBBBBBBBBB",
    token: "USDC", amount: "50.00", period: "Weekly", status: "Active",
    nextBillingDate: "2026-04-11", totalPaid: "500.00", periodsBilled: 10,
    migrationTarget: 203, migrationPlanName: "Storage Plus", billingHistory: [
      { id: 4, period: 9, amount: "50.00", date: "2026-03-28", txHash: "stu012...vwx" },
      { id: 5, period: 10, amount: "50.00", date: "2026-04-04", txHash: "yza345...bcd" },
    ],
  },
  {
    id: 3, planId: 303, planName: "API Access",
    merchantAddress: "GDEFG...H8I9MERCHANT3CCCCCCCCCCCCCCCCCCCCCC",
    token: "USDC", amount: "25.00", period: "Monthly", status: "Cancelled",
    nextBillingDate: "-", totalPaid: "75.00", periodsBilled: 3,
    migrationTarget: 0, billingHistory: [
      { id: 6, period: 1, amount: "25.00", date: "2026-01-15", txHash: "efg678...hij" },
      { id: 7, period: 2, amount: "25.00", date: "2026-02-15", txHash: "klm901...nop" },
      { id: 8, period: 3, amount: "25.00", date: "2026-03-15", txHash: "qrs234...tuv" },
    ],
  },
];

function truncateAddress(address: string): string {
  if (address.length <= 14) return address;
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

function badgeVariant(status: SubscriptionStatus): "active" | "paused" | "cancelled" | "expired" {
  return status.toLowerCase() as "active" | "paused" | "cancelled" | "expired";
}

export default function SubscriptionsPage() {
  const { address, isConnected, connect } = useWallet();
  const [subscriptions, setSubscriptions] = useState<SubscriptionEntry[]>(PLACEHOLDER_SUBSCRIPTIONS);
  const [expandedHistory, setExpandedHistory] = useState<Set<number>>(new Set());

  function handleCancel(id: number) {
    setSubscriptions((prev) =>
      prev.map((sub) => sub.id === id ? { ...sub, status: "Cancelled" as SubscriptionStatus, nextBillingDate: "-" } : sub),
    );
  }

  function handleAcceptMigration(id: number) {
    setSubscriptions((prev) =>
      prev.map((sub) => sub.id === id ? { ...sub, migrationTarget: 0, planName: sub.migrationPlanName ?? sub.planName, migrationPlanName: undefined } : sub),
    );
  }

  function handleRejectMigration(id: number) {
    setSubscriptions((prev) =>
      prev.map((sub) => sub.id === id ? { ...sub, migrationTarget: 0, migrationPlanName: undefined } : sub),
    );
  }

  function toggleHistory(id: number) {
    setExpandedHistory((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col">
        <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto w-full">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo/vowena.svg" alt="Vowena" width={20} height={20} />
            <span className="text-sm font-semibold" style={{ letterSpacing: "-0.03em" }}>vowena</span>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button size="sm" onClick={connect}>Connect wallet</Button>
          </div>
        </nav>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
          <div className="w-12 h-12 rounded-xl bg-accent-subtle flex items-center justify-center">
            <span className="text-accent text-lg">◎</span>
          </div>
          <h1 className="text-lg font-semibold text-foreground">My Subscriptions</h1>
          <p className="text-sm text-muted max-w-xs text-center">
            Connect your Stellar wallet to view and manage all your Vowena subscriptions.
          </p>
          <Button onClick={connect} className="mt-2">Connect wallet</Button>
        </div>
      </div>
    );
  }

  const active = subscriptions.filter((s) => s.status === "Active").length;
  const total = subscriptions.length;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto w-full border-b border-border">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo/vowena.svg" alt="Vowena" width={20} height={20} />
          <span className="text-sm font-semibold" style={{ letterSpacing: "-0.03em" }}>vowena</span>
        </Link>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <span className="text-xs font-mono text-muted">{address?.slice(0, 8)}...{address?.slice(-4)}</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto w-full px-6 py-8 flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight" style={{ letterSpacing: "-0.02em" }}>
              My Subscriptions
            </h1>
            <p className="text-sm text-muted mt-1">
              {active} active of {total} total across all merchants
            </p>
          </div>
          <Link href="/merchant">
            <Button variant="outline" size="sm">Merchant view</Button>
          </Link>
        </div>

        {/* Subscription cards */}
        <div className="grid gap-4">
          {subscriptions.map((sub) => (
            <Card key={sub.id} className="overflow-hidden">
              {/* Migration banner */}
              {sub.migrationTarget > 0 && (
                <div className="px-6 py-3 bg-warning/8 border-b border-warning/15 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Migration available to <span className="text-accent">{sub.migrationPlanName}</span>
                    </p>
                    <p className="text-xs text-muted mt-0.5">Review the new plan terms before accepting.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleAcceptMigration(sub.id)}>Accept</Button>
                    <Button size="sm" variant="ghost" onClick={() => handleRejectMigration(sub.id)}>Reject</Button>
                  </div>
                </div>
              )}

              <CardContent className="pt-5 pb-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-sm font-semibold text-foreground">{sub.planName}</h3>
                      <Badge variant={badgeVariant(sub.status)}>{sub.status}</Badge>
                    </div>
                    <p className="text-xs text-muted font-mono mt-1">{truncateAddress(sub.merchantAddress)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-foreground tabular-nums">
                      {sub.amount} <span className="text-xs font-normal text-muted">{sub.token}</span>
                    </p>
                    <p className="text-[11px] text-muted">/{sub.period.toLowerCase()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 py-3 border-t border-border-subtle">
                  <div>
                    <p className="text-[11px] text-muted uppercase tracking-wider mb-0.5">Next billing</p>
                    <p className="text-sm text-foreground tabular-nums">{sub.nextBillingDate}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted uppercase tracking-wider mb-0.5">Total paid</p>
                    <p className="text-sm text-foreground tabular-nums">{sub.totalPaid} {sub.token}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted uppercase tracking-wider mb-0.5">Periods</p>
                    <p className="text-sm text-foreground tabular-nums">{sub.periodsBilled}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border-subtle">
                  <button
                    onClick={() => toggleHistory(sub.id)}
                    className="text-xs text-muted hover:text-foreground transition-colors cursor-pointer"
                  >
                    {expandedHistory.has(sub.id) ? "Hide history" : "Billing history"}
                  </button>
                  {sub.status === "Active" && (
                    <button
                      onClick={() => handleCancel(sub.id)}
                      className="ml-auto text-xs text-error hover:text-error/80 transition-colors cursor-pointer"
                    >
                      Cancel subscription
                    </button>
                  )}
                </div>

                {/* Billing history */}
                {expandedHistory.has(sub.id) && (
                  <div className="mt-3 rounded-lg border border-border overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-surface text-muted">
                          <th className="px-3 py-2 text-left font-medium">#</th>
                          <th className="px-3 py-2 text-left font-medium">Date</th>
                          <th className="px-3 py-2 text-left font-medium">Amount</th>
                          <th className="px-3 py-2 text-left font-medium">Tx</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sub.billingHistory.map((record) => (
                          <tr key={record.id} className="border-t border-border-subtle">
                            <td className="px-3 py-2 text-muted tabular-nums">{record.period}</td>
                            <td className="px-3 py-2 text-foreground">{record.date}</td>
                            <td className="px-3 py-2 text-foreground tabular-nums">{record.amount} {sub.token}</td>
                            <td className="px-3 py-2 font-mono text-muted">{record.txHash}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
