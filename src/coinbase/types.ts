import { AxiosPromise, AxiosRequestConfig, RawAxiosRequestConfig } from "axios";
import { ethers } from "ethers";
import {
  Address as AddressModel,
  AddressList,
  AddressBalanceList,
  Balance,
  CreateAddressRequest,
  CreateWalletRequest,
  BroadcastTransferRequest,
  CreateTransferRequest,
  TransferList,
  User as UserModel,
  Wallet as WalletModel,
  Transfer as TransferModel,
} from "./../client/api";

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
  listWalletBalances(walletId: string, options?): AxiosPromise<AddressBalanceList>;

  /**
   * List the balances of all of the addresses in the wallet aggregated by asset.
   *
   * @param walletId - The ID of the wallet to fetch the balances for.
   * @param options - Override http request option.
   * @throws {RequiredError} If the required parameter is not provided.
   * @throws {APIError} If the request fails.
   */
  listWalletBalances(walletId: string, options?): AxiosPromise<AddressBalanceList>;

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
  requestFaucetFunds(
    walletId: string,
    addressId: string,
  ): Promise<{ data: { transaction_hash: string } }>;

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

  /*
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
 * API clients type definition for the Coinbase SDK.
 * Represents the set of API clients available in the SDK.
 */
export type ApiClients = {
  user?: UserAPIClient;
  wallet?: WalletAPIClient;
  address?: AddressAPIClient;
  transfer?: TransferAPIClient;
  baseSepoliaProvider?: ethers.Provider;
};

/**
 * Transfer status type definition.
 */
export enum TransferStatus {
  PENDING = "PENDING",
  BROADCAST = "BROADCAST",
  COMPLETE = "COMPLETE",
  FAILED = "FAILED",
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
