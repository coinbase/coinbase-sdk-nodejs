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
    it("should return a Wallet instance", async () => {
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
      Coinbase.apiClients.address!.createAddress = mockReturnValue(newAddressModel(walletId));
      
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
    let walletModel: WalletModel;
    let seedWallet: Wallet;

    beforeEach(() => {
      const addressModel = newAddressModel(walletId);
      walletModel = {
        id: walletId,
        network_id: Coinbase.networks.BaseSepolia,
        default_address: addressModel,
        feature_set: {} as FeatureSet,
      };
      Coinbase.apiClients.address!.getAddress = mockFn(() => {
        return { data: addressModel };
      });
      seedWallet = Wallet.init(walletModel, existingSeed);
    });

    it("exports the Wallet data", () => {
      const walletData = seedWallet.export();
      expect(walletData.walletId).toBe(seedWallet.getId());
      expect(walletData.seed).toBe(existingSeed);
    });

    it("allows for re-creation of a Wallet", () => {
      const walletData = seedWallet.export();
      const newWallet = Wallet.init(walletModel, walletData.seed);
      expect(newWallet).toBeInstanceOf(Wallet);
    });

    it("throws an error when the Wallet is seedless", () => {
      const seedlessWallet = Wallet.init(walletModel, "");
      expect(() => seedlessWallet.export()).toThrow(Error);
    });

    it("should be able to be imported", async () => {
      const walletData = seedWallet.export();
      Coinbase.apiClients.address!.listAddresses = mockFn(() => {
        return {
          data: {
            data: [newAddressModel(walletId)],
          },
        };
      });
      const importedWallet = await Wallet.import(walletData);
      expect(importedWallet).toBeInstanceOf(Wallet);
      expect(Coinbase.apiClients.address!.listAddresses).toHaveBeenCalledTimes(1);
    });

    it("should throw an error when walletId is not provided", async () => {
      const walletData = seedWallet.export();
      walletData.walletId = "";
      await expect(async () => await Wallet.import(walletData)).rejects.toThrow(
        "Wallet ID must be provided",
      );
    });
  });

  describe("#saveSeed", () => {
    let apiPrivateKey: string;
    const filePath = "seeds.json";
    let seedWallet: Wallet;

    beforeEach(() => {
      apiPrivateKey = Coinbase.apiKeyPrivateKey;
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
      Coinbase.apiKeyPrivateKey = apiPrivateKey;
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
    let apiPrivateKey: string;
    const filePath = "seeds.json";
    let seedWallet: Wallet;
    let seedlessWallet: Wallet;

    beforeEach(() => {
      apiPrivateKey = Coinbase.apiKeyPrivateKey;
      Coinbase.apiKeyPrivateKey = crypto.generateKeyPairSync("ec", {
        namedCurve: "prime256v1",
        privateKeyEncoding: { type: "pkcs8", format: "pem" },
        publicKeyEncoding: { type: "spki", format: "pem" },
      }).privateKey;

      const initialSeedData = {
        [walletId]: {
          encrypted: false,
          iv: "",
          authTag: "",
          seed: existingSeed,
        },
      };
      fs.writeFileSync(filePath, JSON.stringify(initialSeedData), "utf8");
      seedWallet = Wallet.init({
        id: walletId,
        network_id: Coinbase.networks.BaseSepolia,
        default_address: newAddressModel(walletId),
        feature_set: {} as FeatureSet,
      }, existingSeed);
      seedlessWallet = Wallet.init({
        id: walletId,
        network_id: Coinbase.networks.BaseSepolia,
        default_address: newAddressModel(walletId),
        feature_set: {} as FeatureSet,
      }, "");
    });

    afterEach(() => {
      fs.unlinkSync(filePath);
      Coinbase.apiKeyPrivateKey = apiPrivateKey;
    });

    it("loads the seed from the file", async () => {
      await seedlessWallet.loadSeed(filePath);
      expect(seedlessWallet.canSign()).toBe(true);
    });

    it("loads the encrypted seed from the file", async () => {
      seedWallet.saveSeed(filePath, true);
      await seedlessWallet.loadSeed(filePath);
      expect(seedlessWallet.canSign()).toBe(true);
    });

    it("loads the encrypted seed from the file with multiple seeds", async () => {
      seedWallet.saveSeed(filePath, true);

      const otherWalletId = crypto.randomUUID();
      const otherModel = {
        id: otherWalletId,
        network_id: Coinbase.networks.BaseSepolia,
        default_address: newAddressModel(otherWalletId),
        feature_set: {} as FeatureSet,
      };
      const randomSeed = ethers.Wallet.createRandom().privateKey.slice(2);
      const otherWallet = Wallet.init(otherModel, randomSeed);
      otherWallet.saveSeed(filePath, true);

      await seedlessWallet.loadSeed(filePath);
      expect(seedlessWallet.canSign()).toBe(true);
    });

    it("raises an error if the wallet is already hydrated", async () => {
      await expect(seedWallet.loadSeed(filePath)).rejects.toThrow(Error);
    });

    it("raises an error when file contains different wallet data", async () => {
      const otherSeedData = {
        [crypto.randomUUID()]: {
          encrypted: false,
          iv: "",
          authTag: "",
          seed: existingSeed,
        },
      };
      fs.writeFileSync(filePath, JSON.stringify(otherSeedData), "utf8");

      await expect(seedlessWallet.loadSeed(filePath)).rejects.toThrow(ArgumentError);
    });

    it("raises an error when the file is absent", async () => {
      await expect(seedlessWallet.loadSeed("non-file.json")).rejects.toThrow(ArgumentError);
    });

    it("raises an error when the file is corrupted", async () => {
      fs.writeFileSync(filePath, "corrupted data", "utf8");

      await expect(seedlessWallet.loadSeed(filePath)).rejects.toThrow(ArgumentError);
    });

    it("throws an error when the file is empty", async () => {
      fs.writeFileSync("invalid-file.json", "", "utf8");
      await expect(seedlessWallet.loadSeed("invalid-file.json")).rejects.toThrow(ArgumentError);
      fs.unlinkSync("invalid-file.json");
    });

    it("throws an error when the file is not a valid JSON", async () => {
      fs.writeFileSync("invalid-file.json", `{"test":{"authTag":false}}`, "utf8");
      await expect(seedlessWallet.loadSeed("invalid-file.json")).rejects.toThrow(ArgumentError);
      fs.unlinkSync("invalid-file.json");
    });
  });
});