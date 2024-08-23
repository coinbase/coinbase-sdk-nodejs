import { Coinbase, ExternalAddress, StakeOptionsMode } from "..";
import { ethers } from "ethers";

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

  // Build a stake operation for an amount <= stakeableBalance, and in multiples of 32. In this case, 32 ETH.
  const stakingOperation = await address.buildStakeOperation(32, "eth", StakeOptionsMode.NATIVE);

  console.log("created staking operation", stakingOperation);

  /*
   * Native ETH staking involves setting up infrastructure, which can take time.
   * Example of polling the stake operation status until it reaches a terminal state using the SDK.
   */
  console.log("waiting until underlying infra is provisioned", stakingOperation);
  await stakingOperation.wait();
  console.log("done!", stakingOperation);

  // Load your wallet's private key from which you initiated the above stake operation.
  const wallet = new ethers.Wallet(
    "a93461695bc246aff6f517c5c02b925c4f157e6eeec22d31ef8d37f79ad9e9fa",
  );

  // Sign the transactions within staking operation resource with your wallet.
  await stakingOperation.sign(wallet);

  // For Holesky, publicly available RPC URL's can be found here https://chainlist.org/chain/17000
  const provider = new ethers.JsonRpcProvider(
    "https://boldest-weathered-aura.ethereum-holesky.quiknode.pro/0ff8cbb4e5c14043ab259fd21d8bade2d6815a4b",
  );

  // Broadcast each of the signed transactions to the network.
  stakingOperation.getTransactions().forEach(async tx => {
    const resp = await provider.broadcastTransaction(tx.getSignedPayload()!);
    console.log(resp);
  });
}

(async () => {
  await stakeETH();
})();
