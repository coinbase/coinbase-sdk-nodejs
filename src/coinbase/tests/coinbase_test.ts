import { Coinbase } from "../coinbase";
import MockAdapter from "axios-mock-adapter";
import axios from "axios";
import { APIError } from "../api_error";
import { VALID_WALLET_MODEL } from "./wallet_test";

const axiosMock = new MockAdapter(axios);
const PATH_PREFIX = "./src/coinbase/tests/config";

describe("Coinbase tests", () => {
  beforeEach(() => {
    axiosMock.reset();
  });

  it("should throw an error if the API key name or private key is empty", () => {
    expect(() => new Coinbase("", "test")).toThrow("Invalid configuration: apiKeyName is empty");
    expect(() => new Coinbase("test", "")).toThrow("Invalid configuration: privateKey is empty");
  });

  it("should throw an error if the file does not exist", () => {
    expect(() => Coinbase.configureFromJson(`${PATH_PREFIX}/does-not-exist.json`)).toThrow(
      "Invalid configuration: file not found at ./src/coinbase/tests/config/does-not-exist.json",
    );
  });

  it("should initialize the Coinbase SDK from a JSON file", () => {
    const cbInstance = Coinbase.configureFromJson(`${PATH_PREFIX}/coinbase_cloud_api_key.json`);
    expect(cbInstance).toBeInstanceOf(Coinbase);
  });

  it("should throw an error if there is an issue reading the file or parsing the JSON data", () => {
    expect(() => Coinbase.configureFromJson(`${PATH_PREFIX}/invalid.json`)).toThrow(
      "Invalid configuration: missing configuration values",
    );
  });

  it("should throw an error if the JSON file is not parseable", () => {
    expect(() => Coinbase.configureFromJson(`${PATH_PREFIX}/not_parseable.json`)).toThrow(
      "Not able to parse the configuration file",
    );
  });

  describe("should able to interact with the API", () => {
    const cbInstance = Coinbase.configureFromJson(
      `${PATH_PREFIX}/coinbase_cloud_api_key.json`,
      true,
    );
    let user;
    beforeEach(async () => {
      axiosMock.reset();
      axiosMock
        .onPost(/\/v1\/wallets\/.*\/addresses\/.*\/faucet/)
        .reply(200, { transaction_hash: "0xdeadbeef" })
        .onGet(/\/me/)
        .reply(200, {
          id: 123,
        })
        .onPost(/\/v1\/wallets/)
        .reply(200, VALID_WALLET_MODEL)
        .onGet(/\/v1\/wallets\/.*/)
        .reply(200, VALID_WALLET_MODEL);
      user = await cbInstance.getDefaultUser();
    });

    it("should return the correct user ID", () => {
      expect(user.getId()).toBe(123);
      expect(user.toString()).toBe("User{ userId: 123 }");
    });

    it("should be able to get faucet funds", async () => {
      const wallet = await user.createWallet();
      expect(wallet.getId()).toBe(VALID_WALLET_MODEL.id);

      const defaultAddress = wallet.defaultAddress();
      expect(defaultAddress?.getId()).toBe(VALID_WALLET_MODEL.default_address.address_id);

      const faucetTransaction = await wallet?.faucet();
      expect(faucetTransaction.getTransactionHash()).toBe("0xdeadbeef");
    });
  });

  it("should raise an error if the user is not found", async () => {
    axiosMock.onGet().reply(404);
    const cbInstance = Coinbase.configureFromJson(`${PATH_PREFIX}/coinbase_cloud_api_key.json`);
    await expect(cbInstance.getDefaultUser()).rejects.toThrow(APIError);
  });
});
