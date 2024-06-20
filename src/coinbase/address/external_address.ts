import { Address } from "../address";
import { Amount, CoinbaseExternalAddressStakeOptions, StakeOptionsMode } from "../types";
import { Coinbase } from "../coinbase";
import Decimal from "decimal.js";
import { Asset } from "../asset";
import { StakingOperation } from "../staking_operation";

/**
 * A representation of a blockchain Address, which is a user-controlled account on a Network. Addresses are used to
 * send and receive Assets. An ExternalAddress is an Address that is not controlled by the developer, but is instead
 * controlled by the user.
 */
export class ExternalAddress extends Address {
  /**
   * Builds a stake operation for the supplied asset. The stake operation
   * may take a few minutes to complete in the case when infrastructure is spun up.
   *
   * @param amount - The amount of the asset to stake.
   * @param assetId - The asset to stake.
   * @param options - Additional options for the stake operation.
   * @returns {StakingOperation} The stake operation.
   */
  public async buildStakeOperation(
    amount: Amount,
    assetId: string,
    options: CoinbaseExternalAddressStakeOptions = { mode: StakeOptionsMode.DEFAULT },
  ): Promise<StakingOperation> {
    await this.validateCanStake(amount, assetId, options);
    return this.buildStakingOperation(amount, assetId, "stake", options);
  }

  /**
   * Builds an unstake operation for the supplied asset.
   *
   * @param amount - The amount of the asset to unstake.
   * @param assetId - The asset to unstake.
   * @param options - Additional options for the unstake operation.
   * @returns {StakingOperation} The unstake operation.
   */
  public async buildUnstakeOperation(
    amount: Amount,
    assetId: string,
    options: CoinbaseExternalAddressStakeOptions = { mode: StakeOptionsMode.DEFAULT },
  ): Promise<StakingOperation> {
    await this.validateCanUnstake(amount, assetId, options);
    return this.buildStakingOperation(amount, assetId, "unstake", options);
  }

  /**
   * Builds a claim stake operation for the supplied asset.
   *
   * @param amount - The amount of the asset to claim stake.
   * @param assetId - The asset to claim stake.
   * @param options - Additional options for the claim stake operation.
   * @returns {Transaction} The claim stake operation.
   */
  public async buildClaimStakeOperation(
    amount: Amount,
    assetId: string,
    options: CoinbaseExternalAddressStakeOptions = { mode: StakeOptionsMode.DEFAULT },
  ): Promise<StakingOperation> {
    await this.validateCanClaimStake(amount, assetId, options);
    return this.buildStakingOperation(amount, assetId, "claim_stake", options);
  }

  /**
   * Get the stakeable balance for the supplied asset.
   *
   * @param asset_id - The asset to check the stakeable balance for.
   * @param options - Additional options for getting the stakeable balance.
   * @returns {string} The stakeable balance.
   */
  public async getStakeableBalance(
    asset_id: string,
    options: CoinbaseExternalAddressStakeOptions = { mode: StakeOptionsMode.DEFAULT },
  ): Promise<string> {
    const balances = await this.getStakingBalances(asset_id, options);
    return balances["stakeableBalance"];
  }

  /**
   * Get the unstakeable balance for the supplied asset.
   *
   * @param asset_id - The asset to check the unstakeable balance for.
   * @param options - Additional options for getting the unstakeable balance.
   * @returns {string} The unstakeable balance.
   */
  public async getUnstakeableBalance(
    asset_id: string,
    options: CoinbaseExternalAddressStakeOptions = { mode: StakeOptionsMode.DEFAULT },
  ): Promise<string> {
    const balances = await this.getStakingBalances(asset_id, options);
    return balances["unstakeableBalance"];
  }

  /**
   * Get the claimable balance for the supplied asset.
   *
   * @param asset_id - The asset to check claimable balance for.
   * @param options - Additional options for getting the claimable balance.
   * @returns {string} The claimable balance.
   */
  public async getClaimableBalance(
    asset_id: string,
    options: CoinbaseExternalAddressStakeOptions = { mode: StakeOptionsMode.DEFAULT },
  ): Promise<string> {
    const balances = await this.getStakingBalances(asset_id, options);
    return balances["claimableBalance"];
  }

  /**
   * Validate if the operation is able to stake with the supplied input.
   *
   * @param amount - The amount of the asset to stake.
   * @param assetId - The asset to stake.
   * @param options - Additional options for the stake operation.
   * @private
   * @throws {Error} If the supplied input is not able to create a stake operation.
   */
  private async validateCanStake(
    amount: Amount,
    assetId: string,
    options: CoinbaseExternalAddressStakeOptions = { mode: StakeOptionsMode.DEFAULT },
  ): Promise<void> {
    const stakeableBalance = await this.getStakeableBalance(assetId, options);

    if (new Decimal(stakeableBalance).lessThan(amount.toString())) {
      throw new Error(
        `Insufficient funds ${amount} requested to stake, only ${stakeableBalance} available.`,
      );
    }
  }

