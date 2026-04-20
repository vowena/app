import { VowenaClient, SECONDS_PER_DAY, fromStroops } from "vowena";
import { Address } from "@stellar/stellar-sdk";

const CONTRACT_ID = "CAHGU3IPILE6P7PH324ZTDTYJNQAOGPYZAYLIBJQWPJBVBK4MVIMZQAR";
const RPC_URL = "https://soroban-testnet.stellar.org";
const PASSPHRASE = "Test SDF Network ; September 2015";

export const client = new VowenaClient({
  contractId: CONTRACT_ID,
  rpcUrl: RPC_URL,
  networkPassphrase: PASSPHRASE,
});

export { SECONDS_PER_DAY, fromStroops };
export const CONTRACT = { ID: CONTRACT_ID, RPC_URL, PASSPHRASE };

export async function getSubscriberSubscriptions(address: string) {
  try {
    const subIds = await client.getSubscriberSubscriptions(address, address);
    return subIds.map((id) => Number(id));
  } catch (error) {
    console.error("Failed to fetch subscriber subscriptions:", error);
    return [];
  }
}

export async function getSubscription(subId: number, subscriberAddress: string) {
  try {
    const sub = await client.getSubscription(subId, subscriberAddress);
    return {
      id: Number(sub.id),
      planId: Number(sub.plan_id),
      subscriber: sub.subscriber.toString(),
      status: sub.status,
      createdAt: Number(sub.created_at),
      periodsBilled: Number(sub.periods_billed),
      nextBillingTime: Number(sub.next_billing_time),
      failedAt: Number(sub.failed_at),
      migrationTarget: Number(sub.migration_target),
      cancelledAt: Number(sub.cancelled_at),
    };
  } catch (error) {
    console.error(`Failed to fetch subscription ${subId}:`, error);
    throw error;
  }
}

export async function getPlan(planId: number, merchantAddress: string) {
  try {
    const plan = await client.getPlan(planId, merchantAddress);
    return {
      id: Number(plan.id),
      merchant: plan.merchant.toString(),
      token: plan.token.toString(),
      amount: Number(plan.amount),
      period: Number(plan.period),
      trialPeriods: Number(plan.trial_periods),
      maxPeriods: Number(plan.max_periods),
      gracePeriod: Number(plan.grace_period),
      priceCeiling: Number(plan.price_ceiling),
      createdAt: Number(plan.created_at),
      active: plan.active,
    };
  } catch (error) {
    console.error(`Failed to fetch plan ${planId}:`, error);
    throw error;
  }
}

export async function getMerchantPlans(merchantAddress: string) {
  try {
    const planIds = await client.getMerchantPlans(merchantAddress, merchantAddress);
    return planIds.map((id) => Number(id));
  } catch (error) {
    console.error("Failed to fetch merchant plans:", error);
    return [];
  }
}

export async function getPlanSubscribers(planId: number) {
  try {
    const subIds = await client.getPlanSubscribers(planId);
    return subIds.map((id) => Number(id));
  } catch (error) {
    console.error(`Failed to fetch plan subscribers for plan ${planId}:`, error);
    return [];
  }
}
