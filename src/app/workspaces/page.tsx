"use client";

import { useWallet } from "@/components/wallet/wallet-provider";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { VowenaLogo } from "@/components/vowena-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CreateWorkspaceModal } from "@/components/workspaces/create-workspace-modal";

export default function WorkspacesPage() {
  const { address, disconnect } = useWallet();
  const router = useRouter();
  const { workspaces, createWorkspace } = useWorkspaces();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Placeholder Pro gate
  const isPro = false;

  if (!isPro) {
    return (
      <>
        {/* Top bar */}
        <div className="sticky top-0 z-40 border-b border-border bg-elevated/80 backdrop-blur-xl">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <VowenaLogo size="sm" />
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Button variant="ghost" size="sm" onClick={disconnect}>
                Disconnect
              </Button>
            </div>
          </div>
        </div>

        {/* Pro gate overlay */}
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
          <Card className="w-full max-w-md">
            <div className="p-8 text-center">
              <div className="text-4xl mb-4">⭐</div>
              <h2 className="text-2xl font-semibold text-foreground mb-3">
                Upgrade to Pro
              </h2>
              <p className="text-secondary text-sm mb-6 leading-relaxed">
                Workspaces and merchant features are available in Vowena Pro.
                Upgrade now to start billing your customers.
              </p>

              <div className="bg-accent-subtle rounded-lg p-4 mb-6 text-sm text-accent mb-6">
                <p className="font-medium mb-2">Pro includes:</p>
                <ul className="text-left text-xs space-y-1">
                  <li>✓ Unlimited workspaces</li>
                  <li>✓ Custom billing plans</li>
                  <li>✓ Advanced analytics</li>
                  <li>✓ Dedicated support</li>
                </ul>
              </div>

              <Button className="w-full mb-3">Upgrade to Pro</Button>
              <Button variant="ghost" className="w-full">
                Waitlist
              </Button>
            </div>
          </Card>
        </div>
      </>
    );
  }

  // Pro view
  return (
    <>
      {/* Top bar */}
      <div className="sticky top-0 z-40 border-b border-border bg-elevated/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <VowenaLogo size="sm" />
            <div className="text-xs font-mono text-muted">
              {address.slice(0, 8)}...{address.slice(-8)}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={disconnect}>
              Disconnect
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12 flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent mb-3">
              WORKSPACES
            </p>
            <h1 className="text-4xl font-semibold text-foreground mb-4">
              Your projects
            </h1>
            <p className="text-secondary text-lg">
              {workspaces.length} workspace{workspaces.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            New Workspace
          </Button>
        </div>

        {/* Workspaces grid */}
        {workspaces.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted text-lg mb-4">No workspaces yet</p>
            <p className="text-secondary text-sm mb-6">
              Create your first workspace to start accepting payments
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              Create workspace
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                onClick={() => router.push(`/workspaces/${workspace.id}`)}
                className="text-left rounded-xl border border-border bg-elevated hover:bg-surface hover:border-accent/50 transition-all duration-200 p-6 group"
              >
                <h3 className="text-lg font-semibold text-foreground group-hover:text-accent transition-colors mb-2">
                  {workspace.name}
                </h3>
                {workspace.description && (
                  <p className="text-sm text-secondary mb-4">
                    {workspace.description}
                  </p>
                )}
                <p className="text-xs font-mono text-muted">
                  {workspace.merchantAddress.slice(0, 12)}...
                  {workspace.merchantAddress.slice(-12)}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Create workspace modal */}
      <CreateWorkspaceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateWorkspace={(name, merchantAddress, description) => {
          createWorkspace(name, merchantAddress, description);
          setShowCreateModal(false);
        }}
        defaultAddress={address}
      />
    </>
  );
}
