import { HDKey } from "@scure/bip32";
import * as bip39 from "bip39";
import { ethers } from "ethers";
import { Address as AddressModel, Wallet as WalletModel } from "../client";
import { Address } from "./address";
import { InternalError } from "./errors";
import { ApiClients } from "./types";

/**
 * A representation of a Wallet. Wallets come with a single default Address, but can expand to have a set of Addresses,
 * each of which can hold a balance of one or more Assets. Wallets can create new Addresses, list their addresses,
 * list their balances, and transfer Assets to other Addresses. Wallets should be created through User.createWallet or
 * User.importWallet.
 */
export class Wallet {
  private model: WalletModel;
  private client: ApiClients;

  private master: HDKey;
  private addresses: Address[] = [];
  private readonly addressPathPrefix = "m/44'/60'/0'/0";
  private addressIndex = 0;

  /**
   * Returns a new Wallet object. Do not use this method directly. Instead, use User.createWallet or User.importWallet.
   * @param {WalletModel} model - The wallet model data.
   * @param {ApiClients} client - The API client to interact with the server.
   * @param {string} seed - The seed to use for the Wallet. Expects a 32-byte hexadecimal with no 0x prefix. If not provided, a new seed will be generated.
   * @param {number} addressCount - The number of addresses to generate.
   * @throws {InternalError} If the model or client is empty.
   */
  constructor(model: WalletModel, client: ApiClients, seed: string = "", addressCount: number = 0) {
    if (!model) {
      throw new InternalError("Wallet model cannot be empty");
    }
    if (!client?.address || !client?.user) {
      throw new InternalError("Address client cannot be empty");
    }
    this.model = model;
    this.client = client;

    if (!seed) {
      seed = bip39.generateMnemonic();
    }

    this.master = HDKey.fromMasterSeed(bip39.mnemonicToSeedSync(seed));
    for (let i = 0; i < addressCount; i++) {
      this.deriveAddress();
    }
  }

  /**
   * Derives a new HDKey for the next address.
   * @returns The derived HDKey.
   */
  private deriveKey(): HDKey {
    return this.master.deriveChild(this.addressIndex++);
  }

  /**
   * Derives a new address and caches it.
   * @returns {Promise<void>}
   * @throws {InternalError} If address derivation or caching fails.
   */
  private deriveAddress() {
    const key = this.deriveKey();
    const address = new ethers.Wallet(Buffer.from(key?.privateKey || "").toString("hex")).address;
  }

  /**
   * Caches an Address on the client-side and increments the address index.
   * @param {AddressModel} address - The address to cache.
   * @throws {InternalError} If the address is not provided.
   * @returns {void}
   */
  private cacheAddress(address: AddressModel): void {
    this.addresses.push(new Address(address, this.client.address!));
    this.addressIndex++;
  }

  /**
   * Gets the network identifier.
   * @returns The network identifier.
   */
  public getNetworkId(): string {
    return this.model.network_id;
  }

  /**
   * Gets the wallet identifier.
   * @returns The wallet identifier.
   */
  public getId(): string | undefined {
    return this.model.id;
  }

  /**
   * Gets the default address of the wallet.
   * @returns The default address.
   */
  public defaultAddress(): Address | undefined {
    return this.model.default_address
      ? new Address(this.model.default_address, this.client.address!)
      : undefined;
  }

  /**
   * Converts the wallet instance to a string representation.
   * @returns The string representation of the wallet.
   */
  public toString(): string {
    return `Wallet{id: '${this.model.id}', network_id: '${this.model.network_id}'}`;
  }
}
