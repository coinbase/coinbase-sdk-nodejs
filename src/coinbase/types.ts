import { AxiosPromise, AxiosRequestConfig, RawAxiosRequestConfig } from "axios";
import { Address, User as UserModel } from "./../client/api";
import { RequestArgs } from "../client/base";

/**
 * AddressAPI client type definition.
 */
export type AddressClient = {
  /**
   * Requests faucet funds for the address.
   * @param {string} walletId - The wallet ID.
   * @param {string} addressId - The address ID.
   * @returns {Promise<{ data: { transaction_hash: string } }>} - The transaction hash
   * @throws {Error} If the request fails.
   */
  requestFaucetFunds(
    walletId: string,
    addressId: string,
  ): Promise<{ data: { transaction_hash: string } }>;

  /**
   * Get address
   * @summary Get address by onchain address
   * @param {string} walletId The ID of the wallet the address belongs to.
   * @param {string} addressId The onchain address of the address that is being fetched.
   * @param {AxiosRequestConfig} [options] - Axios request options.
   * @throws {RequiredError}
   */
  getAddress(
    walletId: string,
    addressId: string,
    options?: AxiosRequestConfig,
  ): AxiosPromise<Address>;
};

/**
 * AddressAPI client type definition.
 */
export type AddressAPIClient = {
  /**
   * Requests faucet funds for the address.
   * @param {string} walletId - The wallet ID.
   * @param {string} addressId - The address ID.
   * @returns {Promise<{ data: { transaction_hash: string } }>} - The transaction hash
   * @throws {AxiosError} If the request fails.
   */
  requestFaucetFunds(
    walletId: string,
    addressId: string,
  ): Promise<{ data: { transaction_hash: string } }>;
};

/**
 * UserAPI client type definition.
 */
export type UserAPIClient = {
  /**
   * Retrieves the current user.
   * @param {AxiosRequestConfig} [options] - Axios request options.
   * @returns {AxiosPromise<UserModel>} - A promise resolving to the User model.
   * @throws {AxiosError} If the request fails.
   */
  getCurrentUser(options?: AxiosRequestConfig): AxiosPromise<UserModel>;
};

/**
 * API clients type definition for the Coinbase SDK.
 * Represents the set of API clients available in the SDK.
 */
export type ApiClients = {
  /**
   * The User API client.
   * @type {UserAPIClient}
   */
  user?: UserAPIClient;
  address?: AddressClient;
};
