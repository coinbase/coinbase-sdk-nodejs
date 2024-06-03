import * as crypto from "crypto";
import { InternalError } from "../errors";
import {
  AddressBalanceList,
  AddressList,
  Address as AddressModel,
  Balance as BalanceModel,
  User as UserModel,
  Wallet as WalletModel,
} from "./../../client/api";
import { Coinbase } from "./../coinbase";
import { WalletData } from "./../types";
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
      expect(result.wallets[0].listAddresses().length).toBe(2);
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
      Coinbase.apiClients.address!.listAddresses = mockReturnValue(mockAddressList);
      const result = await user.listWallets();
      const unhydratedWallet = result.wallets[0];
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

      const result = await user.listWallets();
      const wallet = result.wallets[0];
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
      Coinbase.apiClients.wallet!.getWallet = mockReturnRejectedValue(new Error("API Error"));
      await expect(user.getWallet(walletId)).rejects.toThrow(new Error("API Error"));
      expect(Coinbase.apiClients.wallet!.getWallet).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.wallet!.getWallet).toHaveBeenLastCalledWith(walletId);
    });

    it("should raise an error when the Address API call fails", async () => {
      Coinbase.apiClients.wallet!.getWallet = mockReturnValue(walletModelWithDefaultAddress);
      Coinbase.apiClients.address!.listAddresses = mockReturnRejectedValue(new Error("API Error"));
      await expect(user.getWallet(walletId)).rejects.toThrow(new Error("API Error"));
      expect(Coinbase.apiClients.wallet!.getWallet).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.wallet!.getWallet).toHaveBeenLastCalledWith(walletId);
      expect(Coinbase.apiClients.address!.listAddresses).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.address!.listAddresses).toHaveBeenLastCalledWith(walletId);
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
      expect(result.listAddresses().length).toBe(2);
      expect(result.canSign()).toBe(false);
      expect(Coinbase.apiClients.wallet!.getWallet).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.address!.listAddresses).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.address!.listAddresses).toHaveBeenCalledWith(walletId);
      expect(Coinbase.apiClients.wallet!.getWallet).toHaveBeenCalledWith(walletId);
    });
  });
});
