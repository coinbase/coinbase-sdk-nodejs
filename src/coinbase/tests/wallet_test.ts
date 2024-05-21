import { randomUUID } from "crypto";
import { Coinbase } from "../coinbase";
import { Wallet } from "../wallet";
import { addressesApiMock, mockFn, newAddressModel, walletsApiMock } from "./utils";
import { ArgumentError } from "../errors";

describe("Wallet Class", () => {
  let wallet, walletModel, walletId;
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

  describe(".create", () => {
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
});
