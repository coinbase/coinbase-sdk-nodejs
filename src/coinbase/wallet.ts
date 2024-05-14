import { HDKey } from "@scure/bip32";
import * as bip39 from "bip39";
import { Address } from "./address";
import { InternalError } from "./errors";
import { Wallet as WalletModel, Address as AddressModel } from "../client";
import { ApiClients } from "./types";
import { ethers } from "ethers";

/**
 * Wallet class represents a wallet with address management.
 */
export class Wallet {
  private model: WalletModel;
  private client: ApiClients;

  private master: HDKey;
  private addresses: Address[] = [];
  private readonly addressPathPrefix = "m/44'/60'/0'/0";
  private addressIndex = 0;

  /**
   * Creates an instance of Wallet.
   * @param {WalletModel} model - The wallet model data.
   * @param {ApiClients} client - The API client to interact with address-related endpoints.
   * @param {string} seed - The seed to generate the wallet.
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
    try {
      const key = this.deriveKey();
      const address = new ethers.Wallet(Buffer.from(key?.privateKey || "").toString("hex")).address;
      if (!this.model.id) {
        throw new InternalError("Wallet ID could not found");
      }
      if (!key.publicKey) {
        throw new InternalError("Public key could not found");
      }
      this.cacheAddress({
        address_id: address,
        network_id: this.model.network_id,
        public_key: Buffer.from(key?.publicKey || "").toString("hex"),
        wallet_id: this.model.id,
      });
    } catch (e) {
      console.error("Error deriving address:", e);
      throw new InternalError("Failed to derive address");
    }
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
    if (!this.model.default_address) {
      return undefined;
    }
    if (!this.client.address) {
      throw new InternalError("Address client cannot be empty");
    }
    return new Address(this.model.default_address, this.client.address);
  }

  /**
   * Converts the wallet instance to a string representation.
   * @returns The string representation of the wallet.
   */
  public toString(): string {
    return `Wallet{id: '${this.model.id}', network_id: '${this.model.network_id}'}`;
  }
}
