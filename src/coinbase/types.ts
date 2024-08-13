import { Decimal } from "decimal.js";
import { AxiosPromise, AxiosRequestConfig, RawAxiosRequestConfig } from "axios";
import {
  Address as AddressModel,
  AddressList,
  AddressBalanceList,
  AddressHistoricalBalanceList,
  Balance,
  CreateAddressRequest,
  CreateWalletRequest,
  BroadcastTransferRequest,
  CreateTransferRequest,
  TransferList,
  User as UserModel,
  Wallet as WalletModel,
  Transfer as TransferModel,
  Trade as TradeModel,
  Asset as AssetModel,
  WalletList,
  TradeList as TradeListModel,
  CreateTradeRequest,
  BroadcastTradeRequest,
  ServerSignerList,
  BuildStakingOperationRequest,
  StakingOperation as StakingOperationModel,
  GetStakingContextRequest,
  StakingContext as StakingContextModel,
  FetchStakingRewardsRequest,
  FetchStakingRewards200Response,
  FaucetTransaction,
  BroadcastStakingOperationRequest,
  CreateStakingOperationRequest,
  ValidatorList,
  Validator,
  Webhook as WebhookModel,
  WebhookList,
  CreateWebhookRequest,
  UpdateWebhookRequest,
} from "./../client/api";
import { Address } from "./address";
import { Wallet } from "./wallet";
import { HistoricalBalance } from "./historical_balance";

export type AssetAPIClient = {
  /**
   * Get the asset for the specified asset ID.
   *
   * @summary Get the asset for the specified asset ID.
   * @param networkId - networkId The ID of the blockchain network.
   * @param assetId - assetId The ID of the asset to fetch.
   * @param options - Override http request option.
   * @throws {RequiredError} If the required parameter is not provided.
   */
  getAsset(
    networkId: string,
    assetId: string,
    options?: RawAxiosRequestConfig,
  ): AxiosPromise<AssetModel>;
};

export type TradeApiClients = {
  /**
   * Broadcast a trade.
   *
   * @param walletId - The ID of the wallet the address belongs to.
   * @param addressId - The ID of the address the trade belongs to.
   * @param tradeId - The ID of the trade to broadcast.
   * @param broadcastTradeRequest - The request body.
   * @param options - Override http request option.
   * @throws {RequiredError} If the required parameter is not provided.
   */
  broadcastTrade(
    walletId: string,
    addressId: string,
    tradeId: string,
    broadcastTradeRequest: BroadcastTradeRequest,
    options?: RawAxiosRequestConfig,
  ): AxiosPromise<TradeModel>;

  /**
   * Create a new trade.
   *
   * @param walletId - The ID of the wallet the source address belongs to.
   * @param addressId - The ID of the address to conduct the trade from.
   * @param createTradeRequest - The request body.
   * @param options - Override http request option.
   * @throws {RequiredError} If the required parameter is not provided.
   */
  createTrade(
    walletId: string,
    addressId: string,
    createTradeRequest: CreateTradeRequest,
    options?: RawAxiosRequestConfig,
  ): AxiosPromise<TradeModel>;

  /**
   * Get a trade by ID.
   *
   * @param walletId - The ID of the wallet the address belongs to.
   * @param addressId - The ID of the address the trade belongs to.
   * @param tradeId - The ID of the trade to fetch.
   * @param options - Override http request option.
   * @throws {RequiredError} If the required parameter is not provided.
   */
  getTrade(
    walletId: string,
    addressId: string,
    tradeId: string,
    options?: RawAxiosRequestConfig,
  ): AxiosPromise<TradeModel>;

  /**
   * List trades for an address.
   *
   * @param walletId - The ID of the wallet the address belongs to.
   * @param addressId - The ID of the address to list trades for.
   * @param limit - A limit on the number of objects to be returned. Limit can range between 1 and 100, and the default is 10.
   * @param page - A cursor for pagination across multiple pages of results. Don't include this parameter on the first call. Use the next_page value returned in a previous response to request subsequent results.
   * @param options - Override http request option.
   * @throws {RequiredError} If the required parameter is not provided.
   */
  listTrades(
    walletId: string,
    addressId: string,
    limit?: number,
    page?: string,
    options?: RawAxiosRequestConfig,
  ): AxiosPromise<TradeListModel>;
};

