import { type NextRequest, NextResponse } from "next/server";
import {
  Keypair,
  TransactionBuilder,
  Networks,
  rpc as SorobanRpc,
  Contract,
  nativeToScVal,
  scValToNative,
} from "@stellar/stellar-sdk";

/**
 * Vercel cron entry point. Configured to fire every 5 minutes via
 * vercel.json. Walks plan subscribers and fires charge() on every
 * subscription. The contract decides what's actually due — calling
 * for a not-yet-due sub is a harmless no-op (returns false).
 *
 * Performance design:
 *   - Discovery is parallel: Promise.all over a bounded plan ID range
 *   - Charge submission is parallel and fire-and-forget: we send the tx
 *     and immediately move on. We do NOT poll for inclusion — that was
 *     burning ~12s per sub serially and overflowing the 300s function
 *     timeout. Whether a charge actually billed shows up on the next
 *     read of the subscription's periodsBilled.
 *   - charge() is idempotent within a period, so re-sending is safe.
 *
 * Auth: when CRON_SECRET is set, require Authorization: Bearer <secret>.
 * Vercel automatically sends this header for scheduled cron invocations.
 *
 * Required env: VOWENA_ISSUER_SECRET (charge() is permissionless on the
 * contract; reusing the issuer key avoids a new env var).
 */

// Allow this function up to 60s (default would kill it after 10s/15s).
export const maxDuration = 60;

const CONTRACT_ID = "CCNDNEGYFYKTVBM7T2BEF5YVSKKICE44JOVHT7SAN5YTKHHBFIIEL72T";
const RPC_URL = "https://soroban-testnet.stellar.org";

// Upper bound for plan-ID scan. Way more than the demo / beta will hit;
// a real deployment would replace this with a NextPlanId contract read
// or a dedicated indexer.
const MAX_PLAN_SCAN = 200;

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const issuerSecret = process.env.VOWENA_ISSUER_SECRET;
  if (!issuerSecret) {
    return NextResponse.json(
      { error: "VOWENA_ISSUER_SECRET not configured" },
      { status: 503 },
    );
  }

  const keeper = Keypair.fromSecret(issuerSecret);
  const server = new SorobanRpc.Server(RPC_URL);
  const contract = new Contract(CONTRACT_ID);

  try {
    // 1) Discover subscribers across all plans IN PARALLEL.
    const planIds = Array.from({ length: MAX_PLAN_SCAN }, (_, i) => i + 1);
    const subscribersPerPlan = await Promise.all(
      planIds.map((pid) =>
        readVecU64(server, keeper.publicKey(), contract, "get_plan_subscribers", [
          nativeToScVal(pid, { type: "u64" }),
        ]).catch(() => [] as number[]),
      ),
    );
    const subIds = Array.from(new Set(subscribersPerPlan.flat()));

    if (subIds.length === 0) {
      return NextResponse.json({
        ranAt: new Date().toISOString(),
        attempted: 0,
        submitted: 0,
        failed: 0,
      });
    }

    // 2) Fire all charges IN PARALLEL, no polling. The submit goes through;
    //    the contract decides whether to actually move tokens. We track
    //    submission success here, not inclusion success.
    const sequenceAccount = await server.getAccount(keeper.publicKey());
    let baseSequence = BigInt(sequenceAccount.sequenceNumber());

    const submissions = await Promise.allSettled(
      subIds.map(async (subId) => {
        // Build, simulate, prepare, sign, send.
        // We don't need a fresh sequence per call when running in parallel
        // because we use independent simulations + sequential bumping.
        const acct = new (await import("@stellar/stellar-sdk")).Account(
          keeper.publicKey(),
          (++baseSequence).toString(),
        );
        const tx = new TransactionBuilder(acct, {
          fee: "100000",
          networkPassphrase: Networks.TESTNET,
        })
          .addOperation(
            contract.call("charge", nativeToScVal(subId, { type: "u64" })),
          )
          .setTimeout(30)
          .build();

        const sim = await server.simulateTransaction(tx);
        if (SorobanRpc.Api.isSimulationError(sim)) {
          throw new Error(`sim ${subId}: ${sim.error}`);
        }
        const prepared = SorobanRpc.assembleTransaction(tx, sim).build();
        prepared.sign(keeper);
        const sent = await server.sendTransaction(prepared);
        if (sent.status === "ERROR") {
          throw new Error(`send ${subId}: error`);
        }
        return sent.hash;
      }),
    );

    const submitted = submissions.filter((r) => r.status === "fulfilled").length;
    const failed = submissions.filter((r) => r.status === "rejected").length;

    return NextResponse.json({
      ranAt: new Date().toISOString(),
      attempted: subIds.length,
      submitted,
      failed,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Cron failed" },
      { status: 500 },
    );
  }
}

async function readVecU64(
  server: SorobanRpc.Server,
  caller: string,
  contract: Contract,
  fn: string,
  args: ReturnType<typeof nativeToScVal>[],
): Promise<number[]> {
  const account = await server.getAccount(caller);
  const tx = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(contract.call(fn, ...args))
    .setTimeout(30)
    .build();
  const sim = await server.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(sim) || !("result" in sim)) return [];
  const rv = sim.result?.retval;
  if (!rv) return [];
  try {
    const native = scValToNative(rv) as unknown[];
    return native.map((x) => Number(x));
  } catch {
    return [];
  }
}
