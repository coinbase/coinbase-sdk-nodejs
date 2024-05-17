import { ethers } from "ethers";
import {
  AddressBalanceList,
  AddressesApiFactory,
  Address as AddressModel,
  Balance as BalanceModel,
} from "../../client";
import { Address } from "./../address";
import { FaucetTransaction } from "./../faucet_transaction";

import MockAdapter from "axios-mock-adapter";
import { randomUUID } from "crypto";
import { APIError, FaucetLimitReachedError } from "../api_error";
import { Coinbase } from "../coinbase";
import { InternalError } from "../errors";
import { createAxiosMock } from "./utils";
import Decimal from "decimal.js";

const newEthAddress = ethers.Wallet.createRandom();

export const VALID_ADDRESS_MODEL: AddressModel = {
  address_id: newEthAddress.address,
  network_id: Coinbase.networkList.BaseSepolia,
  public_key: newEthAddress.publicKey,
  wallet_id: randomUUID(),
};

export const ETH_BALANCE_MODEL: BalanceModel = {
  amount: "1000000000000000000",
  asset: {
    asset_id: Coinbase.assetList.Eth,
    network_id: Coinbase.networkList.BaseSepolia,
  },
};

export const USDC_BALANCE_MODEL: BalanceModel = {
  amount: "5000000000",
  asset: {
    asset_id: "usdc",
    network_id: Coinbase.networkList.BaseSepolia,
    decimals: 6,
  },
};

export const WETH_BALANCE_MODEL: BalanceModel = {
  amount: "3000000000000000000",
  asset: {
    asset_id: "weth",
    network_id: Coinbase.networkList.BaseSepolia,
    decimals: 6,
  },
};

export const VALID_ADDRESS_BALANCE_LIST: AddressBalanceList = {
  data: [ETH_BALANCE_MODEL, USDC_BALANCE_MODEL, WETH_BALANCE_MODEL],
  has_more: false,
  next_page: "",
  total_count: 3,
};

// Test suite for Address class
describe("Address", () => {
  const [axiosInstance, configuration, BASE_PATH] = createAxiosMock();
  const client = AddressesApiFactory(configuration, BASE_PATH, axiosInstance);
  let address: Address, axiosMock;

  beforeAll(() => {
    axiosMock = new MockAdapter(axiosInstance);
  });

  beforeEach(() => {
    address = new Address(VALID_ADDRESS_MODEL, client);
  });

  afterEach(() => {
    axiosMock.reset();
  });

  it("should initialize a new Address", () => {
    expect(address).toBeInstanceOf(Address);
  });

  it("should return the network ID", () => {
    expect(address.getId()).toBe(newEthAddress.address);
  });

  it("should return the address ID", () => {
    expect(address.getNetworkId()).toBe(VALID_ADDRESS_MODEL.network_id);
  });

  it("should return the correct list of balances", async () => {
    axiosMock.onGet().reply(200, VALID_ADDRESS_BALANCE_LIST);
    const balances = await address.listBalances();
    expect(balances.get(Coinbase.assetList.Eth)).toEqual(new Decimal(1));
    expect(balances.get("usdc")).toEqual(new Decimal(5000));
    expect(balances.get("weth")).toEqual(new Decimal(3));
  });

  it("should return the correct ETH balance", async () => {
    axiosMock.onGet().reply(200, ETH_BALANCE_MODEL);
    const ethBalance = await address.getBalance(Coinbase.assetList.Eth);
    expect(ethBalance).toBeInstanceOf(Decimal);
    expect(ethBalance).toEqual(new Decimal(1));
  });

  it("should return the correct Gwei balance", async () => {
    axiosMock.onGet().reply(200, ETH_BALANCE_MODEL);
    const ethBalance = await address.getBalance("gwei");
    expect(ethBalance).toBeInstanceOf(Decimal);
    expect(ethBalance).toEqual(new Decimal(1000000000));
  });

  it("should return the correct Wei balance", async () => {
    axiosMock.onGet().reply(200, ETH_BALANCE_MODEL);
    const ethBalance = await address.getBalance("wei");
    expect(ethBalance).toBeInstanceOf(Decimal);
    expect(ethBalance).toEqual(new Decimal(1000000000000000000));
  });

  it("should return an error for an unsupported asset", async () => {
    axiosMock.onGet().reply(404, null);
    try {
      await address.getBalance("unsupported-asset");
      fail("Expect 404 to be thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(APIError);
    }
  });

  it("should return the wallet ID", () => {
    expect(address.getWalletId()).toBe(VALID_ADDRESS_MODEL.wallet_id);
  });

  it("should throw an InternalError when model is not provided", () => {
    expect(() => new Address(null!, client)).toThrow(`Address model cannot be empty`);
  });

  it("should throw an InternalError when client is not provided", () => {
    expect(() => new Address(VALID_ADDRESS_MODEL, null!)).toThrow(`Address client cannot be empty`);
  });

  it("should request funds from the faucet and returns the faucet transaction", async () => {
    const transactionHash = "0xdeadbeef";
    axiosMock.onPost().reply(200, {
      transaction_hash: transactionHash,
    });
    const faucetTransaction = await address.faucet();
    expect(faucetTransaction).toBeInstanceOf(FaucetTransaction);
    expect(faucetTransaction.getTransactionHash()).toBe(transactionHash);
  });

  it("should throw an APIError when the request is unsuccesful", async () => {
    axiosMock.onPost().reply(400);
    await expect(address.faucet()).rejects.toThrow(APIError);
  });

  it("should throw a FaucetLimitReachedError when the faucet limit is reached", async () => {
    axiosMock.onPost().reply(429, {
      code: "faucet_limit_reached",
      message: "Faucet limit reached",
    });
    await expect(address.faucet()).rejects.toThrow(FaucetLimitReachedError);
  });

  it("should throw an InternalError when the request fails unexpectedly", async () => {
    axiosMock.onPost().reply(500, {
      code: "internal",
      message: "unexpected error occurred while requesting faucet funds",
    });
    await expect(address.faucet()).rejects.toThrow(InternalError);
  });

  it("should return the correct string representation", () => {
    expect(address.toString()).toBe(
      `Coinbase:Address{addressId: '${VALID_ADDRESS_MODEL.address_id}', networkId: '${VALID_ADDRESS_MODEL.network_id}', walletId: '${VALID_ADDRESS_MODEL.wallet_id}'}`,
    );
  });
});
