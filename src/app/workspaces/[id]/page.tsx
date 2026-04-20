"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { RequireWallet } from "@/components/wallet/require-wallet";
import {
  useWorkspaces,
  getWorkspacePlansWithData,
  type WorkspaceConfig,
} from "@/hooks/useWorkspaces";
import { usePro } from "@/hooks/usePro";
import { WorkspaceSidebar } from "@/components/workspaces/workspace-sidebar";
import { TopNav } from "@/components/top-nav";
import { PlansTab } from "@/components/workspaces/plans-tab";
import { SubscribersTab } from "@/components/workspaces/subscribers-tab";
import { BillingTab } from "@/components/workspaces/billing-tab";
import { KeeperTab } from "@/components/workspaces/keeper-tab";
import { IntegrateTab } from "@/components/workspaces/integrate-tab";
import { ChevronLeftIcon } from "@/components/ui/icons";

export default function WorkspaceDashboardPage() {
  return (
    <RequireWallet>
      <WorkspaceDashboardView />
    </RequireWallet>
  );
}

function WorkspaceDashboardView() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;

  const { isPro, isLoading: isProLoading } = usePro();
  const { workspaces, isLoading: isWsLoading } = useWorkspaces();
  const [activeTab, setActiveTab] = useState("plans");
  const [plans, setPlans] = useState<
    Awaited<ReturnType<typeof getWorkspacePlansWithData>>
  >([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const workspace: WorkspaceConfig | undefined = workspaces.find(
    (w) => w.id === workspaceId,
  );

  // Pro gate
  useEffect(() => {
    if (!isProLoading && !isPro) {
      router.replace("/workspaces");
    }
  }, [isPro, isProLoading, router]);

  // Workspace not found after chain read completes → bounce to list
  useEffect(() => {
    if (!isWsLoading && workspaces.length > 0 && !workspace) {
      router.replace("/workspaces");
    }
  }, [isWsLoading, workspace, workspaces.length, router]);

  // Load plans tagged to this workspace from chain
  useEffect(() => {
    if (!workspace) return;
    let cancelled = false;
    const load = async () => {
      setIsLoadingPlans(true);
      try {
        const data = await getWorkspacePlansWithData(
          workspace.merchantAddress,
          workspace.planIds,
        );
        if (!cancelled) setPlans(data);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setIsLoadingPlans(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [workspace, refreshKey]);

  const refreshPlans = () => setRefreshKey((k) => k + 1);

  // Loading skeleton while resolving workspace + pro status
  if (isWsLoading || isProLoading || !workspace || !isPro) {
    return (
      <>
        <TopNav active="workspaces" />
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
          <div className="rounded-2xl border border-border bg-elevated/40 min-h-[calc(100vh-200px)] flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-border border-t-accent animate-spin" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TopNav active="workspaces" />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Link
          href="/workspaces"
          className="text-xs text-muted hover:text-foreground transition-colors inline-flex items-center gap-1 mb-4"
        >
          <ChevronLeftIcon size={12} />
          Workspaces
        </Link>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="rounded-2xl border border-border bg-elevated/40 overflow-hidden flex flex-col lg:flex-row min-h-[calc(100vh-200px)]">
          <WorkspaceSidebar
            workspace={workspace}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          <main className="flex-1 overflow-auto bg-elevated min-w-0">
            <div className="p-5 sm:p-8 lg:p-10">
              {activeTab === "plans" && (
                <PlansTab
                  workspace={workspace}
                  plans={plans}
                  isLoading={isLoadingPlans}
                  onCreated={refreshPlans}
                />
              )}
              {activeTab === "subscribers" && (
                <SubscribersTab workspace={workspace} plans={plans} />
              )}
              {activeTab === "billing" && (
                <BillingTab workspace={workspace} plans={plans} />
              )}
              {activeTab === "keeper" && <KeeperTab workspace={workspace} />}
              {activeTab === "integrate" && (
                <IntegrateTab workspace={workspace} plans={plans} />
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
