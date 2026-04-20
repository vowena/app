import type { OnChainWorkspace } from "@/lib/account-data";

/**
 * Convert a workspace name into a URL-safe slug.
 * "My SaaS" → "my-saas"
 * "Netflix" → "netflix"
 * "abc#123!" → "abc123"
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * Build the canonical workspace URL for a given workspace.
 */
export function workspaceUrl(workspace: { name: string }): string {
  const slug = slugify(workspace.name);
  if (!slug) return `/workspaces`;
  return `/workspaces/${slug}`;
}

/**
 * Resolve a slug from the URL back to a workspace. Falls back to slot-based
 * lookup so old links like /workspaces/0 still work for back-compat.
 */
export function findWorkspaceByUrlParam<
  W extends Pick<OnChainWorkspace, "name" | "slot">,
>(workspaces: W[], param: string): W | undefined {
  const decoded = decodeURIComponent(param).toLowerCase();

  // First try slug match
  const bySlug = workspaces.find((w) => slugify(w.name) === decoded);
  if (bySlug) return bySlug;

  // Fallback: numeric slot (legacy URLs)
  if (/^\d+$/.test(decoded)) {
    const slot = parseInt(decoded, 10);
    return workspaces.find((w) => w.slot === slot);
  }

  return undefined;
}

/**
 * Returns true if any existing workspace already uses this slug — used to
 * prevent duplicate-name collisions before signing the create tx.
 */
export function slugCollides(
  workspaces: { name: string }[],
  candidateName: string,
): boolean {
  const candidate = slugify(candidateName);
  if (!candidate) return false;
  return workspaces.some((w) => slugify(w.name) === candidate);
}
