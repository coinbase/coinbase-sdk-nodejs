import { randomUUID } from "crypto";
import { APIError } from "../api_error";
import { Coinbase } from "../coinbase";
import {
  VALID_WALLET_MODEL,
  addressesApiMock,
  generateRandomHash,
  mockReturnRejectedValue,
  mockReturnValue,
  usersApiMock,
  walletsApiMock,
} from "./utils";

const PATH_PREFIX = "./src/coinbase/tests/config";

describe("Coinbase tests", () => {
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
    let user, walletId, publicKey, addressId, transactionHash;
    const cbInstance = Coinbase.configureFromJson(
      `${PATH_PREFIX}/coinbase_cloud_api_key.json`,
      true,
    );

    beforeAll(async () => {
      Coinbase.apiClients = {
        user: usersApiMock,
        wallet: walletsApiMock,
        address: addressesApiMock,
      };

      walletId = randomUUID();
      publicKey = generateRandomHash(8);
      addressId = randomUUID();
      transactionHash = generateRandomHash(8);

      const walletModel = {
        id: walletId,
        network_id: Coinbase.networkList.BaseSepolia,
        default_address: {
          wallet_id: walletId,
          address_id: addressId,
          public_key: publicKey,
          network_id: Coinbase.networkList.BaseSepolia,
        },
      };

      Coinbase.apiClients.user!.getCurrentUser = mockReturnValue({ id: 123 });
      Coinbase.apiClients.wallet!.createWallet = mockReturnValue(walletModel);
      Coinbase.apiClients.wallet!.getWallet = mockReturnValue(walletModel);
      Coinbase.apiClients.address!.requestFaucetFunds = mockReturnValue({
        transaction_hash: transactionHash,
      });
      Coinbase.apiClients.address!.createAddress = mockReturnValue(
        VALID_WALLET_MODEL.default_address,
      );

      user = await cbInstance.getDefaultUser();
    });

    it("should return the correct user ID", async () => {
      expect(user.getId()).toBe(123);
      expect(user.toString()).toBe("User{ userId: 123 }");
      expect(Coinbase.apiClients.user!.getCurrentUser).toHaveBeenCalledWith();
      expect(usersApiMock.getCurrentUser).toHaveBeenCalledTimes(1);
    });

    it("should be able to get faucet funds", async () => {
      const wallet = await user.createWallet();
      expect(wallet.getId()).toBe(walletId);
      const payload = { wallet: { network_id: Coinbase.networkList.BaseSepolia } };
      expect(walletsApiMock.createWallet).toHaveBeenCalledWith(payload);
      expect(walletsApiMock.createWallet).toHaveBeenCalledTimes(1);

      const defaultAddress = wallet.defaultAddress();
      expect(defaultAddress?.getId()).toBe(addressId);

      const faucetTransaction = await wallet?.faucet();
      expect(faucetTransaction.getTransactionHash()).toBe(transactionHash);
      expect(addressesApiMock.requestFaucetFunds).toHaveBeenCalledWith(
        defaultAddress.getWalletId(),
        defaultAddress?.getId(),
      );
      expect(addressesApiMock.requestFaucetFunds).toHaveBeenCalledTimes(1);
    });
  });

  it("should raise an error if the user is not found", async () => {
    const cbInstance = Coinbase.configureFromJson(`${PATH_PREFIX}/coinbase_cloud_api_key.json`);
    Coinbase.apiClients.user!.getCurrentUser = mockReturnRejectedValue(
      new APIError("User not found"),
    );

    await expect(cbInstance.getDefaultUser()).rejects.toThrow(APIError);
    expect(usersApiMock.getCurrentUser).toHaveBeenCalledWith();
    expect(usersApiMock.getCurrentUser).toHaveBeenCalledTimes(1);
  });
});
