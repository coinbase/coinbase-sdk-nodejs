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

  /**
   * Initializes a new User instance.
   *
   * @param {UserModel} user - The user model.
   * @param {ApiClients} client - The API clients.
   */
  constructor(user: UserModel, client: ApiClients) {
    this.client = client;
    this.model = user;
  }

  /**
   * Returns the user's ID.
   *
   * @returns {string} The user's ID.
   */
  public getId(): string {
    return this.model.id;
  }

  /**
   * Returns a string representation of the User.
   *
   * @returns {string} The string representation of the User.
   */
  toString(): string {
    return `Coinbase:User{userId: ${this.model.id}}`;
  }
}
