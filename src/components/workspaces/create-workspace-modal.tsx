"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CloseIcon, AlertTriangleIcon, CheckIcon } from "@/components/ui/icons";

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateWorkspace: (
    name: string,
    merchantAddress: string,
    description?: string,
  ) => void;
  defaultAddress?: string;
}

export function CreateWorkspaceModal({
  isOpen,
  onClose,
  onCreateWorkspace,
  defaultAddress,
}: CreateWorkspaceModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [customAddress, setCustomAddress] = useState("");
  const [useConnectedWallet, setUseConnectedWallet] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => {
        setName("");
        setDescription("");
        setCustomAddress("");
        setUseConnectedWallet(true);
        setIsLoading(false);
      }, 200);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

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
  const canSubmit = name.trim() && merchantAddress;

  const handleCreate = async () => {
    if (!canSubmit) return;
    setIsLoading(true);
    try {
      onCreateWorkspace(name.trim(), merchantAddress, description.trim() || undefined);
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

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none overflow-y-auto">
        <div
          className="w-full max-w-lg my-auto rounded-2xl border border-border bg-elevated shadow-2xl pointer-events-auto animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreate();
            }}
          >
            {/* Header */}
            <div className="px-6 sm:px-8 pt-6 sm:pt-8 pb-6 flex items-start justify-between border-b border-border-subtle">
              <div>
                <h2 className="text-xl font-semibold text-foreground tracking-tight">
                  Create workspace
                </h2>
                <p className="text-sm text-secondary mt-1.5">
                  Set up a new project to accept recurring payments.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-muted hover:text-foreground hover:bg-surface rounded-md p-2 transition-colors -m-2"
                aria-label="Close"
              >
                <CloseIcon size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 sm:px-8 py-6 space-y-6">
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

              <div>
                <label className="block text-xs font-semibold text-foreground mb-3">
                  Receiving wallet
                </label>
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
                    title="Different wallet"
                  />
                  {!useConnectedWallet && (
                    <div className="pt-1">
                      <Input
                        placeholder="G..."
                        value={customAddress}
                        onChange={(e) => setCustomAddress(e.target.value)}
                        className="font-mono text-xs"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-warning/20 bg-warning/5 p-3">
                <AlertTriangleIcon
                  size={14}
                  className="text-warning shrink-0 mt-0.5"
                />
                <p className="text-xs text-warning leading-relaxed">
                  The receiving wallet is permanent. It cannot be changed once
                  the workspace is created.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 sm:px-8 py-4 border-t border-border-subtle bg-surface/30 flex items-center justify-end gap-3 rounded-b-2xl">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={!canSubmit || isLoading}>
                {isLoading ? "Creating…" : "Create workspace"}
              </Button>
            </div>
          </form>
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
      type="button"
      onClick={onSelect}
      className={`w-full flex items-center gap-3 p-3 border rounded-lg transition-all text-left ${
        selected
          ? "border-accent bg-accent-subtle"
          : "border-border hover:border-border hover:bg-surface"
      }`}
    >
      <div
        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
          selected ? "border-accent" : "border-border"
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
