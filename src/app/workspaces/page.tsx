"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/wallet/wallet-provider";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { CreateWorkspaceModal } from "@/components/workspaces/create-workspace-modal";
import { TopNav } from "@/components/top-nav";
import { Button } from "@/components/ui/button";
import {
  PlusIcon,
  ArrowRightIcon,
  CheckIcon,
  SparkleIcon,
} from "@/components/ui/icons";

export default function WorkspacesPage() {
  const { address } = useWallet();
  const router = useRouter();
  const { workspaces, createWorkspace } = useWorkspaces();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isPro, setIsPro] = useState(false);

  if (!isPro) {
    return (
      <>
        <TopNav active="workspaces" />

        {/* Premium upgrade hero */}
        <section className="relative overflow-hidden">
          {/* Background grid pattern */}
          <div
            className="absolute inset-0 -z-10"
            style={{
              backgroundImage: `
                linear-gradient(var(--border-default) 1px, transparent 1px),
                linear-gradient(90deg, var(--border-default) 1px, transparent 1px)
              `,
              backgroundSize: "64px 64px",
              opacity: 0.04,
            }}
          />
          {/* Top hairline accent */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
          {/* Soft radial glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10">
            <div className="w-[600px] h-[300px] rounded-full bg-accent/5 blur-3xl" />
          </div>

          <div className="max-w-4xl mx-auto px-6 pt-24 pb-32">
            <div className="text-center">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 mb-8">
                <span className="h-px w-8 bg-accent/40" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
                  VOWENA PRO
                </span>
                <span className="h-px w-8 bg-accent/40" />
              </div>

              {/* Heading */}
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-semibold text-foreground mb-6 leading-[1.05] tracking-tight">
                Build with{" "}
                <span className="serif-italic text-accent text-[1.08em]">
                  Vowena.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-secondary leading-relaxed max-w-xl mx-auto mb-10">
                Workspaces give you everything you need to accept recurring
                payments. Create plans, manage subscribers, and integrate in
                minutes.
              </p>

              {/* Beta callout */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-subtle border border-accent/20 mb-10">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
                </span>
                <span className="text-xs font-medium text-accent">
                  Free during open beta
                </span>
              </div>

              {/* CTA */}
              <div className="flex items-center justify-center gap-3 mb-16">
                <Button
                  size="lg"
                  className="h-11 px-6 text-sm gap-2"
                  onClick={() => {
                    setIsPro(true);
                  }}
                >
                  Activate Pro
                  <ArrowRightIcon size={14} />
                </Button>
              </div>
            </div>

            {/* Feature grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {[
                {
                  title: "Unlimited workspaces",
                  description:
                    "Create separate billing setups for each product or project.",
                },
                {
                  title: "Real-time analytics",
                  description:
                    "Track revenue, churn, and subscriber growth on-chain.",
                },
                {
                  title: "SDK integration",
                  description:
                    "Drop into your app in minutes with our typed SDK.",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl border border-border bg-elevated p-6"
                >
                  <div className="w-8 h-8 rounded-lg bg-accent-subtle flex items-center justify-center mb-4">
                    <CheckIcon size={14} className="text-accent" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2 text-sm">
                    {feature.title}
                  </h3>
                  <p className="text-secondary text-xs leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </>
    );
  }

  // Pro view - workspaces list
  return (
    <>
      <TopNav active="workspaces" />

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent mb-3">
              WORKSPACES
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold text-foreground mb-3 tracking-tight">
              Your{" "}
              <span className="serif-italic text-accent text-[1.05em]">
                projects.
              </span>
            </h1>
            <p className="text-secondary text-sm">
              {workspaces.length} workspace{workspaces.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="gap-2 shrink-0"
          >
            <PlusIcon size={14} />
            New workspace
          </Button>
        </div>

        {/* Workspaces grid */}
        {workspaces.length === 0 ? (
          <div className="rounded-2xl border border-border border-dashed bg-surface/50 p-16 text-center">
            <div className="w-12 h-12 mx-auto mb-6 rounded-full bg-accent-subtle flex items-center justify-center">
              <SparkleIcon size={20} className="text-accent" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No workspaces yet
            </h3>
            <p className="text-secondary text-sm mb-8 max-w-sm mx-auto">
              Create your first workspace to start accepting recurring payments
              for your product.
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="gap-2"
            >
              <PlusIcon size={14} />
              Create workspace
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                onClick={() => router.push(`/workspaces/${workspace.id}`)}
                className="text-left rounded-xl border border-border bg-elevated hover:border-accent/40 transition-all duration-200 p-6 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-accent-subtle flex items-center justify-center text-accent font-semibold text-sm">
                    {workspace.name.slice(0, 2).toUpperCase()}
                  </div>
                  <ArrowRightIcon
                    size={16}
                    className="text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all"
                  />
                </div>
                <h3 className="text-base font-semibold text-foreground group-hover:text-accent transition-colors mb-2">
                  {workspace.name}
                </h3>
                {workspace.description && (
                  <p className="text-sm text-secondary mb-4 line-clamp-2">
                    {workspace.description}
                  </p>
                )}
                <p className="text-xs font-mono text-muted">
                  {workspace.merchantAddress.slice(0, 6)}…
                  {workspace.merchantAddress.slice(-6)}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      <CreateWorkspaceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateWorkspace={(name, merchantAddress, description) => {
          const ws = createWorkspace(name, merchantAddress, description);
          setShowCreateModal(false);
          router.push(`/workspaces/${ws.id}`);
        }}
        defaultAddress={address || ""}
      />
    </>
  );
}
