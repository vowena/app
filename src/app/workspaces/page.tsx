"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/wallet/wallet-provider";
import { RequireWallet } from "@/components/wallet/require-wallet";
import { usePro } from "@/hooks/usePro";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { CreateWorkspaceModal } from "@/components/workspaces/create-workspace-modal";
import { TopNav } from "@/components/top-nav";
import { Button } from "@/components/ui/button";
import {
  PlusIcon,
  ArrowRightIcon,
  CheckIcon,
} from "@/components/ui/icons";

export default function WorkspacesPage() {
  return (
    <RequireWallet>
      <WorkspacesView />
    </RequireWallet>
  );
}

function WorkspacesView() {
  const { address } = useWallet();
  const router = useRouter();
  const { isPro, activate } = usePro();
  const { workspaces, createWorkspace } = useWorkspaces();
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (!isPro) {
    return (
      <>
        <TopNav active="workspaces" />
        <UpgradeView onActivate={activate} />
      </>
    );
  }

  return (
    <>
      <TopNav active="workspaces" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Header */}
        <div className="mb-12 sm:mb-16 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
              Workspaces
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-semibold text-foreground tracking-tight leading-[1.1]">
              Your{" "}
              <span className="serif-italic text-accent text-[1.05em]">
                projects.
              </span>
            </h1>
            <p className="text-secondary text-sm max-w-md">
              {workspaces.length === 0
                ? "Create a workspace for each product or service you charge for."
                : `${workspaces.length} workspace${workspaces.length !== 1 ? "s" : ""} on Stellar.`}
            </p>
          </div>
          {workspaces.length > 0 && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="gap-2 shrink-0 self-start sm:self-end"
            >
              <PlusIcon size={14} />
              New workspace
            </Button>
          )}
        </div>

        {workspaces.length === 0 ? (
          <EmptyState onCreate={() => setShowCreateModal(true)} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                onClick={() => router.push(`/workspaces/${workspace.id}`)}
                className="text-left rounded-xl border border-border bg-elevated hover:border-accent/40 hover:bg-elevated transition-all duration-200 p-6 sm:p-7 group"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="w-10 h-10 rounded-lg bg-accent-subtle flex items-center justify-center text-accent font-semibold text-sm">
                    {workspace.name.slice(0, 2).toUpperCase()}
                  </div>
                  <ArrowRightIcon
                    size={16}
                    className="text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all"
                  />
                </div>
                <h3 className="text-base font-semibold text-foreground group-hover:text-accent transition-colors mb-2 truncate">
                  {workspace.name}
                </h3>
                {workspace.description && (
                  <p className="text-sm text-secondary mb-4 line-clamp-2 leading-relaxed">
                    {workspace.description}
                  </p>
                )}
                <p className="text-xs font-mono text-muted truncate">
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

function UpgradeView({ onActivate }: { onActivate: () => void }) {
  return (
    <section className="relative overflow-hidden">
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
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 pointer-events-none">
        <div className="w-[600px] h-[300px] rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28 pb-24 sm:pb-32">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent mb-6">
            Vowena Pro
          </p>

          <h1 className="text-3xl sm:text-4xl lg:text-[3rem] font-semibold text-foreground mb-6 leading-[1.1] tracking-tight">
            Build with{" "}
            <span className="serif-italic text-accent text-[1.08em]">
              Vowena.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-secondary leading-relaxed mb-10">
            Workspaces give you everything you need to accept recurring
            payments. Create plans, share checkout links, and integrate in
            minutes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
            <Button
              size="lg"
              className="h-11 px-6 text-sm gap-2"
              onClick={onActivate}
            >
              Activate Pro
              <ArrowRightIcon size={14} />
            </Button>
          </div>

          <p className="text-xs text-muted">
            Pro is free during the open beta. No credit card required.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 max-w-3xl mx-auto mt-20 sm:mt-24">
          {[
            {
              title: "Unlimited workspaces",
              description:
                "Create separate billing setups for each product or project.",
            },
            {
              title: "Shareable checkout",
              description:
                "Send a link, get paid. No SDK required for basic flows.",
            },
            {
              title: "Real-time analytics",
              description:
                "Revenue, churn, and subscriber growth read from on-chain events.",
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
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-2xl border border-border border-dashed bg-surface/50 p-10 sm:p-16 text-center">
      <h3 className="text-xl font-semibold text-foreground mb-2 tracking-tight">
        No workspaces yet
      </h3>
      <p className="text-secondary text-sm mb-8 max-w-sm mx-auto leading-relaxed">
        Create your first workspace to start accepting recurring payments for
        your product.
      </p>
      <Button onClick={onCreate} className="gap-2">
        <PlusIcon size={14} />
        Create workspace
      </Button>
    </div>
  );
}
