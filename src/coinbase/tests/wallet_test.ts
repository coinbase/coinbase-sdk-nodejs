import MockAdapter from "axios-mock-adapter";
import * as bip39 from "bip39";
import { randomUUID } from "crypto";
import { AddressesApiFactory, WalletsApiFactory } from "../../client";
import { Coinbase } from "../coinbase";
import { ArgumentError } from "../errors";
import { Wallet } from "../wallet";
import { createAxiosMock } from "./utils";
import { ETH_BALANCE_MODEL, VALID_ADDRESS_BALANCE_LIST, VALID_ADDRESS_MODEL } from "./address_test";
import Decimal from "decimal.js";
import { APIError } from "../api_error";

const walletId = randomUUID();
export const VALID_WALLET_MODEL = {
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
  let wallet: Wallet, axiosMock: MockAdapter;
  const seed = bip39.generateMnemonic();

  const [axiosInstance, configuration, BASE_PATH] = createAxiosMock();
  const client = {
    wallet: WalletsApiFactory(configuration, BASE_PATH, axiosInstance),
    address: AddressesApiFactory(configuration, BASE_PATH, axiosInstance),
  };

  beforeAll(async () => {
    axiosMock = new MockAdapter(axiosInstance);
    axiosMock
      .onPost(/v1\/wallets/)
      .replyOnce(200, VALID_WALLET_MODEL)
      .onGet(/v1\/wallets\/.+\/addresses\/.+/)
      .reply(200, VALID_ADDRESS_MODEL);
    wallet = await Wallet.init(VALID_WALLET_MODEL, client, seed, 2);
  });

  afterEach(() => {
    axiosMock.reset();
  });

  describe("should initialize a new Wallet", () => {
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
      expect(wallet.listAddresses().length).toBe(2);
    });
    it("should return the correct address", () => {
      const defaultAddress = wallet.defaultAddress();
      expect(wallet.getAddress(defaultAddress!.getId())).toEqual(wallet.listAddresses()[0]);
    });

    it("should return a BalanceMap with ETH, USDC, and WETH balances", async () => {
      axiosMock.onGet().reply(200, VALID_ADDRESS_BALANCE_LIST);
      const balances = await wallet.listBalances();
      expect(balances.get(Coinbase.assetList.Eth)).toEqual(new Decimal(1));
      expect(balances.get("usdc")).toEqual(new Decimal(5000));
      expect(balances.get("weth")).toEqual(new Decimal(3));
    });

    it("should return the correct ETH balance", async () => {
      axiosMock.onGet().reply(200, ETH_BALANCE_MODEL);
      const ethBalance = await wallet.getBalance(Coinbase.assetList.Eth);
      expect(ethBalance).toBeInstanceOf(Decimal);
      expect(ethBalance).toEqual(new Decimal(1));
    });

    it("should return the correct Gwei balance", async () => {
      axiosMock.onGet().reply(200, ETH_BALANCE_MODEL);
      const ethBalance = await wallet.getBalance("gwei");
      expect(ethBalance).toBeInstanceOf(Decimal);
      expect(ethBalance).toEqual(new Decimal(1000000000));
    });

    it("should return the correct Wei balance", async () => {
      axiosMock.onGet().reply(200, ETH_BALANCE_MODEL);
      const ethBalance = await wallet.getBalance("wei");
      expect(ethBalance).toBeInstanceOf(Decimal);
      expect(ethBalance).toEqual(new Decimal(1000000000000000000));
    });

    it("should return an error for an unsupported asset", async () => {
      axiosMock.onGet().reply(404, null);
      try {
        await wallet.getBalance("unsupported-asset");
        fail("Expect 404 to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(APIError);
      }
    });

    it("should return the correct string representation", async () => {
      expect(wallet.toString()).toBe(
        `Wallet{id: '${VALID_WALLET_MODEL.id}', networkId: '${Coinbase.networkList.BaseSepolia}'}`,
      );
    });
  });

  it("should throw an ArgumentError when the API client is not provided", async () => {
    await expect(Wallet.init(VALID_WALLET_MODEL, undefined!)).rejects.toThrow(ArgumentError);
  });

  it("should throw an ArgumentError when the wallet model is not provided", async () => {
    await expect(Wallet.init(undefined!, client)).rejects.toThrow(ArgumentError);
  });
});
