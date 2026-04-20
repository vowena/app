"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useWallet } from "@/components/wallet/wallet-provider";
import {
  useWorkspaces,
  getWorkspacePlansWithData,
} from "@/hooks/useWorkspaces";
import { WorkspaceSidebar } from "@/components/workspaces/workspace-sidebar";
import { TopNav } from "@/components/top-nav";
import { PlansTab } from "@/components/workspaces/plans-tab";
import { SubscribersTab } from "@/components/workspaces/subscribers-tab";
import { BillingTab } from "@/components/workspaces/billing-tab";
import { KeeperTab } from "@/components/workspaces/keeper-tab";
import { IntegrateTab } from "@/components/workspaces/integrate-tab";

export default function WorkspaceDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;

  const { getWorkspace } = useWorkspaces();
  const [activeTab, setActiveTab] = useState("plans");
  const [workspace, setWorkspace] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);

  useEffect(() => {
    const ws = getWorkspace(workspaceId);
    if (!ws) {
      router.push("/workspaces");
      return;
    }
    setWorkspace(ws);
  }, [workspaceId, getWorkspace, router]);

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
  }, [workspace]);

  if (!workspace) return null;

  return (
    <>
      <TopNav active="workspaces" />

      <div className="max-w-6xl mx-auto px-6 pt-6">
        {/* Breadcrumb */}
        <Link
          href="/workspaces"
          className="text-xs text-muted hover:text-foreground transition-colors inline-flex items-center gap-1 mb-4"
        >
          ← Workspaces
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-12">
        <div className="rounded-2xl border border-border bg-elevated/40 overflow-hidden flex min-h-[calc(100vh-200px)]">
          <WorkspaceSidebar
            workspace={workspace}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          <main className="flex-1 overflow-auto bg-elevated">
            <div className="p-8">
              {activeTab === "plans" && (
                <PlansTab
                  workspace={workspace}
                  plans={plans}
                  isLoading={isLoadingPlans}
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
