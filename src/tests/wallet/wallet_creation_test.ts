import * as fs from "fs";
import crypto from "crypto";
import { ethers } from "ethers";
import { Coinbase } from "../../coinbase/coinbase";
import { Wallet } from "../../coinbase/wallet";
import { ServerSignerStatus } from "../../coinbase/types";
import { FeatureSet } from "../../client";
import {
  VALID_WALLET_MODEL,
  walletsApiMock,
  addressesApiMock,
  mockReturnValue,
  newAddressModel,
  mockFn,
  generateWalletFromSeed,
} from "../utils";
import { ArgumentError } from "../../coinbase/errors";
import {
  Address as AddressModel,
  Wallet as WalletModel,
} from "../../client";

describe("Wallet Creation", () => {
  let walletId: string;
  let existingSeed: string;
  let address1: string;
  let address2: string;
  let wallet1PrivateKey: string;
  let wallet2PrivateKey: string;

  beforeEach(() => {
    jest.clearAllMocks();
    walletId = crypto.randomUUID();
    existingSeed = "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";
    ({ address1, address2, wallet1PrivateKey, wallet2PrivateKey } = generateWalletFromSeed(existingSeed, 2));
    Coinbase.apiClients.wallet = walletsApiMock;
    Coinbase.apiClients.address = addressesApiMock;
  });

  describe(".create", () => {
    beforeEach(() => {
      jest.spyOn(ethers.Wallet, "createRandom").mockReturnValue({
        privateKey: `0x${existingSeed}`,
      } as never);

      Coinbase.apiClients.wallet!.createWallet = mockFn(request => {
        const { network_id } = request.wallet;
        return { 
          data: {
            id: walletId,
            network_id,
            default_address: newAddressModel(walletId),
          }
        };
      });

      Coinbase.apiClients.wallet!.getWallet = mockFn(walletId => {
        const walletModel = {
          id: walletId,
          network_id: Coinbase.networks.BaseSepolia,
          default_address: newAddressModel(walletId),
        };
        walletModel.default_address!.address_id = address1;
        return { data: walletModel };
      });

      Coinbase.apiClients.address!.createAddress = mockFn(walletId => {
        return { data: newAddressModel(walletId) };
      });
    });

    it("should return a Wallet instance", async () => {
      const wallet = await Wallet.create();
      expect(wallet).toBeInstanceOf(Wallet);
      expect(wallet.getId()).toBe(walletId);
    });

    it("should change the network ID", async () => {
      Coinbase.apiClients.wallet!.createWallet = mockReturnValue({
        ...VALID_WALLET_MODEL,
        network_id: Coinbase.networks.BaseMainnet,
        server_signer_status: ServerSignerStatus.PENDING,
      });
      Coinbase.apiClients.wallet!.getWallet = mockReturnValue({
        ...VALID_WALLET_MODEL,
        network_id: Coinbase.networks.BaseMainnet,
        server_signer_status: ServerSignerStatus.ACTIVE,
      });
      
      const wallet = await Wallet.create({
        networkId: Coinbase.networks.BaseMainnet,
      });
      
      expect(wallet.getNetworkId()).toBe(Coinbase.networks.BaseMainnet);
    });

    describe("when using a server signer", () => {
      beforeEach(() => {
        Coinbase.useServerSigner = true;
      });

      afterEach(() => {
        Coinbase.useServerSigner = false;
      });

      it("should return a Wallet instance", async () => {
        Coinbase.apiClients.wallet!.createWallet = mockReturnValue({
          ...VALID_WALLET_MODEL,
          server_signer_status: ServerSignerStatus.PENDING,
        });
        Coinbase.apiClients.wallet!.getWallet = mockReturnValue({
          ...VALID_WALLET_MODEL,
          server_signer_status: ServerSignerStatus.ACTIVE,
        });
        Coinbase.apiClients.address!.createAddress = mockReturnValue(newAddressModel(walletId));

        const wallet = await Wallet.create();
        expect(wallet).toBeInstanceOf(Wallet);
        expect(wallet.getServerSignerStatus()).toBe(ServerSignerStatus.ACTIVE);
        expect(Coinbase.apiClients.wallet!.createWallet).toHaveBeenCalledTimes(1);
        expect(Coinbase.apiClients.wallet!.getWallet).toHaveBeenCalledTimes(2);
        expect(Coinbase.apiClients.address!.createAddress).toHaveBeenCalledTimes(1);
      });

      it("should throw an Error if the Wallet times out waiting on a not active server signer", async () => {
        const intervalSeconds = 0.000002;
        const timeoutSeconds = 0.000002;
        Coinbase.apiClients.wallet!.getWallet = mockReturnValue({
          ...VALID_WALLET_MODEL,
          server_signer_status: ServerSignerStatus.PENDING,
        });

        await expect(Wallet.create({ timeoutSeconds, intervalSeconds })).rejects.toThrow(
          "Wallet creation timed out. Check status of your Server-Signer",
        );
        expect(Coinbase.apiClients.wallet!.createWallet).toHaveBeenCalledTimes(1);
        expect(Coinbase.apiClients.wallet!.getWallet).toHaveBeenCalled();
      });
    });
  });

  describe(".init", () => {
    let addressList: AddressModel[];
    let walletModel: WalletModel;

    beforeEach(() => {
      addressList = [
        {
          address_id: address1,
          network_id: Coinbase.networks.BaseSepolia,
          public_key: wallet1PrivateKey,
          wallet_id: walletId,
          index: 0,
        },
        {
          address_id: address2,
          network_id: Coinbase.networks.BaseSepolia,
          public_key: wallet2PrivateKey,
          wallet_id: walletId,
          index: 1,
        },
      ];
      walletModel = {
        id: walletId,
        network_id: Coinbase.networks.BaseSepolia,
        default_address: addressList[0],
        feature_set: {} as FeatureSet,
      };
    });

    it("should return a Wallet instance", () => {
      const wallet = Wallet.init(walletModel, existingSeed);
      expect(wallet).toBeInstanceOf(Wallet);
    });

    it("should return the correct wallet ID", () => {
      const wallet = Wallet.init(walletModel, existingSeed);
      expect(wallet.getId()).toBe(walletModel.id);
    });

    it("should return the correct network ID", () => {
      const wallet = Wallet.init(walletModel, existingSeed);
      expect(wallet.getNetworkId()).toBe(Coinbase.networks.BaseSepolia);
    });

    it("should return the correct string representation", () => {
      const wallet = Wallet.init(walletModel, existingSeed);
      expect(wallet.toString()).toBe(
        `Wallet{id: '${walletModel.id}', networkId: '${Coinbase.networks.BaseSepolia}'}`,
      );
    });

    it("should raise an error when the seed is invalid", () => {
      const newWallet = Wallet.init(walletModel, "");
      expect(() => newWallet.setSeed(``)).toThrow(ArgumentError);
      expect(() => newWallet.setSeed(`invalid-seed`)).toThrow(ArgumentError);
    });
  });

  describe("#export", () => {
    let wallet: Wallet;
    const walletId = "test-wallet-id";
    const publicKey = "some-public-key";
    beforeEach(() => {
      const walletModel: WalletModel = {
        id: walletId,
        network_id: Coinbase.networks.BaseSepolia,
        default_address: {
          wallet_id: walletId,
          network_id: Coinbase.networks.BaseSepolia,
          public_key: publicKey,
          address_id: address1,
          index: 0,
        },
        feature_set: {} as FeatureSet,
      };
      wallet = Wallet.init(walletModel, existingSeed);
    });

    it("should export the wallet data correctly", () => {
      const exportedData = wallet.export();
      expect(exportedData).toEqual({
        walletId: walletId,
        seed: existingSeed,
      });
    });

    it("should throw an error when exporting a wallet without a seed", () => {
      const seedlessWalletModel: WalletModel = {
        id: "seedless-wallet-id",
        network_id: Coinbase.networks.BaseSepolia,
        default_address: {
          wallet_id: "test-wallet-id",
          network_id: Coinbase.networks.BaseSepolia,
          public_key: publicKey,
          address_id: address1,
          index: 0,
        },
        feature_set: {} as FeatureSet,
      };
      const seedlessWallet = Wallet.init(seedlessWalletModel, "");

      expect(() => seedlessWallet.export()).toThrow("Cannot export Wallet without loaded seed");
    });

    it("should export different wallets with different data", () => {
      const anotherWalletModel: WalletModel = {
        id: "another-wallet-id",
        network_id: Coinbase.networks.BaseMainnet,
        default_address: {
          wallet_id: "another-wallet-id",
          network_id: Coinbase.networks.BaseMainnet,
          public_key: publicKey,
          address_id: address2,
          index: 1,
        },
        feature_set: {} as FeatureSet,
      };
      const anotherSeed = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
      const anotherWallet = Wallet.init(anotherWalletModel, anotherSeed);

      const exportedData1 = wallet.export();
      const exportedData2 = anotherWallet.export();

      expect(exportedData1).not.toEqual(exportedData2);
      expect(exportedData1.walletId).toBe(walletId);
      expect(exportedData1.seed).toBe(existingSeed);
      expect(exportedData2.walletId).toBe("another-wallet-id");
      expect(exportedData2.seed).toBe(anotherSeed);
    });

    it("should not expose any additional wallet data", () => {
      const exportedData = wallet.export();
      expect(Object.keys(exportedData)).toHaveLength(2);
      expect(Object.keys(exportedData)).toEqual(expect.arrayContaining(['walletId', 'seed']));
    });
  });
  
  describe("#saveSeed", () => {
    const filePath = "seeds.json";
    let seedWallet: Wallet;

    beforeEach(() => {
      Coinbase.apiKeyPrivateKey = crypto.generateKeyPairSync("ec", {
        namedCurve: "prime256v1",
        privateKeyEncoding: { type: "pkcs8", format: "pem" },
        publicKeyEncoding: { type: "spki", format: "pem" },
      }).privateKey;
      fs.writeFileSync(filePath, JSON.stringify({}), "utf8");
      seedWallet = Wallet.init({
        id: walletId,
        network_id: Coinbase.networks.BaseSepolia,
        default_address: newAddressModel(walletId),
        feature_set: {} as FeatureSet,
      }, existingSeed);
    });

    afterEach(() => {
      fs.unlinkSync(filePath);
    });

    it("should save the seed when encryption is false", () => {
      seedWallet.saveSeed(filePath, false);
      const storedSeedData = fs.readFileSync(filePath);
      const walletSeedData = JSON.parse(storedSeedData.toString());
      expect(walletSeedData[walletId].encrypted).toBe(false);
      expect(walletSeedData[walletId].iv).toBe("");
      expect(walletSeedData[walletId].authTag).toBe("");
      expect(walletSeedData[walletId].seed).toBe(existingSeed);
    });

    it("should save the seed when encryption is true", () => {
      seedWallet.saveSeed(filePath, true);
      const storedSeedData = fs.readFileSync(filePath);
      const walletSeedData = JSON.parse(storedSeedData.toString());
      expect(walletSeedData[walletId].encrypted).toBe(true);
      expect(walletSeedData[walletId].iv).not.toBe("");
      expect(walletSeedData[walletId].authTag).not.toBe("");
      expect(walletSeedData[walletId].seed).not.toBe(existingSeed);
    });

    it("should throw an error when the wallet is seedless", () => {
      const seedlessWallet = Wallet.init({
        id: walletId,
        network_id: Coinbase.networks.BaseSepolia,
        default_address: newAddressModel(walletId),
        feature_set: {} as FeatureSet,
      }, "");
      expect(() => seedlessWallet.saveSeed(filePath, false)).toThrow(Error);
    });
  });

  describe("#loadSeed", () => {
    const filePath = "test_seeds.json";
    let seedWallet: Wallet;
    let seedlessWallet: Wallet;

    beforeEach(() => {
      // Setup mock for Coinbase.apiKeyPrivateKey
      Coinbase.apiKeyPrivateKey = crypto.generateKeyPairSync("ec", {
        namedCurve: "prime256v1",
        privateKeyEncoding: { type: "pkcs8", format: "pem" },
        publicKeyEncoding: { type: "spki", format: "pem" },
      }).privateKey;

      // Create a wallet model
      const walletModel: WalletModel = {
        id: walletId,
        network_id: Coinbase.networks.BaseSepolia,
        default_address: newAddressModel(walletId),
        feature_set: {} as FeatureSet,
      };

      // Initialize wallets
      seedWallet = Wallet.init(walletModel, existingSeed);
      seedlessWallet = Wallet.init(walletModel, "");

      // Generate the correct address from the seed
      const hdNode = ethers.HDNodeWallet.fromSeed(Buffer.from(existingSeed, 'hex'));
      const derivedAddress = hdNode.derivePath("m/44'/60'/0'/0/0").address;

      // Mock the listAddresses API call with the correct address
      Coinbase.apiClients.address!.listAddresses = jest.fn().mockResolvedValue({
        data: {
          data: [{
            ...newAddressModel(walletId),
            address_id: derivedAddress,
          }],
          has_more: false,
          next_page: "",
        },
      });

      // Create a seed file
      const seedData = {
        [walletId]: {
          encrypted: false,
          iv: "",
          authTag: "",
          seed: existingSeed,
        },
      };
      fs.writeFileSync(filePath, JSON.stringify(seedData), "utf8");
    });

    afterEach(() => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    it("should load an unencrypted seed from file", async () => {
      await seedlessWallet.loadSeed(filePath);
      expect(seedlessWallet.canSign()).toBe(true);
      expect(Coinbase.apiClients.address!.listAddresses).toHaveBeenCalledTimes(1);
    });

    it("should load an encrypted seed from file", async () => {
      // Save an encrypted seed
      seedWallet.saveSeed(filePath, true);
      
      await seedlessWallet.loadSeed(filePath);
      expect(seedlessWallet.canSign()).toBe(true);
      expect(Coinbase.apiClients.address!.listAddresses).toHaveBeenCalledTimes(1);
    });

    it("should throw an error when trying to load a seed for an already seeded wallet", async () => {
      await expect(seedWallet.loadSeed(filePath)).rejects.toThrow("Seed is already set");
    });

    it("should throw an error when the file doesn't contain data for the wallet", async () => {
      const differentWalletId = "different-wallet-id";
      const differentSeedData = {
        [differentWalletId]: {
          encrypted: false,
          iv: "",
          authTag: "",
          seed: existingSeed,
        },
      };
      fs.writeFileSync(filePath, JSON.stringify(differentSeedData), "utf8");

      await expect(seedlessWallet.loadSeed(filePath)).rejects.toThrow(
        `File ${filePath} does not contain seed data for wallet ${walletId}`
      );
    });

    it("should throw an error when the file doesn't exist", async () => {
      const nonExistentFile = "non_existent_file.json";
      await expect(seedlessWallet.loadSeed(nonExistentFile)).rejects.toThrow(
        `File ${nonExistentFile} does not contain any seed data`
      );
    });

    it("should throw an error when the file contains invalid JSON", async () => {
      fs.writeFileSync(filePath, "invalid json", "utf8");
      await expect(seedlessWallet.loadSeed(filePath)).rejects.toThrow("Malformed backup data");
    });

    it("should throw an error when the seed data is malformed", async () => {
      const malformedSeedData = {
        [walletId]: {
          encrypted: false,
          iv: "",
          authTag: "",
          // Missing seed property
        },
      };
      fs.writeFileSync(filePath, JSON.stringify(malformedSeedData), "utf8");

      await expect(seedlessWallet.loadSeed(filePath)).rejects.toThrow("Malformed backup data");
    });
  });
});