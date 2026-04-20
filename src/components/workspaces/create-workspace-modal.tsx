"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, merchantAddress: string, description?: string) => void;
  defaultAddress?: string;
}

export function CreateWorkspaceModal({
  isOpen,
  onClose,
  onCreateWorkspace,
  defaultAddress,
}: CreateWorkspaceModalProps & { onCreateWorkspace?: any }) {
  const [step, setStep] = useState<"name" | "wallet">("name");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [merchantAddress, setMerchantAddress] = useState(
    defaultAddress || ""
  );
  const [useConnectedWallet, setUseConnectedWallet] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!name || !merchantAddress) {
      return;
    }

    setIsLoading(true);
    try {
      // Call the parent's create function
      if (typeof onCreate === "function") {
        onCreate(name, merchantAddress, description);
      } else if (typeof onCreateWorkspace === "function") {
        onCreateWorkspace(name, merchantAddress, description);
      }
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <div className="p-8">
            <h2 className="text-2xl font-semibold text-foreground mb-6">
              Create workspace
            </h2>

            {step === "name" ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Workspace name
                  </label>
                  <Input
                    placeholder="e.g., My SaaS"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Description (optional)
                  </label>
                  <Input
                    placeholder="What do you sell?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <Button variant="ghost" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => setStep("wallet")}
                    disabled={!name}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-secondary mb-4">
                    Choose which wallet receives payments for "{name}"
                  </p>

                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-surface transition-colors">
                      <input
                        type="radio"
                        checked={useConnectedWallet}
                        onChange={() => setUseConnectedWallet(true)}
                        className="w-4 h-4"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-foreground text-sm">
                          Use connected wallet
                        </p>
                        <p className="text-muted text-xs mt-1">
                          {defaultAddress?.slice(0, 12)}...
                          {defaultAddress?.slice(-12)}
                        </p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-surface transition-colors">
                      <input
                        type="radio"
                        checked={!useConnectedWallet}
                        onChange={() => setUseConnectedWallet(false)}
                        className="w-4 h-4"
                      />
                      <p className="font-medium text-foreground text-sm">
                        Use different wallet
                      </p>
                    </label>
                  </div>

                  {!useConnectedWallet && (
                    <div className="mt-4">
                      <Input
                        placeholder="Wallet address"
                        value={merchantAddress}
                        onChange={(e) => setMerchantAddress(e.target.value)}
                        className="font-mono text-xs"
                      />
                    </div>
                  )}

                  <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 mt-4">
                    <p className="text-xs text-warning font-medium">
                      ⚠️ This wallet address is permanent and cannot be changed.
                      All payments for this workspace will be received here.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <Button variant="ghost" onClick={() => setStep("name")}>
                    Back
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={isLoading || !merchantAddress}
                  >
                    {isLoading ? "Creating..." : "Create"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
