import { InternalError } from "./errors";
import { ApiClients } from "./types";

/**
 * A representation of a User.
 * Users have Wallets, which can hold balances of Assets.
 * Access the default User through Coinbase.defaultUser().
 */
export class User {
  private userId: string = "";
  private client: ApiClients;

  constructor(userId: string, client: ApiClients) {
    if (!userId) {
      throw new InternalError("UserID cannot be empty");
    }
    if (!client) {
      throw new InternalError("Client cannot be empty");
    }
    this.userId = userId;
    this.client = client;
  }

  public getUserId(): string {
    return this.userId;
  }

  toString(): string {
    return `Coinbase:User{userId: ${this.userId}}`;
  }
}
