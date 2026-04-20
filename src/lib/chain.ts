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

// Placeholder implementations - these will be wired to the actual SDK later
export async function getSubscriberSubscriptions(_address: string) {
  try {
    // TODO: Wire to VowenaClient.getSubscriberSubscriptions(_address, _address)
    return [];
  } catch (error) {
    console.error("Failed to fetch subscriber subscriptions:", error);
    return [];
  }
}

export async function getSubscription(subId: number, _subscriberAddress: string) {
  try {
    // TODO: Wire to VowenaClient.getSubscription(subId, _subscriberAddress)
    throw new Error(`Subscription ${subId} not implemented`);
  } catch (error) {
    console.error(`Failed to fetch subscription ${subId}:`, error);
    throw error;
  }
}

export async function getPlan(planId: number, _merchantAddress: string) {
  try {
    // TODO: Wire to VowenaClient.getPlan(planId, _merchantAddress)
    throw new Error(`Plan ${planId} not implemented`);
  } catch (error) {
    console.error(`Failed to fetch plan ${planId}:`, error);
    throw error;
  }
}

export async function getMerchantPlans(_merchantAddress: string) {
  try {
    // TODO: Wire to VowenaClient.getMerchantPlans(_merchantAddress, _merchantAddress)
    return [];
  } catch (error) {
    console.error("Failed to fetch merchant plans:", error);
    return [];
  }
}

export async function getPlanSubscribers(planId: number) {
  try {
    // TODO: Wire to VowenaClient.getPlanSubscribers(planId)
    return [];
  } catch (error) {
    console.error(`Failed to fetch plan subscribers for plan ${planId}:`, error);
    return [];
  }
}
