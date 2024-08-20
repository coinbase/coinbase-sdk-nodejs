import { Amount, Coinbase, ExternalAddress, StakeOptionsMode, Validator } from "./src";
import { ethers } from "ethers";
import { StakingRewardFormat } from "./src/client";

const provider = new ethers.JsonRpcProvider(
  "https://dawn-indulgent-general.ethereum-holesky.quiknode.pro/f6cf1219a078d6c8d2b5d72a0b9336ea9c061e4c",
);

const coinbase = Coinbase.configureFromJson({
  filePath: "~/code/cb/staking/.coinbase_cloud_api_key_dev.json",
  basePath: "http://localhost:8000",
});

/**
 * Helps test Shared ETH stakefunctionality using External Address.
 *
 * @param amount - The amount to stake.
 * @param networkID - The network ID.
 * @param externalAddress - The external address.
 * @param privateKey - The private key of the external address.
 */
async function testSharedETHStakeWithExternalAddress(
  amount: Amount,
  networkID: string,
  externalAddress: string,
  privateKey: string,
) {
  const ea = new ExternalAddress(networkID, externalAddress);

  const stakeableBalance = await ea.stakeableBalance(Coinbase.assets.Eth);
  console.log("Stakeable balance: ", stakeableBalance);

  const stakingOperation = await ea.buildStakeOperation(amount, Coinbase.assets.Eth);

  await stakingOperation.wait();

  console.log("Stake operation status: ", stakingOperation.getStatus());

  await stakingOperation.sign(new ethers.Wallet(privateKey));

  for (const tx of stakingOperation.getTransactions()) {
    const resp = await provider.broadcastTransaction(tx.getSignedPayload()!);
    console.log("Tx Hash: ", getTxLink(resp.hash, networkID));
  }
}

/**
 * Helps test Shared ETH unstake functionality using External Address.
 *
 * @param amount - The amount to stake.
 * @param networkID - The network ID.
 * @param externalAddress - The external address.
 * @param privateKey - The private key of the external address.
 */
async function testSharedETHUnstakeWithExternalAddress(
  amount: Amount,
  networkID: string,
  externalAddress: string,
  privateKey: string,
) {
  const ea = new ExternalAddress(networkID, externalAddress);

  const unstakeableBalance = await ea.unstakeableBalance(Coinbase.assets.Eth);
  console.log("Unstakeable balance: ", unstakeableBalance);

  const stakingOperation = await ea.buildUnstakeOperation(amount, Coinbase.assets.Eth);

  await stakingOperation.wait();

  console.log("Stake operation status: ", stakingOperation.getStatus());

  await stakingOperation.sign(new ethers.Wallet(privateKey));

  for (const tx of stakingOperation.getTransactions()) {
    const resp = await provider.broadcastTransaction(tx.getSignedPayload()!);
    console.log("Tx Hash: ", getTxLink(resp.hash, networkID));
  }
}

/**
 * Helps test Shared ETH claim stake functionality using External Address.
 *
 * @param amount - The amount to claim stake.
 * @param networkID - The network ID.
 * @param externalAddress - The external address.
 * @param privateKey - The private key of the external address.
 */
async function testSharedETHClaimStakeWithExternalAddress(
  amount: Amount,
  networkID: string,
  externalAddress: string,
  privateKey: string,
) {
  const ea = new ExternalAddress(networkID, externalAddress);

  const claimableBalance = await ea.claimableBalance(Coinbase.assets.Eth);
  console.log("Claimable balance: ", claimableBalance);

  const stakingOperation = await ea.buildClaimStakeOperation(amount, Coinbase.assets.Eth);

  await stakingOperation.wait();

  console.log("Stake operation status: ", stakingOperation.getStatus());

  await stakingOperation.sign(new ethers.Wallet(privateKey));

  for (const tx of stakingOperation.getTransactions()) {
    const resp = await provider.broadcastTransaction(tx.getSignedPayload()!);
    console.log("Tx Hash: ", getTxLink(resp.hash, networkID));
  }
}

/**
 * Helps test Shared ETH staking functionality using Wallet Address.
 *
 * @param amount - The amount to stake.
 */
async function testSharedETHStakeWithWalletAddress(amount: Amount) {
  const user = await coinbase.getDefaultUser();

  const myWallet = await user.getWallet("a9df73f4-efe1-47b6-b584-973b45a102a5");

  await myWallet.loadSeed("wallet-seed");

  const stakeableBalance = await myWallet.stakeableBalance(Coinbase.assets.Eth);
  console.log("Stakeable balance: ", stakeableBalance);

  const stakingOperation = await myWallet.createStake(amount, Coinbase.assets.Eth);

  console.log("Stake operation status: ", stakingOperation.getStatus());

  for (const tx of stakingOperation.getTransactions()) {
    console.log("Tx Hash: ", tx.getTransactionLink());
  }
}

/**
 * Helps test Dedicated ETH stake functionality using External Address.
 *
 * @param amount - The amount to stake.
 * @param networkID - The network ID.
 * @param externalAddress - The external address.
 */
