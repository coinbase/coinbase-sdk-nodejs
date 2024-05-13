import globalAxios from "axios";
import fs from "fs";
import { UsersApiFactory } from "../client";
import { BASE_PATH } from "./../client/base";
import { Configuration } from "./../client/configuration";
import { CoinbaseAuthenticator } from "./authenticator";
import { InvalidConfiguration } from "./errors";
import { ApiClients } from "./types";
import { User } from "./user";

// The Coinbase SDK.
export class Coinbase {
  apiClients: ApiClients = {};

  /**
   * Initializes the Coinbase SDK.
   * @constructor
   * @param {string} apiKeyName - The API key name.
   * @param {string} privateKey - The private key associated with the API key.
   */
  constructor(apiKeyName: string, privateKey: string) {
    if (apiKeyName === "" || privateKey === "") {
      throw InvalidConfiguration;
    }
    const coinbaseAuthenticator = new CoinbaseAuthenticator(apiKeyName, privateKey);
    const config = new Configuration({
      basePath: BASE_PATH,
    });
    const axiosInstance = globalAxios.create();
    axiosInstance.interceptors.request.use(config =>
      coinbaseAuthenticator.authenticateRequest(config),
    );
    this.apiClients.user = UsersApiFactory(config, BASE_PATH, axiosInstance);
  }

  /**
   * Reads the API key and private key from a JSON file and returns a new instance of Coinbase.
   * @param {string} filePath - The path to the JSON file containing the API key and private key.
   * @returns {Coinbase} A new instance of the Coinbase SDK.
   */
  static fromJsonConfig(filePath: string = "coinbase_cloud_api_key.json"): Coinbase {
    /* Read the JSON file for a given path and return a new instance of Coinbase check if the file exists */
    if (!fs.existsSync(filePath)) {
      // throw an error if the file does not exist
      throw InvalidConfiguration;
    }
    // read the file and parse the JSON data
    try {
      // read the file and parse the JSON data
      const data = fs.readFileSync(filePath, "utf8");

      // parse the JSON data
      const config = JSON.parse(data);

      // return a new instance of Coinbase
      if (!config.name || !config.privateKey) {
        throw InvalidConfiguration;
      }
      return new Coinbase(config.name, config.privateKey);
    } catch (e) {
      throw InvalidConfiguration;
    }
  }

  /**
   * Returns the default user.
   * @returns {User} The default user.
   */
  async defaultUser(): Promise<User> {
    const user = await this.apiClients.user?.getCurrentUser();
    return new User(user?.data?.id || "", this.apiClients);
  }
}