/**
 * WalletAPI client type definition.
 */
export type WalletAPIClient = {
  /**
   * Create a new wallet scoped to the user.
   *
   * @class
   * @param createdWalletRequest - The wallet creation request.
   * @param options - Axios request options.
   * @throws {APIError} If the request fails.
   */
  createWallet: (
    createWalletRequest?: CreateWalletRequest,
    options?: RawAxiosRequestConfig,
  ) => AxiosPromise<WalletModel>;

  /**
   * Returns the wallet model with the given ID.
   *
   * @param walletId - The ID of the wallet to fetch.
   * @param options - Override http request option.
   * @throws {APIError} If the request fails.
   */
  getWallet: (walletId: string, options?: RawAxiosRequestConfig) => AxiosPromise<WalletModel>;

  /**
   * List the balances of all of the addresses in the wallet aggregated by asset.
   *
   * @param walletId - The ID of the wallet to fetch the balances for.
   * @param options - Override http request option.
   * @throws {RequiredError} If the required parameter is not provided.
   * @throws {APIError} If the request fails.
   */
  listWalletBalances(
    walletId: string,
    options?: RawAxiosRequestConfig,
  ): AxiosPromise<AddressBalanceList>;

  /**
   * List the balances of all of the addresses in the wallet aggregated by asset.
   *
   * @param walletId - The ID of the wallet to fetch the balances for.
   * @param options - Override http request option.
   * @throws {RequiredError} If the required parameter is not provided.
   * @throws {APIError} If the request fails.
   */
  listWalletBalances(
    walletId: string,
    options?: RawAxiosRequestConfig,
  ): AxiosPromise<AddressBalanceList>;

  /**
   * Get the aggregated balance of an asset across all of the addresses in the wallet.
   *
   * @param walletId - The ID of the wallet to fetch the balance for.
   * @param assetId - The symbol of the asset to fetch the balance for.
   * @param options - Override http request option.
   * @throws {RequiredError} If the required parameter is not provided.
   * @throws {APIError} If the request fails.
   */
  getWalletBalance(
    walletId: string,
    assetId: string,
    options?: RawAxiosRequestConfig,
  ): AxiosPromise<Balance>;

  /**
   * List wallets belonging to the user.
   *
   * @param limit - A limit on the number of objects to be returned. Limit can range between 1 and 100, and the default is 10.
   * @param page - A cursor for pagination across multiple pages of results. Don\&#39;t include this parameter on the first call. Use the next_page value returned in a previous response to request subsequent results.
   * @param options - Override http request option.
   * @throws {APIError} If the request fails.
   * @throws {RequiredError} If the required parameter is not provided.
   */
  listWallets(
    limit?: number,
    page?: string,
    options?: RawAxiosRequestConfig,
  ): AxiosPromise<WalletList>;
};

/**
 * AddressAPI client type definition.
 */
