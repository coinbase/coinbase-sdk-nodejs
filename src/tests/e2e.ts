import fs from "fs";
import dotenv from "dotenv";
import { Coinbase, Wallet } from "../index";
import { TransferStatus } from "../coinbase/types";

describe("Coinbase SDK E2E Test", () => {
  let coinbase: Coinbase;
  beforeAll(() => {
    dotenv.config();
  });

  beforeEach(() => {
    coinbase = new Coinbase({
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
