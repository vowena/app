import { useCallback, useEffect, useState } from "react";
import { getMerchantPlans, getPlan } from "@/lib/chain";

export interface WorkspaceConfig {
  id: string;
  name: string;
  description?: string;
  merchantAddress: string;
  createdAt: number;
}

const STORAGE_KEY = "vowena:workspaces";

export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState<WorkspaceConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setWorkspaces(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load workspaces from localStorage:", error);
    }
    setIsLoading(false);
  }, []);

  const saveWorkspaces = useCallback((ws: WorkspaceConfig[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ws));
      setWorkspaces(ws);
    } catch (error) {
      console.error("Failed to save workspaces to localStorage:", error);
      throw error;
    }
  }, []);

  const createWorkspace = useCallback(
    (
      name: string,
      merchantAddress: string,
      description?: string
    ): WorkspaceConfig => {
      const newWorkspace: WorkspaceConfig = {
        id: crypto.randomUUID(),
        name,
        description,
        merchantAddress,
        createdAt: Date.now(),
      };

      saveWorkspaces([...workspaces, newWorkspace]);
      return newWorkspace;
    },
    [workspaces, saveWorkspaces]
  );

  const updateWorkspace = useCallback(
    (id: string, updates: Partial<Omit<WorkspaceConfig, "id" | "merchantAddress" | "createdAt">>) => {
      const updated = workspaces.map((w) =>
        w.id === id ? { ...w, ...updates } : w
      );
      saveWorkspaces(updated);
    },
    [workspaces, saveWorkspaces]
  );

  const deleteWorkspace = useCallback(
    (id: string) => {
      const filtered = workspaces.filter((w) => w.id !== id);
      saveWorkspaces(filtered);
    },
    [workspaces, saveWorkspaces]
  );

  const getWorkspace = useCallback(
    (id: string) => workspaces.find((w) => w.id === id),
    [workspaces]
  );

  return {
    workspaces,
    isLoading,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    getWorkspace,
  };
}

export async function getWorkspacePlansWithData(merchantAddress: string) {
  try {
    const planIds = await getMerchantPlans(merchantAddress);
    const plans = await Promise.all(
      planIds.map((id) => getPlan(id, merchantAddress))
    );
    return plans;
  } catch (error) {
    console.error("Failed to fetch workspace plans:", error);
    return [];
  }
}
