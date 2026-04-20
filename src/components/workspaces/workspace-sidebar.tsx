"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { WorkspaceConfig } from "@/hooks/useWorkspaces";
import { Button } from "@/components/ui/button";

interface WorkspaceSidebarProps {
  workspace: WorkspaceConfig;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function WorkspaceSidebar({
  workspace,
  activeTab,
  onTabChange,
}: WorkspaceSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load collapsed state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(
        `vowena:workspace:${workspace.id}:sidebar-collapsed`
      );
      if (saved) {
        setIsCollapsed(JSON.parse(saved));
      }
    } catch {}
  }, [workspace.id]);

  const handleToggle = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    try {
      localStorage.setItem(
        `vowena:workspace:${workspace.id}:sidebar-collapsed`,
        JSON.stringify(newCollapsed)
      );
    } catch {}
  };

  const tabs = [
    { id: "plans", label: "Plans", icon: "📋" },
    { id: "subscribers", label: "Subscribers", icon: "👥" },
    { id: "billing", label: "Billing", icon: "💰" },
    { id: "keeper", label: "Keeper", icon: "⚙️" },
    { id: "integrate", label: "Integrate", icon: "🔗" },
  ];

  return (
    <aside
      className={`${
        isCollapsed ? "w-14" : "w-56"
      } bg-surface border-r border-border flex flex-col transition-all duration-200`}
    >
      {/* Header */}
      <div className="border-b border-border p-4 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground truncate">
              {workspace.name}
            </h3>
            <p className="text-xs text-muted truncate font-mono">
              {workspace.merchantAddress.slice(0, 8)}...
            </p>
          </div>
        )}
        <button
          onClick={handleToggle}
          className="text-muted hover:text-foreground transition-colors p-1"
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          {isCollapsed ? "→" : "←"}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm ${
              activeTab === tab.id
                ? "bg-accent text-white font-medium"
                : "text-secondary hover:bg-elevated hover:text-foreground"
            }`}
          >
            <span className="text-base">{tab.icon}</span>
            {!isCollapsed && <span>{tab.label}</span>}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <Link
          href={`https://stellar.expert/explorer/testnet/contract/${workspace.merchantAddress}`}
          target="_blank"
          className="text-xs text-muted hover:text-accent transition-colors block text-center"
        >
          {isCollapsed ? "🔍" : "View on Explorer"}
        </Link>
      </div>
    </aside>
  );
}
