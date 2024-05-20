import MockAdapter from "axios-mock-adapter";
import * as bip39 from "bip39";
import { randomUUID } from "crypto";
import { Address as AddressModel, AddressesApiFactory, WalletsApiFactory } from "../../client";
import { Coinbase } from "../coinbase";
import { BASE_PATH } from "../../client/base";
import { ArgumentError } from "../errors";
import { Wallet } from "../wallet";
import { createAxiosMock } from "./utils";
import { newAddressModel } from "./address_test";

const walletId = randomUUID();

const DEFAULT_ADDRESS_MODEL = newAddressModel(walletId);

export const VALID_WALLET_MODEL = {
  id: walletId,
  network_id: Coinbase.networkList.BaseSepolia,
  default_address: DEFAULT_ADDRESS_MODEL,
};

export const VALID_WALLET_MODEL_WITHOUT_DEFAULT_ADDRESS = {
  id: walletId,
  network_id: Coinbase.networkList.BaseSepolia,
};

describe("Wallet Class", () => {
  let wallet, axiosMock;
  const seed = bip39.generateMnemonic();

  const [axiosInstance, configuration, BASE_PATH] = createAxiosMock();
  const client = {
    wallet: WalletsApiFactory(configuration, BASE_PATH, axiosInstance),
    address: AddressesApiFactory(configuration, BASE_PATH, axiosInstance),
  };

  beforeAll(async () => {
    axiosMock = new MockAdapter(axiosInstance);
  });

  afterEach(() => {
    axiosMock.reset();
  });

  describe(".create", () => {
    beforeEach(async () => {
      axiosMock
        .onPost(BASE_PATH + "/v1/wallets")
        .reply(200, VALID_WALLET_MODEL_WITHOUT_DEFAULT_ADDRESS);

      axiosMock
        .onPost(BASE_PATH + "/v1/wallets/" + VALID_WALLET_MODEL.id + "/addresses")
        .reply(200, DEFAULT_ADDRESS_MODEL);

      // Mock reloading the wallet after default address is created.
      axiosMock
        .onGet(BASE_PATH + "/v1/wallets/" + VALID_WALLET_MODEL.id)
        .reply(200, VALID_WALLET_MODEL);

      wallet = await Wallet.create(client);
    });

    it("should return a Wallet instance", async () => {
      expect(wallet).toBeInstanceOf(Wallet);
    });

    it("should return the correct wallet ID", async () => {
      expect(wallet.getId()).toBe(VALID_WALLET_MODEL.id);
    });

    it("should return the correct network ID", async () => {
      expect(wallet.getNetworkId()).toBe(Coinbase.networkList.BaseSepolia);
    });

    it("should return the correct default address", async () => {
      expect(wallet.defaultAddress()?.getId()).toBe(DEFAULT_ADDRESS_MODEL.address_id);
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
      addressList.forEach(address => {
        axiosMock
          .onGet(
            BASE_PATH + "/v1/wallets/" + VALID_WALLET_MODEL.id + "/addresses/" + address.address_id,
          )
          .replyOnce(200, address);
      });

      wallet = await Wallet.init(VALID_WALLET_MODEL, client, existingSeed, 2);
    });

    it("should return a Wallet instance", async () => {
      expect(wallet).toBeInstanceOf(Wallet);
    });

    it("should return the correct wallet ID", async () => {
      expect(wallet.getId()).toBe(VALID_WALLET_MODEL.id);
    });

    it("should return the correct network ID", async () => {
      expect(wallet.getNetworkId()).toBe(Coinbase.networkList.BaseSepolia);
    });

    it("should return the correct default address", async () => {
      expect(wallet.defaultAddress()?.getId()).toBe(VALID_WALLET_MODEL.default_address.address_id);
    });

    it("should derive the correct number of addresses", async () => {
      expect(wallet.addresses.length).toBe(2);
    });

    it("should return the correct string representation", async () => {
      expect(wallet.toString()).toBe(
        `Wallet{id: '${VALID_WALLET_MODEL.id}', networkId: '${Coinbase.networkList.BaseSepolia}'}`,
      );
    });

    it("should throw an ArgumentError when the API client is not provided", async () => {
      await expect(Wallet.init(VALID_WALLET_MODEL, undefined!)).rejects.toThrow(ArgumentError);
    });

    it("should throw an ArgumentError when the wallet model is not provided", async () => {
      await expect(Wallet.init(undefined!, client)).rejects.toThrow(ArgumentError);
    });
  });
});
