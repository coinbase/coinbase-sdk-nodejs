import * as os from "os";
import * as fs from "fs";
import { randomUUID } from "crypto";
import { APIError } from "../coinbase/api_error";
import { Coinbase } from "../index";
import { Wallet } from "../coinbase/wallet";
import { NetworkIdentifier } from "../client";
import {
  VALID_WALLET_MODEL,
  addressesApiMock,
  generateRandomHash,
  mockReturnValue,
  walletsApiMock,
} from "./utils";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import path from "path";
import MockAdapter from "axios-mock-adapter";
import axios from "axios";

const PATH_PREFIX = "./src/tests/config";

describe("Coinbase tests", () => {
  describe(".networks", () => {
    it("returns a map of networks that match the api generated NetworkIdentifier", () => {
      expect(Coinbase.networks).toEqual(NetworkIdentifier);
    });

    it("returns the network ID when selecting a specific network", () => {
      expect(Coinbase.networks.BaseSepolia).toEqual("base-sepolia");
    });
  });

  it("should throw an error if the API key name or private key is empty", () => {
    expect(() => new Coinbase({ apiKeyName: "", privateKey: "test" })).toThrow(
      "Invalid configuration: apiKeyName is empty",
    );
    expect(() => new Coinbase({ apiKeyName: "test", privateKey: "" })).toThrow(
      "Invalid configuration: privateKey is empty",
    );
  });

  it("should throw an error if the file does not exist", () => {
    expect(() =>
      Coinbase.configureFromJson({ filePath: `${PATH_PREFIX}/does-not-exist.json` }),
    ).toThrow("Invalid configuration: file not found at ./src/tests/config/does-not-exist.json");
  });

  it("should initialize the Coinbase SDK from a JSON file", () => {
    const cbInstance = Coinbase.configureFromJson({
      filePath: `${PATH_PREFIX}/test_api_key.json`,
    });
    expect(cbInstance).toBeInstanceOf(Coinbase);
  });

  it("should throw an error if there is an issue reading the file or parsing the JSON data", () => {
    expect(() => Coinbase.configureFromJson({ filePath: `${PATH_PREFIX}/invalid.json` })).toThrow(
      "Invalid configuration: missing configuration values",
    );
  });

  it("should throw an error if the JSON file is not parseable", () => {
    expect(() =>
      Coinbase.configureFromJson({ filePath: `${PATH_PREFIX}/not_parseable.json` }),
    ).toThrow("Not able to parse the configuration file");
  });

  it("should expand the tilde to the home directory", () => {
    const configuration = fs.readFileSync(`${PATH_PREFIX}/test_api_key.json`, "utf8");
    const homeDir = os.homedir();
    const relativePath = "~/test_config.json";
    const expandedPath = path.join(homeDir, "test_config.json");
    fs.writeFileSync(expandedPath, configuration, "utf8");
    const cbInstance = Coinbase.configureFromJson({ filePath: relativePath });
    expect(cbInstance).toBeInstanceOf(Coinbase);
    fs.unlinkSync(expandedPath);
  });

  describe("should able to interact with the API", () => {
    let walletId, publicKey, addressId, transactionHash;
    const cbInstance = Coinbase.configureFromJson({
      filePath: `${PATH_PREFIX}/test_api_key.json`,
      debugging: true,
    });

    beforeEach(async () => {
      jest.clearAllMocks();
      Coinbase.apiClients = {
        wallet: walletsApiMock,
        address: addressesApiMock,
      };
      const ethAddress = privateKeyToAccount(generatePrivateKey());

      walletId = randomUUID();
      publicKey = ethAddress.publicKey;
      addressId = randomUUID();
      transactionHash = generateRandomHash(8);

      const walletModel = {
        id: walletId,
        network_id: Coinbase.networks.BaseSepolia,
        default_address: {
          wallet_id: walletId,
          address_id: addressId,
          public_key: publicKey,
          network_id: Coinbase.networks.BaseSepolia,
        },
      };

      Coinbase.apiClients.wallet!.createWallet = mockReturnValue(walletModel);
      Coinbase.apiClients.wallet!.getWallet = mockReturnValue(walletModel);
      Coinbase.apiClients.address!.requestFaucetFunds = mockReturnValue({
        transaction_hash: transactionHash,
      });
      Coinbase.apiClients.address!.createAddress = mockReturnValue(
        VALID_WALLET_MODEL.default_address,
      );
    });

    it("enables interaction with the API clients", async () => {
      const wallet = await Wallet.create({ networkId: NetworkIdentifier.BaseSepolia });

      expect(wallet.getId()).toEqual(walletId);
    });
  });
});

describe("Axios Interceptors", () => {
  it("should raise an error if the user is not found", async () => {
    const mock = new MockAdapter(axios);
    mock.onGet("/v1/wallets").reply(401, "unauthorized");
    const cbInstance = Coinbase.configureFromJson({
      filePath: `${PATH_PREFIX}/test_api_key.json`,
      debugging: true,
    });

    await expect(Wallet.listWallets()).rejects.toThrow(APIError);
  });
});
