import Decimal from "decimal.js";
import { Coinbase } from "./coinbase";
import { Asset } from "./asset";
import { Balance } from "./balance";
import { BalanceMap } from "./balance_map";
import { FaucetTransaction } from "./faucet_transaction";
import { StakeOptionsMode } from "./types";

/**
 * A representation of a blockchain address, which is a user-controlled account on a network.
 */
export class Address {
  protected networkId: string;
  protected id: string;

  /**
   * Initializes a new Address instance.
   *
   * @param networkId - The network id.
   * @param id - The onchain address id.
   */
  constructor(networkId: string, id: string) {
    this.networkId = networkId;
    this.id = id;
  }

  /**
   * Returns the network ID.
   *
   * @returns The network ID.
   */
  public getNetworkId(): string {
    return this.networkId;
  }

  /**
   * Returns the address ID.
   *
   * @returns The address ID.
   */
  public getId(): string {
    return this.id;
  }

  /**
   * Returns the list of balances for the address.
   *
   * @returns The map from asset ID to balance.
   */
  public async listBalances(): Promise<BalanceMap> {
    const response = await Coinbase.apiClients.externalAddress!.listExternalAddressBalances(
      this.getNetworkId(),
      this.getId(),
    );

    return BalanceMap.fromBalances(response.data.data);
  }

  /**
   * Returns the balance of the provided asset.
   *
   * @param assetId - The asset ID.
   * @returns The balance of the asset.
   */
  async getBalance(assetId: string): Promise<Decimal> {
    const response = await Coinbase.apiClients.externalAddress!.getExternalAddressBalance(
      this.getNetworkId(),
      this.getId(),
      Asset.primaryDenomination(assetId),
    );

    if (!response.data) {
      return new Decimal(0);
    }

    return Balance.fromModelAndAssetId(response.data, assetId).amount;
  }

  /**
   * Get the stakeable balance for the supplied asset.
   *
   * @param asset_id - The asset to check the stakeable balance for.
   * @param mode - The staking mode. Defaults to DEFAULT.
   * @param options - Additional options for getting the stakeable balance.
   * @returns The stakeable balance.
   */
  public async stakeableBalance(
    asset_id: string,
    mode: StakeOptionsMode = StakeOptionsMode.DEFAULT,
    options: { [key: string]: string } = {},
  ): Promise<Decimal> {
    const balances = await this.getStakingBalances(asset_id, mode, options);
    return balances.stakeableBalance;
  }

  /**
   * Get the unstakeable balance for the supplied asset.
   *
   * @param asset_id - The asset to check the unstakeable balance for.
   * @param mode - The staking mode. Defaults to DEFAULT.
   * @param options - Additional options for getting the unstakeable balance.
   * @returns The unstakeable balance.
   */
  public async unstakeableBalance(
    asset_id: string,
    mode: StakeOptionsMode = StakeOptionsMode.DEFAULT,
    options: { [key: string]: string } = {},
  ): Promise<Decimal> {
    const balances = await this.getStakingBalances(asset_id, mode, options);
    return balances.unstakeableBalance;
  }

  /**
   * Get the claimable balance for the supplied asset.
   *
   * @param asset_id - The asset to check claimable balance for.
   * @param mode - The staking mode. Defaults to DEFAULT.
   * @param options - Additional options for getting the claimable balance.
   * @returns The claimable balance.
   */
  public async claimableBalance(
    asset_id: string,
    mode: StakeOptionsMode = StakeOptionsMode.DEFAULT,
    options: { [key: string]: string } = {},
  ): Promise<Decimal> {
    const balances = await this.getStakingBalances(asset_id, mode, options);
    return balances.claimableBalance;
  }

  /**
   * Requests faucet funds for the address.
   * Only supported on testnet networks.
   *
   * @returns The faucet transaction object.
   * @throws {InternalError} If the request does not return a transaction hash.
   * @throws {Error} If the request fails.
   */
  public async faucet(): Promise<FaucetTransaction> {
    const response = await Coinbase.apiClients.externalAddress!.requestExternalFaucetFunds(
      this.getNetworkId(),
      this.getId(),
    );
    return new FaucetTransaction(response.data);
  }

  /**
   * Returns a string representation of the address.
   *
   * @returns A string representing the address.
   */
  public toString(): string {
    return `Address { addressId: '${this.getId()}', networkId: '${this.getNetworkId()}' }`;
  }

  /**
   * Create a shallow copy of given options.
   *
   * @param options - The supplied options to be copied
   * @private
   * @returns A copy of the options.
   */
  protected copyOptions(options?: { [key: string]: string }): {
    [key: string]: string;
  } {
    return { ...options };
  }

  /**
   * Get the different staking balance types for the supplied asset.
   *
   * @param assetId - The asset to lookup balances for.
   * @param mode - The staking mode. Defaults to DEFAULT.
   * @param options - Additional options for the balance lookup.
   * @private
   * @returns The different balance types.
   */
  private async getStakingBalances(
    assetId: string,
    mode?: StakeOptionsMode,
    options?: { [key: string]: string },
  ): Promise<{ [key: string]: Decimal }> {
    const newOptions = this.copyOptions(options);

    if (mode) {
      newOptions.mode = mode;
    }

    const request = {
      network_id: this.getNetworkId(),
      asset_id: Asset.primaryDenomination(assetId),
      address_id: this.getId(),
      options: newOptions,
    };

    const response = await Coinbase.apiClients.stake!.getStakingContext(request);

    return {
      stakeableBalance: Balance.fromModelAndAssetId(
        response!.data.context.stakeable_balance,
        assetId,
      ).amount,
      unstakeableBalance: Balance.fromModelAndAssetId(
        response!.data.context.unstakeable_balance,
        assetId,
      ).amount,
      claimableBalance: Balance.fromModelAndAssetId(
        response!.data.context.claimable_balance,
        assetId,
      ).amount,
    };
  }
}