  /**
   * Validate if the operation is able to unstake with the supplied input.
   *
   * @param amount - The amount of the asset to unstake.
   * @param assetId - The asset to unstake.
   * @param options - Additional options for the unstake operation.
   * @private
   * @throws {Error} If the supplied input is not able to create an unstake operation.
   */
  private async validateCanUnstake(
    amount: Amount,
    assetId: string,
    options: CoinbaseExternalAddressStakeOptions = { mode: StakeOptionsMode.DEFAULT },
  ): Promise<void> {
    const unstakeableBalance = new Decimal(await this.getUnstakeableBalance(assetId, options));

    if (unstakeableBalance.lessThan(amount.toString())) {
      throw new Error(
        `Insufficient funds ${amount} requested to unstake, only ${unstakeableBalance} available.`,
      );
    }
  }

  /**
   * Validate if the operation is able to claim stake with the supplied input.
   *
   * @param amount - The amount of the asset to claim stake.
   * @param assetId - The asset to claim stake.
   * @param options - Additional options for the claim stake operation.
   * @private
   * @throws {Error} If the supplied input is not able to create a claim stake operation.
   */
  private async validateCanClaimStake(
    amount: Amount,
    assetId: string,
    options: CoinbaseExternalAddressStakeOptions = { mode: StakeOptionsMode.DEFAULT },
  ): Promise<void> {
    const claimableBalance = new Decimal(await this.getClaimableBalance(assetId, options));

    if (claimableBalance.lessThan(amount.toString())) {
      throw new Error(
        `Insufficient funds ${amount} requested to claim stake, only ${claimableBalance} available.`,
      );
    }
  }

  /**
   * Get the different staking balance types for the supplied asset.
   *
   * @param assetId - The asset to lookup balances for.
   * @param options - Additional options for the balance lookup.
   * @private
   * @returns { Map } The different balance types.
   */
  private async getStakingBalances(
    assetId: string,
    options: CoinbaseExternalAddressStakeOptions = { mode: StakeOptionsMode.DEFAULT },
  ): Promise<{ [key: string]: string }> {
    const request = {
      network_id: this.getNetworkId(),
      asset_id: assetId,
      address_id: this.getId(),
      options: this.transformStakeOptions(options),
    };

    const response = await Coinbase.apiClients.stake!.getStakingContext(request);
    const { claimable_balance, stakeable_balance, unstakeable_balance } = response!.data.context;

    return {
      claimableBalance: Asset.fromAtomicAmount(new Decimal(claimable_balance), assetId)
        .toFixed()
        .toString(),
      stakeableBalance: Asset.fromAtomicAmount(new Decimal(stakeable_balance), assetId)
        .toFixed()
        .toString(),
      unstakeableBalance: Asset.fromAtomicAmount(new Decimal(unstakeable_balance), assetId)
        .toFixed()
        .toString(),
    };
  }

  /**
   * Builds the staking operation based on the supplied input.
   *
   * @param amount - The amount for the staking operation.
   * @param assetId - The asset for the staking operation.
   * @param action - The specific action for the staking operation. e.g. stake, unstake, claim_stake
   * @param options - Additional options to build a stake operation.
   * @private
   * @returns {StakingOperation} The staking operation.
   * @throws {Error} If the supplied input cannot build a valid staking operation.
   */
  private async buildStakingOperation(
    amount: Amount,
    assetId: string,
    action: string,
    options: CoinbaseExternalAddressStakeOptions = { mode: StakeOptionsMode.DEFAULT },
  ): Promise<StakingOperation> {
    const stakingAmount = new Decimal(amount.toString());
    if (stakingAmount.lessThanOrEqualTo(0)) {
      throw new Error(`Amount required greater than zero.`);
    }

    options.amount = Asset.toAtomicAmount(new Decimal(amount.toString()), assetId).toString();

    const request = {
      network_id: this.getNetworkId(),
      asset_id: assetId,
      address_id: this.getId(),
      action: action,
      options: options,
    };

    const response = await Coinbase.apiClients.stake!.buildStakingOperation(request);

    return new StakingOperation(response!.data);
  }

  /**
   * Transform the operations from a {CoinbaseExternalAddressStakeOptions} type to a generic {Map}.
   *
   * @param options - The supplied options to transform.
   * @private
   * @returns {Map} The transformed options.
   */
  private transformStakeOptions(options: CoinbaseExternalAddressStakeOptions): {
    [key: string]: string;
  } {
    const result: { [key: string]: string } = {};

    if (options.mode !== undefined) {
      result["mode"] = options.mode;
    }

    return result;
  }
}
