import { AxiosPromise, AxiosRequestConfig, RawAxiosRequestConfig } from "axios";
import {
  Address,
  CreateWalletRequest,
  User as UserModel,
  Wallet as WalletModel,
} from "./../client/api";

/**
 * WalletAPI client type definition.
 */
export type WalletAPIClient = {
  /**
   * Create a new wallet scoped to the user.
   *
   * @class
   * @param {CreateWalletRequest} [createWalletRequest] - The wallet creation request.
   * @param {RawAxiosRequestConfig} [options] - Axios request options.
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
   * @param {string} walletId - The wallet ID.
   * @param {string} addressId - The address ID.
   * @returns {Promise<{ data: { transaction_hash: string } }>} - The transaction hash
   * @throws {APIError} If the request fails.
   */
  requestFaucetFunds(
    walletId: string,
    addressId: string,
  ): Promise<{ data: { transaction_hash: string } }>;

  /**
   * Get address
   *
   * @summary Get address by onchain address
   * @param {string} walletId - The ID of the wallet the address belongs to.
   * @param {string} addressId - The onchain address of the address that is being fetched.
   * @param {AxiosRequestConfig} [options] - Axios request options.
   * @throws {APIError} If the request fails.
   */
  getAddress(
    walletId: string,
    addressId: string,
    options?: AxiosRequestConfig,
  ): AxiosPromise<Address>;
};

/**
 * UserAPI client type definition.
 */
export type UserAPIClient = {
  /**
   * Retrieves the current user.
   *
   * @param {AxiosRequestConfig} [options] - Axios request options.
   * @returns {AxiosPromise<UserModel>} - A promise resolvindg to the User model.
   * @throws {APIError} If the request fails.
   */
  getCurrentUser(options?: AxiosRequestConfig): AxiosPromise<UserModel>;
};

/**
 * API clients type definition for the Coinbase SDK.
 * Represents the set of API clients available in the SDK.
 */
export type ApiClients = {
  user?: UserAPIClient;
  address?: AddressAPIClient;
  wallet?: WalletAPIClient;
};
