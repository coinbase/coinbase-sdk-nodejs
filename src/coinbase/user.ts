import { ApiClients } from "./types";
import { User as UserModel } from "./../client/api";
import { Coinbase } from "./coinbase";
import { Wallet } from "./wallet";
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
   * Creates a new Wallet belonging to the User.
   *
   * @throws {APIError} If the request fails.
   * @throws {ArgumentError} If the model or client is not provided.
   * @throws {InternalError} - If address derivation or caching fails.
   * @returns the new Wallet
   */
  async createWallet(): Promise<Wallet> {
    const payload = {
      wallet: {
        network_id: Coinbase.networkList.BaseSepolia,
      },
    };
    const walletData = await this.client.wallet!.createWallet(payload);
    return Wallet.init(walletData.data!, {
      wallet: this.client.wallet!,
      address: this.client.address!,
    });
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
    return `User{ userId: ${this.model.id} }`;
  }
}
