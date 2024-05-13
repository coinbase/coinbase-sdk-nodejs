import { AxiosPromise } from "axios";
import { User as UserModel } from "./../client/api";

export type UserAPIClient = { getCurrentUser(options?): AxiosPromise<UserModel> };

export type ApiClients = {
  user?: UserAPIClient;
};
