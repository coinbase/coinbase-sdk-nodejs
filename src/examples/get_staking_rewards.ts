import { Coinbase, StakingReward } from "../../src";

const apiKeyFilePath = "~/.apikeys/prod.json";

async function stake() {
  Coinbase.configureFromJson({ filePath: apiKeyFilePath });

  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 60);

  const rewards = await StakingReward.list(
    Coinbase.networks.EthereumMainnet,
    Coinbase.assets.Eth,
    [
      "0xad927b51bf02d120dd5e25526ee734ba78468cc5c7588fde2a2d9b02ba4502296b97b0fa0ff22900ff7425652ac76d51",
    ],
    start.toISOString(),
    end.toISOString(),
  );

  // Loop through the rewards and print each staking reward
  rewards.forEach(reward => console.log(reward.toString()));
}

(async () => {
  try {
    await stake();
  } catch (error) {
    console.error("Error during stake operation", error);
  }
})();
