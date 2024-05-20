import { ethers } from "ethers";
import { Address as AddressModel } from "../../client";
import { Address } from "./../address";
import { FaucetTransaction } from "./../faucet_transaction";

import { randomUUID } from "crypto";
import Decimal from "decimal.js";
import { APIError, FaucetLimitReachedError } from "../api_error";
import { Coinbase } from "../coinbase";
import { InternalError } from "../errors";
import { VALID_BALANCE_MODEL, VALID_ADDRESS_BALANCE_LIST, addressesApiMock } from "./utils";

const newEthAddress = ethers.Wallet.createRandom();

const VALID_ADDRESS_MODEL: AddressModel = {
  address_id: newEthAddress.address,
  network_id: Coinbase.networkList.BaseSepolia,
  public_key: newEthAddress.publicKey,
  wallet_id: randomUUID(),
};

// Test suite for Address class
describe("Address", () => {
  let address: Address;

  beforeEach(() => {
    address = new Address(VALID_ADDRESS_MODEL);
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
    Coinbase.apiClients.address = {
      ...addressesApiMock,
      listAddressBalances: jest.fn().mockResolvedValue({ data: VALID_ADDRESS_BALANCE_LIST }),
    };
    const balances = await address.listBalances();
    expect(balances.get(Coinbase.assetList.Eth)).toEqual(new Decimal(1));
    expect(balances.get("usdc")).toEqual(new Decimal(5000));
    expect(balances.get("weth")).toEqual(new Decimal(3));
  });

  it("should return the correct ETH balance", async () => {
    Coinbase.apiClients.address = {
      ...addressesApiMock,
      getAddressBalance: jest.fn().mockResolvedValue({ data: VALID_BALANCE_MODEL }),
    };
    const ethBalance = await address.getBalance(Coinbase.assetList.Eth);
    expect(ethBalance).toBeInstanceOf(Decimal);
    expect(ethBalance).toEqual(new Decimal(1));
  });

  it("should return the correct Gwei balance", async () => {
    Coinbase.apiClients.address = {
      ...addressesApiMock,
      getAddressBalance: jest.fn().mockResolvedValue({ data: VALID_BALANCE_MODEL }),
    };
    const ethBalance = await address.getBalance("gwei");
    expect(ethBalance).toBeInstanceOf(Decimal);
    expect(ethBalance).toEqual(new Decimal(1000000000));
  });

  it("should return the correct Wei balance", async () => {
    Coinbase.apiClients.address = {
      ...addressesApiMock,
      getAddressBalance: jest.fn().mockResolvedValue({ data: VALID_BALANCE_MODEL }),
    };
    const ethBalance = await address.getBalance("wei");
    expect(ethBalance).toBeInstanceOf(Decimal);
    expect(ethBalance).toEqual(new Decimal(1000000000000000000));
  });

  it("should return an error for an unsupported asset", async () => {
    Coinbase.apiClients.address = {
      ...addressesApiMock,
      getAddressBalance: jest.fn().mockRejectedValue(new APIError("")),
    };
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
    expect(() => new Address(null!)).toThrow(`Address model cannot be empty`);
  });

  it("should request funds from the faucet and returns the faucet transaction", async () => {
    const transactionHash = "0xdeadbeef";
    Coinbase.apiClients.address = {
      ...addressesApiMock,
      requestFaucetFunds: jest
        .fn()
        .mockResolvedValue({ data: { transaction_hash: transactionHash } }),
    };
    const faucetTransaction = await address.faucet();
    expect(faucetTransaction).toBeInstanceOf(FaucetTransaction);
    expect(faucetTransaction.getTransactionHash()).toBe(transactionHash);
  });

  it("should throw an APIError when the request is unsuccesful", async () => {
    Coinbase.apiClients.address = {
      ...addressesApiMock,
      requestFaucetFunds: jest.fn().mockRejectedValue(new APIError("")),
    };
    await expect(address.faucet()).rejects.toThrow(APIError);
  });

  it("should throw a FaucetLimitReachedError when the faucet limit is reached", async () => {
    Coinbase.apiClients.address = {
      ...addressesApiMock,
      requestFaucetFunds: jest.fn().mockRejectedValue(new FaucetLimitReachedError("")),
    };
    await expect(address.faucet()).rejects.toThrow(FaucetLimitReachedError);
  });

  it("should throw an InternalError when the request fails unexpectedly", async () => {
    Coinbase.apiClients.address = {
      ...addressesApiMock,
      requestFaucetFunds: jest.fn().mockRejectedValue(new InternalError("")),
    };
    await expect(address.faucet()).rejects.toThrow(InternalError);
  });

  it("should return the correct string representation", () => {
    expect(address.toString()).toBe(
      `Coinbase:Address{addressId: '${VALID_ADDRESS_MODEL.address_id}', networkId: '${VALID_ADDRESS_MODEL.network_id}', walletId: '${VALID_ADDRESS_MODEL.wallet_id}'}`,
    );
  });
});
