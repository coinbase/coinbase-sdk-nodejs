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
  const transactionHash = "0xdeadbeef";
  let address: Address;
  const getAddressBalance = jest.fn().mockResolvedValue({ data: VALID_BALANCE_MODEL });
  const listAddressBalances = jest.fn().mockResolvedValue({ data: VALID_ADDRESS_BALANCE_LIST });
  const requestFaucetFunds = jest
    .fn()
    .mockResolvedValue({ data: { transaction_hash: transactionHash } });

  beforeEach(() => {
    address = new Address(VALID_ADDRESS_MODEL);
    jest.clearAllMocks();
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
      listAddressBalances,
    };
    const balances = await address.listBalances();
    expect(balances.get(Coinbase.assetList.Eth)).toEqual(new Decimal(1));
    expect(balances.get("usdc")).toEqual(new Decimal(5000));
    expect(balances.get("weth")).toEqual(new Decimal(3));
    expect(listAddressBalances).toHaveBeenCalledWith(address.getWalletId(), address.getId());
    expect(listAddressBalances).toHaveBeenCalledTimes(1);
  });

  it("should return the correct ETH balance", async () => {
    Coinbase.apiClients.address = {
      ...addressesApiMock,
      getAddressBalance,
    };
    const ethBalance = await address.getBalance(Coinbase.assetList.Eth);
    expect(ethBalance).toBeInstanceOf(Decimal);
    expect(ethBalance).toEqual(new Decimal(1));
    expect(getAddressBalance).toHaveBeenCalledWith(
      address.getWalletId(),
      address.getId(),
      Coinbase.assetList.Eth,
    );
    expect(getAddressBalance).toHaveBeenCalledTimes(1);
  });

  it("should return the correct Gwei balance", async () => {
    const assetId = "gwei";
    Coinbase.apiClients.address = {
      ...addressesApiMock,
      getAddressBalance,
    };
    const ethBalance = await address.getBalance(assetId);
    expect(ethBalance).toBeInstanceOf(Decimal);
    expect(ethBalance).toEqual(new Decimal(1000000000));
    expect(getAddressBalance).toHaveBeenCalledWith(address.getWalletId(), address.getId(), assetId);
    expect(getAddressBalance).toHaveBeenCalledTimes(1);
  });

  it("should return the correct Wei balance", async () => {
    const assetId = "wei";
    Coinbase.apiClients.address = {
      ...addressesApiMock,
      getAddressBalance,
    };
    const ethBalance = await address.getBalance(assetId);
    expect(ethBalance).toBeInstanceOf(Decimal);
    expect(ethBalance).toEqual(new Decimal(1000000000000000000));
    expect(getAddressBalance).toHaveBeenCalledWith(address.getWalletId(), address.getId(), assetId);
    expect(getAddressBalance).toHaveBeenCalledTimes(1);
  });

  it("should return an error for an unsupported asset", async () => {
    const getAddressBalance = jest.fn().mockRejectedValue(new APIError(""));
    const assetId = "unsupported-asset";
    Coinbase.apiClients.address = {
      ...addressesApiMock,
      getAddressBalance,
    };
    await expect(address.getBalance(assetId)).rejects.toThrow(APIError);
    expect(getAddressBalance).toHaveBeenCalledWith(address.getWalletId(), address.getId(), assetId);
    expect(getAddressBalance).toHaveBeenCalledTimes(1);
  });

  it("should return the wallet ID", () => {
    expect(address.getWalletId()).toBe(VALID_ADDRESS_MODEL.wallet_id);
  });

  it("should throw an InternalError when model is not provided", () => {
    expect(() => new Address(null!)).toThrow(`Address model cannot be empty`);
  });

  it("should request funds from the faucet and returns the faucet transaction", async () => {
    Coinbase.apiClients.address = {
      ...addressesApiMock,
      requestFaucetFunds,
    };
    const faucetTransaction = await address.faucet();
    expect(faucetTransaction).toBeInstanceOf(FaucetTransaction);
    expect(faucetTransaction.getTransactionHash()).toBe(transactionHash);
    expect(requestFaucetFunds).toHaveBeenCalledWith(address.getWalletId(), address.getId());
    expect(requestFaucetFunds).toHaveBeenCalledTimes(1);
  });

  it("should throw an APIError when the request is unsuccesful", async () => {
    const requestFaucetFunds = jest.fn().mockRejectedValue(new APIError(""));
    Coinbase.apiClients.address = {
      ...addressesApiMock,
      requestFaucetFunds,
    };
    await expect(address.faucet()).rejects.toThrow(APIError);
    expect(requestFaucetFunds).toHaveBeenCalledWith(address.getWalletId(), address.getId());
    expect(requestFaucetFunds).toHaveBeenCalledTimes(1);
  });

  it("should throw a FaucetLimitReachedError when the faucet limit is reached", async () => {
    const requestFaucetFunds = jest.fn().mockRejectedValue(new FaucetLimitReachedError(""));
    Coinbase.apiClients.address = {
      ...addressesApiMock,
      requestFaucetFunds,
    };
    await expect(address.faucet()).rejects.toThrow(FaucetLimitReachedError);
    expect(requestFaucetFunds).toHaveBeenCalledTimes(1);
  });

  it("should throw an InternalError when the request fails unexpectedly", async () => {
    const requestFaucetFunds = jest.fn().mockRejectedValue(new InternalError(""));
    Coinbase.apiClients.address = {
      ...addressesApiMock,
      requestFaucetFunds,
    };
    await expect(address.faucet()).rejects.toThrow(InternalError);
    expect(requestFaucetFunds).toHaveBeenCalledTimes(1);
  });

  it("should return the correct string representation", () => {
    expect(address.toString()).toBe(
      `Coinbase:Address{addressId: '${VALID_ADDRESS_MODEL.address_id}', networkId: '${VALID_ADDRESS_MODEL.network_id}', walletId: '${VALID_ADDRESS_MODEL.wallet_id}'}`,
    );
  });
});
