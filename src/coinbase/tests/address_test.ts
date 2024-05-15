import { ethers } from "ethers";
import { AddressesApiFactory, Address as AddressModel } from "../../client";
import { Address } from "./../address";
import { FaucetTransaction } from "./../faucet_transaction";

import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { randomUUID } from "crypto";

const axiosMock = new MockAdapter(axios);

const newEthAddress = ethers.Wallet.createRandom();

const VALID_ADDRESS_MODEL: AddressModel = {
  address_id: newEthAddress.address,
  network_id: "SEPOLIA",
  public_key: newEthAddress.publicKey,
  wallet_id: randomUUID(),
};

// Test suite for Address class
describe("Address", () => {
  const client = AddressesApiFactory();

  afterEach(() => {
    axiosMock.reset();
  });

  it("should create an Address instance", () => {
    const address = new Address(VALID_ADDRESS_MODEL, client);
    expect(address).toBeInstanceOf(Address);
    expect(address.getId()).toBe(newEthAddress.address);
    expect(address.getPublicKey()).toBe(newEthAddress.publicKey);
    expect(address.getNetworkId()).toBe(VALID_ADDRESS_MODEL.network_id);
    expect(address.getWalletId()).toBe(VALID_ADDRESS_MODEL.wallet_id);
  });

  it("should throw an InternalError if model is not provided", () => {
    expect(() => new Address(null!, client)).toThrow(`Address model cannot be empty`);
  });

  it("should throw an InternalError if client is not provided", () => {
    expect(() => new Address(VALID_ADDRESS_MODEL, null!)).toThrow(`Address client cannot be empty`);
  });

  it("should request faucet funds and return a FaucetTransaction", async () => {
    axiosMock.onPost().reply(200, {
      transaction_hash: "mocked_transaction_hash",
    });
    const address = new Address(VALID_ADDRESS_MODEL, client);
    const faucetTransaction = await address.faucet();
    expect(faucetTransaction).toBeInstanceOf(FaucetTransaction);
    expect(faucetTransaction.getTransactionHash()).toBe("mocked_transaction_hash");
  });

  it("should request faucet funds and throw an InternalError if the request does not return a transaction hash", async () => {
    axiosMock.onPost().reply(200, {});
    const address = new Address(VALID_ADDRESS_MODEL, client);
    await expect(address.faucet()).rejects.toThrow("Failed to complete faucet request");
  });

  it("should throw an AxiosError if faucet request fails", async () => {
    axiosMock.onPost().reply(400);
    const address = new Address(VALID_ADDRESS_MODEL, client);
    await expect(address.faucet()).rejects.toThrow("Request failed with status code 400");
  });

  it("should return the correct string representation", () => {
    const address = new Address(VALID_ADDRESS_MODEL, client);
    expect(address.toString()).toBe(
      `Coinbase:Address{addressId: '${VALID_ADDRESS_MODEL.address_id}', networkId: '${VALID_ADDRESS_MODEL.network_id}', walletId: '${VALID_ADDRESS_MODEL.wallet_id}'}`,
    );
  });
});
