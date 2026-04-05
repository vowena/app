"use client";

import Link from "next/link";
import Image from "next/image";
import { useWallet } from "@/components/wallet/wallet-provider";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  const { address, isConnected, connect } = useWallet();

  return (
    <div className="flex flex-col flex-1">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <Image src="/logo/vowena.svg" alt="Vowena" width={24} height={24} />
          <span className="text-base font-semibold text-foreground" style={{ letterSpacing: "-0.03em" }}>
            vowena
          </span>
        </div>
        <div className="flex items-center gap-5">
          <Link href="https://docs.vowena.xyz" className="text-sm text-muted hover:text-foreground transition-colors">
            Docs
          </Link>
          <Link href="https://blog.vowena.xyz" className="text-sm text-muted hover:text-foreground transition-colors">
            Blog
          </Link>
          <Link href="https://github.com/vowena" className="text-sm text-muted hover:text-foreground transition-colors">
            GitHub
          </Link>
          <ThemeToggle />
          {isConnected ? (
            <Link href="/merchant">
              <Button size="sm">Dashboard</Button>
            </Link>
          ) : (
            <Button size="sm" onClick={connect}>Connect wallet</Button>
          )}
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1">
        <section className="px-6 pt-20 pb-24 max-w-6xl mx-auto">
          <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-surface text-xs font-medium text-muted mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              Live on Stellar Testnet
            </div>

            <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight text-foreground leading-[1.1]" style={{ letterSpacing: "-0.035em" }}>
              Recurring payments,{" "}
              <span className="text-accent">on-chain</span>
            </h1>

            <p className="mt-6 text-lg text-secondary leading-relaxed max-w-md">
              The subscription billing protocol for Stellar. One signature. No intermediaries. Built for USDC.
            </p>

            <div className="flex items-center gap-3 mt-10">
              {isConnected ? (
                <>
                  <Link href="/merchant">
                    <Button size="lg">Open dashboard</Button>
                  </Link>
                  <Link href="/subscriptions">
                    <Button variant="outline" size="lg">My subscriptions</Button>
                  </Link>
                </>
              ) : (
                <>
                  <Button size="lg" onClick={connect}>Get started</Button>
                  <Link href="https://docs.vowena.xyz">
                    <Button variant="outline" size="lg">Documentation</Button>
                  </Link>
                </>
              )}
            </div>

            {isConnected && (
              <p className="mt-4 text-xs text-muted font-mono">
                {address?.slice(0, 8)}...{address?.slice(-8)}
              </p>
            )}
          </div>

          {/* Code preview */}
          <div className="mt-20 max-w-xl mx-auto">
            <div className="rounded-xl border border-border bg-elevated shadow-sm overflow-hidden">
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border-subtle bg-surface">
                <div className="w-2 h-2 rounded-full bg-[#FF4D6A]/40" />
                <div className="w-2 h-2 rounded-full bg-[#FFBD2E]/40" />
                <div className="w-2 h-2 rounded-full bg-[#00DC82]/40" />
                <span className="ml-3 text-[11px] text-muted font-mono">subscribe.ts</span>
              </div>
              <pre className="p-5 text-[13px] leading-7 overflow-x-auto font-mono text-secondary">
                <code>{`import { VowenaClient, toStroops } from "vowena"

// Subscribe to a plan - one signature
const xdr = await client.buildSubscribe(
  wallet.address,
  1 // plan ID
)

// Sign and submit
const signed = await wallet.signTransaction(xdr)
await client.submitTransaction(signed)`}</code>
              </pre>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="px-6 py-24 border-t border-border">
          <div className="max-w-6xl mx-auto">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted mb-2 text-center">How it works</p>
            <h2 className="text-2xl font-semibold text-foreground text-center tracking-tight mb-16" style={{ letterSpacing: "-0.02em" }}>
              Three roles, one protocol
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  step: "01",
                  title: "Merchant creates a plan",
                  desc: "Define the token, amount, billing period, trial length, and price ceiling. The plan lives on-chain as an immutable billing template.",
                },
                {
                  step: "02",
                  title: "Subscriber signs once",
                  desc: "One wallet signature approves both the subscription and the token allowance. No recurring prompts. The contract handles the rest.",
                },
                {
                  step: "03",
                  title: "Keeper triggers billing",
                  desc: "Anyone can call charge(). The contract verifies conditions and transfers USDC from subscriber to merchant. Fully permissionless.",
                },
              ].map((item) => (
                <div key={item.step} className="relative p-6 rounded-xl border border-border bg-elevated">
                  <span className="text-[11px] font-mono text-accent font-bold">{item.step}</span>
                  <h3 className="text-sm font-semibold text-foreground mt-3 mb-2">{item.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features grid */}
        <section className="px-6 py-24 bg-surface">
          <div className="max-w-6xl mx-auto">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted mb-2 text-center">Features</p>
            <h2 className="text-2xl font-semibold text-foreground text-center tracking-tight mb-16" style={{ letterSpacing: "-0.02em" }}>
              Everything you need for subscription billing
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                {
                  title: "Pull billing",
                  desc: "Contract calls transfer_from() each period. No server dependency. No recurring signatures.",
                  icon: "↻",
                },
                {
                  title: "Price protection",
                  desc: "Price ceiling prevents surprise hikes. Migrations require explicit subscriber consent.",
                  icon: "🛡",
                },
                {
                  title: "Grace periods",
                  desc: "Failed charges enter a configurable grace window. Paused, not cancelled. Subscribers can recover.",
                  icon: "⏳",
                },
                {
                  title: "Free trials",
                  desc: "Trial periods advance the billing counter without transferring tokens. Cancel during trial, never charged.",
                  icon: "🎁",
                },
                {
                  title: "Permissionless",
                  desc: "Anyone can call charge(). Only the merchant receives funds. Run your own keeper or use the dashboard.",
                  icon: "🔓",
                },
                {
                  title: "$0.00001 per tx",
                  desc: "Stellar makes micro-billing practical. 5-second finality. Native USDC. No gas fee anxiety.",
                  icon: "⚡",
                },
              ].map((feature) => (
                <div key={feature.title} className="p-5 rounded-xl border border-border bg-elevated hover:border-accent/20 transition-colors">
                  <span className="text-lg mb-3 block">{feature.icon}</span>
                  <h3 className="text-sm font-semibold text-foreground mb-1.5">{feature.title}</h3>
                  <p className="text-xs text-muted leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Roles */}
        <section className="px-6 py-24 border-t border-border">
          <div className="max-w-6xl mx-auto">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted mb-2 text-center">Built for</p>
            <h2 className="text-2xl font-semibold text-foreground text-center tracking-tight mb-16" style={{ letterSpacing: "-0.02em" }}>
              Everyone in the payment chain
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  role: "Merchants",
                  desc: "Create billing plans, manage subscribers, track revenue, automate charges. Dashboard or SDK - your choice.",
                  cta: "Merchant dashboard",
                  href: "/merchant",
                },
                {
                  role: "Subscribers",
                  desc: "See every subscription in one place. Cancel anytime, directly on-chain. No merchant can lock you in.",
                  cta: "My subscriptions",
                  href: "/subscriptions",
                },
                {
                  role: "Developers",
                  desc: "npm install vowena. TypeScript SDK, event polling, keeper bot. Open source. MIT license.",
                  cta: "Read the docs",
                  href: "https://docs.vowena.xyz",
                },
              ].map((item) => (
                <Link
                  key={item.role}
                  href={item.href}
                  className="group flex flex-col justify-between rounded-xl border border-border bg-elevated p-6 hover:border-accent/30 hover:shadow-sm transition-all"
                >
                  <div>
                    <h3 className="text-base font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">
                      {item.role}
                    </h3>
                    <p className="text-sm text-muted leading-relaxed">{item.desc}</p>
                  </div>
                  <span className="mt-6 text-xs font-medium text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.cta} →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-20 bg-accent">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-semibold text-white tracking-tight mb-3" style={{ letterSpacing: "-0.02em" }}>
              Start billing on-chain today
            </h2>
            <p className="text-sm text-white/70 mb-8">
              Deploy your first subscription plan in under 5 minutes. Free on testnet.
            </p>
            <div className="flex items-center justify-center gap-3">
              {isConnected ? (
                <Link href="/merchant">
                  <Button size="lg" className="bg-white text-accent hover:bg-white/90">
                    Open dashboard
                  </Button>
                </Link>
              ) : (
                <Button size="lg" onClick={connect} className="bg-white text-accent hover:bg-white/90">
                  Connect wallet
                </Button>
              )}
              <Link href="https://docs.vowena.xyz/quickstart">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  Quickstart guide
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Image src="/logo/vowena.svg" alt="Vowena" width={18} height={18} />
                <span className="text-sm font-semibold text-foreground" style={{ letterSpacing: "-0.03em" }}>vowena</span>
              </div>
              <p className="text-xs text-muted max-w-xs">
                The first trustless recurring payment protocol on Stellar.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-16 gap-y-2 text-xs">
              <Link href="https://docs.vowena.xyz" className="text-muted hover:text-foreground transition-colors">Documentation</Link>
              <Link href="https://github.com/vowena" className="text-muted hover:text-foreground transition-colors">GitHub</Link>
              <Link href="https://blog.vowena.xyz" className="text-muted hover:text-foreground transition-colors">Blog</Link>
              <Link href="https://www.npmjs.com/package/vowena" className="text-muted hover:text-foreground transition-colors">npm</Link>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
            <p className="text-[11px] text-muted">Built on Stellar. Powered by Soroban.</p>
            <p className="text-[11px] text-muted">&copy; {new Date().getFullYear()} Vowena</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
