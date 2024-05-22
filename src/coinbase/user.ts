import * as fs from "fs";
import * as crypto from "crypto";
import { WalletData, SeedData } from "./types";
import { User as UserModel } from "./../client/api";
import { Wallet } from "./wallet";
import { Coinbase } from "./coinbase";
import { ArgumentError } from "./errors";

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
   * Saves a Wallet to local file system. Wallet saved this way can be re-instantiated with `loadWallets` function,
   * provided the backup file is available. This is an insecure method of storing Wallet seeds and should only be used
   * for development purposes. If you call `saveWallet` with Wallets containing the same walletId, the backup will be overwritten during the second attempt.
   * The default backup file is `seeds.json` in the root folder. It can be configured by changing `Coinbase.backupFilePath`.
   *
   * @param wallet - The Wallet object to save.
   * @param encrypt - Whether or not to encrypt the backup persisted to local file system.
   * @returns The saved Wallet object.
   */
  public saveWallet(wallet: Wallet, encrypt: boolean = false): Wallet {
    const existingSeedsInStore = this.getExistingSeeds();
    const data = wallet.export();
    let seedToStore = data.seed;
    let authTag = "";
    let iv = "";

    if (encrypt) {
      const ivBytes = crypto.randomBytes(12);
      const sharedSecret = this.storeEncryptionKey();
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

    fs.writeFileSync(
      Coinbase.backupFilePath,
      JSON.stringify(existingSeedsInStore, null, 2),
      "utf8",
    );
    return wallet;
  }

  /**
   * Loads all wallets belonging to the User with backup persisted to the local file system.
   *
   * @returns the map of walletId's to the Wallet objects.
   * @throws {ArgumentError} - If the backup file is not found or the data is malformed.
   */
  public async loadWallets(): Promise<{ [key: string]: Wallet }> {
    const existingSeedsInStore = this.getExistingSeeds();
    if (Object.keys(existingSeedsInStore).length === 0) {
      throw new ArgumentError("Backup file not found");
    }

    const wallets: { [key: string]: Wallet } = {};
    for (const [walletId, seedData] of Object.entries(existingSeedsInStore)) {
      let seed = seedData.seed;
      if (!seed) {
        throw new Error("Malformed backup data");
      }

      if (seedData.encrypted) {
        const sharedSecret = this.storeEncryptionKey();
        if (!seedData.iv || !seedData.authTag) {
          throw new Error("Malformed encrypted seed data");
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

      const data: WalletData = { walletId, seed };
      wallets[walletId] = await this.importWallet(data);
    }
    return wallets;
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
    const addressCount = addressList.data!.total_count;

    return Wallet.init(walletModel.data, data.seed, addressCount);
  }

  /**
   * Gets existing seeds if any from the backup file.
   *
   * @returns The existing seeds as a JSON object.
   * @throws {ArgumentError} - If the backup data is malformed.
   */
  private getExistingSeeds(): Record<string, SeedData> {
    try {
      const data = fs.readFileSync(Coinbase.backupFilePath, "utf8");
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
