import * as bip39 from "bip39";
import { Address as AddressModel, Wallet as WalletModel } from "../../client";
import { Wallet } from "../wallet";
import { ApiClients } from "./../types";

// Mock data
const VALID_WALLET_MODEL: WalletModel = {
  id: "mocked_wallet_id",
  network_id: "mocked_network_id",
  default_address: {
    address_id: "mocked_address_id",
    network_id: "mocked_network_id",
    public_key: "mocked_public_key",
    wallet_id: "mocked_wallet_id",
  },
};

const VALID_ADDRESS_MODEL: AddressModel = {
  address_id: "mocked_address_id",
  network_id: "mocked_network_id",
  public_key: "mocked_public_key",
  wallet_id: "mocked_wallet_id",
};

// Mock ApiClients
const mockClient: ApiClients = {
  address: {
    getAddress: jest.fn().mockResolvedValue({ data: VALID_ADDRESS_MODEL }),
    requestFaucetFunds: jest.fn(),
  },
  user: {
    getCurrentUser: jest.fn(),
  },
};

// Test suite for Wallet class
describe("Wallet", () => {
  const seed = bip39.generateMnemonic();
  it("should create a Wallet instance", () => {
    const wallet = new Wallet(VALID_WALLET_MODEL, mockClient, seed, 1);
    expect(wallet).toBeInstanceOf(Wallet);
    expect(wallet.getId()).toBe("mocked_wallet_id");
    expect(wallet.getNetworkId()).toBe("mocked_network_id");
    expect(wallet.defaultAddress()?.getId()).toBe("mocked_address_id");
  });

  it("should return the correct string representation", () => {
    const wallet = new Wallet(VALID_WALLET_MODEL, mockClient);
    expect(wallet.toString()).toBe(
      "Wallet{id: 'mocked_wallet_id', network_id: 'mocked_network_id'}",
    );
  });

  it("should throw an InternalError if address client is not provided", () => {
    expect(() => new Wallet(VALID_WALLET_MODEL, undefined!)).toThrow(
      "Address client cannot be empty",
    );
  });
  it("should throw an InternalError if address client is not provided", () => {
    expect(() => new Wallet(undefined!, mockClient)).toThrow("Wallet model cannot be empty");
  });
});
