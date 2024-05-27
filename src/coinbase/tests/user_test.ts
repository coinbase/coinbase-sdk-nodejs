import * as crypto from "crypto";
import * as fs from "fs";
import { ArgumentError, InternalError } from "../errors";
import {
  AddressBalanceList,
  AddressList,
  Address as AddressModel,
  Balance as BalanceModel,
  User as UserModel,
  Wallet as WalletModel,
} from "./../../client/api";
import { Coinbase } from "./../coinbase";
import { SeedData, WalletData } from "./../types";
import { User } from "./../user";
import { Wallet } from "./../wallet";
import {
  addressesApiMock,
  generateRandomHash,
  generateWalletFromSeed,
  mockReturnRejectedValue,
  mockReturnValue,
  newAddressModel,
  walletsApiMock,
} from "./utils";
import Decimal from "decimal.js";
import { FaucetTransaction } from "../faucet_transaction";

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
      walletData = {
        walletId: walletId,
        seed: "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f",
      };
      const { address1 } = generateWalletFromSeed(walletData.seed);
      mockAddressModel = newAddressModel(walletId, address1);
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
      user = new User(mockUserModel);
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
      expect(importedWallet.getDefaultAddress()!.getId()).toBe(mockAddressModel.address_id);
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
      const { address1, wallet1PrivateKey } = generateWalletFromSeed(seed);
      mockAddressModel = {
        address_id: address1,
        wallet_id: walletId,
        public_key: wallet1PrivateKey,
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
    let malformedSeedData: Record<string, string>;
    let seedDataWithoutSeed: Record<string, object>;
    let seedDataWithoutIv: Record<string, object>;
    let seedDataWithoutAuthTag: Record<string, object>;

    beforeAll(() => {
      walletId = crypto.randomUUID();
      addressModel = newAddressModel(walletId);
      addressModel.address_id = "0xB1666C6cDDB29468f721f3A4881a6e95CC963849";
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
      const seed = "86fc9fba421dcc6ad42747f14132c3cd975bd9fb1454df84ce5ea554f2542fbe";
      const { address1, address2 } = generateWalletFromSeed(seed);
      const addressModel1: AddressModel = newAddressModel(walletId, address1);
      const addressModel2: AddressModel = newAddressModel(walletId, address2);
      walletModelWithDefaultAddress = {
        id: walletId,
        network_id: Coinbase.networkList.BaseSepolia,
        default_address: addressModel1,
      };
      addressListModel = {
        data: [addressModel1, addressModel2],
        has_more: false,
        next_page: "",
        total_count: 2,
      };

      Coinbase.apiClients.wallet = walletsApiMock;
      Coinbase.apiClients.wallet!.getWallet = mockReturnValue(walletModelWithDefaultAddress);
      Coinbase.apiClients.address = addressesApiMock;
      Coinbase.apiClients.address!.listAddresses = mockReturnValue(addressListModel);

      const wallets = await user.loadWallets();
      const wallet = wallets[walletId];
      expect(wallet).not.toBeNull();
      expect(wallet.getId()).toBe(walletId);
      expect(wallet.getDefaultAddress()?.getId()).toBe(addressModel1.address_id);
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

  describe(".listWallets", () => {
    let user: User;
    let walletId: string;
    let walletModelWithDefaultAddress: WalletModel;
    let addressListModel: AddressList;
    const seed = "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";

    beforeEach(() => {
      jest.clearAllMocks();
      walletId = crypto.randomUUID();
      const { address1 } = generateWalletFromSeed(seed);
      mockAddressModel = newAddressModel(walletId, address1);

      const addressModel1: AddressModel = newAddressModel(walletId);
      const addressModel2: AddressModel = newAddressModel(walletId);
      walletModelWithDefaultAddress = {
        id: walletId,
        network_id: Coinbase.networkList.BaseSepolia,
        default_address: addressModel1,
      };
      addressListModel = {
        data: [addressModel1, addressModel2],
        has_more: false,
        next_page: "",
        total_count: 1,
      };
      Coinbase.apiClients.wallet = walletsApiMock;
      Coinbase.apiClients.address = addressesApiMock;
      const mockUserModel: UserModel = {
        id: "12345",
      } as UserModel;
      user = new User(mockUserModel);
    });

    it("should raise an error when the Wallet API call fails", async () => {
      Coinbase.apiClients.wallet!.listWallets = mockReturnRejectedValue(new Error("API Error"));
      await expect(user.listWallets()).rejects.toThrow(new Error("API Error"));
      expect(Coinbase.apiClients.wallet!.listWallets).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.address!.listAddresses).toHaveBeenCalledTimes(0);
      expect(Coinbase.apiClients.wallet!.listWallets).toHaveBeenCalledWith(10, undefined);
    });

    it("should raise an error when the Address API call fails", async () => {
      Coinbase.apiClients.wallet!.listWallets = mockReturnValue({
        data: [walletModelWithDefaultAddress],
        has_more: false,
        next_page: "",
        total_count: 1,
      });
      Coinbase.apiClients.address!.listAddresses = mockReturnRejectedValue(new Error("API Error"));
      await expect(user.listWallets()).rejects.toThrow(new Error("API Error"));
      expect(Coinbase.apiClients.wallet!.listWallets).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.address!.listAddresses).toHaveBeenCalledTimes(1);
    });

    it("should return an empty list of Wallets when the User has no Wallets", async () => {
      Coinbase.apiClients.wallet!.listWallets = mockReturnValue({
        data: [],
        has_more: false,
        next_page: "",
        total_count: 0,
      });
      const wallets = await user.listWallets();
      expect(wallets.length).toBe(0);
      expect(Coinbase.apiClients.wallet!.listWallets).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.address!.listAddresses).toHaveBeenCalledTimes(0);
    });

    it("should return the list of Wallets", async () => {
      const { address1 } = generateWalletFromSeed(seed);
      mockAddressModel = newAddressModel(walletId, address1);

      Coinbase.apiClients.wallet!.listWallets = mockReturnValue({
        data: [walletModelWithDefaultAddress],
        has_more: false,
        next_page: "",
        total_count: 1,
      });
      Coinbase.apiClients.address!.listAddresses = mockReturnValue(addressListModel);
      const wallets = await user.listWallets();
      expect(wallets[0]).toBeInstanceOf(Wallet);
      expect(wallets.length).toBe(1);
      expect(wallets[0].getId()).toBe(walletId);
      expect(wallets[0].listAddresses().length).toBe(2);
      expect(Coinbase.apiClients.wallet!.listWallets).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.address!.listAddresses).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.address!.listAddresses).toHaveBeenCalledWith(
        walletId,
        Wallet.MAX_ADDRESSES,
      );
      expect(Coinbase.apiClients.wallet!.listWallets).toHaveBeenCalledWith(10, undefined);
    });

    it("should create Wallets when seed is provided", async () => {
      const { address1 } = generateWalletFromSeed(seed);
      mockAddressModel = newAddressModel(walletId, address1);
      Coinbase.apiClients.wallet!.listWallets = mockReturnValue({
        data: [walletModelWithDefaultAddress],
        has_more: false,
        next_page: "",
        total_count: 1,
      });
      Coinbase.apiClients.address!.listAddresses = mockReturnValue(addressListModel);
      const [unhydratedWallet] = await user.listWallets();
      expect(unhydratedWallet.canSign()).toBe(false);
      await unhydratedWallet.setSeed(seed);
      expect(unhydratedWallet).toBeInstanceOf(Wallet);
      expect(unhydratedWallet?.getId()).toBe(walletId);
      expect(unhydratedWallet.canSign()).toBe(true);
    });

    it("should prevent access to master wallet required methods", async () => {
      const { address1 } = generateWalletFromSeed(seed);
      mockAddressModel = newAddressModel(walletId, address1);
      Coinbase.apiClients.wallet!.listWallets = mockReturnValue({
        data: [walletModelWithDefaultAddress],
        has_more: false,
        next_page: "",
        total_count: 1,
      });
      Coinbase.apiClients.address!.listAddresses = mockReturnValue(addressListModel);
      const [unhydratedWallet] = await user.listWallets();
      expect(() => unhydratedWallet.export()).toThrow(
        new InternalError("Cannot export Wallet without loaded seed"),
      );
      await expect(unhydratedWallet.createAddress()).rejects.toThrow(InternalError);
      await expect(
        unhydratedWallet.createTransfer(
          new Decimal("500000000000000000"),
          Coinbase.assets.Eth,
          address1,
        ),
      ).rejects.toThrow(InternalError);
      expect(unhydratedWallet.canSign()).toBe(false);
    });

    it("should access read-only methods", async () => {
      const { address1 } = generateWalletFromSeed(seed);
      mockAddressModel = newAddressModel(walletId, address1);
      Coinbase.apiClients.wallet!.listWallets = mockReturnValue({
        data: [walletModelWithDefaultAddress],
        has_more: false,
        next_page: "",
        total_count: 1,
      });
      Coinbase.apiClients.address!.listAddresses = mockReturnValue(addressListModel);
      const mockWalletBalance: BalanceModel = {
        amount: "5000000000000000000",
        asset: {
          asset_id: Coinbase.assets.Eth,
          network_id: Coinbase.networkList.BaseSepolia,
          decimals: 18,
        },
      };
      const addressBalanceList: AddressBalanceList = {
        data: [mockWalletBalance],
        has_more: false,
        next_page: "",
        total_count: 2,
      };
      Coinbase.apiClients.wallet!.getWalletBalance = mockReturnValue(mockWalletBalance);
      Coinbase.apiClients.wallet!.listWalletBalances = mockReturnValue(addressBalanceList);
      Coinbase.apiClients.address!.requestFaucetFunds = mockReturnValue({
        transaction_hash: generateRandomHash(8),
      });

      const [wallet] = await user.listWallets();
      expect(wallet.getId()).toBe(walletId);
      expect(wallet.canSign()).toBe(false);
      expect(wallet.getNetworkId()).toBe(Coinbase.networkList.BaseSepolia);
      expect(wallet.getDefaultAddress()?.getId()).toBe(
        walletModelWithDefaultAddress.default_address?.address_id,
      );
      expect(wallet.listAddresses().length).toBe(2);
      expect(wallet.getAddress(addressListModel.data[0].address_id)?.getId()).toBe(
        addressListModel.data[0].address_id,
      );
      const balance = await wallet.getBalance(Coinbase.assets.Eth);
      expect(balance).toEqual(new Decimal("5"));

      const balanceMap = await wallet.listBalances();
      expect(balanceMap.get("eth")).toEqual(new Decimal("5"));

      const faucet = await wallet.faucet();
      expect(faucet).toBeInstanceOf(FaucetTransaction);
    });
  });
});
