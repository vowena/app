import { getPlan, getProject } from "@/lib/chain";
import { decodePlanId, encodePlanId } from "@/lib/plan-id-codec";

export interface CheckoutSeo {
  planParam: string;
  planId: number | null;
  title: string;
  description: string;
  eyebrow: string;
  displayId: string;
}

export async function getCheckoutSeo(planParam: string): Promise<CheckoutSeo> {
  const planId = decodePlanId(planParam);
  const validPlanId = Number.isFinite(planId) && planId > 0 ? planId : null;
  const displayId = validPlanId ? encodePlanId(validPlanId) : planParam;

  if (!validPlanId) {
    return genericCheckoutSeo(planParam, null, displayId);
  }

  try {
    const plan = await getPlan(validPlanId, "");
    const project = plan.projectId
      ? await getProject(plan.projectId).catch(() => null)
      : null;

    const planName = plan.name || `Plan ${displayId}`;
    const projectName = project?.name || "a Vowena merchant";
    const amount = (Number(plan.amount) / 1e7).toFixed(2);
    const period = formatPeriod(Number(plan.period));

    return {
      planParam,
      planId: validPlanId,
      displayId,
      eyebrow: project?.name || "Vowena checkout",
      title: `${planName} by ${projectName}`,
      description: `Subscribe for ${amount} USDC per ${period} with a secure Vowena checkout on Stellar.`,
    };
  } catch {
    return genericCheckoutSeo(planParam, validPlanId, displayId);
  }
}

function genericCheckoutSeo(
  planParam: string,
  planId: number | null,
  displayId: string,
): CheckoutSeo {
  return {
    planParam,
    planId,
    displayId,
    eyebrow: "Vowena checkout",
    title: "Secure subscription checkout",
    description:
      "Subscribe with Vowena using an on-chain Stellar payment authorization.",
  };
}

function formatPeriod(seconds: number): string {
  if (seconds === 60) return "minute";
  if (seconds === 3600) return "hour";
  if (seconds === 86400) return "day";
  if (seconds === 604800) return "week";
  if (seconds === 2592000) return "month";
  if (seconds === 7776000) return "quarter";
  if (seconds === 31536000) return "year";
  return `${seconds} seconds`;
}
