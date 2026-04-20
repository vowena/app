"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SubscribersTabProps {
  workspace: any;
  plans: any[];
}

const FILTERS = ["All", "Active", "Paused", "Cancelled", "Expired"] as const;
type FilterValue = (typeof FILTERS)[number];

export function SubscribersTab({ workspace, plans }: SubscribersTabProps) {
  const [filter, setFilter] = useState<FilterValue>("All");

  // Subscribers will come from on-chain in next iteration
  const subscribers: any[] = [];
  const filtered = subscribers;

  return (
    <div>
      <div className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent mb-2">
          Customers
        </p>
        <h2 className="text-2xl font-semibold text-foreground tracking-tight mb-1">
          Subscribers
        </h2>
        <p className="text-sm text-secondary">
          Everyone subscribed across your {plans.length} plan
          {plans.length !== 1 ? "s" : ""}.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1 mb-6 p-1 rounded-lg bg-surface w-fit">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              filter === f
                ? "bg-elevated text-foreground shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border border-dashed bg-surface/30 p-12 text-center">
          <h3 className="text-base font-semibold text-foreground mb-2">
            No subscribers yet
          </h3>
          <p className="text-sm text-secondary max-w-sm mx-auto">
            Subscribers will appear here once people sign up to your plans.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-elevated overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr className="text-left">
                <Th>Subscriber</Th>
                <Th>Plan</Th>
                <Th>Status</Th>
                <Th align="right">Periods</Th>
                <Th align="right">Next billing</Th>
                <Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sub: any) => (
                <tr
                  key={sub.id}
                  className="border-b border-border-subtle last:border-0 hover:bg-surface/50 transition-colors"
                >
                  <Td>
                    <span className="font-mono text-xs">
                      {sub.subscriber.slice(0, 6)}…{sub.subscriber.slice(-4)}
                    </span>
                  </Td>
                  <Td>Plan #{sub.planId}</Td>
                  <Td>
                    <Badge variant={statusVariant(sub.status)}>
                      {sub.status}
                    </Badge>
                  </Td>
                  <Td align="right">{sub.periodsBilled}</Td>
                  <Td align="right">
                    <span className="text-xs">
                      {new Date(
                        sub.nextBillingTime * 1000,
                      ).toLocaleDateString()}
                    </span>
                  </Td>
                  <Td align="right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm">
                        Refund
                      </Button>
                      <Button variant="ghost" size="sm">
                        Cancel
                      </Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted text-${align}`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <td className={`px-4 py-3 text-${align} text-foreground`}>{children}</td>
  );
}

function statusVariant(status: string) {
  switch (status) {
    case "Active":
      return "active";
    case "Paused":
      return "paused";
    case "Cancelled":
      return "cancelled";
    default:
      return "expired";
  }
}
