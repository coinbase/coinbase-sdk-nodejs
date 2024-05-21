import { Address } from "./../address";
import { FaucetTransaction } from "./../faucet_transaction";

import Decimal from "decimal.js";
import { APIError, FaucetLimitReachedError } from "../api_error";
import { Coinbase } from "../coinbase";
import { InternalError } from "../errors";
import {
  VALID_ADDRESS_BALANCE_LIST,
  VALID_ADDRESS_MODEL,
  addressesApiMock,
  generateRandomHash,
  mockFn,
  mockReturnRejectedValue,
} from "./utils";

// Test suite for Address class
describe("Address", () => {
  const transactionHash = generateRandomHash();
  let address: Address, balanceModel;

  beforeAll(() => {
    Coinbase.apiClients.address = addressesApiMock;
    Coinbase.apiClients.address!.getAddressBalance = mockFn(request => {
      const { asset_id } = request;
      balanceModel = {
        amount: "1000000000000000000",
        asset: {
          asset_id,
          network_id: Coinbase.networkList.BaseSepolia,
        },
      };
      return { data: balanceModel };
    });
    Coinbase.apiClients.address!.listAddressBalances = mockFn(() => {
      return { data: VALID_ADDRESS_BALANCE_LIST };
    });
    Coinbase.apiClients.address!.requestFaucetFunds = mockFn(() => {
      return { data: { transaction_hash: transactionHash } };
    });
  });

  beforeEach(() => {
    address = new Address(VALID_ADDRESS_MODEL);
    jest.clearAllMocks();
  });

  it("should initialize a new Address", () => {
    expect(address).toBeInstanceOf(Address);
  });

  it("should return the address ID", () => {
    expect(address.getId()).toBe(VALID_ADDRESS_MODEL.address_id);
  });

  it("should return the network ID", () => {
    expect(address.getNetworkId()).toBe(VALID_ADDRESS_MODEL.network_id);
  });

  it("should return the correct list of balances", async () => {
    const balances = await address.listBalances();
    expect(balances.get(Coinbase.assetList.Eth)).toEqual(new Decimal(1));
    expect(balances.get("usdc")).toEqual(new Decimal(5000));
    expect(balances.get("weth")).toEqual(new Decimal(3));
    expect(Coinbase.apiClients.address!.listAddressBalances).toHaveBeenCalledWith(
      address.getWalletId(),
      address.getId(),
    );
    expect(Coinbase.apiClients.address!.listAddressBalances).toHaveBeenCalledTimes(1);
  });

  it("should return the correct ETH balance", async () => {
    const ethBalance = await address.getBalance(Coinbase.assetList.Eth);
    expect(ethBalance).toBeInstanceOf(Decimal);
    expect(ethBalance).toEqual(new Decimal(1));
    expect(Coinbase.apiClients.address!.getAddressBalance).toHaveBeenCalledWith(
      address.getWalletId(),
      address.getId(),
      Coinbase.assetList.Eth,
    );
    expect(Coinbase.apiClients.address!.getAddressBalance).toHaveBeenCalledTimes(1);
  });

  it("should return the correct Gwei balance", async () => {
    const assetId = "gwei";
    const ethBalance = await address.getBalance(assetId);
    expect(ethBalance).toBeInstanceOf(Decimal);
    expect(ethBalance).toEqual(new Decimal(1000000000));
    expect(Coinbase.apiClients.address!.getAddressBalance).toHaveBeenCalledWith(
      address.getWalletId(),
      address.getId(),
      assetId,
    );
    expect(Coinbase.apiClients.address!.getAddressBalance).toHaveBeenCalledTimes(1);
  });

  it("should return the correct Wei balance", async () => {
    const assetId = "wei";
    const ethBalance = await address.getBalance(assetId);
    expect(ethBalance).toBeInstanceOf(Decimal);
    expect(ethBalance).toEqual(new Decimal(1000000000000000000));
    expect(Coinbase.apiClients.address!.getAddressBalance).toHaveBeenCalledWith(
      address.getWalletId(),
      address.getId(),
      assetId,
    );
    expect(Coinbase.apiClients.address!.getAddressBalance).toHaveBeenCalledTimes(1);
  });

  it("should return an error for an unsupported asset", async () => {
    const getAddressBalance = jest.fn().mockRejectedValue(new APIError(""));
    const assetId = "unsupported-asset";
    Coinbase.apiClients.address!.getAddressBalance = getAddressBalance;
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
    const faucetTransaction = await address.faucet();
    expect(faucetTransaction).toBeInstanceOf(FaucetTransaction);
    expect(faucetTransaction.getTransactionHash()).toBe(transactionHash);
    expect(Coinbase.apiClients.address!.requestFaucetFunds).toHaveBeenCalledWith(
      address.getWalletId(),
      address.getId(),
    );
    expect(Coinbase.apiClients.address!.requestFaucetFunds).toHaveBeenCalledTimes(1);
  });

  it("should throw an APIError when the request is unsuccesful", async () => {
    Coinbase.apiClients.address!.requestFaucetFunds = mockReturnRejectedValue(new APIError(""));
    await expect(address.faucet()).rejects.toThrow(APIError);
    expect(Coinbase.apiClients.address!.requestFaucetFunds).toHaveBeenCalledWith(
      address.getWalletId(),
      address.getId(),
    );
    expect(Coinbase.apiClients.address!.requestFaucetFunds).toHaveBeenCalledTimes(1);
  });

  it("should throw a FaucetLimitReachedError when the faucet limit is reached", async () => {
    Coinbase.apiClients.address!.requestFaucetFunds = mockReturnRejectedValue(
      new FaucetLimitReachedError(""),
    );
    await expect(address.faucet()).rejects.toThrow(FaucetLimitReachedError);
    expect(Coinbase.apiClients.address!.requestFaucetFunds).toHaveBeenCalledTimes(1);
  });

  it("should throw an InternalError when the request fails unexpectedly", async () => {
    Coinbase.apiClients.address!.requestFaucetFunds = mockReturnRejectedValue(
      new InternalError(""),
    );
    await expect(address.faucet()).rejects.toThrow(InternalError);
    expect(Coinbase.apiClients.address!.requestFaucetFunds).toHaveBeenCalledTimes(1);
  });

  it("should return the correct string representation", () => {
    expect(address.toString()).toBe(
      `Coinbase:Address{addressId: '${VALID_ADDRESS_MODEL.address_id}', networkId: '${VALID_ADDRESS_MODEL.network_id}', walletId: '${VALID_ADDRESS_MODEL.wallet_id}'}`,
    );
  });
});