export type AddressAPIClient = {
  /**
   * Requests faucet funds for the address.
   *
   * @param walletId - The wallet ID.
   * @param addressId - The address ID.
   * @returns The transaction hash.
   * @throws {APIError} If the request fails.
   */
  requestFaucetFunds(walletId: string, addressId: string): AxiosPromise<FaucetTransaction>;

  /**
   * Get address by onchain address.
   *
   * @param walletId - The ID of the wallet the address belongs to.
   * @param addressId - The onchain address of the address that is being fetched.
   * @param options - Axios request options.
   * @throws {APIError} If the request fails.
   */
  getAddress(
    walletId: string,
    addressId: string,
    options?: AxiosRequestConfig,
  ): AxiosPromise<AddressModel>;

  /**
   * Lists addresses.
   *
   * @param walletId - The ID of the wallet the addresses belong to.
   * @param limit - The maximum number of addresses to return.
   * @param page - A cursor for pagination across multiple pages of results. Do not include this parameter on the first call.
   *  Use the next_page value returned in a previous response to request subsequent results.
   * @param options - Override http request option.
   * @throws {APIError} If the request fails.
   */
  listAddresses(
    walletId: string,
    limit?: number,
    page?: string,
    options?: AxiosRequestConfig,
  ): AxiosPromise<AddressList>;

  /**
   * Get address balance
   *
   * @param walletId - The ID of the wallet to fetch the balance for.
   * @param addressId - The onchain address of the address that is being fetched.
   * @param assetId - The symbol of the asset to fetch the balance for.
   * @param options - Axios request options.
   * @throws {APIError}
   */
  getAddressBalance(
    walletId: string,
    addressId: string,
    assetId: string,
    options?: AxiosRequestConfig,
  ): AxiosPromise<Balance>;

  /**
   * Lists address balances
   *
   * @param walletId - The ID of the wallet to fetch the balances for.
   * @param addressId - The onchain address of the address that is being fetched.
   * @param page - A cursor for pagination across multiple pages of results. Do not include this parameter on the first call.
   *  Use the next_page value returned in a previous response to request subsequent results.
   * @param options - Override http request option.
   * @throws {APIError}
   */
  listAddressBalances(
    walletId: string,
    addressId: string,
    page?: string,
    options?: AxiosRequestConfig,
  ): AxiosPromise<AddressBalanceList>;

  /**
   * Create a new address scoped to the wallet.
   *
   * @param walletId - The ID of the wallet to create the address in.
   * @param createAddressRequest - The address creation request.
   * @param options - Axios request options.
   * @throws {APIError} If the request fails.
   */
  createAddress(
    walletId: string,
    createAddressRequest?: CreateAddressRequest,
    options?: AxiosRequestConfig,
  ): AxiosPromise<AddressModel>;
};

/**
 * ExternalAddressAPIClient client type definition.
 */
export type ExternalAddressAPIClient = {
  /**
   * List all of the balances of an external address
   *
   * @param networkId - The ID of the blockchain network
   * @param addressId - The ID of the address to fetch the balance for
   * @param page - A cursor for pagination across multiple pages of results. Don\&#39;t include this parameter on the first call. Use the next_page value returned in a previous response to request subsequent results.
   * @param options - Override http request option.
   * @throws {APIError} If the request fails.
   */
  listExternalAddressBalances(
    networkId: string,
    addressId: string,
    page?: string,
    options?: RawAxiosRequestConfig,
  ): AxiosPromise<AddressBalanceList>;

  /**
   * Get the balance of an asset in an external address
   *
   * @param networkId - The ID of the blockchain network
   * @param addressId - The ID of the address to fetch the balance for
   * @param assetId - The ID of the asset to fetch the balance for
   * @param options - Override http request option.
   * @throws {APIError} If the request fails.
   */
  getExternalAddressBalance(
    networkId: string,
    addressId: string,
    assetId: string,
    options?: RawAxiosRequestConfig,
  ): AxiosPromise<Balance>;

  /**
   * List the historical balance of an asset in a specific address.
   *
   * @summary Get address balance history for asset
   * @param networkId - The ID of the blockchain network
   * @param addressId - The ID of the address to fetch the historical balance for.
   * @param assetId - The symbol of the asset to fetch the historical balance for.
   * @param limit - A limit on the number of objects to be returned. Limit can range between 1 and 100, and the default is 10.
   * @param page - A cursor for pagination across multiple pages of results. Don\&#39;t include this parameter on the first call. Use the next_page value returned in a previous response to request subsequent results.
   * @param options - Override http request option.
   * @throws {RequiredError}
   */
  listAddressHistoricalBalance(
    networkId: string,
    addressId: string,
    assetId: string,
    limit?: number,
    page?: string,
    options?: RawAxiosRequestConfig,
  ): AxiosPromise<AddressHistoricalBalanceList>;

  /**
   * Request faucet funds to be sent to external address.
   *
   * @param networkId - The ID of the blockchain network
   * @param addressId - The onchain address of the address that is being fetched.
   * @param options - Override http request option.
   * @throws {APIError} If the request fails.
   */
  requestExternalFaucetFunds(
    networkId: string,
    addressId: string,
    options?: RawAxiosRequestConfig,
  ): AxiosPromise<FaucetTransaction>;
};

/**
 * UserAPI client type definition.
 */
export type UserAPIClient = {
  /**
   * Retrieves the current user.
   *
   * @param options - Axios request options.
   * @returns - A promise resolvindg to the User model.
   * @throws {APIError} If the request fails.
   */
  getCurrentUser(options?: AxiosRequestConfig): AxiosPromise<UserModel>;
};

