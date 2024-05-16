import globalAxios from "axios";
import fs from "fs";
import { AddressesApiFactory, User as UserModel, UsersApiFactory, WalletsApiFactory } from "../client";
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

  apiClients: ApiClients = {};

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

    this.apiClients.user = UsersApiFactory(config, BASE_PATH, axiosInstance);
    this.apiClients.wallet = WalletsApiFactory(config, BASE_PATH, axiosInstance);
    this.apiClients.address = AddressesApiFactory(config, BASE_PATH, axiosInstance);
  }

  /**
   * Reads the API key and private key from a JSON file and initializes the Coinbase SDK.
   *
   * @param filePath - The path to the JSON file containing the API key and private key.
   * @param debugging - If true, logs API requests and responses to the console.
   * @param basePath - The base path for the API.
   * @returns {Coinbase} A new instance of the Coinbase SDK.
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
   * @returns {User} The default user.
   * @throws {APIError} If the request fails.
   */
  async getDefaultUser(): Promise<User> {
    const userResponse = await this.apiClients.user!.getCurrentUser();
    return new User(userResponse.data as UserModel, this.apiClients);
  }
}
