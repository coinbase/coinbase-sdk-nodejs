import fs from "fs";
import dotenv from "dotenv";
import { Coinbase } from "../coinbase";
import { TransferStatus } from "../types";

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
    console.log("Fetching default user...");
    const user = await coinbase.getDefaultUser();
    expect(user.getId()).toBeDefined();
    console.log(`Fetched default user with ID: ${user.getId()}`);

    console.log("Creating new wallet...");
    const wallet = await user.createWallet();
    expect(wallet?.getId()).toBeDefined();
    console.log(
      `Created new wallet with ID: ${wallet.getId()}, default address: ${wallet.getDefaultAddress()}`,
    );

    console.log("Importing wallet with balance...");
    const seedFile = JSON.parse(process.env.WALLET_DATA || "");
    const walletId = Object.keys(seedFile)[0];
    const seed = seedFile[walletId].seed;

    const userWallet = await user.importWallet({ seed, walletId });
    expect(userWallet).toBeDefined();
    expect(userWallet.getId()).toBe(walletId);
    console.log(
      `Imported wallet with ID: ${userWallet.getId()}, default address: ${userWallet.getDefaultAddress()}`,
    );
    await userWallet.saveSeed("test_seed.json");

    try {
      await userWallet.faucet();
    } catch {
      console.log("Faucet request failed. Skipping...");
    }
    console.log("Listing wallet addresses...");
    const addresses = userWallet.listAddresses();
    expect(addresses.length).toBeGreaterThan(0);
    console.log(`Listed addresses: ${userWallet.listAddresses().join(", ")}`);

    console.log("Fetching wallet balances...");
    const balances = await userWallet.listBalances();
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

    const unhydratedWallet = await user.getWallet(walletId);
    expect(unhydratedWallet.canSign()).toBe(false);
    await unhydratedWallet.loadSeed("test_seed.json");
    expect(unhydratedWallet.canSign()).toBe(true);
    expect(unhydratedWallet.getId()).toBe(walletId);

    console.log("Transfering 1 Gwei from default address to second address...");
    const transfer = await unhydratedWallet.createTransfer(1, Coinbase.assets.Gwei, wallet);
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
