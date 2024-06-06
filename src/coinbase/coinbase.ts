import globalAxios from "axios";
import * as fs from "fs";
import {
  User as UserModel,
  UsersApiFactory,
  TransfersApiFactory,
  AddressesApiFactory,
  WalletsApiFactory,
  ServerSignersApiFactory,
} from "../client";
import { BASE_PATH } from "./../client/base";
import { Configuration } from "./../client/configuration";
import { CoinbaseAuthenticator } from "./authenticator";
import { InternalError, InvalidAPIKeyFormat, InvalidConfiguration } from "./errors";
import { ApiClients, CoinbaseConfigureFromJsonOptions, CoinbaseOptions } from "./types";
import { User } from "./user";
import { logApiResponse, registerAxiosInterceptors } from "./utils";
import * as os from "os";

/**
 * The Coinbase SDK.
 */
export class Coinbase {
  /**
   * The list of supported networks.
   *
   * @constant
   */
  static networks = {
    BaseSepolia: "base-sepolia",
    BaseMainnet: "base-mainnet",
  };

  /**
   * The list of supported assets.
   *
   * @constant
   */
  static assets = {
    Eth: "eth",
    Wei: "wei",
    Gwei: "gwei",
    Usdc: "usdc",
    Weth: "weth",
  };

  static apiClients: ApiClients = {};

  /**
   * The CDP API key Private Key.
   *
   * @constant
   */
  static apiKeyPrivateKey: string;

  /**
   * Whether to use a server signer or not.
   *
   * @constant
   */
  static useServerSigner: boolean;

  /**
   * Initializes the Coinbase SDK.
   *
   * @class
   * @param options - The constructor options.
   * @param options.apiKeyName - The API key name.
   * @param options.privateKey - The private key associated with the API key.
   * @param options.useServerSigner - Whether to use a Server-Signer or not.
   * @param options.debugging - If true, logs API requests and responses to the console.
   * @param options.basePath - The base path for the API.
   * @throws {InternalError} If the configuration is invalid.
   * @throws {InvalidAPIKeyFormat} If not able to create JWT token.
   */
  constructor({
    apiKeyName,
    privateKey,
    useServerSigner = false,
    debugging = false,
    basePath = BASE_PATH,
  }: CoinbaseOptions) {
    if (apiKeyName === "") {
      throw new InternalError("Invalid configuration: apiKeyName is empty");
    }
    if (privateKey === "") {
      throw new InternalError("Invalid configuration: privateKey is empty");
    }
    const coinbaseAuthenticator = new CoinbaseAuthenticator(apiKeyName, privateKey);
    const config = new Configuration({
      basePath: basePath,
    });
    const axiosInstance = globalAxios.create();
    registerAxiosInterceptors(
      axiosInstance,
      config => coinbaseAuthenticator.authenticateRequest(config, debugging),
      response => logApiResponse(response, debugging),
    );

    Coinbase.apiClients.user = UsersApiFactory(config, basePath, axiosInstance);
    Coinbase.apiClients.wallet = WalletsApiFactory(config, basePath, axiosInstance);
    Coinbase.apiClients.address = AddressesApiFactory(config, basePath, axiosInstance);
    Coinbase.apiClients.transfer = TransfersApiFactory(config, basePath, axiosInstance);
    Coinbase.apiClients.serverSigner = ServerSignersApiFactory(config, basePath, axiosInstance);
    Coinbase.apiKeyPrivateKey = privateKey;
    Coinbase.useServerSigner = useServerSigner;
  }

  /**
   * Reads the API key and private key from a JSON file and initializes the Coinbase SDK.
   *
   * @param options - The configuration options.
   * @param options.filePath - The path to the JSON file containing the API key and private key.
   * @param options.useServerSigner - Whether to use a Server-Signer or not.
   * @param options.debugging - If true, logs API requests and responses to the console.
   * @param options.basePath - The base path for the API.
   * @returns A new instance of the Coinbase SDK.
   * @throws {InvalidAPIKeyFormat} If the file does not exist or the configuration values are missing/invalid.
   * @throws {InvalidConfiguration} If the configuration is invalid.
   * @throws {InvalidAPIKeyFormat} If not able to create JWT token.
   */
  static configureFromJson({
    filePath = "coinbase_cloud_api_key.json",
    useServerSigner = false,
    debugging = false,
    basePath = BASE_PATH,
  }: CoinbaseConfigureFromJsonOptions = {}): Coinbase {
    filePath = filePath.startsWith("~") ? filePath.replace("~", os.homedir()) : filePath;

    if (!fs.existsSync(filePath)) {
      throw new InvalidConfiguration(`Invalid configuration: file not found at ${filePath}`);
    }
    try {
      const data = fs.readFileSync(filePath, "utf8");
      const config = JSON.parse(data) as { name: string; privateKey: string };
      if (!config.name || !config.privateKey) {
        throw new InvalidAPIKeyFormat("Invalid configuration: missing configuration values");
      }

      return new Coinbase({
        apiKeyName: config.name,
        privateKey: config.privateKey,
        useServerSigner: useServerSigner,
        debugging: debugging,
        basePath: basePath,
      });
    } catch (e) {
      if (e instanceof SyntaxError) {
        throw new InvalidAPIKeyFormat("Not able to parse the configuration file");
      } else {
        throw new InvalidAPIKeyFormat(
          `An error occurred while reading the configuration file: ${(e as Error).message}`,
        );
      }
    }
  }

  /**
   * Returns User object for the default user.
   *
   * @returns The default user.
   * @throws {APIError} If the request fails.
   */
  async getDefaultUser(): Promise<User> {
    const userResponse = await Coinbase.apiClients.user!.getCurrentUser();
    return new User(userResponse.data as UserModel);
  }
}
