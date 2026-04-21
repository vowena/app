"use client";

import { useState } from "react";
import Link from "next/link";
import { useWallet } from "@/components/wallet/wallet-provider";
import { RequireWallet } from "@/components/wallet/require-wallet";
import { useSubscriptions, type Subscription } from "@/hooks/useSubscriptions";
import { SubscriptionModal } from "@/components/subscriptions/subscription-modal";
import { TopNav } from "@/components/top-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, ArrowRightIcon } from "@/components/ui/icons";
import { cancelSubscription } from "@/lib/contract";
import { formatChainError } from "@/lib/chain-errors";

export default function SubscriptionsPage() {
  return (
    <RequireWallet>
      <SubscriptionsView />
    </RequireWallet>
  );
}

function SubscriptionsView() {
  const { address } = useWallet();
  const { data: subscriptions, isLoading, refetch } =
    useSubscriptions(address);
  const [selectedSubId, setSelectedSubId] = useState<number | null>(null);

  const handleCancel = async () => {
    if (!address || selectedSubId == null) return;
    try {
      await cancelSubscription({ caller: address, subId: selectedSubId });
      setSelectedSubId(null);
      await refetch();
    } catch (err) {
      throw new Error(formatChainError(err, "Couldn't cancel subscription"));
    }
  };

  const selectedSub =
    selectedSubId && subscriptions
      ? subscriptions.find((s: Subscription) => s.id === selectedSubId)
      : null;

  const activeCount =
    subscriptions?.filter((s: Subscription) => s.status === "Active").length ||
    0;
  const inactiveCount = (subscriptions?.length || 0) - activeCount;

  return (
    <>
      <TopNav active="subscriptions" />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Header */}
        <div className="mb-12 sm:mb-16 space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
            Your subscriptions
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-semibold text-foreground tracking-tight leading-[1.1]">
            Manage your{" "}
            <span className="serif-italic text-accent text-[1.05em]">
              subscriptions.
            </span>
          </h1>
          <p className="text-secondary text-sm max-w-md">
            {isLoading
              ? "Reading from chain…"
              : `${activeCount} active${
                  inactiveCount > 0 ? ` · ${inactiveCount} inactive` : ""
                }`}
          </p>
        </div>

        {!subscriptions || subscriptions.length === 0 ? (
          <EmptyState
            title="No subscriptions yet"
            description="When you subscribe to a service powered by Vowena, it will appear here."
            action={
              <Link href="https://vowena.xyz" target="_blank">
                <Button variant="outline" className="gap-2">
                  Discover apps
                  <ArrowRightIcon size={14} />
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {subscriptions.map((sub: Subscription) => (
              <SubscriptionCard
                key={sub.id}
                sub={sub}
                onClick={() => setSelectedSubId(sub.id)}
              />
            ))}
          </div>
        )}
      </div>

      <SubscriptionModal
        subscription={selectedSub || null}
        isOpen={selectedSubId !== null}
        onClose={() => setSelectedSubId(null)}
        onCancel={handleCancel}
      />
    </>
  );
}

function SubscriptionCard({
  sub,
  onClick,
}: {
  sub: Subscription;
  onClick: () => void;
}) {
  const now = Math.floor(Date.now() / 1000);
  const nextBillingIn = sub.nextBillingTime - now;
  const nextBillingDate = new Date(sub.nextBillingTime * 1000);
  const amount = sub.plan?.amount
    ? (Number(sub.plan.amount) / 1e7).toFixed(2)
    : "0.00";

  const projectName = sub.projectName || "Untitled project";
  const planName = sub.planName || "Plan";
  const periodLabel = formatPeriod(sub.plan?.period || 0);
  const initial = (projectName[0] || "•").toUpperCase();

  return (
    <button
      onClick={onClick}
      className="text-left rounded-xl border border-border bg-elevated hover:border-accent/40 transition-all duration-200 p-6 sm:p-7 group flex flex-col"
    >
      <div className="flex items-start justify-between mb-5 gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-lg bg-accent-subtle flex items-center justify-center text-accent font-semibold text-sm shrink-0">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted mb-1 truncate">
              {projectName}
            </p>
            <h3 className="text-base font-semibold text-foreground group-hover:text-accent transition-colors truncate">
              {planName}
            </h3>
          </div>
        </div>
        <Badge
          variant={
            sub.status === "Active"
              ? "active"
              : sub.status === "Paused"
                ? "paused"
                : sub.status === "Cancelled"
                  ? "cancelled"
                  : "expired"
          }
        >
          {sub.status}
        </Badge>
      </div>

      <div className="mb-5">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-semibold text-foreground tracking-tight tabular-nums">
            {amount}
          </span>
          <span className="text-sm text-muted font-mono">USDC</span>
        </div>
        <p className="text-xs text-muted mt-1">per {periodLabel}</p>
      </div>

      <div className="mt-auto pt-4 border-t border-border-subtle flex items-center gap-2 text-xs text-muted">
        <CalendarIcon size={12} />
        <span>
          {sub.status === "Active"
            ? nextBillingIn > 0
              ? `Next ${nextBillingDate.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}`
              : "Due now"
            : sub.status}
        </span>
        <span className="ml-auto text-foreground font-medium">
          {sub.periodsBilled} period{sub.periodsBilled !== 1 ? "s" : ""}
        </span>
      </div>
    </button>
  );
}

function formatPeriod(seconds: number): string {
  if (seconds === 60) return "minute";
  if (seconds === 3600) return "hour";
  if (seconds === 86400) return "day";
  if (seconds === 604800) return "week";
  if (seconds === 2592000) return "month";
  if (seconds === 7776000) return "quarter";
  if (seconds === 31536000) return "year";
  return `${seconds}s`;
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border border-dashed bg-surface/50 p-10 sm:p-16 text-center">
      <h3 className="text-xl font-semibold text-foreground mb-2 tracking-tight">
        {title}
      </h3>
      <p className="text-secondary text-sm mb-8 max-w-sm mx-auto leading-relaxed">
        {description}
      </p>
      {action}
    </div>
  );
}
