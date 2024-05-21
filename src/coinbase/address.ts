import { Address as AddressModel } from "../client";
import { Balance } from "./balance";
import { BalanceMap } from "./balance_map";
import { Coinbase } from "./coinbase";
import { InternalError } from "./errors";
import { FaucetTransaction } from "./faucet_transaction";
import { Decimal } from "decimal.js";

/**
 * A representation of a blockchain address, which is a user-controlled account on a network.
 */
export class Address {
  private model: AddressModel;

  /**
   * Initializes a new Address instance.
   *
   * @param {AddressModel} model - The address model data.
   * @throws {InternalError} If the model or client is empty.
   */
  constructor(model: AddressModel) {
    if (!model) {
      throw new InternalError("Address model cannot be empty");
    }
    this.model = model;
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
    const response = await Coinbase.apiClients.address!.requestFaucetFunds(
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
   * Returns the list of balances for the address.
   *
   * @returns {BalanceMap} - The map from asset ID to balance.
   */
  async listBalances(): Promise<BalanceMap> {
    const response = await Coinbase.apiClients.address!.listAddressBalances(
      this.model.wallet_id,
      this.model.address_id,
    );

    return BalanceMap.fromBalances(response.data.data);
  }

  /**
   * Returns the balance of the provided asset.
   *
   * @param {string} assetId - The asset ID.
   * @returns {Decimal} The balance of the asset.
   */
  async getBalance(assetId: string): Promise<Decimal> {
    const response = await Coinbase.apiClients.address!.getAddressBalance(
      this.model.wallet_id,
      this.model.address_id,
      assetId,
    );

    if (!response.data) {
      return new Decimal(0);
    }

    return Balance.fromModelAndAssetId(response.data, assetId).amount;
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
