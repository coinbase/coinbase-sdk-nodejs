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
  Wallet as WalletModel,
  SmartWallet as SmartWalletModel,
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
  FetchHistoricalStakingBalances200Response,
  FaucetTransaction,
  BroadcastStakingOperationRequest,
  CreateStakingOperationRequest,
  ValidatorList,
  Validator,
  ValidatorStatus as APIValidatorStatus,
  Webhook as WebhookModel,
  WebhookList,
  CreateWebhookRequest,
  UpdateWebhookRequest,
  ContractEventList,
  CreatePayloadSignatureRequest,
  PayloadSignature as PayloadSignatureModel,
  PayloadSignatureList,
  WebhookEventType,
  WebhookEventFilter,
  AddressTransactionList,
  BroadcastContractInvocationRequest,
  CreateContractInvocationRequest,
  ContractInvocationList,
  ContractInvocation as ContractInvocationModel,
  SmartContractList,
  CreateSmartContractRequest,
  SmartContract as SmartContractModel,
  FundOperation as FundOperationModel,
  FundQuote as FundQuoteModel,
  DeploySmartContractRequest,
  WebhookEventTypeFilter,
  CreateWalletWebhookRequest,
  ReadContractRequest,
  SolidityValue,
  FundOperationList,
  CreateFundOperationRequest,
  CreateFundQuoteRequest,
  AddressReputation,
  RegisterSmartContractRequest,
  UpdateSmartContractRequest,
  CompileSmartContractRequest,
  CompiledSmartContract,
  BroadcastExternalTransactionRequest,
  BroadcastExternalTransaction200Response,
  CreateSmartWalletRequest,
  CreateUserOperationRequest,
  UserOperation as UserOperationModel,
  BroadcastUserOperationRequest,
} from "./../client/api";
import { Address } from "./address";
import { Wallet } from "./wallet";
import { HistoricalBalance } from "./historical_balance";
import { Transaction } from "./transaction";

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
   * @param page - A cursor for pagination across multiple pages of results. Don't include this parameter on the first call. Use the next_page value returned in a previous response to request subsequent results.
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
 * SmartWalletAPI client type definition.
 */
export type SmartWalletAPIClient = {
  /**
   * Create a new smart wallet scoped to the user.
   *
   * @class
   * @param createdSmartWalletRequest - The smart wallet creation request.
   * @param options - Axios request options.
   * @throws {APIError} If the request fails.
   */
  createSmartWallet: (
    createSmartWalletRequest?: CreateSmartWalletRequest,
    options?: RawAxiosRequestConfig,
  ) => AxiosPromise<SmartWalletModel>;

  /*
   *Get the smart wallet by address
   *
   *@param smartWalletAddress - The address of the smart wallet to fetch.
   *@param options - Override http request option.
   *@throws {APIError} If the request fails.
   */
  getSmartWallet: (
    smartWalletAddress: string,
    options?: RawAxiosRequestConfig,
  ) => AxiosPromise<SmartWalletModel>;

  /*
   *Create a user operation
   *
   *@param createUserOperationRequest - The user operation creation request.
   *@param options - Override http request option.
   *@throws {APIError} If the request fails.
   */
  createUserOperation: (
    smartWalletAddress: string,
    networkId: string,
    createUserOperationRequest: CreateUserOperationRequest,
    options?: RawAxiosRequestConfig,
  ) => AxiosPromise<UserOperationModel>;

  /*
   *Broadcast a user operation
   *
   *@param broadcastUserOperationRequest - The user operation broadcast request.
   *@param options - Override http request option.
   *@throws {APIError} If the request fails.
   */
  broadcastUserOperation: (
    smartWalletAddress: string,
    userOperationId: string,
    broadcastUserOperationRequest: BroadcastUserOperationRequest,
    options?: RawAxiosRequestConfig,
  ) => AxiosPromise<UserOperationModel>;

  /*
   *Get a user operation by ID
   *
   *@param userOperationId - The ID of the user operation to fetch.
   *@param options - Override http request option.
   *@throws {APIError} If the request fails.
   */
  getUserOperation: (
    smartWalletAddress: string,
    userOpHash: string,
    options?: RawAxiosRequestConfig,
  ) => AxiosPromise<UserOperationModel>;
};

