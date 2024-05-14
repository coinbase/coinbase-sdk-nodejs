import { AddressesApiFactory, Address as AddressModel } from "../../client";
import { Address } from "./../address";
import { FaucetTransaction } from "./../faucet_transaction";

import axios from "axios";
import MockAdapter from "axios-mock-adapter";

const axiosMock = new MockAdapter(axios);

const VALID_ADDRESS_MODEL: AddressModel = {
  address_id: "mocked_address_id",
  network_id: "mocked_network_id",
  public_key: "mocked_public_key",
  wallet_id: "mocked_wallet_id",
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
    expect(address.getId()).toBe("mocked_address_id");
    expect(address.getNetworkId()).toBe("mocked_network_id");
    expect(address.getPublicKey()).toBe("mocked_public_key");
    expect(address.getWalletId()).toBe("mocked_wallet_id");
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
      "Coinbase:Address{addressId: 'mocked_address_id', networkId: 'mocked_network_id', walletId: 'mocked_wallet_id'}",
    );
  });
});
