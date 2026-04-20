"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CloseIcon,
  ArrowRightIcon,
  ChevronLeftIcon,
  AlertTriangleIcon,
  CheckIcon,
} from "@/components/ui/icons";

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateWorkspace: (
    name: string,
    merchantAddress: string,
    description?: string
  ) => void;
  defaultAddress?: string;
}

export function CreateWorkspaceModal({
  isOpen,
  onClose,
  onCreateWorkspace,
  defaultAddress,
}: CreateWorkspaceModalProps) {
  const [step, setStep] = useState<"name" | "wallet">("name");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [customAddress, setCustomAddress] = useState("");
  const [useConnectedWallet, setUseConnectedWallet] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep("name");
        setName("");
        setDescription("");
        setCustomAddress("");
        setUseConnectedWallet(true);
      }, 200);
    }
  }, [isOpen]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const merchantAddress = useConnectedWallet
    ? defaultAddress || ""
    : customAddress;

  const handleCreate = async () => {
    if (!name || !merchantAddress) return;
    setIsLoading(true);
    try {
      onCreateWorkspace(name, merchantAddress, description || undefined);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        <div
          className="w-full max-w-md rounded-2xl border border-border bg-elevated shadow-2xl pointer-events-auto animate-in fade-in zoom-in-95 duration-200 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-5 flex items-start justify-between border-b border-border">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted mb-1">
                Step {step === "name" ? "1" : "2"} of 2
              </p>
              <h2 className="text-lg font-semibold text-foreground tracking-tight">
                {step === "name"
                  ? "Name your workspace"
                  : "Choose receiving wallet"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-muted hover:text-foreground hover:bg-surface rounded-md p-2 transition-colors"
              aria-label="Close"
            >
              <CloseIcon size={16} />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {step === "name" ? (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-2">
                    Workspace name
                  </label>
                  <Input
                    placeholder="My SaaS"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                  />
                  <p className="text-xs text-muted mt-2">
                    A short name to identify this project.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-2">
                    Description{" "}
                    <span className="text-muted font-normal">(optional)</span>
                  </label>
                  <Input
                    placeholder="What does it do?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <p className="text-sm text-secondary">
                  All payments for{" "}
                  <span className="text-foreground font-medium">{name}</span>{" "}
                  will be sent to this wallet.
                </p>

                <div className="space-y-2">
                  <WalletOption
                    selected={useConnectedWallet}
                    onSelect={() => setUseConnectedWallet(true)}
                    title="Connected wallet"
                    address={defaultAddress}
                  />
                  <WalletOption
                    selected={!useConnectedWallet}
                    onSelect={() => setUseConnectedWallet(false)}
                    title="Use a different wallet"
                  />
                  {!useConnectedWallet && (
                    <div className="pt-2">
                      <Input
                        placeholder="G..."
                        value={customAddress}
                        onChange={(e) => setCustomAddress(e.target.value)}
                        className="font-mono text-xs"
                        autoFocus
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-3 rounded-lg border border-warning/20 bg-warning/5 p-3">
                  <AlertTriangleIcon
                    size={14}
                    className="text-warning shrink-0 mt-0.5"
                  />
                  <p className="text-xs text-warning leading-relaxed">
                    This wallet address is permanent. It cannot be changed once
                    the workspace is created.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-surface/30">
            {step === "wallet" ? (
              <Button
                variant="ghost"
                onClick={() => setStep("name")}
                className="gap-1.5"
              >
                <ChevronLeftIcon size={14} />
                Back
              </Button>
            ) : (
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
            )}
            {step === "name" ? (
              <Button
                onClick={() => setStep("wallet")}
                disabled={!name.trim()}
                className="gap-1.5"
              >
                Continue
                <ArrowRightIcon size={14} />
              </Button>
            ) : (
              <Button
                onClick={handleCreate}
                disabled={isLoading || !merchantAddress}
              >
                {isLoading ? "Creating…" : "Create workspace"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function WalletOption({
  selected,
  onSelect,
  title,
  address,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  address?: string;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-3 p-3 border rounded-lg transition-all text-left ${
        selected
          ? "border-accent bg-accent-subtle"
          : "border-border hover:border-border-default hover:bg-surface"
      }`}
    >
      <div
        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
          selected ? "border-accent" : "border-border-default"
        }`}
      >
        {selected && <CheckIcon size={10} className="text-accent" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {address && (
          <p className="text-[10px] text-muted font-mono truncate mt-0.5">
            {address.slice(0, 12)}…{address.slice(-12)}
          </p>
        )}
      </div>
    </button>
  );
}
