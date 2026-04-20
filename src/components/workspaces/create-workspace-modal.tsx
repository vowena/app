"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CloseIcon, AlertTriangleIcon } from "@/components/ui/icons";

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Returns a promise that rejects on error; UI displays the error inline. */
  onCreateWorkspace: (
    name: string,
    description?: string,
  ) => Promise<void> | void;
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => {
        setName("");
        setDescription("");
        setIsSubmitting(false);
        setError(null);
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
      if (e.key === "Escape" && !isSubmitting) onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose, isSubmitting]);

  if (!isOpen) return null;

  const canSubmit = name.trim().length > 0 && !!defaultAddress;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await onCreateWorkspace(name.trim(), description.trim() || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create workspace");
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 animate-in fade-in duration-200"
        onClick={isSubmitting ? undefined : onClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none overflow-y-auto">
        <div
          className="w-full max-w-lg my-auto rounded-2xl border border-border bg-elevated shadow-2xl pointer-events-auto animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <form onSubmit={handleSubmit}>
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
                disabled={isSubmitting}
                className="text-muted hover:text-foreground hover:bg-surface rounded-md p-2 transition-colors -m-2 disabled:opacity-40 disabled:pointer-events-none"
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
                  disabled={isSubmitting}
                  maxLength={64}
                />
                <p className="text-[10px] text-muted mt-1">
                  Stored on your Stellar account. Up to 64 characters.
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
                  disabled={isSubmitting}
                  maxLength={64}
                />
              </div>

              {/* Receiving wallet (read-only for now) */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-2">
                  Receiving wallet
                </label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface/50 border border-border">
                  <span className="w-1.5 h-1.5 rounded-full bg-success" />
                  <p className="text-xs font-mono text-foreground truncate">
                    {defaultAddress
                      ? `${defaultAddress.slice(0, 10)}…${defaultAddress.slice(-10)}`
                      : "—"}
                  </p>
                </div>
                <p className="text-[10px] text-muted mt-1">
                  All payments for this workspace go to your connected wallet.
                </p>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-warning/20 bg-warning/5 p-3">
                <AlertTriangleIcon
                  size={14}
                  className="text-warning shrink-0 mt-0.5"
                />
                <p className="text-xs text-warning leading-relaxed">
                  Creating a workspace writes to your Stellar account data. Your
                  wallet will ask you to sign a transaction (small base reserve
                  required).
                </p>
              </div>

              {error && (
                <div className="rounded-lg border border-error/20 bg-error/5 px-3 py-2 text-xs text-error">
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 sm:px-8 py-4 border-t border-border-subtle bg-surface/30 flex items-center justify-end gap-3 rounded-b-2xl">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? "Signing…" : "Create workspace"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
