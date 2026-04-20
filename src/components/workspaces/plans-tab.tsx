"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PlusIcon, CloseIcon, CopyIcon, CheckIcon } from "@/components/ui/icons";

interface PlansTabProps {
  workspace: any;
  plans: any[];
  isLoading: boolean;
}

const TUSDC_SAC = "CARX6UEO5WL2IMHPCFURHXNRQJQ4NHSMN26SK6FNE7FN27LISLZDINFA";

export function PlansTab({ workspace, plans, isLoading }: PlansTabProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between gap-6 mb-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent mb-2">
            Pricing Plans
          </p>
          <h2 className="text-2xl font-semibold text-foreground tracking-tight mb-1">
            Plans
          </h2>
          <p className="text-sm text-secondary">
            Define what you charge subscribers and how often.
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="gap-2 shrink-0">
            <PlusIcon size={14} />
            New plan
          </Button>
        )}
      </div>

      {showForm && (
        <CreatePlanForm
          onClose={() => setShowForm(false)}
          onSubmit={async (data) => {
            // TODO: wire to contract.createPlan(...)
            console.log("Creating plan:", data);
            setShowForm(false);
          }}
        />
      )}

      {/* Plans list */}
      {isLoading ? (
        <PlansSkeleton />
      ) : plans.length === 0 && !showForm ? (
        <div className="rounded-xl border border-border border-dashed bg-surface/30 p-12 text-center">
          <h3 className="text-base font-semibold text-foreground mb-2">
            No plans yet
          </h3>
          <p className="text-sm text-secondary mb-6 max-w-sm mx-auto">
            Create your first pricing plan to start accepting subscribers.
          </p>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <PlusIcon size={14} />
            Create plan
          </Button>
        </div>
      ) : plans.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PlanCard({ plan }: { plan: any }) {
  const [copied, setCopied] = useState(false);
  const amount = (Number(plan.amount) / 1e7).toFixed(2);

  const handleCopyId = async () => {
    await navigator.clipboard.writeText(plan.id.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="rounded-xl border border-border bg-elevated p-6 group">
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted mb-1.5">
            Plan #{plan.id}
          </p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold text-foreground tabular-nums tracking-tight">
              {amount}
            </span>
            <span className="text-xs text-muted font-mono">USDC</span>
          </div>
          <p className="text-xs text-muted mt-0.5">
            every {plan.period}s
          </p>
        </div>
        <Badge variant={plan.active ? "active" : "expired"}>
          {plan.active ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="space-y-1.5 text-xs mb-5 pb-5 border-b border-border-subtle">
        <Row label="Trial" value={`${plan.trialPeriods} period${plan.trialPeriods !== 1 ? "s" : ""}`} />
        <Row label="Max periods" value={plan.maxPeriods > 0 ? plan.maxPeriods.toString() : "Unlimited"} />
        <Row label="Grace" value={`${plan.gracePeriod}s`} />
        <Row label="Ceiling" value={`${(Number(plan.priceCeiling) / 1e7).toFixed(2)} USDC`} />
      </div>

      <button
        onClick={handleCopyId}
        className="w-full flex items-center justify-between text-xs text-muted hover:text-foreground transition-colors"
      >
        <span>Plan ID</span>
        <span className="flex items-center gap-1.5 font-mono">
          {plan.id}
          {copied ? (
            <CheckIcon size={12} className="text-success" />
          ) : (
            <CopyIcon size={12} />
          )}
        </span>
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted">{label}</span>
      <span className="text-foreground font-medium">{value}</span>
    </div>
  );
}

function CreatePlanForm({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}) {
  const [token, setToken] = useState(TUSDC_SAC);
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState("2592000"); // 30 days
  const [trialPeriods, setTrialPeriods] = useState("0");
  const [maxPeriods, setMaxPeriods] = useState("0");
  const [gracePeriod, setGracePeriod] = useState("86400"); // 1 day
  const [priceCeiling, setPriceCeiling] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        token,
        amount: BigInt(Math.floor(parseFloat(amount) * 1e7)),
        period: parseInt(period),
        trialPeriods: parseInt(trialPeriods),
        maxPeriods: parseInt(maxPeriods),
        gracePeriod: parseInt(gracePeriod),
        priceCeiling: BigInt(Math.floor(parseFloat(priceCeiling || amount) * 2 * 1e7)),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-border bg-elevated p-6 mb-6"
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-foreground tracking-tight">
            New plan
          </h3>
          <p className="text-xs text-secondary mt-1">
            Configure your subscription pricing.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-muted hover:text-foreground hover:bg-surface rounded-md p-2 transition-colors"
        >
          <CloseIcon size={14} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Amount (USDC)" required>
          <Input
            type="number"
            step="0.01"
            placeholder="9.99"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </Field>

        <Field label="Period" required>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-full h-9 rounded-lg border border-border bg-elevated px-3 text-sm focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none"
          >
            <option value="60">Every minute (testing)</option>
            <option value="3600">Hourly</option>
            <option value="86400">Daily</option>
            <option value="604800">Weekly</option>
            <option value="2592000">Monthly</option>
            <option value="7776000">Quarterly</option>
            <option value="31536000">Yearly</option>
          </select>
        </Field>

        <Field label="Trial periods" hint="Free periods at start">
          <Input
            type="number"
            placeholder="0"
            value={trialPeriods}
            onChange={(e) => setTrialPeriods(e.target.value)}
          />
        </Field>

        <Field label="Max periods" hint="0 = unlimited">
          <Input
            type="number"
            placeholder="0"
            value={maxPeriods}
            onChange={(e) => setMaxPeriods(e.target.value)}
          />
        </Field>

        <Field label="Grace (seconds)" hint="Time before pause on failed charge">
          <Input
            type="number"
            placeholder="86400"
            value={gracePeriod}
            onChange={(e) => setGracePeriod(e.target.value)}
          />
        </Field>

        <Field label="Price ceiling (USDC)" hint="Max future price (defaults to 2× amount)">
          <Input
            type="number"
            step="0.01"
            placeholder={amount ? (parseFloat(amount) * 2).toFixed(2) : ""}
            value={priceCeiling}
            onChange={(e) => setPriceCeiling(e.target.value)}
          />
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Token contract">
          <Input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="font-mono text-xs"
          />
        </Field>
      </div>

      <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-border-subtle">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !amount}>
          {isSubmitting ? "Creating…" : "Create plan"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-foreground mb-1.5">
        {label}
        {required && <span className="text-error ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] text-muted mt-1">{hint}</p>}
    </div>
  );
}

function PlansSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-elevated p-6 animate-pulse"
        >
          <div className="h-3 w-16 bg-surface rounded mb-3" />
          <div className="h-8 w-24 bg-surface rounded mb-2" />
          <div className="h-3 w-20 bg-surface rounded mb-6" />
          <div className="space-y-2">
            <div className="h-3 bg-surface rounded" />
            <div className="h-3 bg-surface rounded" />
            <div className="h-3 bg-surface rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
