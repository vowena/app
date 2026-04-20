import type { OnChainProject } from "@/lib/account-data";

/**
 * Convert a project name into a URL-safe slug.
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
 * Build the canonical project URL for a given project.
 */
export function projectUrl(project: { name: string }): string {
  const slug = slugify(project.name);
  if (!slug) return `/projects`;
  return `/projects/${slug}`;
}

/**
 * Resolve a slug from the URL back to a project. Falls back to slot-based
 * lookup so old links like /projects/0 still work for back-compat.
 */
export function findProjectByUrlParam<
  W extends Pick<OnChainProject, "name" | "slot">,
>(projects: W[], param: string): W | undefined {
  const decoded = decodeURIComponent(param).toLowerCase();

  // First try slug match
  const bySlug = projects.find((w) => slugify(w.name) === decoded);
  if (bySlug) return bySlug;

  // Fallback: numeric slot (legacy URLs)
  if (/^\d+$/.test(decoded)) {
    const slot = parseInt(decoded, 10);
    return projects.find((w) => w.slot === slot);
  }

  return undefined;
}

/**
 * Returns true if any existing project already uses this slug — used to
 * prevent duplicate-name collisions before signing the create tx.
 */
export function slugCollides(
  projects: { name: string }[],
  candidateName: string,
): boolean {
  const candidate = slugify(candidateName);
  if (!candidate) return false;
  return projects.some((w) => slugify(w.name) === candidate);
}
