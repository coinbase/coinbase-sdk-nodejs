import * as crypto from "crypto";
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
   * @returns The list of Wallets.
   */
  public async getWallets(pageSize: number = 10, nextPageToken?: string): Promise<Wallet[]> {
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

    return Promise.all(
      walletsModels.map(async wallet => {
        return await Wallet.init(wallet, undefined, addressModelMap[wallet.id!]);
      }),
    );
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
   * Stores the encryption key for encrypting the backup.
   *
   * @returns The encryption key.
   */
  private storeEncryptionKey(): Buffer {
    const privateKey = crypto.createPrivateKey(Coinbase.apiKeyPrivateKey);
    const publicKey = crypto.createPublicKey(Coinbase.apiKeyPrivateKey);
    const sharedSecret = crypto.diffieHellman({
      privateKey,
      publicKey,
    });
    return sharedSecret;
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
