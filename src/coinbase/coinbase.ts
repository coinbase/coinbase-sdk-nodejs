import globalAxios, { AxiosError } from "axios";
import axiosRetry from "axios-retry";
import * as fs from "fs";
import {
  TransfersApiFactory,
  AddressesApiFactory,
  WalletsApiFactory,
  TradesApiFactory,
  ServerSignersApiFactory,
  StakeApiFactory,
  AssetsApiFactory,
  ExternalAddressesApiFactory,
  WebhooksApiFactory,
  NetworkIdentifier,
  ContractEventsApiFactory,
  ContractInvocationsApiFactory,
  BalanceHistoryApiFactory,
  SmartContractsApiFactory,
  TransactionHistoryApiFactory,
  MPCWalletStakeApiFactory,
  FundApiFactory,
  ReputationApiFactory,
  SmartWalletsApiFactory,
} from "../client";
import { BASE_PATH } from "./../client/base";
import { Configuration } from "./../client/configuration";
import { CoinbaseAuthenticator } from "./authenticator";
import {
  InvalidAPIKeyFormatError,
  InvalidConfigurationError,
  UninitializedSDKError,
} from "./errors";
import { ApiClients, CoinbaseConfigureFromJsonOptions, CoinbaseOptions } from "./types";
import { logApiResponse, registerAxiosInterceptors } from "./utils";
import * as os from "os";

/**
 * The Coinbase SDK.
 */
