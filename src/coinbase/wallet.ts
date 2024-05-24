import { HDKey } from "@scure/bip32";
import * as bip39 from "bip39";
import * as crypto from "crypto";
import { ethers } from "ethers";
import * as secp256k1 from "secp256k1";
import { Address as AddressModel, Wallet as WalletModel } from "../client";
import { Address } from "./address";
import { Coinbase } from "./coinbase";
import { ArgumentError, InternalError } from "./errors";
import { Transfer } from "./transfer";
import { Amount, Destination, WalletData } from "./types";
import { UnhydratedWallet } from "./unhydrated_wallet";
import { convertStringToHex } from "./utils";

/**
 * A representation of a Wallet. Wallets come with a single default Address, but can expand to have a set of Addresses,
 * each of which can hold a balance of one or more Assets. Wallets can create new Addresses, list their addresses,
 * list their balances, and transfer Assets to other Addresses. Wallets should be created through User.createWallet or User.importWallet.
 */
export class Wallet extends UnhydratedWallet {
  private master: HDKey;
  private seed: string;
  private readonly addressPathPrefix = "m/44'/60'/0'/0";
  private addressIndex = 0;
  static MAX_ADDRESSES = 20;

  /**
   * Private constructor to prevent direct instantiation outside of factory method. Use Wallet.init instead.
   *
   * @ignore
   * @param model - The wallet model object.
   * @param master - The HD master key.
   * @param seed - The seed to use for the Wallet. Expects a 32-byte hexadecimal with no 0x prefix.
   * @param addressModels - The models of the addresses already registered with the Wallet.
   * @hideconstructor
   */
  private constructor(
    model: WalletModel,
    master: HDKey,
    seed: string,
    addressModels: AddressModel[] = [],
  ) {
    super(model, addressModels);
    this.model = model;
    this.master = master;
    this.seed = seed;
  }

  /**
   * Returns a newly created Wallet object. Do not use this method directly.
   * Instead, use User.createWallet.
   *
   * @constructs Wallet
   * @throws {ArgumentError} If the model or client is not provided.
   * @throws {InternalError} - If address derivation or caching fails.
   * @throws {APIError} - If the request fails.
   * @returns A promise that resolves with the new Wallet object.
   */
  public static async create(): Promise<Wallet> {
    const walletData = await Coinbase.apiClients.wallet!.createWallet({
      wallet: {
        network_id: Coinbase.networkList.BaseSepolia,
      },
    });

    const wallet = await Wallet.init(walletData.data);

    await wallet.createAddress();
    await wallet.reload();

    return wallet;
  }

  /**
   * Returns a new Wallet object. Do not use this method directly. Instead, use User.createWallet or User.importWallet.
   *
   * @constructs Wallet
   * @param model - The underlying Wallet model object
   * @param seed - The seed to use for the Wallet. Expects a 32-byte hexadecimal with no 0x prefix. If not provided, a new seed will be generated.
   * @param addressModels - The models of the addresses already registered with the Wallet. If not provided, the Wallet will derive the first default address.
   * @throws {ArgumentError} If the model or client is not provided.
   * @throws {InternalError} - If address derivation or caching fails.
   * @throws {APIError} - If the request fails.
   * @returns A promise that resolves with the new Wallet object.
   */
  public static async init(
    model: WalletModel,
    seed: string = "",
    addressModels: AddressModel[] = [],
  ): Promise<Wallet> {
    if (!model) {
      throw new ArgumentError("Wallet model cannot be empty");
    }
    if (!seed) {
      seed = bip39.generateMnemonic();
    }
    const master = HDKey.fromMasterSeed(bip39.mnemonicToSeedSync(seed));
    const wallet = new Wallet(model, master, seed, addressModels);
    if (addressModels.length > 0) {
      wallet.deriveAddresses(addressModels);
    }
    return wallet;
  }

  /**
   * Exports the Wallet's data to a WalletData object.
   *
   * @returns The Wallet's data.
   */
  public export(): WalletData {
    return { walletId: this.getId()!, seed: this.seed };
  }

