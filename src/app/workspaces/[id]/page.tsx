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
  const [plans, setPlans] = useState<any[]>([]);  // eslint-disable-line @typescript-eslint/no-explicit-any
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const workspace: WorkspaceConfig | undefined = workspaces.find(
    (w) => w.id === workspaceId,
  );

  useEffect(() => {
    if (!isProLoading && !isPro) {
      router.replace("/workspaces");
    }
  }, [isPro, isProLoading, router]);

  useEffect(() => {
    if (!isWsLoading && !workspace) {
      router.replace("/workspaces");
    }
  }, [isWsLoading, workspace, router]);

  useEffect(() => {
    if (!workspace) return;
    let cancelled = false;
    const load = async () => {
      setIsLoadingPlans(true);
      try {
        const data = await getWorkspacePlansWithData(workspace.merchantAddress);
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

  if (isWsLoading || isProLoading || !workspace || !isPro) {
    return (
      <>
        <TopNav active="workspaces" />
        <div className="flex items-center justify-center min-h-[calc(100vh-56px)]">
          <div className="w-6 h-6 rounded-full border-2 border-border border-t-accent animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <TopNav active="workspaces" />

      {/* Full-width layout: sidebar flush left, content fills remaining space */}
      <div className="flex min-h-[calc(100vh-56px)]">
        <WorkspaceSidebar
          workspace={workspace}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <main className="flex-1 min-w-0">
          <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-14 py-8 sm:py-12 lg:py-14">
            {/* Breadcrumb */}
            <Link
              href="/workspaces"
              className="text-xs text-muted hover:text-foreground transition-colors inline-flex items-center gap-1 mb-6"
            >
              <ChevronLeftIcon size={12} />
              Workspaces
            </Link>

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
    </>
  );
}