/**
 * AddressAPI client type definition.
 */
export type AddressAPIClient = {
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

  /**
   * Create a new payload signature with an address.
   *
   * @param walletId - The ID of the wallet the address belongs to.
   * @param addressId - The onchain address of the address to sign the payload with.
   * @param createPayloadSignatureRequest - The payload signature creation request.
   * @param options - Axios request options.
   * @throws {APIError} If the request fails.
   */
  createPayloadSignature(
    walletId: string,
    addressId: string,
    createPayloadSignatureRequest?: CreatePayloadSignatureRequest,
    options?: AxiosRequestConfig,
  ): AxiosPromise<PayloadSignatureModel>;

  /**
   * Get payload signature by the specified payload signature ID.
   *
   * @param walletId - The ID of the wallet the address belongs to.
   * @param addressId - The onchain address of the address to sign the payload with.
   * @param payloadSignatureId - The ID of the payload signature to fetch.
   * @param options - Axios request options.
   * @throws {APIError} If the request fails.
   */
  getPayloadSignature(
    walletId: string,
    addressId: string,
    payloadSignatureId: string,
    options?: AxiosRequestConfig,
  ): AxiosPromise<PayloadSignatureModel>;

  /**
   * List payload signatures for the specified address.
   *
   * @param walletId - The ID of the wallet the address belongs to.
   * @param addressId - The onchain address of the address to sign the payload with.
   * @param limit - A limit on the number of objects to be returned. Limit can range between 1 and 100, and the default is 10.
   * @param page - A cursor for pagination across multiple pages of results. Don't include this parameter on the first call. Use the next_page value returned in a previous response to request subsequent results.
   * @param options - Axios request options.
   * @throws {APIError} If the request fails.
   */
  listPayloadSignatures(
    walletId: string,
    addressId: string,
    limit?: number,
    page?: string,
    options?: AxiosRequestConfig,
  ): AxiosPromise<PayloadSignatureList>;
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
   * @param page - A cursor for pagination across multiple pages of results. Don't include this parameter on the first call. Use the next_page value returned in a previous response to request subsequent results.
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
   * Request faucet funds to be sent to external address.
   *
   * @param networkId - The ID of the blockchain network
   * @param addressId - The onchain address of the address that is being fetched.
   * @param assetId - The Optional ID of the asset to request funds for. Defaults to native asset.
   * @param skipWait - The Optional flag to skip waiting for the transaction to be mined. Defaults to false.
   * @param options - Override http request option.
   * @throws {APIError} If the request fails.
   */
  requestExternalFaucetFunds(
    networkId: string,
    addressId: string,
    assetId?: string,
    skipWait?: boolean,
    options?: RawAxiosRequestConfig,
  ): AxiosPromise<FaucetTransaction>;

  /**
   * Get the faucet transaction for an external address.
   *
   * @param networkId - The ID of the blockchain network
   * @param addressId - The onchain address of the address that is being fetched.
   * @param transactionHash - The transaction hash of the faucet transaction.
   * @param options - Override http request option.
   * @throws {APIError} If the request fails.
   * @returns The faucet transaction.
   */
  getFaucetTransaction(
    networkId: string,
    addressId: string,
    transactionHash: string,
    options?: RawAxiosRequestConfig,
  ): AxiosPromise<FaucetTransaction>;

  /**
   * Broadcast an external transaction
   *
   * @param networkId - The ID of the blockchain network
   * @param addressId - The ID of the address to broadcast the transaction for
   * @param broadcastExternalTransactionRequest - The request body
   * @param options - Override http request option.
   * @throws {APIError} If the request fails.
   */
  broadcastExternalTransaction(
    networkId: string,
    addressId: string,
    broadcastExternalTransactionRequest: BroadcastExternalTransactionRequest,
    options?: RawAxiosRequestConfig,
  ): AxiosPromise<BroadcastExternalTransaction200Response>;
};

