import { AxiosPromise } from "axios";
import { User as UserModel } from "./../client/api";

/**
 * UserAPI client type definition
 */
export type UserAPIClient = { getCurrentUser(options?): AxiosPromise<UserModel> };

/**
 * API clients type definition for the Coinbase SDK
 */
export type ApiClients = {
  user?: UserAPIClient;
};