export type StakeAPIClient = {
  /**
   * Build a new staking operation.
   *
   * @param buildStakingOperationRequest - The request to build a staking operation.
   * @param options - Axios request options.
   * @throws {APIError} If the request fails.
   */
  buildStakingOperation(
    buildStakingOperationRequest: BuildStakingOperationRequest,
    options?: AxiosRequestConfig,
  ): AxiosPromise<StakingOperationModel>;

  /**
   * Get a staking operation.
   *
   * @param networkId - The ID of the blockchain network
   * @param addressId - The ID of the address the staking operation corresponds to.
   * @param stakingOperationID - The ID of the staking operation to fetch.
   * @param options - Axios request options.
   * @throws {APIError} If the request fails.
   */
  getExternalStakingOperation(
    networkId: string,
    addressId: string,
    stakingOperationID: string,
    options?: AxiosRequestConfig,
  ): AxiosPromise<StakingOperationModel>;

  /**
   * Get staking context for an address.
   *
   * @param getStakingContextRequest - The request to get the staking context for an address.
   * @param options - Axios request options.
   * @throws {APIError} If the request fails.
   */
  getStakingContext(
    getStakingContextRequest: GetStakingContextRequest,
    options?: AxiosRequestConfig,
  ): AxiosPromise<StakingContextModel>;

  /**
   * Get the staking rewards for an address.
   *
   * @param fetchStakingRewardsRequest - The request to get the staking rewards for an address.
   * @param limit - The amount of records to return in a single call.
   * @param page - The batch of records for a given section in the response.
   * @param options - Axios request options.
   */
  fetchStakingRewards(
    fetchStakingRewardsRequest: FetchStakingRewardsRequest,
    limit?: number,
    page?: string,
    options?: AxiosRequestConfig,
  ): AxiosPromise<FetchStakingRewards200Response>;

  broadcastStakingOperation(
    walletId: string,
    addressId: string,
    stakingOperationId: string,
    broadcastStakingOperationRequest: BroadcastStakingOperationRequest,
    options?: AxiosRequestConfig,
  ): AxiosPromise<StakingOperationModel>;

  createStakingOperation(
    walletId: string,
    addressId: string,
    createStakingOperationRequest: CreateStakingOperationRequest,
    options?: AxiosRequestConfig,
  ): AxiosPromise<StakingOperationModel>;

  getStakingOperation(
    walletId: string,
    addressId: string,
    stakingOperationId: string,
    options?: AxiosRequestConfig,
  ): AxiosPromise<StakingOperationModel>;
};

export type ValidatorAPIClient = {
  /**
   * List the validators for a given network and asset.
   *
   * @param networkId - The ID of the blockchain network.
   * @param assetId - The ID of the asset to fetch the validator for.
   * @param status - The status to filter by.
   * @param limit - The amount of records to return in a single call.
   * @param page - The batch of records for a given section in the response.
   * @param options - Axios request options.
   */
  listValidators(
    networkId: string,
    assetId: string,
    status?: string,
    limit?: number,
    page?: string,
    options?: AxiosRequestConfig,
  ): AxiosPromise<ValidatorList>;

  /**
   * Get the validator for a given network, asset, and address.
   *
   * @param networkId - The ID of the blockchain network.
   * @param assetId - The ID of the asset to fetch the validator for.
   * @param id - The unique publicly identifiable id of the validator for which to fetch the data.
   * @param options - Axios request options.
   */
  getValidator(
    networkId: string,
    assetId: string,
    id: string,
    options?: RawAxiosRequestConfig,
  ): AxiosPromise<Validator>;
};

/**
 * TransferAPI client type definition.
 */
