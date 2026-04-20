"use client";

interface BillingTabProps {
  workspace: any;
  plans: any[];
}

export function BillingTab({ workspace, plans }: BillingTabProps) {
  // Stats will come from on-chain events in next iteration
  const stats = [
    { label: "Monthly Revenue", value: "0.00", suffix: "USDC" },
    { label: "Active Subscribers", value: "0" },
    { label: "Failed Charges", value: "0" },
    { label: "Churn Rate", value: "0.0", suffix: "%" },
  ];

  return (
    <div>
      <div className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent mb-2">
          Analytics
        </p>
        <h2 className="text-2xl font-semibold text-foreground tracking-tight mb-1">
          Billing
        </h2>
        <p className="text-sm text-secondary">
          Revenue and subscriber metrics from the blockchain.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-elevated p-5"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted mb-3">
              {stat.label}
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-semibold text-foreground tabular-nums tracking-tight">
                {stat.value}
              </span>
              {stat.suffix && (
                <span className="text-xs text-muted font-mono">
                  {stat.suffix}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Chart placeholder */}
      <div className="rounded-xl border border-border bg-elevated p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Revenue</h3>
            <p className="text-xs text-muted mt-0.5">Last 30 days</p>
          </div>
        </div>
        <div className="h-64 rounded-lg bg-surface/50 border border-border-subtle border-dashed flex items-center justify-center">
          <p className="text-sm text-muted">
            Chart will appear once charges are processed
          </p>
        </div>
      </div>

      {/* Recent billing events */}
      <div className="rounded-xl border border-border bg-elevated overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">
            Recent activity
          </h3>
        </div>
        <div className="px-6 py-12 text-center">
          <p className="text-sm text-muted">No billing events yet</p>
        </div>
      </div>
    </div>
  );
}
