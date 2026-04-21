"use client";

/**
 * Horizon + friendbot helpers used by the checkout page to onboard new
 * wallets (fund, trustline, submit classic txs). Nothing here is Soroban
 * specific; Soroban reads/writes live in chain.ts and contract.ts.
 */

import {
  Account,
  Asset,
  TransactionBuilder,
  Operation,
  Networks,
  BASE_FEE,
} from "@stellar/stellar-sdk";

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const PASSPHRASE = Networks.TESTNET;

export const TUSDC_ISSUER =
  "GBAINHPXCOOQMUYL5AEOMLIXDDQJOMYPIO4KZXXSUSHMZWQVIQA4CFQV";
export const TUSDC_CODE = "TUSDC";

interface HorizonAccount {
  sequence: string;
  data?: Record<string, string>;
}

async function fetchAccount(address: string): Promise<HorizonAccount> {
  const res = await fetch(`${HORIZON_URL}/accounts/${address}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    if (res.status === 404) return { sequence: "0", data: {} };
    throw new Error(`Horizon fetch failed: ${res.status}`);
  }
  return res.json();
}

/**
 * Build an unsigned tx that establishes a trustline from the user's account
 * to the given asset. First-time subscribers need a USDC trustline before
 * they can be debited.
 */
export async function buildTrustlineTx(
  address: string,
  assetCode: string,
  assetIssuer: string,
): Promise<string> {
  const account = await fetchAccount(address);
  if (account.sequence === "0") {
    throw new Error("Account not found or unfunded.");
  }
  const source = new Account(address, account.sequence);
  const tx = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: PASSPHRASE,
  })
    .addOperation(
      Operation.changeTrust({ asset: new Asset(assetCode, assetIssuer) }),
    )
    .setTimeout(30)
    .build();
  return tx.toXDR();
}

export async function isAccountFunded(address: string): Promise<boolean> {
  try {
    const res = await fetch(`${HORIZON_URL}/accounts/${address}`, {
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Activate a brand-new wallet on testnet via friendbot. Mainnet has no
 * friendbot, so this only works on testnet.
 */
export async function fundViaFriendbot(address: string): Promise<void> {
  const res = await fetch(
    `https://friendbot.stellar.org?addr=${encodeURIComponent(address)}`,
  );
  if (!res.ok) {
    let detail = "Friendbot funding failed";
    try {
      const body = await res.json();
      detail = body?.detail || body?.title || detail;
    } catch {
      // ignore
    }
    throw new Error(detail);
  }
}

export async function submitToHorizon(
  signedXdr: string,
): Promise<{ hash: string }> {
  const res = await fetch(`${HORIZON_URL}/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `tx=${encodeURIComponent(signedXdr)}`,
  });

  const body = await res.json();
  if (!res.ok) {
    const reason =
      body?.extras?.result_codes?.transaction ||
      body?.extras?.result_codes?.operations?.join(", ") ||
      body?.detail ||
      body?.title ||
      "Transaction failed";
    throw new Error(`Stellar: ${reason}`);
  }
  return { hash: body.hash };
}
