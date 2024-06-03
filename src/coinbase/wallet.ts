import { HDKey } from "@scure/bip32";
import * as bip39 from "bip39";
import * as crypto from "crypto";
import * as fs from "fs";
import { ethers } from "ethers";
import * as secp256k1 from "secp256k1";
import { Address as AddressModel, Wallet as WalletModel } from "../client";
import { Address } from "./address";
import { Coinbase } from "./coinbase";
import { ArgumentError, InternalError } from "./errors";
import { Transfer } from "./transfer";
import { Amount, Destination, SeedData, WalletData, ServerSignerStatus } from "./types";
import { convertStringToHex, delay } from "./utils";
import { FaucetTransaction } from "./faucet_transaction";
import { BalanceMap } from "./balance_map";
import Decimal from "decimal.js";
import { Balance } from "./balance";

/**
 * A representation of a Wallet. Wallets come with a single default Address, but can expand to have a set of Addresses,
 * each of which can hold a balance of one or more Assets. Wallets can create new Addresses, list their addresses,
 * list their balances, and transfer Assets to other Addresses. Wallets should be created through User.createWallet or User.importWallet.
 */
export class Wallet {
  private model: WalletModel;

  private master?: HDKey;
  private seed?: string;
  private addresses: Address[] = [];
  private addressModels: AddressModel[] = [];

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
    master: HDKey | undefined,
    seed: string | undefined,
    addressModels: AddressModel[] = [],
  ) {
    this.model = model;
    this.master = master;
    this.seed = seed;
    this.addressModels = addressModels;
  }

  /**
   * Returns a newly created Wallet object. Do not use this method directly.
   * Instead, use User.createWallet.
   *
   * @constructs Wallet
   * @param intervalSeconds - The interval at which to poll the CDPService, in seconds.
   * @param timeoutSeconds - The maximum amount of time to wait for the ServerSigner to create a seed, in seconds.
   * @throws {ArgumentError} If the model or client is not provided.
   * @throws {InternalError} - If address derivation or caching fails.
   * @throws {APIError} - If the request fails.
   * @returns A promise that resolves with the new Wallet object.
   */
  public static async create(intervalSeconds = 0.2, timeoutSeconds = 20): Promise<Wallet> {
    const result = await Coinbase.apiClients.wallet!.createWallet({
      wallet: {
        network_id: Coinbase.networkList.BaseSepolia,
        use_server_signer: Coinbase.useServerSigner,
      },
    });

    const wallet = await Wallet.init(result.data, undefined, []);

    if (Coinbase.useServerSigner) {
      await wallet.waitForSigner(wallet.getId()!, intervalSeconds, timeoutSeconds);
    }

    await wallet.createAddress();
    await wallet.reload();

    return wallet;
  }

  /**
   * Waits until the ServerSigner has created a seed for the Wallet.
   *
   * @param walletId - The ID of the Wallet that is awaiting seed creation.
   * @param intervalSeconds - The interval at which to poll the CDPService, in seconds.
   * @param timeoutSeconds - The maximum amount of time to wait for the ServerSigner to create a seed, in seconds.
   * @throws {APIError} if the API request to get a Wallet fails.
   * @throws {Error} if the ServerSigner times out.
   */
  private async waitForSigner(
    walletId: string,
    intervalSeconds = 0.2,
    timeoutSeconds = 20,
  ): Promise<void> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutSeconds * 1000) {
      const response = await Coinbase.apiClients.wallet!.getWallet(walletId);
      if (response?.data.server_signer_status === ServerSignerStatus.ACTIVE) {
        return;
      }
      await delay(intervalSeconds);
    }
    throw new Error("Wallet creation timed out. Check status of your Server-Signer");
  }

  /**
   * Returns a new Wallet object. Do not use this method directly. Instead, use User.createWallet or User.importWallet.
   *
   * @constructs Wallet
   * @param model - The underlying Wallet model object
   * @param seed - The seed to use for the Wallet. Expects a 32-byte hexadecimal with no 0x prefix. If null or undefined, a new seed will be generated.
   * If the empty string, no seed is generated, and the Wallet will be instantiated without a seed and its corresponding private keys.
   * @param addressModels - The models of the addresses already registered with the Wallet. If not provided, the Wallet will derive the first default address.
   * @throws {ArgumentError} If the model or client is not provided.
   * @throws {InternalError} - If address derivation or caching fails.
   * @throws {APIError} - If the request fails.
   * @returns A promise that resolves with the new Wallet object.
   */
  public static async init(
    model: WalletModel,
    seed?: string | undefined,
    addressModels: AddressModel[] = [],
  ): Promise<Wallet> {
    this.validateSeedAndAddressModels(seed, addressModels);

    if (Coinbase.useServerSigner) {
      return new Wallet(model, undefined, undefined, addressModels);
    }

    const seedAndMaster = this.getSeedAndMasterKey(seed);
    const wallet = new Wallet(model, seedAndMaster.master, seedAndMaster.seed, addressModels);
    wallet.deriveAddresses(addressModels);

    return wallet;
  }

  /**
   * Exports the Wallet's data to a WalletData object.
   *
   * @returns The Wallet's data.
   * @throws {APIError} - If the request fails.
   */
  public export(): WalletData {
    if (!this.seed) {
      throw new InternalError("Cannot export Wallet without loaded seed");
    }
    return { walletId: this.getId()!, seed: this.seed };
  }

  /**
   * Derives a key for an already registered Address in the Wallet.
   *
   * @throws {InternalError} - If the key derivation fails.
   * @returns The derived key.
   */
  private deriveKey(): HDKey {
    const derivedKey = this.master?.derive(this.addressPathPrefix + "/" + this.addressIndex++);
    if (!derivedKey?.privateKey) {
      throw new InternalError("Failed to derive key");
    }
    return derivedKey;
  }

  /**
   * Creates a new Address in the Wallet.
   *
   * @returns The new Address.
   * @throws {APIError} - If the address creation fails.
   */
  public async createAddress(): Promise<Address> {
    let payload, key;
    if (!Coinbase.useServerSigner) {
      const hdKey = this.deriveKey();
      const attestation = this.createAttestation(hdKey);
      const publicKey = convertStringToHex(hdKey.publicKey!);
      key = new ethers.Wallet(convertStringToHex(hdKey.privateKey!));

      payload = {
        public_key: publicKey,
        attestation: attestation,
      };
    }
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
   *
   * @throws {APIError} if the API request to get a Wallet fails.
   */
  private async reload(): Promise<void> {
    const result = await Coinbase.apiClients.wallet!.getWallet(this.model.id!);
    this.model = result?.data;
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
    const doesMasterExist = this.master !== undefined;
    const key = doesMasterExist
      ? new ethers.Wallet(convertStringToHex(this.deriveKey().privateKey!))
      : undefined;
    if (key && !addressMap[key.address]) {
      throw new InternalError("Invalid address");
    }
    this.cacheAddress(addressModel, key);
  }

  /**
   * Derives the registered Addresses in the Wallet.
   *
   * @param addresses - The models of the addresses already registered with the
   */
  private deriveAddresses(addresses: AddressModel[]): void {
    if (addresses.length === 0) {
      return;
    }

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
  private cacheAddress(address: AddressModel, key?: ethers.Wallet): void {
    this.addresses.push(new Address(address, key));
  }

  /**
   * Returns the Wallet model.
   *
   * @param seed - The seed to use for the Wallet. Expects a 32-byte hexadecimal with no 0x prefix.
   */
  public setSeed(seed: string) {
    if (this.master === undefined && (this.seed === undefined || this.seed === "")) {
      this.master = HDKey.fromMasterSeed(Buffer.from(seed, "hex"));
      this.addresses = [];
      this.addressModels.map((addressModel: AddressModel) => {
        const derivedKey = this.deriveKey();
        const etherKey = new ethers.Wallet(convertStringToHex(derivedKey.privateKey!));
        if (etherKey.address != addressModel.address_id) {
          throw new InternalError(
            `Seed does not match wallet; cannot find address ${etherKey.address}`,
          );
        }
        this.cacheAddress(addressModel, etherKey);
      });
    } else {
      throw new InternalError("Cannot set seed on Wallet with existing seed");
    }
  }

  /**
   * Returns the Address with the given ID.
   *
   * @param addressId - The ID of the Address to retrieve.
   * @returns The Address.
   */
  public getAddress(addressId: string): Address | undefined {
    return this.addresses.find(address => {
      return address.getId() === addressId;
    });
  }

  /**
   * Returns the list of Addresses in the Wallet.
   *
   * @returns The list of Addresses.
   */
  public listAddresses(): Address[] {
    return this.addresses;
  }

  /**
   * Returns the list of balances of this Wallet. Balances are aggregated across all Addresses in the Wallet.
   *
   * @returns The list of balances. The key is the Asset ID, and the value is the balance.
   */
  public async listBalances(): Promise<BalanceMap> {
    const response = await Coinbase.apiClients.wallet!.listWalletBalances(this.model.id!);
    return BalanceMap.fromBalances(response.data.data);
  }

  /**
   * Returns the balance of the provided Asset. Balances are aggregated across all Addresses in the Wallet.
   *
   * @param assetId - The ID of the Asset to retrieve the balance for.
   * @returns The balance of the Asset.
   */
  public async getBalance(assetId: string): Promise<Decimal> {
    const response = await Coinbase.apiClients.wallet!.getWalletBalance(this.model.id!, assetId);
    if (!response.data.amount) {
      return new Decimal(0);
    }
    const balance = Balance.fromModelAndAssetId(response.data, assetId);
    return balance.amount;
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
   * Returns the ServerSigner Status of the Wallet.
   *
   * @returns the ServerSigner Status.
   */
  public getServerSignerStatus(): ServerSignerStatus | undefined {
    switch (this.model.server_signer_status) {
      case ServerSignerStatus.PENDING:
        return ServerSignerStatus.PENDING;
      case ServerSignerStatus.ACTIVE:
        return ServerSignerStatus.ACTIVE;
      default:
        return undefined;
    }
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
   * Saves the seed of the Wallet to the given file. Wallets whose seeds are saved this way can be
   * rehydrated using load_seed. A single file can be used for multiple Wallet seeds.
   * This is an insecure method of storing Wallet seeds and should only be used for development purposes.
   *
   * @param filePath - The path of the file to save the seed to
   * @param encrypt - Whether the seed information persisted to the local file system should be
   * encrypted or not. Data is unencrypted by default.
   * @returns A string indicating the success of the operation
   * @throws {InternalError} If the Wallet does not have a seed
   */
  public saveSeed(filePath: string, encrypt: boolean = false): string {
    if (!this.master) {
      throw new InternalError("Cannot save Wallet without loaded seed");
    }

    const existingSeedsInStore = this.getExistingSeeds(filePath);
    const data = this.export();
    let seedToStore = data.seed;
    let authTag = "";
    let iv = "";

    if (encrypt) {
      const ivBytes = crypto.randomBytes(12);
      const sharedSecret = this.getEncryptionKey();
      const cipher: crypto.CipherCCM = crypto.createCipheriv(
        "aes-256-gcm",
        crypto.createHash("sha256").update(sharedSecret).digest(),
        ivBytes,
      );
      const encryptedData = Buffer.concat([cipher.update(data.seed, "utf8"), cipher.final()]);
      authTag = cipher.getAuthTag().toString("hex");
      seedToStore = encryptedData.toString("hex");
      iv = ivBytes.toString("hex");
    }

    existingSeedsInStore[data.walletId] = {
      seed: seedToStore,
      encrypted: encrypt,
      authTag: authTag,
      iv: iv,
    };

    fs.writeFileSync(filePath, JSON.stringify(existingSeedsInStore, null, 2), "utf8");

    return `Successfully saved seed for ${data.walletId} to ${filePath}.`;
  }

  /**
   * Loads the seed of the Wallet from the given file.
   *
   * @param filePath - The path of the file to load the seed from
   * @returns A string indicating the success of the operation
   */
  public loadSeed(filePath: string): string {
    const existingSeedsInStore = this.getExistingSeeds(filePath);
    if (Object.keys(existingSeedsInStore).length === 0) {
      throw new ArgumentError(`File ${filePath} does not contain any seed data`);
    }

    if (existingSeedsInStore[this.getId()!] === undefined) {
      throw new ArgumentError(
        `File ${filePath} does not contain seed data for wallet ${this.getId()}`,
      );
    }

    const seedData = existingSeedsInStore[this.getId()!];
    let seed = seedData.seed;
    if (!seed) {
      throw new ArgumentError("Seed data is malformed");
    }

    if (seedData.encrypted) {
      const sharedSecret = this.getEncryptionKey();
      if (!seedData.iv || !seedData.authTag) {
        throw new ArgumentError("Encrypted seed data is malformed");
      }

      const decipher = crypto.createDecipheriv(
        "aes-256-gcm",
        crypto.createHash("sha256").update(sharedSecret).digest(),
        Buffer.from(seedData.iv, "hex"),
      );
      decipher.setAuthTag(Buffer.from(seedData.authTag, "hex"));

      const decryptedData = Buffer.concat([
        decipher.update(Buffer.from(seed, "hex")),
        decipher.final(),
      ]);

      seed = decryptedData.toString("utf8");
    }

    this.setSeed(seed);

    return `Successfully loaded seed for wallet ${this.getId()} from ${filePath}.`;
  }

  /**
   * Returns the default address of the Wallet.
   *
   * @returns The default address
   */
  public getDefaultAddress(): Address | undefined {
    return this.addresses.find(
      address => address.getId() === this.model.default_address?.address_id,
    );
  }

  /**
   * Returns whether the Wallet has a seed with which to derive keys and sign transactions.
   *
   * @returns Whether the Wallet has a seed with which to derive keys and sign transactions.
   */
  public canSign(): boolean {
    return this.master?.publicKey !== undefined;
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
    const transaction = await this.getDefaultAddress()!.faucet();
    return transaction!;
  }

  /**
   * Transfers the given amount of the given Asset to the given address. Only same-Network Transfers are supported.
   * Currently only the default_address is used to source the Transfer.
   *
   * @param amount - The amount of the Asset to send.
   * @param assetId - The ID of the Asset to send.
   * @param destination - The destination of the transfer. If a Wallet, sends to the Wallet's default address. If a String, interprets it as the address ID.
   * @param intervalSeconds - The interval at which to poll the Network for Transfer status, in seconds.
   * @param timeoutSeconds - The maximum amount of time to wait for the Transfer to complete, in seconds.
   * @returns The hash of the Transfer transaction.
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

  /**
   * Validates the seed and address models passed to the constructor.
   *
   * @param seed - The seed to use for the Wallet
   * @param addressModels - The models of the addresses already registered with the Wallet
   */
  private static validateSeedAndAddressModels(
    seed: string | undefined,
    addressModels: AddressModel[],
  ): void {
    if (seed && seed.length !== 64) {
      throw new ArgumentError("Seed must be 32 bytes");
    }

    if (addressModels.length > 0 && seed === undefined) {
      throw new ArgumentError("Seed must be present if address models are provided");
    }

    if (addressModels.length === 0 && seed === "") {
      throw new ArgumentError("Seed must not be empty if address models are not provided");
    }
  }

  /**
   * Returns the seed and master key.
   *
   * @param seed - The seed to use for the Wallet. The function will generate one if it is not provided.
   * @returns The master key
   */
  private static getSeedAndMasterKey(seed: string | undefined): {
    seed: string | undefined;
    master: HDKey | undefined;
  } {
    switch (seed) {
      case undefined: {
        const mnemonic = bip39.generateMnemonic();
        const seedBuffer = bip39.mnemonicToSeedSync(mnemonic).subarray(0, 32);
        return {
          seed: seedBuffer.toString("hex"),
          master: HDKey.fromMasterSeed(seedBuffer),
        };
      }
      case "": {
        return {
          seed: undefined,
          master: undefined,
        };
      }
      default: {
        return {
          seed: seed,
          master: HDKey.fromMasterSeed(Buffer.from(seed, "hex")),
        };
      }
    }
  }

  /**
   * Loads the seed data from the given file.
   *
   * @param filePath - The path of the file to load the seed data from
   * @returns The seed data
   */
  private getExistingSeeds(filePath: string): Record<string, SeedData> {
    try {
      const data = fs.readFileSync(filePath, "utf8");
      if (!data) {
        return {} as Record<string, SeedData>;
      }
      const seedData = JSON.parse(data);
      if (
        !Object.entries(seedData).every(
          ([key, value]) =>
            typeof key === "string" &&
            /* eslint-disable @typescript-eslint/no-explicit-any */
            typeof (value! as any).authTag! === "string" &&
            typeof (value! as any).encrypted! === "boolean" &&
            typeof (value! as any).iv! === "string" &&
            typeof (value! as any).seed! === "string",
        )
      ) {
        throw new ArgumentError("Malformed backup data");
      }

      return seedData;
    } catch (error: any) {
      /* eslint-enable @typescript-eslint/no-explicit-any */
      if (error.code === "ENOENT") {
        return {} as Record<string, SeedData>;
      }
      throw new ArgumentError("Malformed backup data");
    }
  }

  /**
   * Gets the key for encrypting seed data.
   *
   * @returns The encryption key.
   */
  private getEncryptionKey(): Buffer {
    const privateKey = crypto.createPrivateKey(Coinbase.apiKeyPrivateKey);
    const publicKey = crypto.createPublicKey(Coinbase.apiKeyPrivateKey);
    const encryptionKey = crypto.diffieHellman({
      privateKey,
      publicKey,
    });
    return encryptionKey;
  }
}
