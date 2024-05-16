import MockAdapter from "axios-mock-adapter";
import * as bip39 from "bip39";
import { randomUUID } from "crypto";
import { AddressesApiFactory, WalletsApiFactory } from "../../client";
import { Coinbase } from "../coinbase";
import { ArgumentError } from "../errors";
import { Wallet } from "../wallet";
import { createAxiosMock } from "./utils";

const walletId = randomUUID();
const VALID_WALLET_MODEL = {
  id: randomUUID(),
  network_id: Coinbase.networkList.BaseSepolia,
  default_address: {
    wallet_id: walletId,
    address_id: "0xdeadbeef",
    public_key: "0x1234567890",
    network_id: Coinbase.networkList.BaseSepolia,
  },
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
    axiosMock.onPost().reply(200, VALID_WALLET_MODEL).onGet().reply(200, VALID_WALLET_MODEL);
    wallet = await Wallet.init(VALID_WALLET_MODEL, client, seed, 2);
  });

  afterEach(() => {
    axiosMock.reset();
  });

  describe("should initializes a new Wallet", () => {
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
  });

  it("should return the correct string representation", async () => {
    const wallet = await Wallet.init(VALID_WALLET_MODEL, client);
    expect(wallet.toString()).toBe(
      `Wallet{id: '${VALID_WALLET_MODEL.id}', network_id: 'base_sepolia'}`,
    );
  });

  it("should throw an ArgumentError when the API client is not provided", async () => {
    await expect(Wallet.init(VALID_WALLET_MODEL, undefined!)).rejects.toThrow(ArgumentError);
  });

  it("should throw an ArgumentError when the wallet model is not provided", async () => {
    await expect(Wallet.init(undefined!, client)).rejects.toThrow(ArgumentError);
  });
});
