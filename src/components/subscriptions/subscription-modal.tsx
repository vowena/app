"use client";

import { useState } from "react";
import { Subscription } from "@/hooks/useSubscriptions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface SubscriptionModalProps {
  subscription: Subscription | null;
  isOpen: boolean;
  onClose: () => void;
  onCancel?: () => Promise<void>;
}

export function SubscriptionModal({
  subscription,
  isOpen,
  onClose,
  onCancel,
}: SubscriptionModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "history" | "details">(
    "overview"
  );
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !subscription) return null;

  const now = Math.floor(Date.now() / 1000);
  const nextBillingIn = subscription.nextBillingTime - now;
  const nextBillingCountdown =
    nextBillingIn > 0
      ? `${Math.floor(nextBillingIn / 3600)}h ${Math.floor((nextBillingIn % 3600) / 60)}m`
      : "Due now";

  const handleCancel = async () => {
    if (!onCancel) return;
    setIsLoading(true);
    try {
      await onCancel();
      onClose();
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="border-b border-border px-6 py-6 flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-1">
                {subscription.plan?.id ? `Plan #${subscription.plan.id}` : "Subscription"}
              </h2>
              <p className="text-secondary text-sm">
                Subscriber: {subscription.subscriber.slice(0, 12)}...
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-muted hover:text-foreground transition-colors p-2"
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-border px-6 flex gap-8">
            {(["overview", "history", "details"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? "text-accent border-accent"
                    : "text-muted border-transparent hover:text-secondary"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {activeTab === "overview" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-muted text-sm mb-2">Status</p>
                    <Badge
                      variant={
                        subscription.status === "Active"
                          ? "active"
                          : subscription.status === "Paused"
                            ? "paused"
                            : subscription.status === "Cancelled"
                              ? "cancelled"
                              : "expired"
                      }
                    >
                      {subscription.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted text-sm mb-2">Amount</p>
                    <p className="text-foreground font-mono text-sm">
                      {subscription.plan?.amount
                        ? (Number(subscription.plan.amount) / 1e7).toFixed(2)
                        : "0"}{" "}
                      USDC / {subscription.plan?.period}s
                    </p>
                  </div>
                  <div>
                    <p className="text-muted text-sm mb-2">Periods Billed</p>
                    <p className="text-foreground font-semibold">
                      {subscription.periodsBilled}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted text-sm mb-2">Next Billing</p>
                    <p className="text-foreground text-sm">
                      {nextBillingCountdown}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted text-sm mb-2">Created</p>
                    <p className="text-foreground text-sm">
                      {new Date(subscription.createdAt * 1000).toLocaleDateString()}
                    </p>
                  </div>
                  {subscription.cancelledAt > 0 && (
                    <div>
                      <p className="text-muted text-sm mb-2">Cancelled</p>
                      <p className="text-foreground text-sm">
                        {new Date(subscription.cancelledAt * 1000).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "history" && (
              <div className="space-y-3">
                <p className="text-muted text-sm">
                  Subscription events coming soon. Real-time event tracking will be
                  available in the next update.
                </p>
              </div>
            )}

            {activeTab === "details" && (
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <p className="text-muted mb-1">Subscription ID</p>
                  <p className="text-foreground break-all">{subscription.id}</p>
                </div>
                <div>
                  <p className="text-muted mb-1">Plan ID</p>
                  <p className="text-foreground">{subscription.planId}</p>
                </div>
                <div>
                  <p className="text-muted mb-1">Subscriber Address</p>
                  <p className="text-foreground break-all">
                    {subscription.subscriber}
                  </p>
                </div>
                <div>
                  <p className="text-muted mb-1">Contract Address</p>
                  <p className="text-foreground break-all">
                    CAHGU3IPILE6P7PH324ZTDTYJNQAOGPYZAYLIBJQWPJBVBK4MVIMZQAR
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border px-6 py-6 flex gap-3 justify-end">
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
            {subscription.status === "Active" && (
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={isLoading}
              >
                {isLoading ? "Cancelling..." : "Cancel Subscription"}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
