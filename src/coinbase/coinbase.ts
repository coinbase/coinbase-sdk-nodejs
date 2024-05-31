import util from "util";
import globalAxios from "axios";
import * as fs from "fs";
import {
  User as UserModel,
  UsersApiFactory,
  TransfersApiFactory,
  AddressesApiFactory,
  WalletsApiFactory,
} from "../client";
import { ethers } from "ethers";
import { BASE_PATH } from "./../client/base";
import { Configuration } from "./../client/configuration";
import { CoinbaseAuthenticator } from "./authenticator";
import { InternalError, InvalidAPIKeyFormat, InvalidConfiguration } from "./errors";
import { ApiClients } from "./types";
import { User } from "./user";
import { logApiResponse, registerAxiosInterceptors } from "./utils";

/**
 * The Coinbase SDK.
 */
export class Coinbase {
  /**
   * The list of supported networks.
   *
   * @constant
   */
  static networkList = {
    BaseSepolia: "base-sepolia",
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
   * Initializes the Coinbase SDK.
   *
   * @class
   * @param apiKeyName - The API key name.
   * @param privateKey - The private key associated with the API key.
   * @param debugging - If true, logs API requests and responses to the console.
   * @param basePath - The base path for the API.
   * @throws {InternalError} If the configuration is invalid.
   * @throws {InvalidAPIKeyFormat} If not able to create JWT token.
   */
  constructor(
    apiKeyName: string,
    privateKey: string,
    debugging = false,
    basePath: string = BASE_PATH,
  ) {
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

    Coinbase.apiClients.user = UsersApiFactory(config, BASE_PATH, axiosInstance);
    Coinbase.apiClients.wallet = WalletsApiFactory(config, BASE_PATH, axiosInstance);
    Coinbase.apiClients.address = AddressesApiFactory(config, BASE_PATH, axiosInstance);
    Coinbase.apiClients.transfer = TransfersApiFactory(config, BASE_PATH, axiosInstance);
    Coinbase.apiClients.baseSepoliaProvider = new ethers.JsonRpcProvider(
      "https://sepolia.base.org",
    );
    Coinbase.apiKeyPrivateKey = privateKey;
  }

  /**
   * Reads the API key and private key from a JSON file and initializes the Coinbase SDK.
   *
   * @param filePath - The path to the JSON file containing the API key and private key.
   * @param debugging - If true, logs API requests and responses to the console.
   * @param basePath - The base path for the API.
   * @returns A new instance of the Coinbase SDK.
   * @throws {InvalidAPIKeyFormat} If the file does not exist or the configuration values are missing/invalid.
   * @throws {InvalidConfiguration} If the configuration is invalid.
   * @throws {InvalidAPIKeyFormat} If not able to create JWT token.
   */
  static configureFromJson(
    filePath: string = "coinbase_cloud_api_key.json",
    debugging: boolean = false,
    basePath: string = BASE_PATH,
  ): Coinbase {
    if (!fs.existsSync(filePath)) {
      throw new InvalidConfiguration(`Invalid configuration: file not found at ${filePath}`);
    }
    try {
      const data = fs.readFileSync(filePath, "utf8");
      const config = JSON.parse(data) as { name: string; privateKey: string };
      if (!config.name || !config.privateKey) {
        throw new InvalidAPIKeyFormat("Invalid configuration: missing configuration values");
      }

      return new Coinbase(config.name, config.privateKey, debugging, basePath);
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
  /**
   * Coinbase SDK string representation.
   *
   * @returns The string representation of the Coinbase SDK.
   */
  public toString(): string {
    return `Coinbase { networkList: ${Coinbase.networkList}, assets: ${Coinbase.assets} }`;
  }

  /**
   * Coinbase SDK string representation.
   *
   * @returns The string representation of the Coinbase SDK.
   */
  [util.inspect.custom](): string {
    return this.toString();
  }
}
