import * as crypto from "crypto";
import { InternalError } from "../coinbase/errors";
import {
  AddressBalanceList,
  AddressList,
  Address as AddressModel,
  Balance as BalanceModel,
  User as UserModel,
  Wallet as WalletModel,
} from "./../client/api";
import { Coinbase } from "./../coinbase/coinbase";
import { WalletData } from "./../coinbase/types";
import { User } from "./../coinbase/user";
import { Wallet } from "./../coinbase/wallet";
import {
  VALID_ADDRESS_MODEL,
  VALID_WALLET_MODEL,
  addressesApiMock,
  generateRandomHash,
  generateWalletFromSeed,
  mockReturnRejectedValue,
  mockReturnValue,
  newAddressModel,
  mockListAddress,
  walletsApiMock,
  externalAddressApiMock,
} from "./utils";
import Decimal from "decimal.js";
import { FaucetTransaction } from "../coinbase/faucet_transaction";

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
      const seed = "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";
      walletData = {
        walletId: walletId,
        seed,
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
        network_id: Coinbase.networks.BaseSepolia,
        default_address: mockAddressModel,
        enabled_features: [],
      };
      Coinbase.apiClients.wallet = walletsApiMock;
      Coinbase.apiClients.wallet!.getWallet = mockReturnValue(mockWalletModel);
      Coinbase.apiClients.address = addressesApiMock;
      Coinbase.apiClients.address!.listAddresses = mockReturnValue(mockAddressList);
      user = new User(mockUserModel);
      mockListAddress(seed, 2);
      importedWallet = await user.importWallet(walletData);
      expect(importedWallet).toBeInstanceOf(Wallet);
      expect(Coinbase.apiClients.wallet!.getWallet).toHaveBeenCalledWith(importedWallet.getId());
      expect(Coinbase.apiClients.wallet!.getWallet).toHaveBeenCalledTimes(1);
    });

    it("should import an exported wallet", async () => {
      expect(importedWallet.getId()).toBe(walletId);
    });

    it("should load the wallet addresses", async () => {
      const [address] = await importedWallet.listAddresses();
      expect(address.getId()).toBeDefined();
      expect(importedWallet.getDefaultAddress()?.getId()).toEqual(address.getId());
    });

    it("should raise an error when walletId is not provided", async () => {
      expect(
        Wallet.import({
          seed: walletData.seed,
        } as WalletData),
      ).rejects.toThrow(new InternalError("Wallet ID must be provided"));
    });

    it("should raise an error when seed is not provided", async () => {
      expect(
        Wallet.import({
          walletId: walletId,
        } as WalletData),
      ).rejects.toThrow(new InternalError("Seed must be provided"));
    });

    it("should contain the same seed when re-exported", async () => {
      expect(importedWallet.export().seed!).toBe(walletData.seed);
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
      const { address1, address2 } = generateWalletFromSeed(seed);
      mockAddressModel = newAddressModel(walletId, address1);

      const addressModel1: AddressModel = newAddressModel(walletId);
      addressModel1.address_id = address1;
      const addressModel2: AddressModel = newAddressModel(walletId);
      addressModel2.address_id = address2;
      walletModelWithDefaultAddress = {
        id: walletId,
        network_id: Coinbase.networks.BaseSepolia,
        default_address: addressModel1,
        enabled_features: [],
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
      await expect(user.listWallets(10, "xyz")).rejects.toThrow(new Error("API Error"));
      expect(Coinbase.apiClients.wallet!.listWallets).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.address!.listAddresses).toHaveBeenCalledTimes(0);
      expect(Coinbase.apiClients.wallet!.listWallets).toHaveBeenCalledWith(10, "xyz");
    });

    it("should return an empty list of Wallets when the User has no Wallets", async () => {
      Coinbase.apiClients.wallet!.listWallets = mockReturnValue({
        data: [],
        has_more: false,
        next_page: "",
        total_count: 0,
      });
      const result = await user.listWallets();
      expect(result.wallets.length).toBe(0);
      expect(Coinbase.apiClients.wallet!.listWallets).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.address!.listAddresses).toHaveBeenCalledTimes(0);
    });

    it("should return the list of Wallets", async () => {
      const { address1 } = generateWalletFromSeed(seed);
      mockAddressModel = newAddressModel(walletId, address1);

      Coinbase.apiClients.wallet!.listWallets = mockReturnValue({
        data: [walletModelWithDefaultAddress],
        has_more: false,
        next_page: "nextPageToken",
        total_count: 1,
      });
      Coinbase.apiClients.address!.listAddresses = mockReturnValue(addressListModel);
      const result = await user.listWallets();
      expect(result.wallets[0]).toBeInstanceOf(Wallet);
      expect(result.wallets.length).toBe(1);
      expect(result.wallets[0].getId()).toBe(walletId);
      const addresses = await result.wallets[0].listAddresses();
      expect(addresses.length).toBe(2);
      expect(result.nextPageToken).toBe("nextPageToken");
      expect(Coinbase.apiClients.wallet!.listWallets).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.address!.listAddresses).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.address!.listAddresses).toHaveBeenCalledWith(
        walletId,
        Wallet.MAX_ADDRESSES,
      );
      expect(Coinbase.apiClients.wallet!.listWallets).toHaveBeenCalledWith(10, undefined);
    });

    it("should create Wallets when seed is provided", async () => {
      Coinbase.apiClients.wallet!.listWallets = mockReturnValue({
        data: [walletModelWithDefaultAddress],
        has_more: false,
        next_page: "",
        total_count: 1,
      });
      Coinbase.apiClients.address!.listAddresses = mockReturnValue(addressListModel);
      const result = await user.listWallets();
      const unhydratedWallet = result.wallets[0];
      expect(unhydratedWallet.canSign()).toBe(false);
      unhydratedWallet.setSeed(seed);
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
      Coinbase.apiClients.address!.listAddresses = mockReturnValue(mockAddressList);
      const result = await user.listWallets();
      const unhydratedWallet = result.wallets[0];
      expect(() => unhydratedWallet.export()).toThrow(
        new InternalError("Cannot export Wallet without loaded seed"),
      );
      await expect(unhydratedWallet.createAddress()).rejects.toThrow(InternalError);
      await expect(
        unhydratedWallet.createTransfer({
          amount: new Decimal("500000000000000000"),
          assetId: Coinbase.assets.Eth,
          destination: address1,
        }),
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
          network_id: Coinbase.networks.BaseSepolia,
          decimals: 18,
        },
      };
      const addressBalanceList: AddressBalanceList = {
        data: [mockWalletBalance],
        has_more: false,
        next_page: "",
        total_count: 2,
      };
      Coinbase.apiClients.externalAddress = externalAddressApiMock;
      Coinbase.apiClients.wallet!.getWalletBalance = mockReturnValue(mockWalletBalance);
      Coinbase.apiClients.wallet!.listWalletBalances = mockReturnValue(addressBalanceList);
      Coinbase.apiClients.externalAddress!.requestExternalFaucetFunds = mockReturnValue({
        transaction_hash: generateRandomHash(8),
      });

      const result = await user.listWallets();
      const wallet = result.wallets[0];
      expect(wallet.getId()).toBe(walletId);
      expect(wallet.canSign()).toBe(false);
      expect(wallet.getNetworkId()).toBe(Coinbase.networks.BaseSepolia);
      const addresses = await wallet.listAddresses();
      expect(addresses.length).toBe(2);
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

  describe(".getWallet", () => {
    let user: User;
    let walletId: string;
    let walletModelWithDefaultAddress: WalletModel;
    let addressListModel: AddressList;

    beforeEach(() => {
      jest.clearAllMocks();
      walletId = crypto.randomUUID();
      const seed = "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";
      const { address1 } = generateWalletFromSeed(seed);
      mockAddressModel = newAddressModel(walletId, address1);

      const addressModel1: AddressModel = newAddressModel(walletId);
      const addressModel2: AddressModel = newAddressModel(walletId);
      walletModelWithDefaultAddress = {
        id: walletId,
        network_id: Coinbase.networks.BaseSepolia,
        default_address: addressModel1,
        enabled_features: [],
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
      Coinbase.apiClients.wallet!.getWallet = mockReturnRejectedValue(new Error("API Error"));
      await expect(user.getWallet(walletId)).rejects.toThrow(new Error("API Error"));
      expect(Coinbase.apiClients.wallet!.getWallet).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.wallet!.getWallet).toHaveBeenLastCalledWith(walletId);
    });

    it("should return the Wallet", async () => {
      const seed = "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";
      const { address1 } = generateWalletFromSeed(seed);
      mockAddressModel = newAddressModel(walletId, address1);
      Coinbase.apiClients.wallet!.getWallet = mockReturnValue(walletModelWithDefaultAddress);
      Coinbase.apiClients.address!.listAddresses = mockReturnValue(addressListModel);
      const result = await user.getWallet(walletId);
      expect(result).toBeInstanceOf(Wallet);
      expect(result.getId()).toBe(walletId);
      expect(result.getDefaultAddress()?.getId()).toBeDefined();
      const addresses = await result.listAddresses();
      expect(addresses.length).toBe(2);
      expect(result.canSign()).toBe(false);
      expect(Coinbase.apiClients.wallet!.getWallet).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.address!.listAddresses).toHaveBeenCalledTimes(2);
      expect(Coinbase.apiClients.address!.listAddresses).toHaveBeenCalledWith(walletId, 20);
      expect(Coinbase.apiClients.wallet!.getWallet).toHaveBeenCalledWith(walletId);
    });
  });

  describe(".createWallet", () => {
    it("should create a Wallet", async () => {
      const wallet = Wallet.init(VALID_WALLET_MODEL, "");
      jest.spyOn(Wallet, "create").mockReturnValue(Promise.resolve(wallet));
      const user = new User(mockUserModel);
      const result = await user.createWallet();
      expect(result).toBeInstanceOf(Wallet);
    });
  });
});