export type TransferAPIClient = {
  /**
   * Broadcasts a transfer.
   *
   * @param walletId - The ID of the wallet the address belongs to.
   * @param addressId - The ID of the address the transfer belongs to.
   * @param transferId - The ID of the transfer to broadcast.
   * @param broadcastTransferRequest - The request body.
   * @param options - Axios request options.
   * @returns - A promise resolving to the Transfer model.
   * @throws {APIError} If the request fails.
   */
  broadcastTransfer(
    walletId: string,
    addressId: string,
    transferId: string,
    broadcastTransferRequest: BroadcastTransferRequest,
    options?: AxiosRequestConfig,
  ): AxiosPromise<TransferModel>;

  /**
   * Creates a Transfer.
   *
   * @param walletId - The ID of the wallet the address belongs to.
   * @param addressId - The ID of the address the transfer belongs to.
   * @param createTransferRequest - The request body.
   * @param options - Axios request options.
   * @returns - A promise resolving to the Transfer model.
   * @throws {APIError} If the request fails.
   */
  createTransfer(
    walletId: string,
    addressId: string,
    createTransferRequest: CreateTransferRequest,
    options?: AxiosRequestConfig,
  ): AxiosPromise<TransferModel>;

  /**
   * Retrieves a Transfer.
   *
   * @param walletId - The ID of the wallet the address belongs to.
   * @param addressId - The ID of the address the transfer belongs to.
   * @param transferId - The ID of the transfer to retrieve.
   * @param options - Axios request options.
   * @returns - A promise resolving to the Transfer model.
   * @throws {APIError} If the request fails.
   */
  getTransfer(
    walletId: string,
    addressId: string,
    transferId: string,
    options?: AxiosRequestConfig,
  ): AxiosPromise<TransferModel>;

  /**
   * Lists Transfers.
   *
   * @param walletId - The ID of the wallet the address belongs to.
   * @param addressId - The ID of the address the transfers belong to.
   * @param limit - The maximum number of transfers to return.
   * @param page - The cursor for pagination across multiple pages of Transfers.
   * @param options - Axios request options.
   * @returns - A promise resolving to the Transfer list.
   * @throws {APIError} If the request fails.
   */
  listTransfers(
    walletId: string,
    addressId: string,
    limit?: number,
    page?: string,
    options?: AxiosRequestConfig,
  ): AxiosPromise<TransferList>;
};

/**
 * ServerSignerAPI client type definition.
 */
export type ServerSignerAPIClient = {
  /**
   * Lists Server-Signers.
   *
   * @param limit - The maximum number of Server-Signers to return.
   * @param page - The cursor for pagination across multiple pages of Server-Signers.
   * @param options - Axios request options.
   * @returns - A promise resolving to the Server-Signer list.
   * @throws {APIError} If the request fails.
   */
  listServerSigners(
    limit?: number,
    page?: string,
    options?: AxiosRequestConfig,
  ): AxiosPromise<ServerSignerList>;
};

/**
 * API clients type definition for the Coinbase SDK.
 * Represents the set of API clients available in the SDK.
 */
export type ApiClients = {
  user?: UserAPIClient;
  wallet?: WalletAPIClient;
  address?: AddressAPIClient;
  transfer?: TransferAPIClient;
  trade?: TradeApiClients;
  serverSigner?: ServerSignerAPIClient;
  stake?: StakeAPIClient;
  validator?: ValidatorAPIClient;
  asset?: AssetAPIClient;
  externalAddress?: ExternalAddressAPIClient;
  webhook?:WebhookApiClient;
};

/**
 * Transfer status type definition.
 */
export enum TransferStatus {
  PENDING = "pending",
  BROADCAST = "broadcast",
  COMPLETE = "complete",
  FAILED = "failed",
}

/**
 * Transaction status type definition.
 */
export enum TransactionStatus {
  PENDING = "pending",
  BROADCAST = "broadcast",
  COMPLETE = "complete",
  FAILED = "failed",
}

/**
 * Sponsored Send status type definition.
 */
export enum SponsoredSendStatus {
  PENDING = "pending",
  SIGNED = "signed",
  SUBMITTED = "submitted",
  COMPLETE = "complete",
  FAILED = "failed",
}

/**
 * The Wallet Data type definition.
 * The data required to recreate a Wallet.
 */
export type WalletData = {
  walletId: string;
  seed: string;
};

/**
 * The Seed Data type definition.
 */
export type SeedData = {
  seed: string;
  encrypted: boolean;
  authTag: string;
  iv: string;
};

/**
 * Amount type definition.
 */
export type Amount = number | bigint | Decimal;

/**
 * Destination type definition.
 */
