import * as os from "os";
import * as fs from "fs";
import { randomUUID } from "crypto";
import { APIError } from "../coinbase/api_error";
import { Coinbase, UninitializedSDKError } from "../index";
import { Wallet } from "../coinbase/wallet";
import { NetworkIdentifier } from "../client";
import {
  VALID_WALLET_MODEL,
  addressesApiMock,
  generateRandomHash,
  mockReturnValue,
  walletsApiMock,
} from "./utils";
import { ethers } from "ethers";
import path from "path";
import MockAdapter from "axios-mock-adapter";
import axios from "axios";

const PATH_PREFIX = "./src/tests/config";

describe("Coinbase tests", () => {
  // General tests that don't depend on the actual key file contents.
  describe(".networks", () => {
    it("returns a map of networks that match the api generated NetworkIdentifier", () => {
      expect(Coinbase.networks).toEqual(NetworkIdentifier);
    });

    it("returns the network ID when selecting a specific network", () => {
      expect(Coinbase.networks.BaseSepolia).toEqual("base-sepolia");
    });
  });

  it("should throw UninitializedSDKError when accessing API clients without initialization", async () => {
    // Reset the apiClients to a fresh proxy state
    Coinbase.apiClients = new Proxy({} as any, {
      get(target, prop) {
        if (!Reflect.has(target, prop)) {
          throw new UninitializedSDKError();
        }
        return Reflect.get(target, prop);
      }
    });
  
    expect(() => {
      Coinbase.apiClients.wallet;
    }).toThrow(UninitializedSDKError);
    
    // Verify the error message
    try {
      Coinbase.apiClients.wallet;
    } catch (error) {
      expect((error as Error).message).toEqual(UninitializedSDKError.DEFAULT_MESSAGE);
    }
    
    // Then try to call a method that uses the API client
    await expect(Wallet.listWallets()).rejects.toThrow(UninitializedSDKError);
  });

  it("should throw an error if the API key name or private key is empty", () => {
    expect(() => Coinbase.configure({ apiKeyName: "", privateKey: "test" })).toThrow(
      "Invalid configuration: apiKeyName is empty",
    );
    expect(() => Coinbase.configure({ apiKeyName: "test", privateKey: "" })).toThrow(
      "Invalid configuration: privateKey is empty",
    );
  });

  it("should throw an error if the file does not exist", () => {
    expect(() =>
      Coinbase.configureFromJson({ filePath: `${PATH_PREFIX}/does-not-exist.json` }),
    ).toThrow("Invalid configuration: file not found at ./src/tests/config/does-not-exist.json");
  });

  it("should throw an error if there is an issue reading the file or parsing the JSON data", () => {
    expect(() => Coinbase.configureFromJson({ filePath: `${PATH_PREFIX}/invalid.json` })).toThrow(
      "Invalid configuration: missing API key identifier or privateKey",
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

  // Helper function to run API interaction tests with a given config file.
  const runApiInteractionTests = (filePath: string) => {
    describe(`Using key file: ${filePath}`, () => {
      let walletId: string, publicKey: string, addressId: string, transactionHash: string;
      // Initialize an instance with debugging enabled.
      const cbInstance = Coinbase.configureFromJson({
        filePath,
        debugging: true,
      });

      beforeEach(async () => {
        jest.clearAllMocks();
        Coinbase.apiClients = {
          wallet: walletsApiMock,
          address: addressesApiMock,
        };
        const ethAddress = ethers.Wallet.createRandom();

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
        Coinbase.apiClients.address!.createAddress = mockReturnValue(
          VALID_WALLET_MODEL.default_address,
        );
      });

      it("enables interaction with the API clients", async () => {
        const wallet = await Wallet.create({ networkId: NetworkIdentifier.BaseSepolia });
        expect(wallet.getId()).toEqual(walletId);
      });
    });
  };

  // Group tests by key type.
  describe("Standard API Key tests", () => {
    const keyFiles = [
      { description: "with name", path: `${PATH_PREFIX}/test_api_key.json` },
      { description: "with only id", path: `${PATH_PREFIX}/test_api_key_with_only_id.json` },
    ];

    keyFiles.forEach(({ description, path: filePath }) => {
      describe(`Standard API key ${description}`, () => {
        it("should initialize the Coinbase SDK from a JSON file", () => {
          const cbInstance = Coinbase.configureFromJson({ filePath });
          expect(cbInstance).toBeInstanceOf(Coinbase);
        });
        runApiInteractionTests(filePath);
      });
    });
  });

  describe("ED25519 API Key tests", () => {
    const keyFiles = [
      { description: "with name", path: `${PATH_PREFIX}/test_ed25519_api_key.json` },
      {
        description: "with only id",
        path: `${PATH_PREFIX}/test_ed25519_api_key_with_only_id.json`,
      },
    ];

    keyFiles.forEach(({ description, path: filePath }) => {
      describe(`ED25519 API key ${description}`, () => {
        it("should initialize the Coinbase SDK from a JSON file", () => {
          const cbInstance = Coinbase.configureFromJson({ filePath });
          expect(cbInstance).toBeInstanceOf(Coinbase);
        });
        runApiInteractionTests(filePath);
      });
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
