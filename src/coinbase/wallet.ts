import { HDKey } from "@scure/bip32";
import * as bip39 from "bip39";
import * as crypto from "crypto";
import { ethers } from "ethers";
import * as secp256k1 from "secp256k1";
import { Address as AddressModel, Wallet as WalletModel } from "../client";
import { Address } from "./address";
import { ArgumentError, InternalError } from "./errors";
import { FaucetTransaction } from "./faucet_transaction";
import { AddressAPIClient, WalletAPIClient } from "./types";
import { convertStringToHex } from "./utils";
import Decimal from "decimal.js";
import { Balance } from "./balance";
import { BalanceMap } from "./balance_map";

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

    if (addressCount > 0) {
      for (let i = 0; i < addressCount; i++) {
        await wallet.deriveAddress();
      }
    } else {
      await wallet.createAddress();
      await wallet.updateModel();
    }

    return wallet;
  }

  /**
   * Derives a key for an already registered Address in the Wallet.
   *
   * @throws {InternalError} - If the key derivation fails.
   * @returns The derived key.
   */
  private deriveKey(): HDKey {
    const derivedKey = this.master.derive(`${this.addressPathPrefix}/${this.addressIndex++}`);
    if (!derivedKey?.privateKey) {
      throw new InternalError("Failed to derive key");
    }
    return derivedKey;
  }

  /**
   * Creates a new Address in the Wallet.
   *
   * @throws {APIError} - If the address creation fails.
   */
  private async createAddress(): Promise<void> {
    const key = this.deriveKey();
    const attestation = this.createAttestation(key);
    const publicKey = convertStringToHex(key.publicKey!);

    const payload = {
      public_key: publicKey,
      attestation: attestation,
    };
    const response = await this.client.address.createAddress(this.model.id!, payload);
    this.cacheAddress(response!.data);
  }

  /**
   * Creates an attestation for the Address currently being created.
   *
   * @param key - The key of the Wallet.
   * @returns The attestation.
   */
  private createAttestation(key: HDKey): string {
    if (!key.publicKey || !key.privateKey) {
      throw InternalError;
    }

    const publicKey = convertStringToHex(key.publicKey);

    const payload = JSON.stringify({
      wallet_id: this.model.id,
      public_key: publicKey,
    });

    const hashedPayload = crypto.createHash("sha256").update(payload).digest();
    const signature = secp256k1.ecdsaSign(hashedPayload, key.privateKey);

    const r = signature.signature.slice(0, 32);
    const s = signature.signature.slice(32, 64);
    const v = signature.recid + 27 + 4;

    const newSignatureBuffer = Buffer.concat([Buffer.from([v]), r, s]);
    const newSignatureHex = newSignatureBuffer.toString("hex");

    return newSignatureHex;
  }

  /**
   * Updates the Wallet model with the latest data from the server.
   */
  private async updateModel(): Promise<void> {
    const result = await this.client.wallet.getWallet(this.model.id!);
    this.model = result?.data;
  }

  /**
   * Derives an already registered Address in the Wallet.
   *
   * @throws {InternalError} - If address derivation fails.
   * @throws {APIError} - If the request fails.
   * @returns A promise that resolves when the address is derived.
   */
  private async deriveAddress(): Promise<void> {
    const key = this.deriveKey();
    const wallet = new ethers.Wallet(convertStringToHex(key.privateKey!));
    const response = await this.client.address.getAddress(this.model.id!, wallet.address);
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
   * Requests funds from the faucet for the Wallet's default address and returns the faucet transaction.
   * This is only supported on testnet networks.
   *
   * @throws {InternalError} If the default address is not found.
   * @throws {APIError} If the request fails.
   * @returns The successful faucet transaction
   */
  public async faucet(): Promise<FaucetTransaction> {
    if (!this.model.default_address) {
      throw new InternalError("Default address not found");
    }
    const transaction = await this.defaultAddress()?.faucet();
    return transaction!;
  }

  /**
   * Returns the list of balances of this Wallet. Balances are aggregated across all Addresses in the Wallet.
   *
   * @returns {Promise<BalanceMap>} The map of balances. The key is the Asset ID, and the value is the balance.
   */
  async listBalances(): Promise<BalanceMap> {
    const response = await this.client.wallet.listWalletBalances(this.model.id!);

    return BalanceMap.fromBalances(response.data.data);
  }

  /**
   * Returns the balance of the provided Asset. Balances are aggregated across all Addresses in the Wallet.
   *
   * @param {string} assetId - The ID of the asset to fetch the balance for.
   * @returns {Promise<Decimal>} The balance of the asset.
   */
  async getBalance(assetId: string): Promise<Decimal> {
    const response = await this.client.wallet.getWalletBalance(this.model.id!, assetId);

    if (!response?.data) {
      return new Decimal(0);
    }

    return Balance.fromModelAndAssetId(response.data, assetId).amount;
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
