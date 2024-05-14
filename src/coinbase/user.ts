import { ApiClients } from "./types";
import { User as UserModel } from "./../client/api";
/**
 * A representation of a User.
 * Users have Wallets, which can hold balances of Assets.
 * Access the default User through Coinbase.defaultUser().
 */
export class User {
  private model: UserModel;
  private client: ApiClients;

  constructor(user: UserModel, client: ApiClients) {
    this.client = client;
    this.model = user;
  }

  public getUserId(): string {
    return this.model.id;
  }

  toString(): string {
    return `Coinbase:User{userId: ${this.model.id}}`;
  }
}
