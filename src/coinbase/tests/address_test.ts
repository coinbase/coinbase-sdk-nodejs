import { ethers } from "ethers";
import { AddressesApiFactory, Address as AddressModel } from "../../client";
import { Address } from "./../address";
import { FaucetTransaction } from "./../faucet_transaction";

import MockAdapter from "axios-mock-adapter";
import { randomUUID } from "crypto";
import { APIError, FaucetLimitReachedError } from "../api_error";
import { Coinbase } from "../coinbase";
import { InternalError } from "../errors";
import { createAxiosMock } from "./utils";

const newEthAddress = ethers.Wallet.createRandom();

const VALID_ADDRESS_MODEL: AddressModel = {
  address_id: newEthAddress.address,
  network_id: Coinbase.networkList.BaseSepolia,
  public_key: newEthAddress.publicKey,
  wallet_id: randomUUID(),
};

// Test suite for Address class
describe("Address", () => {
  const [axiosInstance, configuration, BASE_PATH] = createAxiosMock();
  const client = AddressesApiFactory(configuration, BASE_PATH, axiosInstance);
  let address, axiosMock;

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

  it("should return the public key", () => {
    expect(address.getPublicKey()).toBe(newEthAddress.publicKey);
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
