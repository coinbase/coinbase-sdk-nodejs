import { HDKey } from "@scure/bip32";
import * as crypto from "crypto";
import Decimal from "decimal.js";
import { ethers } from "ethers";
import * as fs from "fs";
import * as secp256k1 from "secp256k1";
import { Address as AddressModel, Wallet as WalletModel } from "../client";
import { Address } from "./address";
import { WalletAddress } from "./address/wallet_address";
import { Asset } from "./asset";
import { Balance } from "./balance";
import { BalanceMap } from "./balance_map";
import { Coinbase } from "./coinbase";
import { ArgumentError, InternalError } from "./errors";
import { FaucetTransaction } from "./faucet_transaction";
import { Trade } from "./trade";
import { Transfer } from "./transfer";
import {
  Amount,
  CreateTransferOptions,
  SeedData,
  ServerSignerStatus,
  WalletCreateOptions,
  WalletData,
} from "./types";
import { convertStringToHex, delay } from "./utils";

/**
 * A representation of a Wallet. Wallets come with a single default Address, but can expand to have a set of Addresses,
 * each of which can hold a balance of one or more Assets. Wallets can create new Addresses, list their addresses,
 * list their balances, and transfer Assets to other Addresses. Wallets should be created through User.createWallet or User.importWallet.
 */
export class Wallet {
  private model: WalletModel;

  private master?: HDKey;
  private seed?: string;
  private addresses: WalletAddress[] = [];

  private readonly addressPathPrefix = "m/44'/60'/0'/0";
  static MAX_ADDRESSES = 20;

  /**
   * Private constructor to prevent direct instantiation outside of factory method. Use Wallet.init instead.
   *
   * @ignore
   * @param model - The wallet model object.
   * @param master - The HD master key.
   * @param seed - The seed to use for the Wallet. Expects a 32-byte hexadecimal with no 0x prefix.
   * @hideconstructor
   */
  private constructor(model: WalletModel, master: HDKey | undefined, seed: string | undefined) {
    this.model = model;
    this.master = master;
    this.seed = seed;
  }

  /**
   * Lists the Wallets belonging to the User.
   *
   * @param pageSize - The number of Wallets to return per page. Defaults to 10
   * @param nextPageToken - The token for the next page of Wallets
   * @returns An object containing the Wallets and the token for the next page
   */
  public static async listWallets(
    pageSize: number = 10,
    nextPageToken?: string,
  ): Promise<{ wallets: Wallet[]; nextPageToken: string }> {
    const walletList = await Coinbase.apiClients.wallet!.listWallets(
      pageSize,
      nextPageToken ? nextPageToken : undefined,
    );
    const wallets = await Promise.all(
      walletList.data.data.map(async wallet => {
        return await Wallet.init(wallet, "");
      }),
    );

    return { wallets: wallets, nextPageToken: walletList.data.next_page };
  }

  /**
   * Fetches a Wallet by its ID. The returned wallet can be immediately used for signing operations if backed by a server signer.
   * If the wallet is not backed by a server signer, the wallet's seed will need to be set before it can be used for signing operations.
   *
   * @param wallet_id - The ID of the Wallet to fetch
   * @returns The fetched Wallet
   */
  public static async fetch(wallet_id: string): Promise<Wallet> {
    const response = await Coinbase.apiClients.wallet!.getWallet(wallet_id);
    return Wallet.init(response.data!, "");
  }

  /**
   * Returns a newly created Wallet object. Do not use this method directly.
   * Instead, use User.createWallet.
   *
   * @constructs Wallet
   * @param options - The options to create the Wallet.
   * @param options.networkId - the ID of the blockchain network. Defaults to 'base-sepolia'.
   * @param options.intervalSeconds - The interval at which to poll the CDPService, in seconds.
   * @param options.timeoutSeconds - The maximum amount of time to wait for the ServerSigner to create a seed, in seconds.
   * @throws {ArgumentError} If the model or client is not provided.
   * @throws {InternalError} - If address derivation or caching fails.
   * @throws {APIError} - If the request fails.
   * @returns A promise that resolves with the new Wallet object.
   */
  public static async create({
    networkId = Coinbase.networks.BaseSepolia,
    timeoutSeconds = 20,
    intervalSeconds = 0.2,
  }: WalletCreateOptions = {}): Promise<Wallet> {
    const result = await Coinbase.apiClients.wallet!.createWallet({
      wallet: {
        network_id: networkId,
        use_server_signer: Coinbase.useServerSigner,
      },
    });

    const wallet = await Wallet.init(result.data, undefined);
    if (Coinbase.useServerSigner) {
      await wallet.waitForSigner(wallet.getId()!, intervalSeconds, timeoutSeconds);
    }

    await wallet.createAddress();
    return wallet;
  }