export type WalletStakeAPIClient = {
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

  /**
   * Get the staking balances for an address.
   *
   * @param networkId - The ID of the blockchain network.
   * @param assetId - The ID of the asset to fetch the staking balances for.
   * @param addressId - The onchain address to fetch the staking balances for.
   * @param startTime - The start time of the staking balances.
   * @param endTime - The end time of the staking balances.
   * @param limit - The amount of records to return in a single call.
   * @param page - The batch of records for a given section in the response.
   * @param options - Axios request options.
   */
  fetchHistoricalStakingBalances(
    networkId: string,
    assetId: string,
    addressId: string,
    startTime: string,
    endTime: string,
    limit?: number,
    page?: string,
    options?: AxiosRequestConfig,
  ): AxiosPromise<FetchHistoricalStakingBalances200Response>;

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
    status?: APIValidatorStatus,
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
 * ExternalSmartContractAPIClient client type definition.
 */
export type ExternalSmartContractAPIClient = {
  /**
   * List events for a specific contract
   *
   * @param networkId - Unique identifier for the blockchain network
   * @param protocolName - Case-sensitive name of the blockchain protocol
   * @param contractAddress - EVM address of the smart contract (42 characters, including '0x', in lowercase)
   * @param contractName - Case-sensitive name of the specific contract within the project
   * @param eventName - Case-sensitive name of the event to filter for in the contract's logs
   * @param fromBlockHeight - Lower bound of the block range to query (inclusive)
   * @param toBlockHeight - Upper bound of the block range to query (inclusive)
   * @param nextPage - Pagination token for retrieving the next set of results
   * @throws {APIError} If the request fails.
   */
  listContractEvents(
    networkId: string,
    protocolName: string,
    contractAddress: string,
    contractName: string,
    eventName: string,
    fromBlockHeight: number,
    toBlockHeight: number,
    nextPage?: string,
  ): AxiosPromise<ContractEventList>;
};

/**
 * API clients type definition for the Coinbase SDK.
 * Represents the set of API clients available in the SDK.
 */
export type ApiClients = {
  wallet?: WalletAPIClient;
  address?: AddressAPIClient;
  transfer?: TransferAPIClient;
  trade?: TradeApiClients;
  serverSigner?: ServerSignerAPIClient;
  stake?: StakeAPIClient;
  walletStake?: WalletStakeAPIClient;
  asset?: AssetAPIClient;
  externalAddress?: ExternalAddressAPIClient;
  webhook?: WebhookApiClient;
  contractEvent?: ExternalSmartContractAPIClient;
  contractInvocation?: ContractInvocationAPIClient;
  balanceHistory?: BalanceHistoryApiClient;
  transactionHistory?: TransactionHistoryApiClient;
  smartContract?: SmartContractAPIClient;
  fund?: FundOperationApiClient;
  addressReputation?: AddressReputationApiClient;
  smartWallet?: SmartWalletAPIClient;
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
  SIGNED = "signed",
  BROADCAST = "broadcast",
  COMPLETE = "complete",
  FAILED = "failed",
  UNSPECIFIED = "unspecified",
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
 * Validator status type definition.
 * Represents the various states a validator can be in.
 */
export enum ValidatorStatus {
  UNKNOWN = "unknown",
  PROVISIONING = "provisioning",
  PROVISIONED = "provisioned",
  DEPOSITED = "deposited",
  PENDING_ACTIVATION = "pending_activation",
  ACTIVE = "active",
  EXITING = "exiting",
  EXITED = "exited",
  WITHDRAWAL_AVAILABLE = "withdrawal_available",
  WITHDRAWAL_COMPLETE = "withdrawal_complete",
  ACTIVE_SLASHED = "active_slashed",
  EXITED_SLASHED = "exited_slashed",
  REAPED = "reaped",
}

/**
 * Staking reward format type definition.
 * Represents the format in which staking rewards can be queried.
 */
export enum StakingRewardFormat {
  USD = "usd",
  NATIVE = "native",
}

/**
 * Payload Signature status type definition.
 */
export enum PayloadSignatureStatus {
  PENDING = "pending",
  SIGNED = "signed",
  FAILED = "failed",
}

/**
 * Fund Operation status type definition.
 */
export enum FundOperationStatus {
  PENDING = "pending",
  COMPLETE = "complete",
  FAILED = "failed",
}

/**
 * Interface representing wallet data, with support for both camelCase and snake_case
 * property names for compatibility with older versions of the Python SDK.
 */
export interface WalletData {
  /**
   * The CDP wallet ID in either camelCase or snake_case format, but not both.
   */
  walletId?: string;
  wallet_id?: string;

  /**
   * The wallet seed
   */
  seed: string;

  /**
   * The network ID in either camelCase or snake_case format, but not both.
   */
  networkId?: string;
  network_id?: string;
}

/**
 * Type guard to check if data matches the appropriate WalletData format.
 * WalletData must have:
 * - exactly one of (walletId or wallet_id)
 * - at most one of (networkId or network_id)
 * - a seed
 *
 * @param data - The data to check
 * @returns True if data matches the appropriate WalletData format
 */
export function isWalletData(data: unknown): data is WalletData {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const { walletId, wallet_id, networkId, network_id, seed } = data as WalletData;

  // Check that exactly one of walletId or wallet_id is present (but not both)
  const hasWalletId = typeof walletId === "string";
  const hasWalletSnakeId = typeof wallet_id === "string";
  if (!(hasWalletId !== hasWalletSnakeId)) {
    return false;
  }

  // Check that at most one of networkId or network_id is present (but not both)
  const hasNetworkId = typeof networkId === "string";
  const hasNetworkSnakeId = typeof network_id === "string";
  if (hasNetworkId && hasNetworkSnakeId) {
    return false;
  }

  // Check that seed is present and is a string
  return typeof seed === "string";
}

/**
 * Interface representing a BIP-39 mnemonic seed phrase.
 */
export interface MnemonicSeedPhrase {
  /**
   * The BIP-39 mnemonic seed phrase (12, 15, 18, 21, or 24 words)
   */
  mnemonicPhrase: string;
}

/**
 * Type guard to check if data matches the MnemonicSeedPhrase format.
 *
 * @param data - The data to check
 * @returns True if data matches the MnemonicSeedPhrase format
 */
export function isMnemonicSeedPhrase(data: unknown): data is MnemonicSeedPhrase {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const { mnemonicPhrase } = data as MnemonicSeedPhrase;
  return typeof mnemonicPhrase === "string";
}

/**
 * The Seed Data type definition.
 */
export type SeedData = {
  seed: string;
  encrypted: boolean;
  authTag: string;
  iv: string;
  networkId: string;
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
  seed?: string;
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

  /**
   * The source for the API request, used for analytics. Defaults to `sdk`.
   */
  source?: string;

  /**
   * The version of the source for the API request, used for analytics.
   */
  sourceVersion?: string;
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

  /**
   * The source for the API request, used for analytics. Defaults to `sdk`.
   */
  source?: string;

  /**
   * The version of the source for the API request, used for analytics.
   */
  sourceVersion?: string;
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
 * Smart Contract Type
 */
export enum SmartContractType {
  ERC20 = "erc20",
  ERC721 = "erc721",
  ERC1155 = "erc1155",
  CUSTOM = "custom",
}

/**
 * NFT Contract Options
 */
export type NFTContractOptions = {
  name: string;
  symbol: string;
  baseURI: string;
};

/**
 * Token Contract Options
 */
export type TokenContractOptions = {
  name: string;
  symbol: string;
  totalSupply: string;
};

/**
 * Multi-Token Contract Options
 */
export type MultiTokenContractOptions = {
  uri: string;
};

/**
 * Smart Contract Options
 */
export type SmartContractOptions =
  | NFTContractOptions
  | TokenContractOptions
  | MultiTokenContractOptions
  | string;

/**
 * Options for creating a Transfer.
 */
export type CreateTransferOptions = {
  amount: Amount;
  assetId: string;
  destination: Destination;
  gasless?: boolean;
  skipBatching?: boolean;
};

/**
 * Options for creating a Trade.
 */
export type CreateTradeOptions = {
  amount: Amount;
  fromAssetId: string;
  toAssetId: string;
};

/**
 * Options for creating a Contract Invocation.
 */
export type CreateContractInvocationOptions = {
  contractAddress: string;
  abi?: object;
  method: string;
  args: object;
  amount?: Amount;
  assetId?: string;
};

/**
 * Options for creating a ERC20.
 */
export type CreateERC20Options = {
  name: string;
  symbol: string;
  totalSupply: Amount;
};

/**
 * Options for creating a ERC721.
 */
export type CreateERC721Options = {
  name: string;
  symbol: string;
  baseURI: string;
};

/**
 * Options for creating a ERC1155.
 */
export type CreateERC1155Options = {
  uri: string;
};

/**
 * Options for creating an arbitrary contract.
 */
export type CreateCustomContractOptions = {
  /** The version of the solidity compiler, must be 0.8.+, such as "0.8.28+commit.7893614a". See https://binaries.soliditylang.org/bin/list.json */
  solidityVersion: string;
  /** The input json for the solidity compiler. See https://docs.soliditylang.org/en/latest/using-the-compiler.html#input-description for more details. */
  solidityInputJson: string;
  /** The name of the contract class to be deployed. */
  contractName: string;
  /** The arguments for the constructor. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructorArgs: Record<string, any>;
};

/**
 * Options for creating a fund operation.
 */
export type CreateFundOptions = {
  amount: Amount;
  assetId: string;
};

/**
 * Options for creating a quote for a fund operation.
 */
export type CreateQuoteOptions = CreateFundOptions;

/**
 * Options for listing historical balances of an address.
 */
export type ListHistoricalBalancesOptions = {
  assetId: string;
  limit?: number;
  page?: string;
};

/**
 * Options for listing transactions of an address.
 */
export type ListTransactionsOptions = {
  limit?: number;
  page?: string;
};

/**
 * Result of ListTransactions.
 */
export type ListTransactionsResult = {
  transactions: Transaction[];
  nextPageToken: string;
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
   * Create a new webhook for a wallet
   *
   * @summary Create a new webhook for a wallet
   * @param {string} [walletId]
   * @param {CreateWalletWebhookRequest} [createWalletWebhookRequest]
   * @param {*} [options] - Override http request option.
   * @throws {RequiredError}
   */
  createWalletWebhook(
    walletId?: string,
    createWalletWebhookRequest?: CreateWalletWebhookRequest,
    options?: RawAxiosRequestConfig,
  ): AxiosPromise<WebhookModel>;

  /**
   * Create a new webhook
   *
   * @summary Create a new webhook
   * @param {CreateWebhookRequest} [createWebhookRequest]
   * @param {*} [options] - Override http request option.
   * @throws {RequiredError}
   */
  createWebhook(
    createWebhookRequest?: CreateWebhookRequest,
    options?: RawAxiosRequestConfig,
  ): AxiosPromise<WebhookModel>;

  /**
   * Delete a webhook
   *
   * @summary Delete a webhook
   * @param {string} webhookId - The Webhook uuid that needs to be deleted
   * @param {*} [options] - Override http request option.
   * @throws {RequiredError}
   */
  deleteWebhook(webhookId: string, options?: RawAxiosRequestConfig): AxiosPromise<void>;

  /**
   * List webhooks, optionally filtered by event type.
   *
   * @summary List webhooks
   * @param {number} [limit] - A limit on the number of objects to be returned. Limit can range between 1 and 100, and the default is 10.
   * @param {string} [page] - A cursor for pagination across multiple pages of results. Don't include this parameter on the first call. Use the next_page value returned in a previous response to request subsequent results.
   * @param {*} [options] - Override http request option.
   * @throws {RequiredError}
   */
  listWebhooks(
    limit?: number,
    page?: string,
    options?: RawAxiosRequestConfig,
  ): AxiosPromise<WebhookList>;

  /**
   * Update a webhook
   *
   * @summary Update a webhook
   * @param {string} webhookId - The Webhook id that needs to be updated
   * @param {UpdateWebhookRequest} [updateWebhookRequest]
   * @param {*} [options] - Override http request option.
   * @throws {RequiredError}
   */
  updateWebhook(
    webhookId: string,
    updateWebhookRequest?: UpdateWebhookRequest,
    options?: RawAxiosRequestConfig,
  ): AxiosPromise<WebhookModel>;
}

export interface BalanceHistoryApiClient {
  /**
   * List the historical balance of an asset in a specific address.
   *
   * @summary Get address balance history for asset
   * @param networkId - The ID of the blockchain network
   * @param addressId - The ID of the address to fetch the historical balance for.
   * @param assetId - The symbol of the asset to fetch the historical balance for.
   * @param limit - A limit on the number of objects to be returned. Limit can range between 1 and 100, and the default is 10.
   * @param page - A cursor for pagination across multiple pages of results. Don't include this parameter on the first call. Use the next_page value returned in a previous response to request subsequent results.
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
}

export interface TransactionHistoryApiClient {
  /**
   * List the transactions of a specific address.
   *
   * @summary Get address transactions
   * @param networkId - The ID of the blockchain network
   * @param addressId - The ID of the address to fetch transactions for.
   * @param limit - A limit on the number of objects to be returned. Limit can range between 1 and 100, and the default is 10.
   * @param page - A cursor for pagination across multiple pages of results. Don't include this parameter on the first call. Use the next_page value returned in a previous response to request subsequent results.
   * @param options - Override http request option.
   * @throws {RequiredError}
   */
  listAddressTransactions(
    networkId: string,
    addressId: string,
    limit?: number,
    page?: string,
    options?: RawAxiosRequestConfig,
  ): AxiosPromise<AddressTransactionList>;
}
/**
 *  The domain for an EIP-712 typed data message payload.
 */
export type TypedDataDomain = {
  /**
   *  The human-readable name of the signing domain.
   */
  name?: string;

  /**
   *  The major version of the signing domain.
   */
  version?: string;

  /**
   *  The chain ID of the signing domain.
   */
  chainId?: number;

  /**
   *  The the address of the contract that will verify the signature.
   */
  verifyingContract?: string;

  /**
   *  A salt used for purposes decided by the specific domain as a data hex string.
   */
  salt?: string;
};

/**
 *  A specific field of a structured EIP-712 type.
 */
export type TypedDataField = {
  /**
   *  The field name.
   */
  name: string;

  /**
   *  The type of the field.
   */
  type: string;
};

/**
 * Options for creating a Webhook.
 */
export type CreateWebhookOptions = {
  networkId: string;
  notificationUri: string;
  eventType: WebhookEventType;
  eventTypeFilter?: WebhookEventTypeFilter;
  eventFilters?: Array<WebhookEventFilter>;
  signatureHeader?: string;
};

/**
 * Options for updating a Webhook.
 */
export type UpdateWebhookOptions = {
  notificationUri?: string;
  eventFilters?: Array<WebhookEventFilter>;
  eventTypeFilter?: WebhookEventTypeFilter;
};

/**
 * Options for registering a smart contract.
 */
export type RegisterContractOptions = {
  networkId: string;
  contractAddress: string;
  abi: object;
  contractName?: string;
};

/**
 * Options for updating a smart contract.
 */
export type UpdateContractOptions = {
  abi?: object;
  contractName?: string;
};

/**
 * ContractInvocationAPI client type definition.
 */
export type ContractInvocationAPIClient = {
  /**
   * Broadcasts a contract invocation.
   *
   * @param walletId - The ID of the wallet the address belongs to.
   * @param addressId - The ID of the address the contract invocation belongs to.
   * @param contractInvocationId - The ID of the contract invocation to broadcast.
   * @param broadcastContractInvocationRequest - The request body.
   * @param options - Axios request options.
   * @returns - A promise resolving to the ContractInvocation model.
   * @throws {APIError} If the request fails.
   */
  broadcastContractInvocation(
    walletId: string,
    addressId: string,
    contractInvocationId: string,
    broadcastContractInvocationRequest: BroadcastContractInvocationRequest,
    options?: AxiosRequestConfig,
  ): AxiosPromise<ContractInvocationModel>;

  /**
   * Creates a Contract Invocation.
   *
   * @param walletId - The ID of the wallet the address belongs to.
   * @param addressId - The ID of the address the contract invocation belongs to.
   * @param createContractInvocationRequest - The request body.
   * @param options - Axios request options.
   * @returns - A promise resolving to the ContractInvocation model.
   * @throws {APIError} If the request fails.
   */
  createContractInvocation(
    walletId: string,
    addressId: string,
    createContractInvocationRequest: CreateContractInvocationRequest,
    options?: AxiosRequestConfig,
  ): AxiosPromise<ContractInvocationModel>;

  /**
   * Retrieves a Contract Invocation.
   *
   * @param walletId - The ID of the wallet the address belongs to.
   * @param addressId - The ID of the address the contract invocation belongs to.
   * @param contractInvocationId - The ID of the contract invocation to retrieve.
   * @param options - Axios request options.
   * @returns - A promise resolving to the ContractInvocation model.
   * @throws {APIError} If the request fails.
   */
  getContractInvocation(
    walletId: string,
    addressId: string,
    contractInvocationId: string,
    options?: AxiosRequestConfig,
  ): AxiosPromise<ContractInvocationModel>;

  /**
   * Lists Contract Invocations.
   *
   * @param walletId - The ID of the wallet the address belongs to.
   * @param addressId - The ID of the address the contract invocations belong to.
   * @param limit - The maximum number of contract invocations to return.
   * @param page - The cursor for pagination across multiple pages of contract invocations.
   * @param options - Axios request options.
   * @returns - A promise resolving to the ContractInvocation list.
   * @throws {APIError} If the request fails.
   */
  listContractInvocations(
    walletId: string,
    addressId: string,
    limit?: number,
    page?: string,
    options?: AxiosRequestConfig,
  ): AxiosPromise<ContractInvocationList>;
};

export interface SmartContractAPIClient {
  /**
   * List smart contracts belonging to the CDP project.
   *
   * @summary List smart contracts belonging to the CDP project
   * @param page - A cursor for pagination across multiple pages of results. Don\&#39;t include this parameter on the first call. Use the next_page value returned in a previous response to request subsequent results.
   * @param options - Axios request options.
   * @throws {APIError} If the request fails.
   */
  listSmartContracts(
    page?: string,
    options?: RawAxiosRequestConfig,
  ): AxiosPromise<SmartContractList>;

  /**
   * Compiles a custom contract.
   *
   * @param compileSmartContractRequest - The request body containing the compile smart contract details.
   * @param options - Axios request options.
   * @returns - A promise resolving to the compiled smart contract.
   * @throws {APIError} If the request fails.
   */
  compileSmartContract(
    compileSmartContractRequest: CompileSmartContractRequest,
    options?: RawAxiosRequestConfig,
  ): AxiosPromise<CompiledSmartContract>;

  /**
   * Creates a new Smart Contract.
   *
   * @param walletId - The ID of the wallet the address belongs to.
   * @param addressId - The ID of the address to create the smart contract for.
   * @param createSmartContractRequest - The request body containing the smart contract details.
   * @param options - Axios request options.
   * @throws {APIError} If the request fails.
   */
  createSmartContract(
    walletId: string,
    addressId: string,
    createSmartContractRequest: CreateSmartContractRequest,
    options?: RawAxiosRequestConfig,
  ): AxiosPromise<SmartContractModel>;

  /**
   * Gets a specific Smart Contract.
   *
   * @param  walletId - The ID of the wallet the address belongs to.
   * @param addressId - The ID of the address the smart contract belongs to.
   * @param smartContractId - The ID of the smart contract to retrieve.
   * @param options - Axios request options.
   * @throws {APIError} If the request fails.
   */
  getSmartContract(
    walletId: string,
    addressId: string,
    smartContractId: string,
    options?: RawAxiosRequestConfig,
  ): AxiosPromise<SmartContractModel>;

  /**
   * Deploys a Smart Contract.
   *
   * @param walletId - The ID of the wallet the address belongs to.
   * @param addressId - The ID of the address the smart contract belongs to.
   * @param smartContractId - The ID of the smart contract to deploy.
   * @param deploySmartContractRequest - The request body containing deployment details.
   * @param options - Axios request options.
   * @throws {APIError} If the request fails.
   */
  deploySmartContract(
    walletId: string,
    addressId: string,
    smartContractId: string,
    deploySmartContractRequest: DeploySmartContractRequest,
    options?: RawAxiosRequestConfig,
  ): AxiosPromise<SmartContractModel>;

  /**
   * Read a contract
   *
   * @param networkId - Unique identifier for the blockchain network
   * @param contractAddress - EVM address of the smart contract (42 characters, including '0x', in lowercase)
   * @param readContractRequest - The request body containing the method, args, and optionally the ABI
   * @returns - A promise resolving to the contract read result
   * @throws {APIError} If the request fails
   */
  readContract(
    networkId: string,
    contractAddress: string,
    readContractRequest: ReadContractRequest,
  ): AxiosPromise<SolidityValue>;

  /**
   * Register a smart contract.
   *
   * @summary Register a smart contract.
   * @param {string} [networkId] - The network ID.
   * @param {string} [contractAddress] - The contract address.
   * @param {RegisterSmartContractRequest} [registerSmartContractRequest] - The request body containing the register smart contract details.
   * @param options - Axios request options
   * @returns - A promise resolving to the register smart contract result
   * @throws {APIError} If the request fails
   */
  registerSmartContract(
    networkId: string,
    contractAddress: string,
    registerSmartContractRequest: RegisterSmartContractRequest,
    options?: RawAxiosRequestConfig,
  ): AxiosPromise<SmartContractModel>;

  /**
   * Update a smart contract.
   *
   * @summary Update a smart contract.
   * @param {string} [networkId] - The network ID.
   * @param {string} [contractAddress] - The contract address.
   * @param {UpdateSmartContractRequest} [updateSmartContractRequest] - The request body containing the update smart contract details.
   * @param options - Axios request options
   * @returns - A promise resolving to the update smart contract result
   * @throws {APIError} If the request fails
   */
  updateSmartContract(
    networkId: string,
    contractAddress: string,
    updateSmartContractRequest: UpdateSmartContractRequest,
    options?: RawAxiosRequestConfig,
  ): AxiosPromise<SmartContractModel>;
}

export interface FundOperationApiClient {
  /**
   * List fund operations
   *
   * @param walletId - The ID of the wallet the address belongs to.
   * @param addressId - The ID of the address to list fund operations for.
   * @param limit - A limit on the number of objects to be returned. Limit can range between 1 and 100, and the default is 10.
   * @param page - A cursor for pagination across multiple pages of results. Don't include this parameter on the first call. Use the next_page value returned in a previous response to request subsequent results.
   * @param options - Axios request options
   * @throws {APIError} If the request fails
   */
  listFundOperations(
    walletId: string,
    addressId: string,
    limit?: number,
    page?: string,
    options?: RawAxiosRequestConfig,
  ): AxiosPromise<FundOperationList>;

  /**
   * Get a fund operation
   *
   * @param walletId - The ID of the wallet the address belongs to.
   * @param addressId - The ID of the address the fund operation belongs to.
   * @param fundOperationId - The ID of the fund operation to retrieve
   * @param options - Axios request options
   * @throws {APIError} If the request fails
   */
  getFundOperation(
    walletId: string,
    addressId: string,
    fundOperationId: string,
    options?: RawAxiosRequestConfig,
  ): AxiosPromise<FundOperationModel>;

  /**
   * Create a fund operation
   *
   * @param walletId - The ID of the wallet to create the fund operation for
   * @param addressId - The ID of the address to create the fund operation for
   * @param createFundOperationRequest - The request body containing the fund operation details
   * @param options - Axios request options
   * @throws {APIError} If the request fails
   */
  createFundOperation(
    walletId: string,
    addressId: string,
    createFundOperationRequest: CreateFundOperationRequest,
    options?: RawAxiosRequestConfig,
  ): AxiosPromise<FundOperationModel>;

  /**
   * Create a fund operation quote
   *
   * @param walletId - The ID of the wallet the address belongs to.
   * @param addressId - The ID of the address to create the fund operation quote for.
   * @param createFundQuoteRequest - The request body containing the fund operation quote details.
   * @param options - Axios request options.
   * @throws {APIError} If the request fails.
   */
  createFundQuote(
    walletId: string,
    addressId: string,
    createFundQuoteRequest: CreateFundQuoteRequest,
    options?: RawAxiosRequestConfig,
  ): AxiosPromise<FundQuoteModel>;
}

export interface AddressReputationApiClient {
  /**
   * Get the reputation of an address
   *
   * @param networkId - The ID of the blockchain network
   * @param addressId - The ID of the address to fetch the reputation for
   * @param options - Override http request option.
   * @throws {APIError} If the request fails.
   */
  getAddressReputation(
    networkId: string,
    addressId: string,
    options?: RawAxiosRequestConfig,
  ): AxiosPromise<AddressReputation>;
}

/**
 * Options for pagination on list methods.
 */
export type PaginationOptions = {
  limit?: number;
  page?: string;
};

/**
 * Paginated list response.
 */
export interface PaginationResponse<T> {
  data: T[];
  hasMore: boolean;
  nextPage: string | undefined;
}

/**
 * Response from broadcasting an external transaction
 */
export interface BroadcastExternalTransactionResponse {
  transactionHash: string;
  transactionLink?: string;
}
