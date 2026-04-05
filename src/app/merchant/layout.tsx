"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { useWallet } from "@/components/wallet/wallet-provider";

const navItems = [
  { href: "/merchant", label: "Overview", icon: "◻" },
  { href: "/merchant/plans", label: "Plans", icon: "☰" },
  { href: "/merchant/subscribers", label: "Subscribers", icon: "◎" },
  { href: "/merchant/billing", label: "Billing", icon: "◈" },
  { href: "/merchant/keeper", label: "Keeper", icon: "⟳" },
];

export default function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { address } = useWallet();

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r border-border bg-elevated">
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo/vowena.svg" alt="Vowena" width={20} height={20} />
            <span className="text-sm font-semibold text-foreground" style={{ letterSpacing: "-0.03em" }}>
              vowena
            </span>
          </Link>
          <ThemeToggle />
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 p-3 pt-4">
          {navItems.map((item) => {
            const isActive =
              item.href === "/merchant"
                ? pathname === "/merchant"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-accent-subtle text-accent font-medium"
                    : "text-secondary hover:bg-surface hover:text-foreground",
                )}
              >
                <span className="text-xs opacity-60">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          {address && (
            <p className="text-[11px] text-muted font-mono truncate mb-1">
              {address.slice(0, 8)}...{address.slice(-4)}
            </p>
          )}
          <p className="text-[10px] text-muted uppercase tracking-wider">Stellar Testnet</p>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-background">
        <div className="mx-auto max-w-5xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
