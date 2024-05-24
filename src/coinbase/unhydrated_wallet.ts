import Decimal from "decimal.js";
import { Address as AddressModel, Wallet as WalletModel } from "../client";
import { Address } from "./address";
import { Balance } from "./balance";
import { BalanceMap } from "./balance_map";
import { Coinbase } from "./coinbase";
import { FaucetTransaction } from "./faucet_transaction";
import { Wallet } from "./wallet";
import { InternalError } from "./errors";

/**
 * Represents a Wallet that has not been hydrated with a seed.
 */
export class UnhydratedWallet {
  protected model: WalletModel;
  protected addresses: Address[] = [];
  protected addressModels: AddressModel[] = [];

  /**
   * Initializes a new UnhydratedWallet instance.
   *
   * @param wallet - The Wallet model.
   * @param addressModels - The list of Address models.
   */
  constructor(wallet: WalletModel, addressModels: AddressModel[]) {
    if (!wallet) {
      throw new InternalError("Wallet model cannot be empty");
    }
    this.model = wallet;
    this.addressModels = addressModels;
    this.addresses = this.addressModels.map(addressModel => {
      return new Address(addressModel);
    });
  }

  /**
   * Returns the Wallet model.
   *
   * @param seed - The seed to use for the Wallet. Expects a 32-byte hexadecimal with no 0x prefix.
   * @returns The Wallet object.
   */
  public async setSeed(seed: string): Promise<Wallet> {
    return await Wallet.init(this.model, seed, this.addressModels);
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
   * Returns the list of Addresses in the Wallet.
   *
   * @returns The list of Addresses.
   */
  public getAddresses(): Address[] {
    return this.addresses;
  }

  /**
   * Returns the list of balances of this Wallet. Balances are aggregated across all Addresses in the Wallet.
   *
   * @returns The list of balances. The key is the Asset ID, and the value is the balance.
   */
  public async getBalances(): Promise<BalanceMap> {
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
    return false;
  }

  /**
   * Returns a String representation of the UnhydratedWallet.
   *
   * @returns a String representation of the UnhydratedWallet
   */
  public toString(): string {
    return `UnhydratedWallet{id: '${this.model.id}', networkId: '${this.model.network_id}'}`;
  }
}
