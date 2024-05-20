import * as bip39 from "bip39";
import { Coinbase } from "../coinbase";
import { ArgumentError } from "../errors";
import { Wallet } from "../wallet";
import { VALID_WALLET_MODEL, addressesApiMock, walletsApiMock } from "./utils";

describe("Wallet Class", () => {
  let wallet;
  const seed = bip39.generateMnemonic();

  const client = {
    wallet: walletsApiMock,
    address: addressesApiMock,
  };

  beforeAll(async () => {
    wallet = await Wallet.init(VALID_WALLET_MODEL, client, seed, 2);
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
      expect(wallet.defaultAddress()?.getId()).toBe(VALID_WALLET_MODEL.default_address?.address_id);
    });

    it("should derive the correct number of addresses", async () => {
      expect(wallet.addresses.length).toBe(2);
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
