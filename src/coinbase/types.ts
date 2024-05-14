import { AxiosPromise } from "axios";
import { User as UserModel } from "./../client/api";

/**
 * UserAPI client type definition.
 */
export type UserAPIClient = {
  /**
   * Retrieves the current user.
   * @param {AxiosRequestConfig} [options] - Axios request options.
   * @returns {AxiosPromise<UserModel>} - A promise resolving to the User model.
   * @throws {Error} If the request fails.
   */
  getCurrentUser(options?): AxiosPromise<UserModel>;
};

/**
 * API clients type definition for the Coinbase SDK.
 * Represents the set of API clients available in the SDK.
 * @typedef {Object} ApiClients
 * @property {UserAPIClient} [user] - The User API client.
 */
export type ApiClients = {
  /**
   * The User API client.
   * @type {UserAPIClient}
   */
  user?: UserAPIClient;
};
