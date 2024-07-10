import { Address } from "../address";
import { Amount, StakeOptionsMode } from "../types";
import { Coinbase } from "../coinbase";
import Decimal from "decimal.js";
import { Asset } from "../asset";
import { StakingOperation } from "../staking_operation";
import { StakingRewardFormat } from "../../client";
import { StakingReward } from "../staking_reward";
import { BalanceMap } from "../balance_map";
import { Balance } from "../balance";
import { FaucetTransaction } from "../faucet_transaction";

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
   * Lists the staking rewards for the address.
   *
   * @param assetId - The asset ID.
   * @param startTime - The start time.
   * @param endTime - The end time.
   * @param format - The format to return the rewards in. (usd, native). Defaults to usd.
   * @returns The staking rewards.
   */
  public async stakingRewards(
    assetId: string,
    startTime: string,
    endTime: string,
    format = StakingRewardFormat.Usd,
  ): Promise<StakingReward[]> {
    return StakingReward.list(
      Coinbase.normalizeNetwork(this.getNetworkId()),
      assetId,
      [this.getId()],
      startTime,
      endTime,
      format,
    );
  }

  /**
   * Validate if the operation is able to stake with the supplied input.
   *
   * @param amount - The amount of the asset to stake.
   * @param assetId - The asset to stake.
   * @param mode - The staking mode. Defaults to DEFAULT.
   * @param options - Additional options for the stake operation.
   * @private
   * @throws {Error} If the supplied input is not able to create a stake operation.
   */
  private async validateCanStake(
    amount: Amount,
    assetId: string,
    mode: StakeOptionsMode,
    options: { [key: string]: string },
  ): Promise<void> {
    const stakeableBalance = await this.stakeableBalance(assetId, mode, options);

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
   * @param mode - The staking mode. Defaults to DEFAULT.
   * @param options - Additional options for the unstake operation.
   * @private
   * @throws {Error} If the supplied input is not able to create an unstake operation.
   */
  private async validateCanUnstake(
    amount: Amount,
    assetId: string,
    mode: StakeOptionsMode,
    options: { [key: string]: string },
  ): Promise<void> {
    const unstakeableBalance = new Decimal(await this.unstakeableBalance(assetId, mode, options));

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
   * @param mode - The staking mode. Defaults to DEFAULT.
   * @param options - Additional options for the claim stake operation.
   * @private
   * @throws {Error} If the supplied input is not able to create a claim stake operation.
   */
  private async validateCanClaimStake(
    amount: Amount,
    assetId: string,
    mode: StakeOptionsMode,
    options: { [key: string]: string },
  ): Promise<void> {
    const claimableBalance = new Decimal(await this.claimableBalance(assetId, mode, options));

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
      newOptions["mode"] = mode;
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

    newOptions["mode"] = mode;
    newOptions["amount"] = asset.toAtomicAmount(new Decimal(amount.toString())).toString();

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

  /**
   * Create a shallow copy of given options.
   *
   * @param options - The supplied options to be copied
   * @private
   * @returns A copy of the options.
   */
  private copyOptions(options?: { [key: string]: string }): {
    [key: string]: string;
  } {
    return { ...options };
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
}
