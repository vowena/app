"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  CheckIcon,
  AlertTriangleIcon,
  KeeperIcon,
  CalendarIcon,
} from "@/components/ui/icons";

interface KeeperTabProps {
  project: { merchant: string; name: string };
}

interface RunRecord {
  ts: number;
  attempted: number;
  charged: number;
  failed: number;
  error?: string;
}

export function KeeperTab({ project }: KeeperTabProps) {
  // Auto-billing is ON by default — that's the whole point of subscriptions.
  // Local-only setting (UI hint); the actual cron runs server-side.
  const [autoBillingEnabled, setAutoBillingEnabled] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [lastRunAt, setLastRunAt] = useState<number | null>(null);

  // Hydrate persisted preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem(
        `vowena:keeper:${project.merchant}:enabled`,
      );
      if (saved != null) setAutoBillingEnabled(saved === "true");
      const lastRun = localStorage.getItem(
        `vowena:keeper:${project.merchant}:lastRunAt`,
      );
      if (lastRun) setLastRunAt(Number(lastRun));
      const runsJson = localStorage.getItem(
        `vowena:keeper:${project.merchant}:runs`,
      );
      if (runsJson) setRuns(JSON.parse(runsJson));
    } catch {}
  }, [project.merchant]);

  const persistEnabled = (v: boolean) => {
    setAutoBillingEnabled(v);
    try {
      localStorage.setItem(
        `vowena:keeper:${project.merchant}:enabled`,
        String(v),
      );
    } catch {}
  };

  const handleRunNow = async () => {
    setIsRunning(true);
    try {
      const res = await fetch("/api/keeper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchantAddress: project.merchant }),
      });
      const data = await res.json();
      const run: RunRecord = {
        ts: Date.now(),
        attempted: data.attempted ?? 0,
        charged: data.charged ?? 0,
        failed: data.failed ?? 0,
        error: !res.ok ? data.error : undefined,
      };
      setRuns((prev) => {
        const next = [run, ...prev].slice(0, 10);
        try {
          localStorage.setItem(
            `vowena:keeper:${project.merchant}:runs`,
            JSON.stringify(next),
          );
        } catch {}
        return next;
      });
      setLastRunAt(run.ts);
      try {
        localStorage.setItem(
          `vowena:keeper:${project.merchant}:lastRunAt`,
          String(run.ts),
        );
      } catch {}
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div>
      <div className="mb-8 sm:mb-10 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
          Automation
        </p>
        <h2 className="text-2xl sm:text-[1.75rem] font-semibold text-foreground tracking-tight">
          Keeper
        </h2>
        <p className="text-sm text-secondary leading-relaxed max-w-prose">
          The keeper is what makes Vowena recurring. Every few minutes it walks
          your subscriptions and charges anyone whose period is due — pulling
          USDC from the allowance they signed at subscribe time. You don&apos;t
          have to do anything; the protocol handles it.
        </p>
      </div>

      {/* Status hero */}
      <div className="rounded-xl border border-border bg-elevated p-5 sm:p-6 mb-4">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-11 h-11 rounded-lg bg-success-subtle flex items-center justify-center text-success shrink-0">
              <KeeperIcon size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-semibold text-foreground tracking-tight">
                  Auto-billing
                </h3>
                {autoBillingEnabled ? (
                  <span className="flex items-center gap-1.5 text-[10px] font-semibold text-success">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    ACTIVE
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-muted">
                    PAUSED
                  </span>
                )}
              </div>
              <p className="text-xs text-secondary truncate">
                {autoBillingEnabled
                  ? "Subscribers are charged automatically as their billing periods come due."
                  : "Auto-billing is paused. You can still trigger charges manually."}
              </p>
            </div>
          </div>
          <Toggle enabled={autoBillingEnabled} onChange={persistEnabled} />
        </div>
      </div>

      {/* Manual trigger */}
      <div className="rounded-xl border border-border bg-elevated p-5 sm:p-6 mb-8">
        <div className="flex items-center justify-between gap-6">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground mb-1">
              Run keeper now
            </h3>
            <p className="text-xs text-secondary">
              Manually trigger a single sweep — useful for testing or when you
              want to charge due subs immediately.
            </p>
          </div>
          <Button
            onClick={handleRunNow}
            disabled={isRunning}
            className="shrink-0"
          >
            {isRunning ? "Running…" : "Run now"}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
        <KeeperStat
          label="Last run"
          value={lastRunAt ? formatRelative(lastRunAt) : "Never"}
        />
        <KeeperStat
          label="Total charged"
          value={runs.reduce((sum, r) => sum + r.charged, 0).toString()}
        />
        <KeeperStat
          label="Total attempts"
          value={runs.reduce((sum, r) => sum + r.attempted, 0).toString()}
        />
      </div>

      {/* Activity log */}
      <div className="rounded-xl border border-border bg-elevated overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Recent runs</h3>
        </div>
        {runs.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-muted">
              No runs yet. Hit &quot;Run now&quot; to test the keeper.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {runs.map((run, i) => (
              <li
                key={i}
                className="px-5 sm:px-6 py-3 flex items-center gap-3 text-sm"
              >
                <div
                  className={`shrink-0 ${run.error ? "text-error" : "text-success"}`}
                >
                  {run.error ? (
                    <AlertTriangleIcon size={14} />
                  ) : (
                    <CheckIcon size={14} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-foreground">
                    {run.error
                      ? `Failed: ${run.error}`
                      : `Charged ${run.charged} / ${run.attempted} subscription${
                          run.attempted === 1 ? "" : "s"
                        }`}
                  </p>
                  <p className="text-[10px] text-muted mt-0.5 flex items-center gap-1">
                    <CalendarIcon size={10} />
                    {new Date(run.ts).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Production note */}
      <div className="mt-6 rounded-lg border border-border bg-surface/40 p-4">
        <p className="text-xs text-secondary leading-relaxed">
          <span className="font-semibold text-foreground">In production</span> a
          server cron hits this same endpoint every few minutes — no dashboard
          needed. The toggle above is just a per-device convenience for testing
          locally; the actual scheduling lives on the server.
        </p>
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
        enabled ? "bg-success" : "bg-surface border border-border"
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
    <div className="rounded-xl border border-border bg-elevated p-4 sm:p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted mb-2">
        {label}
      </p>
      <p className="text-base font-semibold text-foreground tabular-nums">
        {value}
      </p>
    </div>
  );
}

function formatRelative(ts: number): string {
  const diffMs = Date.now() - ts;
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86_400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86_400)}d ago`;
}
