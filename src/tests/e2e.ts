import fs from "fs";
import dotenv from "dotenv";
import {
  Coinbase,
  Wallet,
  StakingReward,
  StakingBalance,
  ExternalAddress,
  ValidatorStatus,
  Validator,
  StakeOptionsMode,
  TransactionStatus,
} from "../index";

import { StakingOperationStatusEnum } from "../client";
import { TransferStatus } from "../coinbase/types";

describe("Coinbase SDK E2E Test", () => {
  beforeAll(() => {
    dotenv.config();
  });

  beforeEach(() => {
    Coinbase.configure({
      apiKeyName: process.env.NAME as string,
      privateKey: process.env.PRIVATE_KEY as string,
    });
  });

  it("should be able to access environment variables", () => {
    expect(process.env.NAME).toBeDefined();
    expect(process.env.PRIVATE_KEY).toBeDefined();
  });

  it("should have created a dist folder for NPM", () => {
    expect(fs.existsSync("./dist")).toBe(true);
    expect(fs.existsSync("./dist/index.js")).toBe(true);
    expect(fs.existsSync("./dist/client/index.js")).toBe(true);
    expect(fs.existsSync("./dist/coinbase/coinbase.js")).toBe(true);
  });

  it("should be able to interact with the Coinbase SDK", async () => {
    console.log("Creating new wallet...");
    const wallet = await Wallet.create();

    expect(wallet.toString()).toBeDefined();
    expect(wallet?.getId()).toBeDefined();
    console.log(
      `Created new wallet with ID: ${wallet.getId()}, default address: ${wallet.getDefaultAddress()}`,
    );

    console.log("Importing wallet with balance...");
    const seedFile = JSON.parse(process.env.WALLET_DATA || "");
    const walletId = Object.keys(seedFile)[0];
    const seed = seedFile[walletId].seed;

    const importedWallet = await Wallet.import({ seed, walletId });
    expect(importedWallet).toBeDefined();
    expect(importedWallet.getId()).toBe(walletId);
    console.log(
      `Imported wallet with ID: ${importedWallet.getId()}, default address: ${importedWallet.getDefaultAddress()}`,
    );
    await importedWallet.saveSeed("test_seed.json");

    try {
      const transaction = await importedWallet.faucet();
      expect(transaction.toString()).toBeDefined();
    } catch {
      console.log("Faucet request failed. Skipping...");
    }
    console.log("Listing wallet addresses...");
    const addresses = await importedWallet.listAddresses();
    expect(addresses.length).toBeGreaterThan(0);
    console.log(`Listed addresses: ${addresses.join(", ")}`);

    console.log("Fetching wallet balances...");
    const balances = await importedWallet.listBalances();
    expect(Array.from([...balances.keys()]).length).toBeGreaterThan(0);
    console.log(`Fetched balances: ${balances.toString()}`);

    console.log("Exporting wallet...");
    const exportedWallet = await wallet.export();
    expect(exportedWallet.walletId).toBeDefined();
    expect(exportedWallet.seed).toBeDefined();

    console.log("Saving seed to file...");
    await wallet.saveSeed("test_seed.json");
    expect(fs.existsSync("test_seed.json")).toBe(true);
    console.log("Saved seed to test_seed.json");

    const unhydratedWallet = await Wallet.fetch(walletId);
    expect(unhydratedWallet.canSign()).toBe(false);
    await unhydratedWallet.loadSeed("test_seed.json");
    expect(unhydratedWallet.canSign()).toBe(true);
    expect(unhydratedWallet.getId()).toBe(walletId);

    console.log("Transfering 0.000000001 ETH from default address to second address...");
    const transfer = await unhydratedWallet.createTransfer({
      amount: 0.000000001,
      assetId: Coinbase.assets.Eth,
      destination: wallet,
    });

    await transfer.wait();

    expect(transfer.toString()).toBeDefined();
    expect(await transfer.getStatus()).toBe(TransferStatus.COMPLETE);
    console.log(`Transferred 1 Gwei from ${unhydratedWallet} to ${wallet}`);

    console.log("Fetching updated balances...");
    const firstBalance = await unhydratedWallet.listBalances();
    const secondBalance = await wallet.listBalances();
    expect(firstBalance.get(Coinbase.assets.Eth)).not.toEqual("0");
    expect(secondBalance.get(Coinbase.assets.Eth)).not.toEqual("0");
    console.log(`First address balances: ${firstBalance}`);
    console.log(`Second address balances: ${secondBalance}`);

    console.log("Fetching address transactions...");
    const result = await (
      await unhydratedWallet.getDefaultAddress()
    ).listTransactions({ limit: 1 });
    expect(result?.data.length).toBeGreaterThan(0);
    console.log(`Fetched transactions: ${result?.data[0].toString()}`);

    console.log("Fetching address historical balances...");
    const balance_result = await (
      await unhydratedWallet.getDefaultAddress()
    ).listHistoricalBalances(Coinbase.assets.Eth, { limit: 2 });
    expect(balance_result?.data.length).toBeGreaterThan(0);
    console.log(`First eth historical balance: ${balance_result?.data[0].amount.toString()}`);

    const savedSeed = JSON.parse(fs.readFileSync("test_seed.json", "utf-8"));
    fs.unlinkSync("test_seed.json");

    expect(exportedWallet.seed.length).toBe(64);
    expect(savedSeed[exportedWallet.walletId]).toEqual({
      seed: exportedWallet.seed,
      encrypted: false,
      authTag: "",
      iv: "",
    });
  }, 60000);
});

