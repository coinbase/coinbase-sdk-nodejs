import { Address as AddressModel } from "../client";
import { InternalError } from "./errors";
import { FaucetTransaction } from "./faucet_transaction";
import { AddressAPIClient } from "./types";
import { Decimal } from "decimal.js";

/**
 * A representation of a blockchain address, which is a user-controlled account on a network.
 */
export class Address {
  private model: AddressModel;
  private client: AddressAPIClient;

  /**
   * Initializes a new Address instance.
   *
   * @param {AddressModel} model - The address model data.
   * @param {AddressAPIClient} client - The API client to interact with address-related endpoints.
   * @throws {InternalError} If the model or client is empty.
   */
  constructor(model: AddressModel, client: AddressAPIClient) {
    if (!model) {
      throw new InternalError("Address model cannot be empty");
    }
    if (!client) {
      throw new InternalError("Address client cannot be empty");
    }
    this.model = model;
    this.client = client;
  }

  /**
   * Requests faucet funds for the address.
   * Only supported on testnet networks.
   *
   * @returns {Promise<FaucetTransaction>} The faucet transaction object.
   * @throws {InternalError} If the request does not return a transaction hash.
   * @throws {Error} If the request fails.
   */
  async faucet(): Promise<FaucetTransaction> {
    const response = await this.client.requestFaucetFunds(
      this.model.wallet_id,
      this.model.address_id,
    );
    return new FaucetTransaction(response.data);
  }

  /**
   * Returns the address ID.
   *
   * @returns {string} The address ID.
   */
  public getId(): string {
    return this.model.address_id;
  }

  /**
   * Returns the network ID.
   *
   * @returns {string} The network ID.
   */
  public getNetworkId(): string {
    return this.model.network_id;
  }

  /**
   * Returns the balance of the provided asset.
   *
   * @param {string} assetId - The asset ID.
   * @returns {Decimal} The balance of the asset.
   */
  async getBalance(assetId: string): Promise<Decimal> {
    const response = await this.client.getAddressBalance(
      this.model.wallet_id,
      this.model.address_id,
      assetId,
    );

    return new Decimal(response.data.amount);
  }

  /**
   * Returns the public key.
   *
   * @returns {string} The public key.
   */
  public getPublicKey(): string {
    return this.model.public_key;
  }

  /**
   * Returns the wallet ID.
   *
   * @returns {string} The wallet ID.
   */
  public getWalletId(): string {
    return this.model.wallet_id;
  }

  /**
   * Returns a string representation of the address.
   *
   * @returns {string} A string representing the address.
   */
  public toString(): string {
    return `Coinbase:Address{addressId: '${this.model.address_id}', networkId: '${this.model.network_id}', walletId: '${this.model.wallet_id}'}`;
  }
}
