import { StakingBalance } from "../../coinbase/staking_balance";
import { StakingReward } from "../../coinbase/staking_reward";
import { Coinbase } from "../../coinbase/coinbase";
import { NetworkIdentifier } from "../../client";

const apiKeyFilePath = "/Users/drmoo/.apikeys/prod.json";

/**
 * List Solana historical staking balances for a given wallet.
 *
 * @param wallet - The wallet address to list historical staking rewards and balances for.
 */
async function listSolanaStakingBalances(wallet: string): Promise<void> {
  Coinbase.configureFromJson({ filePath: apiKeyFilePath });

  const startTime = new Date(2024, 5).toISOString();

  const rewards = await StakingReward.list(
    NetworkIdentifier.SolanaMainnet,
    Coinbase.assets.Sol,
    [wallet],
    startTime,
    new Date().toISOString(),
  );
  console.log(rewards);

  const balances = await StakingBalance.list(
    NetworkIdentifier.SolanaMainnet,
    Coinbase.assets.Sol,
    wallet,
    startTime,
    new Date().toISOString(),
  );
  console.log(balances);
}

(async () => {
  await listSolanaStakingBalances("51KR6Q6TRisKJ3NyFB7vmGUji675ufsC8ycmeNY7dDiP");
})();
