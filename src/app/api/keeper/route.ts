import { type NextRequest, NextResponse } from "next/server";
import {
  Account,
  Keypair,
  TransactionBuilder,
  Networks,
  rpc as SorobanRpc,
  Contract,
  nativeToScVal,
  scValToNative,
  StrKey,
} from "@stellar/stellar-sdk";

/**
 * Manual keeper trigger for the dashboard's "Run now" button. Same logic
 * as the scheduled cron at /api/cron, but scoped to one merchant's plans.
 *
 * Submission is parallel and fire-and-forget — we report how many txs we
 * successfully submitted, not how many actually moved tokens (the contract
 * decides that based on whether each sub is due). Periods billed will be
 * reflected on next read.
 */

export const maxDuration = 60;

const CONTRACT_ID = "CCNDNEGYFYKTVBM7T2BEF5YVSKKICE44JOVHT7SAN5YTKHHBFIIEL72T";
const RPC_URL = "https://soroban-testnet.stellar.org";

export async function POST(request: NextRequest) {
  let body: { merchantAddress?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const merchantAddress = body?.merchantAddress;
  if (!merchantAddress || !StrKey.isValidEd25519PublicKey(merchantAddress)) {
    return NextResponse.json(
      { error: "merchantAddress required" },
      { status: 400 },
    );
  }

  const secret = process.env.VOWENA_ISSUER_SECRET;
  if (!secret) {
    return NextResponse.json(
      {
        error:
          "Keeper not configured. Set VOWENA_ISSUER_SECRET in the dashboard env.",
      },
      { status: 503 },
    );
  }

  const keeper = Keypair.fromSecret(secret);
  const server = new SorobanRpc.Server(RPC_URL);
  const contract = new Contract(CONTRACT_ID);

  try {
    // Get just this merchant's plans (small list).
    const merchantPlanIds = await readVecU64(
      server,
      keeper.publicKey(),
      contract,
      "get_merchant_plans",
      [nativeToScVal(merchantAddress, { type: "address" })],
    );

    if (merchantPlanIds.length === 0) {
      return NextResponse.json({ attempted: 0, submitted: 0, failed: 0 });
    }

    // Discover subscribers for each plan in parallel.
    const subscribersPerPlan = await Promise.all(
      merchantPlanIds.map((pid) =>
        readVecU64(server, keeper.publicKey(), contract, "get_plan_subscribers", [
          nativeToScVal(pid, { type: "u64" }),
        ]).catch(() => [] as number[]),
      ),
    );
    const subIds = Array.from(new Set(subscribersPerPlan.flat()));

    if (subIds.length === 0) {
      return NextResponse.json({ attempted: 0, submitted: 0, failed: 0 });
    }

    // Submit all charges in parallel, no inclusion polling.
    const seedAccount = await server.getAccount(keeper.publicKey());
    let baseSequence = BigInt(seedAccount.sequenceNumber());

    const submissions = await Promise.allSettled(
      subIds.map(async (subId) => {
        const acct = new Account(
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
          throw new Error(`sim ${subId}`);
        }
        const prepared = SorobanRpc.assembleTransaction(tx, sim).build();
        prepared.sign(keeper);
        const sent = await server.sendTransaction(prepared);
        if (sent.status === "ERROR") throw new Error(`send ${subId}`);
        return sent.hash;
      }),
    );

    const submitted = submissions.filter((r) => r.status === "fulfilled").length;
    const failed = submissions.filter((r) => r.status === "rejected").length;

    return NextResponse.json({
      attempted: subIds.length,
      submitted,
      charged: submitted,
      failed,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Keeper run failed" },
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
