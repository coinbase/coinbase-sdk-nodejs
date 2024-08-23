import { Coinbase, ExternalAddress, StakeOptionsMode } from "..";

const apiKeyFilePath = "/Users/drmoo/.apikeys/prod.json";

/**
 * List the validators you've provisioned on the `ethereum-holesky` testnet network.
 */
/**
 * List the validators you've provisioned on the `ethereum-holesky` testnet network.
 */
async function stakeETH() {
  await Coinbase.configureFromJson({ filePath: apiKeyFilePath });

  // Create a new external address on the `ethereum-holesky` network.
  const address = new ExternalAddress(
    "ethereum-holesky",
    "0x04DF51085DB07BBA5eAAAf3b5c09469D7374a98c",
  );

  console.log("created address", address);

  const unstakeableBalance = await address.unstakeableBalance("eth", StakeOptionsMode.NATIVE);
  console.log("unstakeable balance", unstakeableBalance);

  // Build an unstake operation for an amount <= unstakeableBalance, in this case 0.005 ETH.
  const unstakeOperation = await address.buildUnstakeOperation(32, "eth", StakeOptionsMode.NATIVE, {
    immediate: "false",
  });
  console.log("created unstake operation", unstakeOperation);
}

(async () => {
  await stakeETH();
})();
