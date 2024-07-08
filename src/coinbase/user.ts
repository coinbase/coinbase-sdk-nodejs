import { User as UserModel } from "./../client/api";
import { WalletData } from "./types";
import { Wallet } from "./wallet";

type CreateWalletOptionsType = {
  networkId?: string;
};

/**
 * A representation of a User.
 * Users have Wallets, which can hold balances of Assets.
 * Access the default User through Coinbase.defaultUser().
 */
export class User {
  private model: UserModel;

  /**
   * Initializes a new User instance.
   *
   * @param user - The user model.
   */
  constructor(user: UserModel) {
    this.model = user;
  }

  /**
   * Creates a new Wallet belonging to the User.
   *
   * @param createWalletOptions - The options for creating the Wallet.
   * @param createWalletOptions.networkId - the ID of the blockchain network. Defaults to 'base-sepolia'.
   * @throws {APIError} - If the request fails.
   * @throws {ArgumentError} - If the model or client is not provided.
   * @throws {InternalError} - If address derivation or caching fails.
   * @returns the new Wallet
   */
  async createWallet(createWalletOptions: CreateWalletOptionsType = {}): Promise<Wallet> {
    return await Wallet.create(createWalletOptions);
  }

  /**
   * Returns the user's ID.
   *
   * @returns The user's ID.
   */
  public getId(): string {
    return this.model.id;
  }

  /**
   * Lists the Wallets belonging to the User.
   *
   * @param pageSize - The number of Wallets to return per page. Defaults to 10
   * @param nextPageToken - The token for the next page of Wallets
   * @returns An object containing the Wallets and the token for the next page
   */
  public async listWallets(
    pageSize: number = 10,
    nextPageToken?: string,
  ): Promise<{ wallets: Wallet[]; nextPageToken: string }> {
    return await Wallet.listWallets(pageSize, nextPageToken);
  }

  /**
   * Returns the Wallet with the given ID.
   *
   * @param wallet_id - the ID of the Wallet
   * @returns the Wallet with the given ID
   */
  public async getWallet(wallet_id: string): Promise<Wallet> {
    const wallet = await Wallet.fetch(wallet_id);
    await wallet.listAddresses();
    return wallet;
  }

  /**
   * Imports a Wallet belonging to a User.
   *
   * @param data - The Wallet data to import.
   * @param data.walletId - The ID of the Wallet to import.
   * @param data.seed - The seed to use for the Wallet.
   * @returns The imported Wallet.
   * @throws {ArgumentError} If the Wallet ID is not provided.
   * @throws {ArgumentError} If the seed is not provided.
   * @throws {APIError} If the request fails.
   */
  public async importWallet(data: WalletData): Promise<Wallet> {
    return await Wallet.import(data);
  }

  /**
   * Returns a string representation of the User.
   *
   * @returns The string representation of the User.
   */
  toString(): string {
    return `User{ userId: ${this.model.id} }`;
  }
}