describe("Coinbase SDK Stake E2E Test", () => {
  const requiredEnvVars = [
    "STAKE_API_KEY_NAME",
    "STAKE_API_PRIVATE_KEY",
    "STAKE_ADDRESS_ID_1",
    "STAKE_ADDRESS_ID_2",
    "STAKE_VALIDATOR_ADDRESS_1",
  ];

  beforeAll(() => {
    dotenv.config();

    requiredEnvVars.forEach(envVar => {
      if (!process.env[envVar]) {
        throw new Error(`Required environment variable ${envVar} is not set`);
      }
    });

    Coinbase.configure({
      apiKeyName: process.env.STAKE_API_KEY_NAME as string,
      privateKey: process.env.STAKE_API_PRIVATE_KEY as string,
    });
  });

  it("should be able to access environment variables", () => {
    requiredEnvVars.forEach(envVar => {
      expect(process.env[envVar]).toBeDefined();
    });
  });

  describe("Stake: Reward Tests", () => {
    it("should list shared eth staking rewards via StakingReward.list", async () => {
      const networkId = Coinbase.networks.EthereumMainnet;
      const assetId = Coinbase.assets.Eth;
      const addressIds = [process.env.STAKE_ADDRESS_ID_1 as string];
      // May 1, 2024 - May 20, 2024
      const startTime = new Date(2024, 4, 1, 0, 0, 0).toISOString();
      const endTime = new Date(2024, 4, 20, 23, 59, 59).toISOString();
      const rewards = await StakingReward.list(networkId, assetId, addressIds, startTime, endTime);

      expect(rewards).toBeDefined();
      expect(rewards.length).toEqual(20);
    });

    it("should list shared eth staking rewards via ExternalAddress", async () => {
      // May 1, 2024 - May 20, 2024
      const startTime = new Date(2024, 4, 1, 0, 0, 0).toISOString();
      const endTime = new Date(2024, 4, 20, 23, 59, 59).toISOString();

      const address = new ExternalAddress(
        Coinbase.networks.EthereumMainnet,
        process.env.STAKE_ADDRESS_ID_1 as string,
      );

      const rewards = await address.stakingRewards(Coinbase.assets.Eth, startTime, endTime);

      expect(rewards).toBeDefined();
      expect(rewards.length).toEqual(20);
    });
  });

  describe("Stake: Balance Tests", () => {
    it("should list shared eth staking balances via StakingBalance.list", async () => {
      const networkId = Coinbase.networks.EthereumMainnet;
      const assetId = Coinbase.assets.Eth;
      const addressId = process.env.STAKE_VALIDATOR_ADDRESS_1 as string;
      // Nov 1, 2024 - Nov 20, 2024
      const startTime = new Date(2024, 10, 1, 0, 0, 0).toISOString();
      const endTime = new Date(2024, 10, 20, 23, 59, 59).toISOString();
      const stakingBalances = await StakingBalance.list(
        networkId,
        assetId,
        addressId,
        startTime,
        endTime,
      );

      expect(stakingBalances).toBeDefined();
      expect(stakingBalances.length).toEqual(20);
    });
  });

  describe("Stake: Validator Tests", () => {
    it("should list validators", async () => {
      const networkId = Coinbase.networks.EthereumMainnet;
      const assetId = Coinbase.assets.Eth;
      const status = ValidatorStatus.ACTIVE;

      const validators = await Validator.list(networkId, assetId, status);

      expect(validators).toBeDefined();
      expect(validators.length).toEqual(1);
      const validator = validators[0];
      expect(validator.getStatus()).toEqual(ValidatorStatus.ACTIVE);
      expect(validator.getValidatorId()).toEqual(process.env.STAKE_VALIDATOR_ADDRESS_1 as string);
    });

    it("should fetch a validator", async () => {
      const networkId = Coinbase.networks.EthereumMainnet;
      const assetId = Coinbase.assets.Eth;
      const validatorId = process.env.STAKE_VALIDATOR_ADDRESS_1 as string;

      const validator = await Validator.fetch(networkId, assetId, validatorId);

      expect(validator).toBeDefined();
      expect(validator.getStatus()).toEqual(ValidatorStatus.ACTIVE);
      expect(validator.getValidatorId()).toEqual(validatorId);
    });
  });

  describe("Stake: Context Tests", () => {
    it("should return stakeable balances for shared ETH staking", async () => {
      const address = new ExternalAddress(
        Coinbase.networks.EthereumMainnet,
        process.env.STAKE_ADDRESS_ID_2 as string,
      );

      const stakeableBalance = await address.stakeableBalance(
        Coinbase.assets.Eth,
        StakeOptionsMode.PARTIAL,
      );

      expect(stakeableBalance).toBeDefined();
      expect(stakeableBalance.toNumber()).toBeGreaterThanOrEqual(0);
    });

    it("should return unstakeable balances for shared ETH staking", async () => {
      const address = new ExternalAddress(
        Coinbase.networks.EthereumMainnet,
        process.env.STAKE_ADDRESS_ID_1 as string,
      );

      const stakeableBalance = await address.unstakeableBalance(
        Coinbase.assets.Eth,
        StakeOptionsMode.PARTIAL,
      );

      expect(stakeableBalance).toBeDefined();
      expect(stakeableBalance.toNumber()).toBeGreaterThanOrEqual(0);
    });

    it("should return claimable balances for shared ETH staking", async () => {
      const address = new ExternalAddress(
        Coinbase.networks.EthereumMainnet,
        process.env.STAKE_ADDRESS_ID_1 as string,
      );

      const stakeableBalance = await address.claimableBalance(
        Coinbase.assets.Eth,
        StakeOptionsMode.PARTIAL,
      );

      expect(stakeableBalance).toBeDefined();
      expect(stakeableBalance.toNumber()).toBeGreaterThanOrEqual(0);
    });

    it("should return unstakeable balances for Dedicated ETH staking", async () => {
      // This address is expected to have 1 validator associated with it, thus returning a 32 unstake balance.

      const address = new ExternalAddress(
        Coinbase.networks.EthereumMainnet,
        process.env.STAKE_ADDRESS_ID_2 as string,
      );

      const stakeableBalance = await address.unstakeableBalance(
        Coinbase.assets.Eth,
        StakeOptionsMode.NATIVE,
      );

      expect(stakeableBalance).toBeDefined();
      expect(stakeableBalance.toNumber()).toBeGreaterThanOrEqual(32);
    });
  });

  describe("Stake: Build Tests", () => {
    it("should return an unsigned tx for shared ETH staking", async () => {
      const address = new ExternalAddress(
        Coinbase.networks.EthereumMainnet,
        process.env.STAKE_ADDRESS_ID_2 as string,
      );

      const stakingOperation = await address.buildStakeOperation(
        0.0001,
        Coinbase.assets.Eth,
        StakeOptionsMode.PARTIAL,
      );

      await stakingOperation.wait({ timeoutSeconds: 5, intervalSeconds: 1 });

      expect(stakingOperation).toBeDefined();
      expect(stakingOperation.getID()).toBeDefined();
      expect(stakingOperation.getStatus()).toEqual(StakingOperationStatusEnum.Complete);
      expect(stakingOperation.getAddressID()).toEqual(process.env.STAKE_ADDRESS_ID_2 as string);
      expect(stakingOperation.getNetworkID()).toEqual(Coinbase.networks.EthereumMainnet);
      expect(stakingOperation.isCompleteState()).toBe(true);
      expect(stakingOperation.getSignedVoluntaryExitMessages()).toEqual([]);
      expect(stakingOperation.getTransactions().length).toEqual(1);
      expect(stakingOperation.getTransactions()[0].isSigned()).toBe(false);
      expect(stakingOperation.getTransactions()[0].getNetworkId()).toEqual(
        Coinbase.networks.EthereumMainnet,
      );
      expect(stakingOperation.getTransactions()[0].getUnsignedPayload()).toBeDefined();
      expect(stakingOperation.getTransactions()[0].getStatus()).toEqual(TransactionStatus.PENDING);
    });
  });
});
