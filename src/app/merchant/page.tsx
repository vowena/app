"use client";

import { useState } from "react";
import Link from "next/link";
import { useWallet } from "@/components/wallet/wallet-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function MerchantOverviewPage() {
  const { address, isConnected, connect } = useWallet();

  const [stats] = useState({
    totalPlans: 0,
    activeSubscribers: 0,
    totalRevenue: "0.00",
    successRate: "100",
  });

  if (!isConnected) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-accent-subtle flex items-center justify-center mb-2">
          <span className="text-accent text-lg">◻</span>
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          Connect your wallet
        </h2>
        <p className="text-sm text-muted max-w-xs text-center">
          Connect a Stellar wallet to create billing plans and manage subscribers.
        </p>
        <Button onClick={connect} className="mt-2">Connect wallet</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight" style={{ letterSpacing: "-0.02em" }}>
            Overview
          </h1>
          <p className="mt-1 text-sm text-muted">
            Your merchant dashboard at a glance.
          </p>
        </div>
        <Link href="/merchant/plans">
          <Button size="sm">Create plan</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Plans", value: stats.totalPlans, change: null },
          { label: "Subscribers", value: stats.activeSubscribers, change: null },
          { label: "Revenue", value: `$${stats.totalRevenue}`, sub: "USDC" },
          { label: "Success rate", value: `${stats.successRate}%`, change: null },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-5 pb-5">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted mb-3">{stat.label}</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-semibold text-foreground tabular-nums">{stat.value}</span>
                {stat.sub && <span className="text-xs text-muted">{stat.sub}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions + recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Getting started */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Get started</h3>
            <div className="space-y-3">
              {[
                { label: "Create your first plan", href: "/merchant/plans", done: stats.totalPlans > 0 },
                { label: "Share with subscribers", href: "https://docs.vowena.xyz/quickstart", done: false },
                { label: "Enable auto-billing", href: "/merchant/keeper", done: false },
              ].map((step) => (
                <Link
                  key={step.label}
                  href={step.href}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-accent/20 hover:bg-surface transition-all group"
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    step.done ? "border-success bg-success/10" : "border-border group-hover:border-accent/40"
                  }`}>
                    {step.done && <span className="text-success text-[10px]">✓</span>}
                  </div>
                  <span className="text-sm text-secondary group-hover:text-foreground transition-colors">{step.label}</span>
                  <span className="ml-auto text-xs text-muted opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Recent activity</h3>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center mb-3">
                <span className="text-muted text-sm">◈</span>
              </div>
              <p className="text-sm text-muted">No activity yet</p>
              <p className="text-xs text-muted mt-1">Events will appear here as subscribers join and billing executes.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
