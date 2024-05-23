import * as fs from "fs";
import * as crypto from "crypto";
import * as bip39 from "bip39";
import {
  User as UserModel,
  Wallet as WalletModel,
  Address as AddressModel,
  AddressList,
} from "./../../client/api";
import { User } from "./../user";
import { Coinbase } from "./../coinbase";
import {
  mockFn,
  walletsApiMock,
  addressesApiMock,
  newAddressModel,
  mockReturnValue,
} from "./utils";
import { SeedData, WalletData } from "./../types";
import { Wallet } from "./../wallet";
import { ArgumentError } from "../errors";

describe("User Class", () => {
  let mockUserModel: UserModel;
  let mockAddressModel: AddressModel;
  let mockWalletModel: WalletModel;
  let mockAddressList: AddressList;
  let user: User;

  beforeEach(() => {
    mockUserModel = {
      id: "12345",
    } as UserModel;
  });

  it("should initialize User instance with a valid user model and API clients, and set the user ID correctly", () => {
    const user = new User(mockUserModel);
    expect(user).toBeInstanceOf(User);
    expect(user.getId()).toBe(mockUserModel.id);
  });

  it("should return a correctly formatted string representation of the User instance", () => {
    const user = new User(mockUserModel);
    expect(user.toString()).toBe(`User{ userId: ${mockUserModel.id} }`);
  });

  describe(".importWallet", () => {
    let importedWallet: Wallet;
    let walletId: string;
    let walletData: WalletData;

    beforeAll(async () => {
      walletId = crypto.randomUUID();
      mockAddressModel = newAddressModel(walletId);
      mockAddressList = {
        data: [mockAddressModel],
        has_more: false,
        next_page: "",
        total_count: 1,
      };
      mockWalletModel = {
        id: walletId,
        network_id: Coinbase.networkList.BaseSepolia,
        default_address: mockAddressModel,
      };
      Coinbase.apiClients.wallet = walletsApiMock;
      Coinbase.apiClients.wallet!.getWallet = mockReturnValue(mockWalletModel);
      Coinbase.apiClients.address = addressesApiMock;
      Coinbase.apiClients.address!.listAddresses = mockReturnValue(mockAddressList);
      Coinbase.apiClients.address!.getAddress = mockReturnValue(mockAddressModel);
      user = new User(mockUserModel);
      walletData = { walletId: walletId, seed: bip39.generateMnemonic() };
      importedWallet = await user.importWallet(walletData);
      expect(importedWallet).toBeInstanceOf(Wallet);
      expect(Coinbase.apiClients.wallet!.getWallet).toHaveBeenCalledWith(walletId);
      expect(Coinbase.apiClients.wallet!.getWallet).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.address!.listAddresses).toHaveBeenCalledWith(walletId);
      expect(Coinbase.apiClients.address!.listAddresses).toHaveBeenCalledTimes(1);
    });

    it("should import an exported wallet", async () => {
      expect(importedWallet.getId()).toBe(walletId);
    });

    it("should load the wallet addresses", async () => {
      expect(importedWallet.defaultAddress()!.getId()).toBe(mockAddressModel.address_id);
    });

    it("should contain the same seed when re-exported", async () => {
      expect(importedWallet.export().seed!).toBe(walletData.seed);
    });
  });

  describe(".saveWallet", () => {
    let seed: string;
    let walletId: string;
    let mockSeedWallet: Wallet;
    let savedWallet: Wallet;

    beforeAll(async () => {
      walletId = crypto.randomUUID();
      seed = "86fc9fba421dcc6ad42747f14132c3cd975bd9fb1454df84ce5ea554f2542fbe";
      mockAddressModel = {
        address_id: "0xdeadbeef",
        wallet_id: walletId,
        public_key: "0x1234567890",
        network_id: Coinbase.networkList.BaseSepolia,
      };
      mockWalletModel = {
        id: walletId,
        network_id: Coinbase.networkList.BaseSepolia,
        default_address: mockAddressModel,
      };
      user = new User(mockUserModel);
      Coinbase.apiClients.address = addressesApiMock;
      Coinbase.apiClients.address!.getAddress = mockReturnValue(mockAddressModel);
      Coinbase.backupFilePath = crypto.randomUUID() + ".json";
      Coinbase.apiKeyPrivateKey = crypto.generateKeyPairSync("ec", {
        namedCurve: "prime256v1",
        privateKeyEncoding: { type: "pkcs8", format: "pem" },
        publicKeyEncoding: { type: "spki", format: "pem" },
      }).privateKey;
      mockSeedWallet = await Wallet.init(mockWalletModel, seed, [mockAddressModel]);
    });

    afterEach(async () => {
      fs.unlinkSync(Coinbase.backupFilePath);
    });

    it("should save the Wallet data when encryption is false", async () => {
      savedWallet = user.saveWallet(mockSeedWallet);
      expect(savedWallet).toBe(mockSeedWallet);
      const storedSeedData = fs.readFileSync(Coinbase.backupFilePath);
      const walletSeedData = JSON.parse(storedSeedData.toString());
      expect(walletSeedData[walletId].encrypted).toBe(false);
      expect(walletSeedData[walletId].iv).toBe("");
      expect(walletSeedData[walletId].authTag).toBe("");
      expect(walletSeedData[walletId].seed).toBe(seed);
    });

    it("should save the Wallet data when encryption is true", async () => {
      savedWallet = user.saveWallet(mockSeedWallet, true);
      expect(savedWallet).toBe(mockSeedWallet);
      const storedSeedData = fs.readFileSync(Coinbase.backupFilePath);
      const walletSeedData = JSON.parse(storedSeedData.toString());
      expect(walletSeedData[walletId].encrypted).toBe(true);
      expect(walletSeedData[walletId].iv).toBeTruthy();
      expect(walletSeedData[walletId].authTag).toBeTruthy();
      expect(walletSeedData[walletId].seed).not.toBe(seed);
    });

    it("should throw an error when the existing file is malformed", async () => {
      fs.writeFileSync(
        Coinbase.backupFilePath,
        JSON.stringify({ malformed: "test" }, null, 2),
        "utf8",
      );
      expect(() => user.saveWallet(mockSeedWallet)).toThrow(ArgumentError);
    });
  });

  describe(".loadWallets", () => {
    let mockUserModel: UserModel;
    let user: User;
    let walletId: string;
    let addressModel: AddressModel;
    let walletModelWithDefaultAddress: WalletModel;
    let addressListModel: AddressList;
    let initialSeedData: Record<string, SeedData>;
    let malformedSeedData: Record<string, any>;
    let seedDataWithoutSeed: Record<string, any>;
    let seedDataWithoutIv: Record<string, any>;
    let seedDataWithoutAuthTag: Record<string, any>;

    beforeAll(() => {
      walletId = crypto.randomUUID();
      addressModel = newAddressModel(walletId);
      walletModelWithDefaultAddress = {
        id: walletId,
        network_id: Coinbase.networkList.BaseSepolia,
        default_address: addressModel,
      };
      addressListModel = {
        data: [addressModel],
        has_more: false,
        next_page: "",
        total_count: 1,
      };
      Coinbase.apiClients.wallet = walletsApiMock;
      Coinbase.apiClients.address = addressesApiMock;
      Coinbase.backupFilePath = `${crypto.randomUUID()}.json`;
      Coinbase.apiKeyPrivateKey = crypto.generateKeyPairSync("ec", {
        namedCurve: "prime256v1",
        privateKeyEncoding: { type: "pkcs8", format: "pem" },
        publicKeyEncoding: { type: "spki", format: "pem" },
      }).privateKey;
      mockUserModel = {
        id: "12345",
      } as UserModel;

      initialSeedData = {
        [walletId]: {
          seed: "86fc9fba421dcc6ad42747f14132c3cd975bd9fb1454df84ce5ea554f2542fbe",
          encrypted: false,
          iv: "",
          authTag: "",
        },
      };
      malformedSeedData = {
        [walletId]: "test",
      };
      seedDataWithoutSeed = {
        [walletId]: {
          seed: "",
          encrypted: false,
        },
      };
      seedDataWithoutIv = {
        [walletId]: {
          seed: "86fc9fba421dcc6ad42747f14132c3cd975bd9fb1454df84ce5ea554f2542fbe",
          encrypted: true,
          iv: "",
          auth_tag: "0x111",
        },
      };
      seedDataWithoutAuthTag = {
        [walletId]: {
          seed: "86fc9fba421dcc6ad42747f14132c3cd975bd9fb1454df84ce5ea554f2542fbe",
          encrypted: true,
          iv: "0x111",
          auth_tag: "",
        },
      };
    });

    beforeEach(() => {
      user = new User(mockUserModel);
      fs.writeFileSync(Coinbase.backupFilePath, JSON.stringify(initialSeedData, null, 2));
    });

    afterEach(() => {
      if (fs.existsSync(Coinbase.backupFilePath)) {
        fs.unlinkSync(Coinbase.backupFilePath);
      }
    });

    it("loads the Wallet from backup", async () => {
      Coinbase.apiClients.wallet = walletsApiMock;
      Coinbase.apiClients.wallet!.getWallet = mockReturnValue(walletModelWithDefaultAddress);
      Coinbase.apiClients.address = addressesApiMock;
      Coinbase.apiClients.address!.listAddresses = mockReturnValue(addressListModel);
      Coinbase.apiClients.address!.getAddress = mockReturnValue(addressModel);

      const wallets = await user.loadWallets();
      const wallet = wallets[walletId];
      expect(wallet).not.toBeNull();
      expect(wallet.getId()).toBe(walletId);
      expect(wallet.defaultAddress()?.getId()).toBe(addressModel.address_id);
    });

    it("throws an error when the backup file is absent", async () => {
      fs.unlinkSync(Coinbase.backupFilePath);
      await expect(user.loadWallets()).rejects.toThrow(new ArgumentError("Backup file not found"));
    });

    it("throws an error when the backup file is corrupted", async () => {
      fs.writeFileSync(Coinbase.backupFilePath, JSON.stringify(malformedSeedData, null, 2));
      await expect(user.loadWallets()).rejects.toThrow(new ArgumentError("Malformed backup data"));
    });

    it("throws an error when backup does not contain seed", async () => {
      fs.writeFileSync(Coinbase.backupFilePath, JSON.stringify(seedDataWithoutSeed, null, 2));
      await expect(user.loadWallets()).rejects.toThrow(new ArgumentError("Malformed backup data"));
    });

    it("throws an error when backup does not contain iv", async () => {
      fs.writeFileSync(Coinbase.backupFilePath, JSON.stringify(seedDataWithoutIv, null, 2));
      await expect(user.loadWallets()).rejects.toThrow(new ArgumentError("Malformed backup data"));
    });

    it("throws an error when backup does not contain auth_tag", async () => {
      fs.writeFileSync(Coinbase.backupFilePath, JSON.stringify(seedDataWithoutAuthTag, null, 2));
      await expect(user.loadWallets()).rejects.toThrow(new ArgumentError("Malformed backup data"));
    });
  });
});
