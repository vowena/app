"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CircleDotIcon } from "@/components/ui/icons";

interface KeeperTabProps {
  workspace: any;
}

export function KeeperTab({ workspace }: KeeperTabProps) {
  const [autoBillingEnabled, setAutoBillingEnabled] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const handleRunNow = async () => {
    setIsRunning(true);
    try {
      // TODO: Call /api/keeper
      await new Promise((r) => setTimeout(r, 1000));
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent mb-2">
          Automation
        </p>
        <h2 className="text-2xl font-semibold text-foreground tracking-tight mb-1">
          Keeper
        </h2>
        <p className="text-sm text-secondary">
          Automatically charge subscribers when their billing period is due.
        </p>
      </div>

      {/* Auto-billing toggle card */}
      <div className="rounded-xl border border-border bg-elevated p-6 mb-6">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-foreground">
                Auto-billing
              </h3>
              {autoBillingEnabled && (
                <span className="flex items-center gap-1.5 text-[10px] font-medium text-success">
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  RUNNING
                </span>
              )}
            </div>
            <p className="text-xs text-secondary leading-relaxed">
              When enabled, the keeper runs every 5 minutes and charges
              subscribers as their billing periods come due.
            </p>
          </div>
          <Toggle
            enabled={autoBillingEnabled}
            onChange={setAutoBillingEnabled}
          />
        </div>
      </div>

      {/* Manual trigger */}
      <div className="rounded-xl border border-border bg-elevated p-6 mb-8">
        <div className="flex items-center justify-between gap-6">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1">
              Run keeper now
            </h3>
            <p className="text-xs text-secondary">
              Manually trigger a single run to charge any due subscriptions.
            </p>
          </div>
          <Button onClick={handleRunNow} disabled={isRunning}>
            {isRunning ? "Running…" : "Run now"}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KeeperStat label="Last run" value="Never" />
        <KeeperStat
          label="Next run"
          value={autoBillingEnabled ? "in 5 min" : "—"}
        />
        <KeeperStat label="Subs charged today" value="0" />
      </div>

      {/* Activity log */}
      <div className="rounded-xl border border-border bg-elevated overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Recent runs</h3>
        </div>
        <div className="px-6 py-12 text-center">
          <p className="text-sm text-muted">No runs yet</p>
        </div>
      </div>
    </div>
  );
}

function Toggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        enabled ? "bg-accent" : "bg-surface border border-border"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function KeeperStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-elevated p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted mb-2">
        {label}
      </p>
      <p className="text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}
