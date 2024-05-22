import { randomUUID } from "crypto";
import { Coinbase } from "../coinbase";
import { Wallet } from "../wallet";
import {
  AddressBalanceList,
  Address as AddressModel,
  Wallet as WalletModel,
  Balance as BalanceModel,
} from "./../../client";
import { ArgumentError } from "../errors";
import {
  addressesApiMock,
  mockFn,
  mockReturnValue,
  newAddressModel,
  walletsApiMock,
} from "./utils";
import { Address } from "../address";
import Decimal from "decimal.js";

describe("Wallet Class", () => {
  let wallet, walletModel, walletId;
  describe(".create", () => {
    const apiResponses = {};

    beforeAll(async () => {
      walletId = randomUUID();
      // Mock the API calls
      Coinbase.apiClients.wallet = walletsApiMock;
      Coinbase.apiClients.address = addressesApiMock;
      Coinbase.apiClients.wallet!.createWallet = mockFn(request => {
        const { network_id } = request.wallet;
        apiResponses[walletId] = {
          id: walletId,
          network_id,
          default_address: newAddressModel(walletId),
        };
        return { data: apiResponses[walletId] };
      });
      Coinbase.apiClients.wallet!.getWallet = mockFn(walletId => {
        walletModel = apiResponses[walletId];
        return { data: apiResponses[walletId] };
      });
      Coinbase.apiClients.address!.createAddress = mockFn(walletId => {
        return { data: apiResponses[walletId].default_address };
      });
      wallet = await Wallet.create();
    });

    it("should return a Wallet instance", async () => {
      expect(wallet).toBeInstanceOf(Wallet);
      expect(Coinbase.apiClients.wallet!.createWallet).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.wallet!.getWallet).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.address!.createAddress).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.wallet!.createWallet).toHaveBeenCalledWith({
        wallet: { network_id: Coinbase.networkList.BaseSepolia },
      });
      expect(Coinbase.apiClients.wallet!.getWallet).toHaveBeenCalledWith(walletId);
    });

    it("should return the correct wallet ID", async () => {
      expect(wallet.getId()).toBe(walletModel.id);
    });

    it("should return the correct network ID", async () => {
      expect(wallet.getNetworkId()).toBe(Coinbase.networkList.BaseSepolia);
    });

    it("should return the correct default address", async () => {
      expect(wallet.defaultAddress()?.getId()).toBe(walletModel.default_address.address_id);
    });
  });

  describe(".init", () => {
    const existingSeed =
      "hidden assault maple cheap gentle paper earth surprise trophy guide room tired";
    const addressList = [
      {
        address_id: "0x23626702fdC45fc75906E535E38Ee1c7EC0C3213",
        network_id: Coinbase.networkList.BaseSepolia,
        public_key: "0x032c11a826d153bb8cf17426d03c3ffb74ea445b17362f98e1536f22bcce720772",
        wallet_id: walletId,
      },
      {
        address_id: "0x770603171A98d1CD07018F7309A1413753cA0018",
        network_id: Coinbase.networkList.BaseSepolia,
        public_key: "0x03c3379b488a32a432a4dfe91cc3a28be210eddc98b2005bb59a4cf4ed0646eb56",
        wallet_id: walletId,
      },
    ];

    beforeEach(async () => {
      jest.clearAllMocks();
      const getAddress = jest.fn();
      addressList.forEach(() => {
        getAddress.mockImplementationOnce((wallet_id, address_id) => {
          return Promise.resolve({
            data: {
              address_id,
              network_id: Coinbase.networkList.BaseSepolia,
              public_key: "0x03c3379b488a32a432a4dfe91cc3a28be210eddc98b2005bb59a4cf4ed0646eb56",
              wallet_id,
            },
          });
        });
      });
      Coinbase.apiClients.address!.getAddress = getAddress;
      wallet = await Wallet.init(walletModel, existingSeed, 2);
      expect(Coinbase.apiClients.address!.getAddress).toHaveBeenCalledTimes(2);
      addressList.forEach((address, callIndex) => {
        expect(Coinbase.apiClients.address!.getAddress).toHaveBeenNthCalledWith(
          callIndex + 1,
          walletId,
          address.address_id,
        );
      });
    });

    it("should return a Wallet instance", async () => {
      expect(wallet).toBeInstanceOf(Wallet);
    });

    it("should return the correct wallet ID", async () => {
      expect(wallet.getId()).toBe(walletModel.id);
    });

    it("should return the correct network ID", async () => {
      expect(wallet.getNetworkId()).toBe(Coinbase.networkList.BaseSepolia);
    });

    it("should return the correct default address", async () => {
      expect(wallet.defaultAddress()?.getId()).toBe(walletModel.default_address?.address_id);
    });

    it("should derive the correct number of addresses", async () => {
      expect(wallet.addresses.length).toBe(2);
    });

    it("should return the correct string representation", async () => {
      expect(wallet.toString()).toBe(
        `Wallet{id: '${walletModel.id}', networkId: '${Coinbase.networkList.BaseSepolia}'}`,
      );
    });

    it("should throw an ArgumentError when the wallet model is not provided", async () => {
      await expect(Wallet.init(undefined!)).rejects.toThrow(ArgumentError);
    });
  });

  describe(".export", () => {
    let walletId: string;
    let addressModel: AddressModel;
    let walletModel: WalletModel;
    let seedWallet: Wallet;
    const seed = "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";
    const addressCount = 1;

    beforeAll(async () => {
      walletId = randomUUID();
      addressModel = newAddressModel(walletId);
      walletModel = {
        id: walletId,
        network_id: Coinbase.networkList.BaseSepolia,
        default_address: addressModel,
      };
      Coinbase.apiClients.address = addressesApiMock;
      Coinbase.apiClients.address!.getAddress = mockFn(() => {
        return { data: addressModel };
      });
      seedWallet = await Wallet.init(walletModel, seed, addressCount);
    });

    it("exports the Wallet data", () => {
      const walletData = seedWallet.export();
      expect(Coinbase.apiClients.address!.getAddress).toHaveBeenCalledTimes(1);
      expect(walletData.walletId).toBe(seedWallet.getId());
      expect(walletData.seed).toBe(seed);
    });

    it("allows for re-creation of a Wallet", async () => {
      const walletData = seedWallet.export();
      const newWallet = await Wallet.init(walletModel, walletData.seed, addressCount);
      expect(Coinbase.apiClients.address!.getAddress).toHaveBeenCalledTimes(2);
      expect(newWallet).toBeInstanceOf(Wallet);
    });
  });

  describe(".defaultAddress", () => {
    let wallet, walletId;
    beforeEach(async () => {
      jest.clearAllMocks();
      walletId = randomUUID();
      const mockAddressModel: AddressModel = newAddressModel(walletId);
      const walletMockWithDefaultAddress: WalletModel = {
        id: walletId,
        network_id: Coinbase.networkList.BaseSepolia,
        default_address: mockAddressModel,
      };
      Coinbase.apiClients.wallet = walletsApiMock;
      Coinbase.apiClients.address = addressesApiMock;
      Coinbase.apiClients.wallet!.createWallet = mockReturnValue(walletMockWithDefaultAddress);
      Coinbase.apiClients.wallet!.getWallet = mockReturnValue(walletMockWithDefaultAddress);
      Coinbase.apiClients.address!.createAddress = mockReturnValue(mockAddressModel);
      wallet = await Wallet.create();
    });

    it("should return the correct address", async () => {
      const defaultAddress = wallet.defaultAddress();
      const address = wallet.getAddress(defaultAddress?.getId());
      expect(address).toBeInstanceOf(Address);
      expect(address?.getId()).toBe(address.getId());
    });

    describe(".walletId", () => {
      it("should return the correct wallet ID", async () => {
        expect(wallet.getId()).toBe(walletId);
      });
    });

    describe(".networkId", () => {
      it("should return the correct network ID", async () => {
        expect(wallet.getNetworkId()).toBe(Coinbase.networkList.BaseSepolia);
      });
    });
  });

  describe(".listBalances", () => {
    beforeEach(() => {
      const mockBalanceResponse: AddressBalanceList = {
        data: [
          {
            amount: "1000000000000000000",
            asset: {
              asset_id: Coinbase.assetList.Eth,
              network_id: Coinbase.networkList.BaseSepolia,
              decimals: 18,
            },
          },
          {
            amount: "5000000",
            asset: {
              asset_id: "usdc",
              network_id: Coinbase.networkList.BaseSepolia,
              decimals: 6,
            },
          },
        ],
        has_more: false,
        next_page: "",
        total_count: 2,
      };
      Coinbase.apiClients.wallet!.listWalletBalances = mockReturnValue(mockBalanceResponse);
    });

    it("should return a hash with an ETH and USDC balance", async () => {
      const balanceMap = await wallet.listBalances();
      expect(balanceMap.get("eth")).toEqual(new Decimal(1));
      expect(balanceMap.get("usdc")).toEqual(new Decimal(5));
      expect(Coinbase.apiClients.wallet!.listWalletBalances).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.wallet!.listWalletBalances).toHaveBeenCalledWith(walletId);
    });
  });

  describe(".getBalance", () => {
    beforeEach(() => {
      const mockWalletBalance: BalanceModel = {
        amount: "5000000000000000000",
        asset: {
          asset_id: Coinbase.assetList.Eth,
          network_id: Coinbase.networkList.BaseSepolia,
          decimals: 18,
        },
      };
      Coinbase.apiClients.wallet!.getWalletBalance = mockReturnValue(mockWalletBalance);
    });

    it("should return the correct ETH balance", async () => {
      const balanceMap = await wallet.getBalance(Coinbase.assetList.Eth);
      expect(balanceMap).toEqual(new Decimal(5));
      expect(Coinbase.apiClients.wallet!.getWalletBalance).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.wallet!.getWalletBalance).toHaveBeenCalledWith(
        walletId,
        Coinbase.assetList.Eth,
      );
    });

    it("should return the correct GWEI balance", async () => {
      const balance = await wallet.getBalance(Coinbase.assetList.Gwei);
      expect(balance).toEqual(new Decimal((BigInt(5) * Coinbase.GWEI_PER_ETHER).toString()));
      expect(Coinbase.apiClients.wallet!.getWalletBalance).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.wallet!.getWalletBalance).toHaveBeenCalledWith(
        walletId,
        Coinbase.assetList.Gwei,
      );
    });

    it("should return the correct WEI balance", async () => {
      const balance = await wallet.getBalance(Coinbase.assetList.Wei);
      expect(balance).toEqual(new Decimal((BigInt(5) * Coinbase.WEI_PER_ETHER).toString()));
      expect(Coinbase.apiClients.wallet!.getWalletBalance).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.wallet!.getWalletBalance).toHaveBeenCalledWith(
        walletId,
        Coinbase.assetList.Wei,
      );
    });

    it("should return 0 when the balance is not found", async () => {
      Coinbase.apiClients.wallet!.getWalletBalance = mockReturnValue({});
      const balance = await wallet.getBalance(Coinbase.assetList.Wei);
      expect(balance).toEqual(new Decimal(0));
      expect(Coinbase.apiClients.wallet!.getWalletBalance).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.wallet!.getWalletBalance).toHaveBeenCalledWith(
        walletId,
        Coinbase.assetList.Wei,
      );
    });
  });

  describe(".canSign", () => {
    let wallet;
    beforeAll(async () => {
      const mockAddressModel = newAddressModel(walletId);
      const mockWalletModel = {
        id: walletId,
        network_id: Coinbase.networkList.BaseSepolia,
        default_address: mockAddressModel,
      };
      Coinbase.apiClients.wallet = walletsApiMock;
      Coinbase.apiClients.address = addressesApiMock;
      Coinbase.apiClients.wallet!.createWallet = mockReturnValue(mockWalletModel);
      Coinbase.apiClients.wallet!.getWallet = mockReturnValue(mockWalletModel);
      Coinbase.apiClients.address!.createAddress = mockReturnValue(mockAddressModel);
      wallet = await Wallet.create();
    });
    it("should return true when the wallet initialized ", () => {
      expect(wallet.canSign()).toBe(true);
    });
  });
});
