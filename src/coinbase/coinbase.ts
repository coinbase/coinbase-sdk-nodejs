import globalAxios from "axios";
import fs from "fs";
import { UsersApiFactory } from "../client";
import { BASE_PATH } from "./../client/base";
import { Configuration } from "./../client/configuration";
import { CoinbaseAuthenticator } from "./authenticator";
import { ApiClients } from "./types";
import { User } from "./user";
import { logApiResponse } from "./utils";
import { InternalError, InvalidConfiguration } from "./errors";

// The Coinbase SDK.
export class Coinbase {
  apiClients: ApiClients = {};

  /**
   * Initializes the Coinbase SDK.
   * @constructor
   * @param {string} apiKeyName - The API key name.
   * @param {string} privateKey - The private key associated with the API key.
   */
  constructor(
    apiKeyName: string,
    privateKey: string,
    debugging = false,
    basePath: string = BASE_PATH,
  ) {
    if (apiKeyName === "" || privateKey === "") {
      throw new InvalidConfiguration("Invalid configuration: privateKey or apiKeyName is empty");
    }
    const coinbaseAuthenticator = new CoinbaseAuthenticator(apiKeyName, privateKey);
    const config = new Configuration({
      basePath: basePath,
    });
    const axiosInstance = globalAxios.create();
    axiosInstance.interceptors.request.use(config =>
      coinbaseAuthenticator.authenticateRequest(config, debugging),
    );
    axiosInstance.interceptors.response.use(response => logApiResponse(response, debugging));
    this.apiClients.user = UsersApiFactory(config, BASE_PATH, axiosInstance);
  }

  /**
   * Reads the API key and private key from a JSON file and returns a new instance of Coinbase.
   * @param {string} filePath - The path to the JSON file containing the API key and private key.
   * @returns {Coinbase} A new instance of the Coinbase SDK.
   * @throws {InternalError} If the file does not exist or the configuration values are missing.
   */
  static fromJsonConfig(
    filePath: string = "coinbase_cloud_api_key.json",
    debugging = false,
    basePath: string = BASE_PATH,
  ): Coinbase {
    if (!fs.existsSync(filePath)) {
      throw new InternalError(`Invalid configuration: file not found at ${filePath}`);
    }
    try {
      const data = fs.readFileSync(filePath, "utf8");
      const config = JSON.parse(data);
      if (!config.name || !config.privateKey) {
        throw new InternalError("Invalid configuration: missing configuration values");
      }

      // Return a new instance of Coinbase
      return new Coinbase(config.name, config.privateKey, debugging, basePath);
    } catch (e) {
      throw new InternalError(`Not able to parse the configuration file`);
    }
  }

  /**
   * Returns the default user.
   * @returns {User} The default user.
   * @throws {Error} If the user is not found or HTTP request fails.
   */
  async defaultUser(): Promise<User> {
    const user = await this.apiClients.user?.getCurrentUser();
    return new User(user?.data?.id as string, this.apiClients);
  }
}