export type Destination = string | Address | Wallet;

/**
 * ServerSigner status type definition.
 */
export enum ServerSignerStatus {
  PENDING = "pending_seed_creation",
  ACTIVE = "active_seed",
}

/**
 * Options for creating a Wallet.
 */
export type WalletCreateOptions = {
  networkId?: string;
  timeoutSeconds?: number;
  intervalSeconds?: number;
};

/**
 * CoinbaseOptions type definition.
 */
export type CoinbaseOptions = {
  /**
   * The API key name.
   */
  apiKeyName: string;

  /**
   * The private key associated with the API key.
   */
  privateKey: string;

  /**
   * Whether to use a Server-Signer or not.
   */
  useServerSigner?: boolean;

  /**
   * If true, logs API requests and responses to the console.
   */
  debugging?: boolean;

  /**
   * The base path for the API.
   */
  basePath?: string;

  /**
   * The maximum number of network retries for the API GET requests.
   */
  maxNetworkRetries?: number;
};

/**
 * CoinbaseConfigureFromJsonOptions type definition.
 */
export type CoinbaseConfigureFromJsonOptions = {
  /**
   * The path to the JSON file containing the API key and private key.
   */
  filePath?: string;

  /**
   * Whether to use a Server-Signer or not.
   */
  useServerSigner?: boolean;

  /**
   * If true, logs API requests and responses to the console.
   */
  debugging?: boolean;

  /**
   * The base path for the API.
   */
  basePath?: string;
};

/**
 * StakeOptionsMode type definition.
 */
export enum StakeOptionsMode {
  /**
   * Defaults to the mode specific to the asset.
   */
  DEFAULT = "default",
  /**
   * Partial represents Partial Ethereum Staking mode.
   */
  PARTIAL = "partial",

  /**
   * Native represents Native Ethereum Staking mode.
   */
  NATIVE = "native",
}

/**
 * Options for creating a Transfer.
 */
export type CreateTransferOptions = {
  amount: Amount;
  assetId: string;
  destination: Destination;
  timeoutSeconds?: number;
  intervalSeconds?: number;
  gasless?: boolean;
};

/**
 * Options for creating a Trade.
 */
export type CreateTradeOptions = {
  amount: Amount;
  fromAssetId: string;
  toAssetId: string;
  timeoutSeconds?: number;
  intervalSeconds?: number;
};

/**
 * Options for listing historical balances of an address.
 */
export type ListHistoricalBalancesOptions = {
  assetId: string;
  limit?: number;
  page?: string;
};

/**
 * Result of ListHistoricalBalances.
 */
export type ListHistoricalBalancesResult = {
  historicalBalances: HistoricalBalance[];
  nextPageToken: string;
};

export interface WebhookApiClient {
  /**
   * Create a new webhook
   * @summary Create a new webhook
   * @param {CreateWebhookRequest} [createWebhookRequest] 
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   */
  createWebhook(createWebhookRequest?: CreateWebhookRequest, options?: RawAxiosRequestConfig): AxiosPromise<WebhookModel>;

  /**
   * Delete a webhook
   * @summary Delete a webhook
   * @param {string} webhookId The Webhook uuid that needs to be deleted
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   */
  deleteWebhook(webhookId: string, options?: RawAxiosRequestConfig): AxiosPromise<void>;

  /**
   * List webhooks, optionally filtered by event type.
   * @summary List webhooks
   * @param {number} [limit] A limit on the number of objects to be returned. Limit can range between 1 and 100, and the default is 10.
   * @param {string} [page] A cursor for pagination across multiple pages of results. Don\&#39;t include this parameter on the first call. Use the next_page value returned in a previous response to request subsequent results.
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   */
  listWebhooks(limit?: number, page?: string, options?: RawAxiosRequestConfig): AxiosPromise<WebhookList>;

  /**
   * Update a webhook
   * @summary Update a webhook
   * @param {string} webhookId The Webhook id that needs to be updated
   * @param {UpdateWebhookRequest} [updateWebhookRequest] 
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   */
  updateWebhook(webhookId: string, updateWebhookRequest?: UpdateWebhookRequest, options?: RawAxiosRequestConfig): AxiosPromise<WebhookModel>;
}