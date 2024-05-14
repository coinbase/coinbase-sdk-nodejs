import { Address as AddressModel } from "../client";
import { InternalError } from "./errors";
import { FaucetTransaction } from "./faucet_transaction";
import { AddressClient } from "./types";

/**
 * Class representing an Address in the Coinbase SDK.
 */
export class Address {
  private model: AddressModel;
  private client: AddressClient;

  /**
   * Creates an instance of Address.
   * @param {AddressModel} model - The address model data.
   * @param {AddressClient} client - The API client to interact with address-related endpoints.
   * @throws {InternalError} If the model or client is empty.
   */
  constructor(model: AddressModel, client: AddressClient) {
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
   * @returns {Promise<FaucetTransaction>} The faucet transaction object.
   * @throws {InternalError} If the request does not return a transaction hash.
   * @throws {Error} If the request fails.
   */
  async faucet(): Promise<FaucetTransaction> {
    try {
      const response = await this.client.requestFaucetFunds(
        this.model.wallet_id,
        this.model.address_id,
      );
      return new FaucetTransaction(response.data);
    } catch (e) {
      throw new Error(`Failed to request faucet funds`);
    }
  }

  /**
   * Gets the address ID.
   * @returns {string} The address ID.
   */
  public getId(): string {
    return this.model.address_id;
  }

  /**
   * Gets the network ID.
   * @returns {string} The network ID.
   */
  public getNetworkId(): string {
    return this.model.network_id;
  }

  /**
   * Gets the public key.
   * @returns {string} The public key.
   */
  public getPublicKey(): string {
    return this.model.public_key;
  }

  /**
   * Gets the wallet ID.
   * @returns {string} The wallet ID.
   */
  public getWalletId(): string {
    return this.model.wallet_id;
  }

  /**
   * Returns a string representation of the address.
   * @returns {string} A string representing the address.
   */
  public toString(): string {
    return `Coinbase:Address{addressId: '${this.model.address_id}', networkId: '${this.model.network_id}', walletId: '${this.model.wallet_id}'}`;
  }
}
