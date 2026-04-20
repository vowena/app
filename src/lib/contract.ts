"use client";

import {
  Address,
  TransactionBuilder,
  authorizeEntry,
  rpc as SorobanRpc,
  xdr,
} from "@stellar/stellar-sdk";
import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit/sdk";
import { client, CONTRACT } from "@/lib/chain";

const server = new SorobanRpc.Server(CONTRACT.RPC_URL);

interface BuildAndSubmitOpts {
  /** XDR returned from one of client.buildXxx() */
  xdr: string;
  /** Address that will sign the envelope (= source account) */
  sourceAddress: string;
  /**
   * If the inner contract call has nested Address-credentialed auth entries
   * (e.g. token.approve inside subscribe), these need wallet-signed authEntry
   * XDRs. Pass true to enable the wallet-driven nested auth signing flow.
   */
  signNestedAuth?: boolean;
}

/**
 * Sign + submit a built XDR. Handles both flat (single signature) and nested
 * (Address auth entries) auth flows. Polls for inclusion and returns the result.
 */
export async function signAndSubmit({
  xdr: builtXdr,
  sourceAddress,
  signNestedAuth = false,
}: BuildAndSubmitOpts) {
  const passphrase = CONTRACT.PASSPHRASE;

  // For flat auth: just sign the envelope and submit.
  if (!signNestedAuth) {
    const { signedTxXdr } = await StellarWalletsKit.signTransaction(builtXdr, {
      networkPassphrase: passphrase,
      address: sourceAddress,
    });
    return submitAndPoll(signedTxXdr);
  }

  // Nested auth: parse the tx, find Address-credentialed auth entries,
  // ask the wallet to sign each one as authEntry XDRs, rebuild, then envelope-sign.
  const tx = TransactionBuilder.fromXDR(builtXdr, passphrase);
  // The op auth lives on the InvokeHostFunction operation.
  const op = (tx.operations[0] as any);
  const authEntries: xdr.SorobanAuthorizationEntry[] = op?.auth ?? [];

  const latest = await server.getLatestLedger();
  const validUntil = latest.sequence + 100_000;

  const signedAuth: xdr.SorobanAuthorizationEntry[] = [];
  for (const entry of authEntries) {
    const cred = entry.credentials();
    if (cred.switch().name === "sorobanCredentialsSourceAccount") {
      // Source-account auth is covered by the envelope signature.
      signedAuth.push(entry);
      continue;
    }

    // Address-credentialed: wallet must sign this authEntry preimage.
    // Stellar Wallets Kit signAuthEntry signs the preimage internally.
    const entryXdr = entry.toXDR("base64");
    const { signedAuthEntry } = await StellarWalletsKit.signAuthEntry(entryXdr, {
      networkPassphrase: passphrase,
      address: sourceAddress,
    });

    signedAuth.push(
      xdr.SorobanAuthorizationEntry.fromXDR(signedAuthEntry, "base64"),
    );
  }

  // Replace op auth with signed entries by rebuilding the tx (Soroban requires
  // op auth + envelope sig to be coherent).
  const innerTx = tx as any;
  innerTx.operations[0].auth = signedAuth;
  // Re-serialize and re-envelope-sign
  const rebuiltXdr = innerTx.toXDR();
  const { signedTxXdr } = await StellarWalletsKit.signTransaction(rebuiltXdr, {
    networkPassphrase: passphrase,
    address: sourceAddress,
  });

  return submitAndPoll(signedTxXdr);
}

async function submitAndPoll(signedXdr: string) {
  const result = await client.submitTransaction(signedXdr);
  return result;
}

// ============== High-level write operations ==============

export async function createPlan(params: {
  merchant: string;
  token: string;
  amountUsdc: number;
  period: number;
  trialPeriods?: number;
  maxPeriods?: number;
  gracePeriod?: number;
  priceCeilingUsdc: number;
}) {
  const built = await client.buildCreatePlan({
    merchant: params.merchant,
    token: params.token,
    amount: BigInt(Math.floor(params.amountUsdc * 1e7)),
    period: params.period,
    trialPeriods: params.trialPeriods ?? 0,
    maxPeriods: params.maxPeriods ?? 0,
    gracePeriod: params.gracePeriod ?? 86400,
    priceCeiling: BigInt(Math.floor(params.priceCeilingUsdc * 1e7)),
  });

  return signAndSubmit({
    xdr: built,
    sourceAddress: params.merchant,
    signNestedAuth: false, // create_plan only requires merchant.require_auth() at top level
  });
}

export async function subscribeToPlan(params: {
  subscriber: string;
  planId: number;
  expirationLedger?: number;
  allowancePeriods?: number;
}) {
  const built = await client.buildSubscribe(
    params.subscriber,
    params.planId,
    {
      expirationLedger: params.expirationLedger,
      allowancePeriods: params.allowancePeriods,
    },
  );

  return signAndSubmit({
    xdr: built,
    sourceAddress: params.subscriber,
    signNestedAuth: true, // subscribe internally calls token.approve which needs nested auth
  });
}

export async function cancelSubscription(params: {
  caller: string;
  subId: number;
}) {
  const built = await client.buildCancel(params.caller, params.subId);
  return signAndSubmit({
    xdr: built,
    sourceAddress: params.caller,
    signNestedAuth: false,
  });
}

export async function refundSubscriber(params: {
  merchant: string;
  subId: number;
  amountUsdc: number;
}) {
  const built = await client.buildRefund(
    params.merchant,
    params.subId,
    BigInt(Math.floor(params.amountUsdc * 1e7)),
  );
  return signAndSubmit({
    xdr: built,
    sourceAddress: params.merchant,
    signNestedAuth: true, // refund calls token.transfer which requires nested auth
  });
}

export async function updatePlanAmount(params: {
  merchant: string;
  planId: number;
  newAmountUsdc: number;
}) {
  const built = await client.buildUpdatePlanAmount(
    params.merchant,
    params.planId,
    BigInt(Math.floor(params.newAmountUsdc * 1e7)),
  );
  return signAndSubmit({
    xdr: built,
    sourceAddress: params.merchant,
    signNestedAuth: false,
  });
}

export async function getLatestLedger() {
  const latest = await server.getLatestLedger();
  return latest.sequence;
}
