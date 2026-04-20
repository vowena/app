// SDK configuration
const CONTRACT_ID = "CAHGU3IPILE6P7PH324ZTDTYJNQAOGPYZAYLIBJQWPJBVBK4MVIMZQAR";
const RPC_URL = "https://soroban-testnet.stellar.org";
const PASSPHRASE = "Test SDF Network ; September 2015";
const SECONDS_PER_DAY = 86400;

export { SECONDS_PER_DAY };
export const CONTRACT = { ID: CONTRACT_ID, RPC_URL, PASSPHRASE };

export function fromStroops(stroops: number): number {
  return stroops / 1e7;
}

export interface ChainPlan {
  id: number;
  merchant: string;
  token: string;
  amount: number;
  period: number;
  trialPeriods: number;
  maxPeriods: number;
  gracePeriod: number;
  priceCeiling: number;
  createdAt: number;
  active: boolean;
}

export interface ChainSubscription {
  id: number;
  planId: number;
  subscriber: string;
  status: "Active" | "Paused" | "Cancelled" | "Expired" | string;
  createdAt: number;
  periodsBilled: number;
  nextBillingTime: number;
  failedAt: number;
  migrationTarget: number;
  cancelledAt: number;
}

// Placeholder implementations - to be wired to vowena SDK
export async function getSubscriberSubscriptions(
  _address: string,
): Promise<number[]> {
  return [];
}

export async function getSubscription(
  subId: number,
  _subscriberAddress: string,
): Promise<ChainSubscription> {
  throw new Error(`getSubscription(${subId}) not implemented`);
}

export async function getPlan(
  planId: number,
  _merchantAddress: string,
): Promise<ChainPlan> {
  throw new Error(`getPlan(${planId}) not implemented`);
}

export async function getMerchantPlans(
  _merchantAddress: string,
): Promise<number[]> {
  return [];
}

export async function getPlanSubscribers(_planId: number): Promise<number[]> {
  return [];
}
