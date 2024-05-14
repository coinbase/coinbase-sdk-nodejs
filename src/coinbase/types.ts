import { AxiosPromise, AxiosRequestConfig, RawAxiosRequestConfig } from "axios";
import {
  CreateWalletRequest,
  BroadcastTransferRequest,
  CreateTransferRequest,
  TransferList,
  User as UserModel,
  Wallet as WalletModel,
  Address as AddressModel,
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
   * @returns The transaction hash
   * @throws {APIError} If the request fails.
   */
  requestFaucetFunds(
    walletId: string,
    addressId: string,
  ): Promise<{ data: { transaction_hash: string } }>;

  /**
   * Get address by onchain address
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
};
