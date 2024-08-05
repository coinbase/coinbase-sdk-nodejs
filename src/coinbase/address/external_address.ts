import { Address } from "../address";
import { Amount, StakeOptionsMode } from "../types";
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
   * @param mode - The staking mode. Defaults to DEFAULT.
   * @param options - Additional options for the stake operation.
   * @returns The stake operation.
   */
  public async buildStakeOperation(
    amount: Amount,
    assetId: string,
    mode: StakeOptionsMode = StakeOptionsMode.DEFAULT,
    options: { [key: string]: string } = {},
  ): Promise<StakingOperation> {
    await this.validateCanStake(amount, assetId, mode, options);
    return this.buildStakingOperation(amount, assetId, "stake", mode, options);
  }

  /**
   * Builds an unstake operation for the supplied asset.
   *
   * @param amount - The amount of the asset to unstake.
   * @param assetId - The asset to unstake.
   * @param mode - The staking mode. Defaults to DEFAULT.
   * @param options - Additional options for the unstake operation.
   * @returns The unstake operation.
   */
  public async buildUnstakeOperation(
    amount: Amount,
    assetId: string,
    mode: StakeOptionsMode = StakeOptionsMode.DEFAULT,
    options: { [key: string]: string } = {},
  ): Promise<StakingOperation> {
    await this.validateCanUnstake(amount, assetId, mode, options);
    return this.buildStakingOperation(amount, assetId, "unstake", mode, options);
  }

  /**
   * Builds a claim stake operation for the supplied asset.
   *
   * @param amount - The amount of the asset to claim stake.
   * @param assetId - The asset to claim stake.
   * @param mode - The staking mode. Defaults to DEFAULT.
   * @param options - Additional options for the claim stake operation.
   * @returns The claim stake operation.
   */
  public async buildClaimStakeOperation(
    amount: Amount,
    assetId: string,
    mode: StakeOptionsMode = StakeOptionsMode.DEFAULT,
    options: { [key: string]: string } = {},
  ): Promise<StakingOperation> {
    await this.validateCanClaimStake(amount, assetId, mode, options);
    return this.buildStakingOperation(amount, assetId, "claim_stake", mode, options);
  }

  /**
   * Builds the staking operation based on the supplied input.
   *
   * @param amount - The amount for the staking operation.
   * @param assetId - The asset for the staking operation.
   * @param action - The specific action for the staking operation. e.g. stake, unstake, claim_stake
   * @param mode - The staking mode. Defaults to DEFAULT.
   * @param options - Additional options to build a stake operation.
   * @private
   * @returns The staking operation.
   * @throws {Error} If the supplied input cannot build a valid staking operation.
   */
  private async buildStakingOperation(
    amount: Amount,
    assetId: string,
    action: string,
    mode: StakeOptionsMode,
    options: { [key: string]: string },
  ): Promise<StakingOperation> {
    const stakingAmount = new Decimal(amount.toString());
    if (stakingAmount.lessThanOrEqualTo(0)) {
      throw new Error(`Amount required greater than zero.`);
    }
    const asset = await Asset.fetch(this.getNetworkId(), assetId);

    const newOptions = this.copyOptions(options);

    newOptions.mode = mode;
    newOptions.amount = asset.toAtomicAmount(new Decimal(amount.toString())).toString();

    const request = {
      network_id: this.getNetworkId(),
      asset_id: Asset.primaryDenomination(assetId),
      address_id: this.getId(),
      action: action,
      options: newOptions,
    };

    const response = await Coinbase.apiClients.stake!.buildStakingOperation(request);

    return new StakingOperation(response!.data);
  }
}