async function testDedicatedETHStakeWithExternalAddress(
  amount: Amount,
  networkID: string,
  externalAddress: string,
) {
  const ea = new ExternalAddress(networkID, externalAddress);

  const stakeableBalance = await ea.stakeableBalance(Coinbase.assets.Eth, StakeOptionsMode.NATIVE);
  console.log("Stakeable balance: ", stakeableBalance);

  const stakingOperation = await ea.buildStakeOperation(
    amount,
    Coinbase.assets.Eth,
    StakeOptionsMode.NATIVE,
  );

  await stakingOperation.wait();

  console.log("Stake operation status: ", stakingOperation.getStatus());

  for (const tx of stakingOperation.getTransactions()) {
    console.log("Deposit Tx: ", tx.getUnsignedPayload());
  }
}

/**
 * Helps test Dedicated ETH unstake functionality using External Address.
 *
 * @param amount - The amount to unstake.
 * @param networkID - The network ID.
 * @param externalAddress - The external address.
 */
async function testDedicatedETHUnstakeWithExternalAddress(
  amount: Amount,
  networkID: string,
  externalAddress: string,
) {
  const ea = new ExternalAddress(networkID, externalAddress);

  const unstakeableBalance = await ea.unstakeableBalance(
    Coinbase.assets.Eth,
    StakeOptionsMode.NATIVE,
  );
  console.log("Unstakeable balance: ", unstakeableBalance);

  const stakingOperation = await ea.buildUnstakeOperation(
    amount,
    Coinbase.assets.Eth,
    StakeOptionsMode.NATIVE,
  );

  await stakingOperation.wait();

  console.log("Stake operation status: ", stakingOperation.getStatus());

  for (const exitMessage of stakingOperation.getSignedVoluntaryExitMessages()) {
    console.log("Validator Exit Message: ", exitMessage);
  }
}

/**
 * Helps list the validators for the Ethereum network.
 *
 * @param networkID - The network ID.
 * @param status - The status to filter by.
 */
async function listEthereumValidators(networkID: string, status?: string) {
  const validators = await Validator.list(networkID, "eth", status);

  validators.forEach(validator => {
    console.log(validator.toString());
  });
}

/**
 * Helps list the rewards for the external address.
 *
 * @param networkID - The network ID.
 * @param externalAddress - The external address.
 */
async function listSharedETHStakingRewards(networkID: string, externalAddress: string) {
  const ea = new ExternalAddress(networkID, externalAddress);

  const rewards = await ea.stakingRewards("eth");

  rewards.forEach(reward => console.log(reward.toString()));
}

/**
 * Helps return the onchain tx link.
 *
 * @param txHash - The transaction hash.
 * @param networkID - The network ID.
 *
 * @returns The onchain tx link.
 */
function getTxLink(txHash: string, networkID: string) {
  let baseUrl: string;

  switch (networkID) {
    case Coinbase.networks.EthereumHolesky:
      baseUrl = "https://holesky.etherscan.io/tx/";
      break;
    case Coinbase.networks.EthereumMainnet:
      baseUrl = "https://etherscan.io/tx/";
      break;
    default:
      throw new Error("Unsupported network ID");
  }

  return `${baseUrl}${txHash}`;
}

(async () => {
  const args = process.argv.slice(2);
  const testCase = args[0];

  const personalWalletAddress = "0x87Bf57c3d7B211a100ee4d00dee08435130A62fA";
  const personalWalletPrivateKey =
    "405fb602cbd9618681f37d3079bb494e341da80e197c2b9d38bc7ad46f11d04f";

  try {
    switch (testCase) {
      case "sharedETHStakeWithExternalAddress":
        await testSharedETHStakeWithExternalAddress(
          0.00001,
          Coinbase.networks.EthereumHolesky,
          personalWalletAddress,
          personalWalletPrivateKey,
        );
        break;
      case "sharedETHUnstakeWithExternalAddress":
        await testSharedETHUnstakeWithExternalAddress(
          0.00001,
          Coinbase.networks.EthereumHolesky,
          personalWalletAddress,
          personalWalletPrivateKey,
        );
        break;
      case "sharedETHClaimStakeWithExternalAddress":
        await testSharedETHClaimStakeWithExternalAddress(
          0.00001,
          Coinbase.networks.EthereumHolesky,
          personalWalletAddress,
          personalWalletPrivateKey,
        );
        break;
      case "sharedETHStakeWithWalletAddress":
        await testSharedETHStakeWithWalletAddress(0.00001);
        break;
      case "dedicatedETHStakeWithExternalAddress":
        await testDedicatedETHStakeWithExternalAddress(
          32,
          Coinbase.networks.EthereumHolesky,
          personalWalletAddress,
        );
        break;
      case "dedicatedETHUnstakeWithExternalAddress":
        await testDedicatedETHUnstakeWithExternalAddress(
          64,
          Coinbase.networks.EthereumHolesky,
          personalWalletAddress,
        );
        break;
      case "listEthereumValidators":
        await listEthereumValidators(Coinbase.networks.EthereumHolesky, "active_ongoing");
        break;
      case "listSharedETHStakingRewards":
        await listSharedETHStakingRewards(Coinbase.networks.EthereumMainnet, personalWalletAddress);
        break;
      default:
        console.error("Invalid test case selected");
    }
  } catch (error) {
    console.error("Error during test", error);
  }
})();
