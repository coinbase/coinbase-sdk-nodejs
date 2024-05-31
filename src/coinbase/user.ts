import util from "util";
import { WalletData } from "./types";
import { User as UserModel, Address as AddressModel, Wallet as WalletModel } from "./../client/api";
import { Wallet } from "./wallet";
import { Coinbase } from "./coinbase";

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
   * @throws {APIError} - If the request fails.
   * @throws {ArgumentError} - If the model or client is not provided.
   * @throws {InternalError} - If address derivation or caching fails.
   * @returns the new Wallet
   */
  async createWallet(): Promise<Wallet> {
    return Wallet.create();
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
    const addressModelMap: { [key: string]: AddressModel[] } = {};
    const walletList = await Coinbase.apiClients.wallet!.listWallets(
      pageSize,
      nextPageToken ? nextPageToken : undefined,
    );
    const walletsModels: WalletModel[] = [];

    for (const wallet of walletList.data.data) {
      walletsModels.push(wallet);
    }
    for (const wallet of walletsModels) {
      const addressList = await Coinbase.apiClients.address!.listAddresses(
        wallet.id!,
        Wallet.MAX_ADDRESSES,
      );
      addressModelMap[wallet.id!] = addressList.data.data;
    }

    const wallets = await Promise.all(
      walletsModels.map(async wallet => {
        const walletId = wallet.id!;
        const addressModels = addressModelMap[walletId];
        return await Wallet.init(wallet, "", addressModels);
      }),
    );

    return { wallets: wallets, nextPageToken: walletList.data.next_page };
  }

  /**
   * Returns the Wallet with the given ID.
   *
   * @param wallet_id - the ID of the Wallet
   * @returns the Wallet with the given ID
   */
  public async getWallet(wallet_id: string): Promise<Wallet> {
    const walletModel = await Coinbase.apiClients.wallet!.getWallet(wallet_id);
    const addressList = await Coinbase.apiClients.address!.listAddresses(wallet_id);
    return Wallet.init(walletModel.data, "", addressList.data.data);
  }

  /**
   * Imports a Wallet belonging to a User.
   *
   * @param data - The Wallet data to import.
   * @returns The imported Wallet.
   */
  public async importWallet(data: WalletData): Promise<Wallet> {
    const walletModel = await Coinbase.apiClients.wallet!.getWallet(data.walletId);
    const addressList = await Coinbase.apiClients.address!.listAddresses(data.walletId);
    return Wallet.init(walletModel.data, data.seed, addressList.data.data);
  }

  /**
   * Returns a string representation of the User.
   *
   * @returns The string representation of the User.
   */
  toString(): string {
    return `User { userId: ${this.model.id} }`;
  }

  /**
   * Returns a string representation of the User.
   *
   * @returns The string representation of the User.
   */
  [util.inspect.custom](): string {
    return this.toString();
  }
}
