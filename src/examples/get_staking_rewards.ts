import { Coinbase, StakingReward } from "../../src";

const apiKeyFilePath = "~/.apikeys/prod.json";

async function stake() {
  Coinbase.configureFromJson({ filePath: apiKeyFilePath });

  // Get the rewards earned from staking in the last 10 days.
  // Note that it can take upto a day for new rewards to show up.
  let now = new Date();
  let tenDaysAgo = new Date();
  tenDaysAgo.setDate(now.getDate() - 10);

  let rewards = await StakingReward.list(
    "ethereum-mainnet",
    "eth",
    [
      "0xa1d1ad0714035353258038e964ae9675dc0252ee22cea896825c01458e1807bfad2f9969338798548d9858a571f7425c",
    ],
    tenDaysAgo.toISOString(),
    now.toISOString(),
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
