import { HDKey } from "@scure/bip32";
import * as bip39 from "bip39";
import { ethers, Wallet as ETHWallet } from "ethers";
import { Address as AddressModel, Wallet as WalletModel } from "../client";
import { Address } from "./address";
import { ArgumentError, InternalError } from "./errors";
import { AddressAPIClient, WalletAPIClient } from "./types";
import { convertStringToHex } from "./utils";

/**
 * The Wallet API client types.
 */
type WalletClients = {
  wallet: WalletAPIClient;
  address: AddressAPIClient;
};

/**
 * A representation of a Wallet. Wallets come with a single default Address, but can expand to have a set of Addresses,
 * each of which can hold a balance of one or more Assets. Wallets can create new Addresses, list their addresses,
 * list their balances, and transfer Assets to other Addresses. Wallets should be created through User.createWallet or User.importWallet.
 */
export class Wallet {
  private model: WalletModel;
  private client: WalletClients;

  private master: HDKey;
  private addresses: Address[] = [];
  private readonly addressPathPrefix = "m/44'/60'/0'/0";
  private addressIndex = 0;

  /**
   * Private constructor to prevent direct instantiation outside of factory method. Use Wallet.init instead.
   *
   * @ignore
   * @param model - The wallet model object.
   * @param client - The API client to interact with the server.
   * @param master - The HD master key.
   * @hideconstructor
   */
  private constructor(model: WalletModel, client: WalletClients, master: HDKey) {
    this.model = model;
    this.client = client;
    this.master = master;
  }

  /**
   * Returns a new Wallet object. Do not use this method directly. Instead, use User.createWallet or User.importWallet.
   *
   * @constructs Wallet
   * @param model - The underlying Wallet model object
   * @param client - The API client to interact with the server.
   * @param seed - The seed to use for the Wallet. Expects a 32-byte hexadecimal with no 0x prefix. If not provided, a new seed will be generated.
   * @param addressCount - The number of addresses already registered for the Wallet.
   * @throws {ArgumentError} If the model or client is not provided.
   * @throws {InternalError} - If address derivation or caching fails.
   * @throws {APIError} - If the request fails.
   * @returns A promise that resolves with the new Wallet object.
   */
  public static async init(
    model: WalletModel,
    client: WalletClients,
    seed: string = "",
    addressCount: number = 0,
  ): Promise<Wallet> {
    if (!model) {
      throw new ArgumentError("Wallet model cannot be empty");
    }
    if (!client?.address || !client?.wallet) {
      throw new ArgumentError("Address client cannot be empty");
    }

    if (!seed) {
      seed = bip39.generateMnemonic();
    }
    const master = HDKey.fromMasterSeed(bip39.mnemonicToSeedSync(seed));
    const wallet = new Wallet(model, client, master);

    for (let i = 0; i < addressCount; i++) {
      await wallet.deriveAddress();
    }

    return wallet;
  }

  /**
   * Derives a key for an already registered Address in the Wallet.
   *
   * @returns The derived key.
   */
  private deriveKey(): ETHWallet {
    const derivedKey = this.master.derive(`${this.addressPathPrefix}/${this.addressIndex++}`);
    if (!derivedKey?.privateKey) {
      throw new InternalError("Failed to derive key");
    }
    return new ethers.Wallet(convertStringToHex(derivedKey.privateKey));
  }

  /**
   * Derives an already registered Address in the Wallet.
   *
   * @throws {InternalError} - If address derivation or caching fails.
   * @throws {APIError} - If the request fails.
   * @returns {Promise<void>} A promise that resolves when the address is derived.
   */
  private async deriveAddress(): Promise<void> {
    const key = this.deriveKey();
    const response = await this.client.address.getAddress(this.model.id!, key.address);
    this.cacheAddress(response.data);
  }

  /**
   * Caches an Address on the client-side and increments the address index.
   *
   * @param address - The AddressModel to cache.
   * @throws {InternalError} If the address is not provided.
   * @returns {void}
   */
  private cacheAddress(address: AddressModel): void {
    this.addresses.push(new Address(address, this.client.address!));
    this.addressIndex++;
  }

  /**
   * Returns the Network ID of the Wallet.
   *
   * @returns The network ID.
   */
  public getNetworkId(): string {
    return this.model.network_id;
  }

  /**
   * Returns the wallet ID.
   *
   * @returns The wallet ID.
   */
  public getId(): string | undefined {
    return this.model.id;
  }

  /**
   * Returns the default address of the Wallet.
   *
   * @returns The default address
   */
  public defaultAddress(): Address | undefined {
    return this.model.default_address
      ? new Address(this.model.default_address, this.client.address!)
      : undefined;
  }

  /**
   * Returns a String representation of the Wallet.
   *
   * @returns a String representation of the Wallet
   */
  public toString(): string {
    return `Wallet{id: '${this.model.id}', networkId: '${this.model.network_id}'}`;
  }
}