  /**
   * Creates a new Address in the Wallet.
   *
   * @returns The new Address.
   * @throws {APIError} - If the address creation fails.
   */
  public async createAddress(): Promise<Address> {
    const hdKey = this.deriveKey();
    const attestation = this.createAttestation(hdKey);
    const publicKey = convertStringToHex(hdKey.publicKey!);
    const key = new ethers.Wallet(convertStringToHex(hdKey.privateKey!));

    const payload = {
      public_key: publicKey,
      attestation: attestation,
    };
    const response = await Coinbase.apiClients.address!.createAddress(this.model.id!, payload);

    this.cacheAddress(response!.data, key);
    return new Address(response!.data, key);
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
   * Reloads the Wallet model with the latest data from the server.
   */
  private async reload(): Promise<void> {
    const result = await Coinbase.apiClients.wallet!.getWallet(this.model.id!);
    this.model = result?.data;
  }

  /**
   * Derives a key for an already registered Address in the Wallet.
   *
   * @throws {InternalError} - If the key derivation fails.
   * @returns The derived key.
   */
  private deriveKey(): HDKey {
    const derivedKey = this.master.derive(this.addressPathPrefix + "/" + this.addressIndex);
    if (!derivedKey?.privateKey) {
      throw new InternalError("Failed to derive key");
    }
    return derivedKey;
  }

  /**
   * Derives an already registered Address in the Wallet.
   *
   * @param addressMap - The map of registered Address IDs
   * @param addressModel - The Address model
   * @throws {InternalError} - If address derivation fails.
   * @throws {APIError} - If the request fails.
   */
  private deriveAddress(addressMap: { [key: string]: boolean }, addressModel: AddressModel): void {
    const hdKey = this.deriveKey();
    const key = new ethers.Wallet(convertStringToHex(hdKey.privateKey!));
    if (!addressMap[key.address]) {
      throw new InternalError("Invalid address");
    }

    this.cacheAddress(addressModel, key);
  }

  /**
   * Derives the registered Addresses in the Wallet.
   *
   * @param addresses - The models of the addresses already registered with the
   */
  public deriveAddresses(addresses: AddressModel[]): void {
    const addressMap = this.buildAddressMap(addresses);
    for (const address of addresses) {
      this.deriveAddress(addressMap, address);
    }
  }

  /**
   * Builds a Hash of the registered Addresses.
   *
   * @param addressModels - The models of the addresses already registered with the Wallet.
   * @returns The Hash of registered Addresses
   */
  private buildAddressMap(addressModels: AddressModel[]): { [key: string]: boolean } {
    const addressMap: { [key: string]: boolean } = {};

    addressModels?.forEach(addressModel => {
      addressMap[addressModel.address_id] = true;
    });

    return addressMap;
  }

  /**
   * Caches an Address on the client-side and increments the address index.
   *
   * @param address - The AddressModel to cache.
   * @param key - The ethers.js Wallet object the address uses for signing data.
   * @throws {InternalError} If the address is not provided.
   * @returns {void}
   */
  private cacheAddress(address: AddressModel, key: ethers.Wallet): void {
    this.addresses.push(new Address(address, key));
  }

  /**
   * Returns whether the Wallet has a seed with which to derive keys and sign transactions.
   *
   * @returns Whether the Wallet has a seed with which to derive keys and sign transactions.
   */
  public canSign(): boolean {
    return this.master.publicKey !== undefined;
  }

  /**
   * Sends an amount of an asset to a destination.
   *
   * @param amount - The amount to send.
   * @param assetId - The asset ID to send.
   * @param destination - The destination address.
   * @param intervalSeconds - The interval at which to poll the Network for Transfer status, in seconds.
   * @param timeoutSeconds - The maximum amount of time to wait for the Transfer to complete, in seconds.
   * @returns The transfer object.
   * @throws {APIError} if the API request to create a Transfer fails.
   * @throws {APIError} if the API request to broadcast a Transfer fails.
   * @throws {Error} if the Transfer times out.
   */
  public async createTransfer(
    amount: Amount,
    assetId: string,
    destination: Destination,
    intervalSeconds = 0.2,
    timeoutSeconds = 10,
  ): Promise<Transfer> {
    if (!this.getDefaultAddress()) {
      throw new InternalError("Default address not found");
    }
    return await this.getDefaultAddress()!.createTransfer(
      amount,
      assetId,
      destination,
      intervalSeconds,
      timeoutSeconds,
    );
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