  /**
   * Returns a new Wallet object. Do not use this method directly. Instead, use User.createWallet or User.importWallet.
   *
   * @constructs Wallet
   * @param model - The underlying Wallet model object
   * @param seed - The seed to use for the Wallet. Expects a 32-byte hexadecimal with no 0x prefix. If null or undefined, a new seed will be generated.
   * If the empty string, no seed is generated, and the Wallet will be instantiated without a seed and its corresponding private keys.
   * @throws {ArgumentError} If the model or client is not provided.
   * @throws {InternalError} - If address derivation or caching fails.
   * @throws {APIError} - If the request fails.
   * @returns A promise that resolves with the new Wallet object.
   */
  public static async init(model: WalletModel, seed?: string | undefined): Promise<Wallet> {
    const wallet = new Wallet(model, undefined, seed);
    if (Coinbase.useServerSigner) {
      return wallet;
    }
    wallet.setMasterNode(seed);
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
   * Creates a new Address in the Wallet.
   *
   * @returns The new Address.
   * @throws {APIError} - If the address creation fails.
   */
  public async createAddress(): Promise<Address> {
    let payload, key;
    if (!Coinbase.useServerSigner) {
      const hdKey = this.deriveKey(this.addresses.length);
      const attestation = this.createAttestation(hdKey);
      const publicKey = convertStringToHex(hdKey.publicKey!);
      key = new ethers.Wallet(convertStringToHex(hdKey.privateKey!));

      payload = {
        public_key: publicKey,
        attestation: attestation,
      };
    }
    const response = await Coinbase.apiClients.address!.createAddress(this.model.id!, payload);
    if (!this.addresses.length || !Coinbase.useServerSigner) {
      this.reload();
    }
    const address = new WalletAddress(response.data, key);
    this.addresses.push(address);

    return address;
  }

  /**
   * Set the seed for the Wallet.
   *
   * @param seed - The seed to use for the Wallet. Expects a 32-byte hexadecimal with no 0x prefix.
   * @throws {ArgumentError} If the seed is empty.
   * @throws {InternalError} If the seed is already set.
   */
  public setSeed(seed: string) {
    if (seed === undefined || seed === "") {
      throw new ArgumentError("Seed must not be empty");
    }
    if (this.master) {
      throw new InternalError("Seed is already set");
    }
    this.setMasterNode(seed);

    if (this.addresses.length < 1) {
      return;
    }

    this.addresses.forEach((address: WalletAddress, index: number) => {
      const derivedKey = this.deriveKey(index);
      const etherWallet = new ethers.Wallet(convertStringToHex(derivedKey.privateKey!));
      if (etherWallet.address != address.getId()) {
        throw new InternalError(
          `Seed does not match wallet; cannot find address ${etherWallet.address}`,
        );
      }
      address.setKey(etherWallet);
    });
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
  public async listAddresses(): Promise<WalletAddress[]> {
    const response = await Coinbase.apiClients.address!.listAddresses(
      this.getId()!,
      Wallet.MAX_ADDRESSES,
    );

    const addresses = response.data.data.map((address, index) => {
      return this.buildWalletAddress(address, index);
    });
    this.addresses = addresses;
    return addresses;
  }

  /**
   *  Trades the given amount of the given Asset for another Asset. Currently only the default address is used to source the Trade
   *
   * @param amount - The amount of the Asset to send.
   * @param fromAssetId - The ID of the Asset to trade from.
   * @param toAssetId - The ID of the Asset to trade to.
   * @throws {InternalError} If the default address is not found.
   * @throws {Error} If the private key is not loaded, or if the asset IDs are unsupported, or if there are insufficient funds.
   * @returns The Trade object.
   */
  public async createTrade(amount: Amount, fromAssetId: string, toAssetId: string): Promise<Trade> {
    if (!this.getDefaultAddress()) {
      throw new InternalError("Default address not found");
    }
    return await this.getDefaultAddress()!.createTrade(amount, fromAssetId, toAssetId);
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
    const response = await Coinbase.apiClients.wallet!.getWalletBalance(
      this.model.id!,
      Asset.primaryDenomination(assetId),
    );
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
    const status: Record<string, ServerSignerStatus> = {
      pending_seed_creation: ServerSignerStatus.PENDING,
      active_seed: ServerSignerStatus.ACTIVE,
    };

    return this.model.server_signer_status ? status[this.model.server_signer_status] : undefined;
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
  public async loadSeed(filePath: string): Promise<string> {
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
      /* istanbul ignore next */
      throw new ArgumentError("Seed data is malformed");
    }

    if (seedData.encrypted) {
      const sharedSecret = this.getEncryptionKey();
      if (!seedData.iv || !seedData.authTag) {
        /* istanbul ignore next */
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
    await this.listAddresses();

    return `Successfully loaded seed for wallet ${this.getId()} from ${filePath}.`;
  }

  /**
   * Returns the default address of the Wallet.
   *
   * @returns The default address
   */
  public getDefaultAddress(): WalletAddress | undefined {
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
   * @param options - The options to create the Transfer.
   * @param options.amount - The amount of the Asset to send.
   * @param options.assetId - The ID of the Asset to send.
   * @param options.destination - The destination of the transfer. If a Wallet, sends to the Wallet's default address. If a String, interprets it as the address ID.
   * @param options.timeoutSeconds - The maximum amount of time to wait for the Transfer to complete, in seconds.
   * @param options.intervalSeconds - The interval at which to poll the Network for Transfer status, in seconds.
   * @returns The hash of the Transfer transaction.
   * @throws {APIError} if the API request to create a Transfer fails.
   * @throws {APIError} if the API request to broadcast a Transfer fails.
   * @throws {Error} if the Transfer times out.
   */
  public async createTransfer({
    amount,
    assetId,
    destination,
    timeoutSeconds = 10,
    intervalSeconds = 0.2,
  }: CreateTransferOptions): Promise<Transfer> {
    if (!this.getDefaultAddress()) {
      throw new InternalError("Default address not found");
    }
    return await this.getDefaultAddress()!.createTransfer({
      amount,
      assetId,
      destination,
      timeoutSeconds,
      intervalSeconds,
    });
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
   */
  private validateSeed(seed: string | undefined): void {
    if (seed && seed.length !== 64) {
      throw new ArgumentError("Seed must be 32 bytes");
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

  /**
   * Returns a WalletAddress object for the given AddressModel.
   *
   * @param addressModel - The AddressModel to build the WalletAddress from.
   * @param index - The index of the AddressModel.
   * @returns The WalletAddress object.
   */
  private buildWalletAddress(addressModel: AddressModel, index: number): WalletAddress {
    if (!this.master) {
      return new WalletAddress(addressModel);
    }
    const key = this.deriveKey(index);
    const ethWallet = new ethers.Wallet(convertStringToHex(key.privateKey!));
    if (ethWallet.address != addressModel.address_id) {
      throw new InternalError(`Seed does not match wallet`);
    }

    return new WalletAddress(addressModel, ethWallet);
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
   * Sets the master node for the given seed, if valid. If the seed is undefined it will set the master node using a random seed.
   *
   * @param seed - The seed to use for the Wallet.
   * @returns The master node for the given seed.
   */
  private setMasterNode(seed: string | undefined): HDKey | undefined {
    if (seed === "") {
      return undefined;
    }
    if (seed === undefined) {
      seed = ethers.Wallet.createRandom().privateKey.slice(2);
    }
    this.validateSeed(seed);
    this.seed = seed;
    this.master = HDKey.fromMasterSeed(Buffer.from(seed, "hex"));
  }

  /**
   * Derives a key for an already registered Address in the Wallet.
   *
   * @param index - The index of the Address to derive.
   * @throws {InternalError} - If the key derivation fails.
   * @returns The derived key.
   */
  private deriveKey(index: number): HDKey {
    if (!this.master) {
      throw new InternalError("Cannot derive key for Wallet without seed loaded");
    }
    const [networkPrefix] = this.model.network_id.split("-");
    // TODO: Push this logic to the backend.
    if (!["base", "ethereum"].includes(networkPrefix)) {
      throw new InternalError(`Unsupported network ID: ${this.model.network_id}`);
    }
    const derivedKey = this.master?.derive(this.addressPathPrefix + `/${index}`);
    if (!derivedKey?.privateKey) {
      throw new InternalError("Failed to derive key");
    }
    return derivedKey;
  }

  /**
   * Creates an attestation for the Address currently being created.
   *
   * @param key - The key of the Wallet.
   * @returns The attestation.
   */
  private createAttestation(key: HDKey): string {
    if (!key.publicKey || !key.privateKey) {
      /* istanbul ignore next */
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
}
