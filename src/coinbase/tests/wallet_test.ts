import * as bip39 from "bip39";
import { randomUUID } from "crypto";
import { Coinbase } from "../coinbase";
import { Wallet } from "../wallet";
import { Address as AddressModel, Wallet as WalletModel } from "./../../client";
import {
  addressesApiMock,
  getAddressFromHDKey,
  mockFn,
  newAddressModel,
  walletsApiMock,
} from "./utils";
import { ArgumentError } from "../errors";
import { HDKey } from "@scure/bip32";

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
    const baseWallet = HDKey.fromMasterSeed(bip39.mnemonicToSeedSync(existingSeed));
    const wallet1 = baseWallet.deriveChild(0);
    const address1 = getAddressFromHDKey(wallet1);
    const wallet2 = baseWallet.deriveChild(1);
    const address2 = getAddressFromHDKey(wallet2);
    const addressList = [
      {
        address_id: address1,
        network_id: Coinbase.networkList.BaseSepolia,
        public_key: "0x032c11a826d153bb8cf17426d03c3ffb74ea445b17362f98e1536f22bcce720772",
        wallet_id: walletId,
      },
      {
        address_id: address2,
        network_id: Coinbase.networkList.BaseSepolia,
        public_key: "0x03c3379b488a32a432a4dfe91cc3a28be210eddc98b2005bb59a4cf4ed0646eb56",
        wallet_id: walletId,
      },
    ];

    beforeEach(async () => {
      jest.clearAllMocks();
      wallet = await Wallet.init(walletModel, existingSeed, addressList);
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

    it("should derive the correct addresses", async () => {
      expect(wallet.getAddress(address1)).toBe(wallet.addresses[0]);
      expect(wallet.getAddress(address2)).toBe(wallet.addresses[1]);
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
      seedWallet = await Wallet.init(walletModel, seed);
    });

    it("exports the Wallet data", () => {
      const walletData = seedWallet.export();
      expect(walletData.walletId).toBe(seedWallet.getId());
      expect(walletData.seed).toBe(seed);
    });

    it("allows for re-creation of a Wallet", async () => {
      const walletData = seedWallet.export();
      const newWallet = await Wallet.init(walletModel, walletData.seed);
      expect(newWallet).toBeInstanceOf(Wallet);
    });
  });
});