export class Coinbase {
  /**
   * The map of supported networks to network ID. Generated from the OpenAPI spec.
   *
   * @constant
   *
   * @example
   * ```typescript
   * Coinbase.networks.BaseMainnet
   * ```
   */
  static networks = NetworkIdentifier;

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
    Sol: "sol",
    Lamport: "lamport",
    Eurc: "eurc",
    Cbbtc: "cbbtc",
  };

  static apiClients: ApiClients = new Proxy({} as ApiClients, {
    get(target, prop) {
      if (!Reflect.has(target, prop)) {
        throw new UninitializedSDKError();
      }
      return Reflect.get(target, prop);
    },
  });

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
   * The default page limit for list methods.
   *
   * @constant
   */
  static defaultPageLimit: number = 100;

  /**
   * Initializes the Coinbase SDK.
   *
   * @deprecated as of v0.5.0, use `configure` or `configureFromJson` instead.
   *
   * @class
   * @param options - The constructor options.
   * @param options.apiKeyName - The API key name.
   * @param options.privateKey - The private key associated with the API key.
   * @param options.useServerSigner - Whether to use a Server-Signer or not.
   * @param options.debugging - If true, logs API requests and responses to the console.
   * @param options.basePath - The base path for the API.
   * @param options.maxNetworkRetries - The maximum number of network retries for the API GET requests.
   * @param options.source - Optional source string to be sent with the API requests. Defaults to `sdk`.
   * @param options.sourceVersion - Optional source version string to be sent with the API requests.
   * @throws {InvalidConfigurationError} If the configuration is invalid.
   * @throws {InvalidAPIKeyFormatError} If not able to create JWT token.
   */
  constructor({
    apiKeyName,
    privateKey,
    useServerSigner = false,
    debugging = false,
    basePath = BASE_PATH,
    maxNetworkRetries = 3,
    source = "sdk",
    sourceVersion = undefined,
  }: CoinbaseOptions) {
    if (apiKeyName === "") {
      throw new InvalidConfigurationError("Invalid configuration: apiKeyName is empty");
    }
    if (privateKey === "") {
      throw new InvalidConfigurationError("Invalid configuration: privateKey is empty");
    }
    const coinbaseAuthenticator = new CoinbaseAuthenticator(
      apiKeyName,
      privateKey,
      source,
      sourceVersion,
    );
    const config = new Configuration({
      basePath: basePath,
    });
    const axiosInstance = globalAxios.create();
    axiosRetry(axiosInstance, {
      retries: maxNetworkRetries,
      retryCondition: (error: AxiosError) => {
        return (
          error.config?.method?.toUpperCase() === "GET" &&
          (error.response?.status || 0) in [500, 502, 503, 504]
        );
      },
    });
    registerAxiosInterceptors(
      axiosInstance,
      config => coinbaseAuthenticator.authenticateRequest(config, debugging),
      /* istanbul ignore file */
      response => logApiResponse(response, debugging),
    );

    Coinbase.apiClients.wallet = WalletsApiFactory(config, basePath, axiosInstance);
    Coinbase.apiClients.smartWallet = SmartWalletsApiFactory(config, basePath, axiosInstance);
    Coinbase.apiClients.address = AddressesApiFactory(config, basePath, axiosInstance);
    Coinbase.apiClients.transfer = TransfersApiFactory(config, basePath, axiosInstance);
    Coinbase.apiClients.trade = TradesApiFactory(config, basePath, axiosInstance);
    Coinbase.apiClients.serverSigner = ServerSignersApiFactory(config, basePath, axiosInstance);
    Coinbase.apiClients.stake = StakeApiFactory(config, basePath, axiosInstance);
    Coinbase.apiClients.walletStake = MPCWalletStakeApiFactory(config, basePath, axiosInstance);
    Coinbase.apiClients.asset = AssetsApiFactory(config, basePath, axiosInstance);
    Coinbase.apiClients.webhook = WebhooksApiFactory(config, basePath, axiosInstance);
    Coinbase.apiClients.contractInvocation = ContractInvocationsApiFactory(
      config,
      basePath,
      axiosInstance,
    );
    Coinbase.apiClients.externalAddress = ExternalAddressesApiFactory(
      config,
      basePath,
      axiosInstance,
    );
    Coinbase.apiClients.balanceHistory = BalanceHistoryApiFactory(config, basePath, axiosInstance);
    Coinbase.apiClients.contractEvent = ContractEventsApiFactory(config, basePath, axiosInstance);
    Coinbase.apiClients.smartContract = SmartContractsApiFactory(config, basePath, axiosInstance);
    Coinbase.apiClients.fund = FundApiFactory(config, basePath, axiosInstance);
    Coinbase.apiClients.transactionHistory = TransactionHistoryApiFactory(
      config,
      basePath,
      axiosInstance,
    );
    Coinbase.apiKeyPrivateKey = privateKey;
    Coinbase.useServerSigner = useServerSigner;
    Coinbase.apiClients.addressReputation = ReputationApiFactory(config, basePath, axiosInstance);
  }

  /**
   * Configures the Coinbase SDK with the provided options.
   *
   * @param options - The configuration options.
   * @param options.apiKeyName - The name of the API key.
   * @param options.privateKey - The private key associated with the API key.
   * @param options.useServerSigner - Whether to use a Server-Signer or not. Defaults to false.
   * @param options.debugging - If true, logs API requests and responses to the console. Defaults to false.
   * @param options.basePath - The base path for the API. Defaults to BASE_PATH.
   * @param options.source - Optional source string to be sent with the API requests. Defaults to `sdk`.
   * @param options.sourceVersion - Optional source version string to be sent with the API requests.
   * @returns A new instance of the Coinbase SDK.
   */
  static configure({
    apiKeyName,
    privateKey,
    useServerSigner = false,
    debugging = false,
    basePath = BASE_PATH,
    source = "sdk",
    sourceVersion = undefined,
  }: CoinbaseOptions) {
    return new Coinbase({
      apiKeyName,
      privateKey,
      useServerSigner,
      debugging,
      basePath,
      source,
      sourceVersion,
    });
  }

  /**
   * Reads the API key and private key from a JSON file and initializes the Coinbase SDK.
   *
   * @param options - The configuration options.
   * @param options.filePath - The path to the JSON file containing the API key and private key.
   * @param options.useServerSigner - Whether to use a Server-Signer or not.
   * @param options.debugging - If true, logs API requests and responses to the console.
   * @param options.basePath - The base path for the API.
   * @param options.source - Optional source string to be sent with the API requests. Defaults to `sdk`.
   * @param options.sourceVersion - Optional source version string to be sent with the API requests.
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
    source = "sdk",
    sourceVersion = undefined,
  }: CoinbaseConfigureFromJsonOptions = {}): Coinbase {
    filePath = filePath.startsWith("~") ? filePath.replace("~", os.homedir()) : filePath;

    if (!fs.existsSync(filePath)) {
      throw new InvalidConfigurationError(`Invalid configuration: file not found at ${filePath}`);
    }
    try {
      const data = fs.readFileSync(filePath, "utf8");
      // Support both "name" and "id" for the API key identifier.
      const config = JSON.parse(data) as { name?: string; id?: string; privateKey: string };
      const apiKeyIdentifier = config.name || config.id;
      if (!apiKeyIdentifier || !config.privateKey) {
        throw new InvalidAPIKeyFormatError(
          "Invalid configuration: missing API key identifier or privateKey",
        );
      }

      return new Coinbase({
        apiKeyName: apiKeyIdentifier,
        privateKey: config.privateKey,
        useServerSigner: useServerSigner,
        debugging: debugging,
        basePath: basePath,
        source,
        sourceVersion,
      });
    } catch (e) {
      if (e instanceof SyntaxError) {
        throw new InvalidAPIKeyFormatError("Not able to parse the configuration file");
      } else {
        throw new InvalidAPIKeyFormatError(
          `An error occurred while reading the configuration file: ${(e as Error).message}`,
        );
      }
    }
  }

  /**
   * Converts a network symbol to a string, replacing underscores with hyphens.
   *
   * @param network - The network symbol to convert
   * @returns the converted string
   */
  static normalizeNetwork(network: string): string {
    return network.replace(/_/g, "-");
  }

  /**
   * Converts a string to a symbol, replacing hyphens with underscores.
   *
   * @param asset - The string to convert
   * @returns the converted symbol
   */
  static toAssetId(asset: string): string {
    return asset.replace(/-/g, "_");
  }
}
