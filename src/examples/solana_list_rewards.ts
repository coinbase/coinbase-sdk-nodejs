import { StakingReward } from "../coinbase/staking_reward";
import { Coinbase } from "../coinbase/coinbase";
import { Address } from "../coinbase/address";
import { NetworkIdentifier } from "../client";
import { coinbaseApiKeyPath, getKeypair } from "./solana_wallet";

async function listSolanaStakingRewards(wallet: string) {
  const startTime = new Date(2024, 5).toISOString();

  const rewards = await StakingReward.list(NetworkIdentifier.SolanaMainnet, Coinbase.assets.Sol, [wallet], startTime, new Date().toISOString());
  console.log(rewards);

  const addr = new Address(NetworkIdentifier.SolanaMainnet, wallet);
  const balances = await addr.historicalStakingBalances(Coinbase.assets.Sol, startTime, new Date().toISOString());
  console.log(balances);
}


Coinbase.configureFromJson({ filePath: coinbaseApiKeyPath() });

const kp = getKeypair();
kp.then(kp => {
  listSolanaStakingRewards(kp.address);
});
