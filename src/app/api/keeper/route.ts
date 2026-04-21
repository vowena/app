import { type NextRequest, NextResponse } from "next/server";
import {
  Keypair,
  TransactionBuilder,
  Networks,
  rpc as SorobanRpc,
  Contract,
  nativeToScVal,
  StrKey,
} from "@stellar/stellar-sdk";

/**
 * POST /api/keeper { merchantAddress }
 *
 * Walks all plans for the merchant, all subscribers per plan, and calls
 * charge(sub_id) on the Vowena contract for each subscription. The contract
 * itself enforces "is this charge actually due?" — so calling it for not-yet-
 * due subscriptions is harmless (returns false, no token movement).
 *
 * Charge is permissionless on the contract — any funded account can call it.
 * We use the same issuer key the faucet uses, so no extra env var is needed.
 */

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
    // 1. Discover this merchant's plans, then their subscribers
    const merchantPlanIds = await readVecU64(
      server,
      keeper.publicKey(),
      contract,
      "get_merchant_plans",
      [nativeToScVal(merchantAddress, { type: "address" })],
    );

    const allSubIds: number[] = [];
    for (const planId of merchantPlanIds) {
      const planSubIds = await readVecU64(
        server,
        keeper.publicKey(),
        contract,
        "get_plan_subscribers",
        [nativeToScVal(planId, { type: "u64" })],
      );
      for (const sid of planSubIds) allSubIds.push(sid);
    }

    if (allSubIds.length === 0) {
      return NextResponse.json({ charged: 0, attempted: 0, failed: 0 });
    }

    // 2. For each sub, fire charge(). Each charge needs its own tx because
    //    Soroban only allows one InvokeHostFunction per tx.
    let charged = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const subId of allSubIds) {
      try {
        const account = await server.getAccount(keeper.publicKey());
        const tx = new TransactionBuilder(account, {
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
          failed++;
          errors.push(`sub ${subId}: ${sim.error}`);
          continue;
        }

        const prepared = SorobanRpc.assembleTransaction(tx, sim).build();
        prepared.sign(keeper);
        const sent = await server.sendTransaction(prepared);
        if (sent.status === "ERROR") {
          failed++;
          errors.push(`sub ${subId}: send error`);
          continue;
        }

        // The contract returns bool: true if it actually charged, false if
        // the sub wasn't due. We poll for inclusion to know which.
        let result = await server.getTransaction(sent.hash);
        const deadline = Date.now() + 15_000;
        while (result.status === "NOT_FOUND" && Date.now() < deadline) {
          await new Promise((r) => setTimeout(r, 1000));
          result = await server.getTransaction(sent.hash);
        }

        if (result.status === "SUCCESS") {
          // returnValue is the contract's bool; only count the actual charges
          const rv = result.returnValue;
          const wasCharged =
            rv != null &&
            ((rv as unknown as { value?: () => boolean })?.value?.() ?? false);
          if (wasCharged) charged++;
        } else {
          failed++;
        }
      } catch (err) {
        failed++;
        errors.push(
          `sub ${subId}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    return NextResponse.json({
      attempted: allSubIds.length,
      charged,
      failed,
      errors: errors.slice(0, 10),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Keeper run failed",
      },
      { status: 500 },
    );
  }
}

/**
 * Read a Vec<u64> from a Soroban contract via simulation.
 */
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
  if (SorobanRpc.Api.isSimulationError(sim) || !("result" in sim)) {
    return [];
  }

  const rv = sim.result?.retval;
  if (!rv) return [];
  // ScVal Vec → array of u64s
  try {
    const native = (
      await import("@stellar/stellar-sdk")
    ).scValToNative(rv) as unknown[];
    return native.map((x) => Number(x));
  } catch {
    return [];
  }
}
