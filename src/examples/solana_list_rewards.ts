import { StakingReward } from "../coinbase/staking_reward";
import { Coinbase } from "../coinbase/coinbase";
import { Address } from "../coinbase/address";
import { NetworkIdentifier } from "../client";

async function listSolanaStakingRewards() {
  Coinbase.configureFromJson({ filePath: "~/Downloads/cdp_api_key.json" });

  const startTime = new Date(2024, 5).toISOString();

  const rewards = await StakingReward.list(NetworkIdentifier.SolanaMainnet, Coinbase.assets.Sol, ["beefKGBWeSpHzYBHZXwp5So7wdQGX6mu4ZHCsH3uTar"], startTime, new Date().toISOString());
  console.log(rewards);

  const addr = new Address(NetworkIdentifier.SolanaMainnet, "beefKGBWeSpHzYBHZXwp5So7wdQGX6mu4ZHCsH3uTar");
  const balances = await addr.historicalStakingBalances(Coinbase.assets.Sol, startTime, new Date().toISOString());
  console.log(balances);
}

listSolanaStakingRewards();
