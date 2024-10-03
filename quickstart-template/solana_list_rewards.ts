import { StakingReward, Coinbase, Address } from "@coinbase/coinbase-sdk";
import { coinbaseApiKeyPath, getKeypair } from "./solana_wallet";

// list solana staking rewards for the provided wallet on solana-mainnet
// then get the historical staking balances for the same wallet. 
// use May 2024 until current the today's date.
async function listSolanaStakingRewards(wallet: string) {
  const startTime = new Date(2024, 5).toISOString();

  const rewards = await StakingReward.list(
    "solana-mainnet",
    Coinbase.assets.Sol,
    [wallet],
    startTime,
    new Date().toISOString(),
  );
  console.log(rewards);

  const addr = new Address("solana-mainnet", wallet);
  const balances = await addr.historicalStakingBalances(
    Coinbase.assets.Sol,
    startTime,
    new Date().toISOString(),
  );
  console.log(balances);
}

// Initialize the sdk with the api key
Coinbase.configureFromJson({ filePath: coinbaseApiKeyPath() });

// GetKeypair will try to read the default path of the solana CLI keypair
const keyPair = getKeypair();
keyPair.then(kp => {
  listSolanaStakingRewards(kp.address);
});
