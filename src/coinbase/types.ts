import { AxiosPromise } from "axios";
import { User as UserModel } from "./../client/api";

/**
 * The User API client type definition
 */
export type UserAPIClient = { getCurrentUser(options?): AxiosPromise<UserModel> };

/**
 * The API clients type definition for the Coinbase SDK
 */
export type ApiClients = {
  user?: UserAPIClient;
};
