import { Address } from "../address";
import { Amount, CoinbaseExternalAddressStakeOptions, StakeOptionsMode } from "../types";
import { Coinbase } from "../coinbase";
import Decimal from "decimal.js";
import { Transaction } from "../transaction";
import { Asset } from "../asset";

/**
 * A representation of a blockchain Address, which is a user-controlled account on a Network. Addresses are used to
 * send and receive Assets. An ExternalAddress is an Address that is not controlled by the developer, but is instead
 * controlled by the user.
 */
export class ExternalAddress extends Address {
  public async buildStakeOperation(
    amount: Amount,
    assetId: string,
    options: CoinbaseExternalAddressStakeOptions = { mode: StakeOptionsMode.DEFAULT },
  ): Promise<Transaction> {
    await this.validateCanStake(amount, assetId, options);
    return this.buildStakingOperation(amount, assetId, "stake", options);
  }

  public async buildUnstakeOperation(
    amount: Amount,
    assetId: string,
    options: { [key: string]: string } = {},
  ): Promise<Transaction> {
    await this.validateCanUnstake(amount, assetId, options);
    return this.buildStakingOperation(amount, assetId, "unstake", options);
  }

  public async buildClaimStakeOperation(
    amount: Amount,
    assetId: string,
    options: { [key: string]: string } = {},
  ): Promise<Transaction> {
    await this.validateCanClaimStake(amount, assetId, options);
    return this.buildStakingOperation(amount, assetId, "claim_stake", options);
  }

  public async getStakeableBalance(
    asset_id: string,
    options: CoinbaseExternalAddressStakeOptions = { mode: StakeOptionsMode.DEFAULT },
  ): Promise<string> {
    const balances = await this.getStakingBalances(asset_id, options);
    return balances["stakeableBalance"];
  }

  public async getUnstakeableBalance(
    asset_id: string,
    options: { [key: string]: string } = {},
  ): Promise<string> {
    const balances = await this.getStakingBalances(asset_id, options);
    return balances["unstakeableBalance"];
  }

  public async getClaimableBalance(
    asset_id: string,
    options: { [key: string]: string } = {},
  ): Promise<string> {
    const balances = await this.getStakingBalances(asset_id, options);
    return balances["claimableBalance"];
  }

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

  private async validateCanUnstake(
    amount: Amount,
    assetId: string,
    options: { [key: string]: string } = {},
  ): Promise<void> {
    const unstakeableBalance = new Decimal(await this.getUnstakeableBalance(assetId, options));

    if (unstakeableBalance.lessThan(amount.toString())) {
      throw new Error(
        `Insufficient funds ${amount} requested to unstake, only ${unstakeableBalance} available.`,
      );
    }
  }

  private async validateCanClaimStake(
    amount: Amount,
    assetId: string,
    options: { [key: string]: string } = {},
  ): Promise<void> {
    const claimableBalance = new Decimal(await this.getClaimableBalance(assetId, options));

    if (claimableBalance.lessThan(amount.toString())) {
      throw new Error(
        `Insufficient funds ${amount} requested to claim stake, only ${claimableBalance} available.`,
      );
    }
  }

  private async getStakingBalances(
    assetId: string,
    options: CoinbaseExternalAddressStakeOptions = { mode: StakeOptionsMode.DEFAULT },
  ): Promise<{ [key: string]: string }> {
    this.processOptions(assetId, options);

    const request = {
      network_id: this.getNetworkId,
      asset_id: assetId,
      address_id: this.getId,
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

  private async buildStakingOperation(
    amount: Amount,
    assetId: string,
    action: string,
    options: CoinbaseExternalAddressStakeOptions = { mode: StakeOptionsMode.DEFAULT },
  ): Promise<Transaction> {
    const stakingAmount = new Decimal(amount.toString());
    if (stakingAmount.lessThanOrEqualTo(0)) {
      throw new Error(`Amount required greater than zero.`);
    }

    this.processOptions(assetId, options);

    options.amount = Asset.toAtomicAmount(new Decimal(amount.toString()), assetId).toString();

    const request = {
      network_id: this.getNetworkId,
      asset_id: assetId,
      address_id: this.getId,
      action: action,
      options: options,
    };

    const response = await Coinbase.apiClients.stake?.buildStakingOperation(request);

    return new Transaction(response!.data.transaction);
  }

  private transformStakeOptions(options: CoinbaseExternalAddressStakeOptions): {
    [key: string]: string;
  } {
    const result: { [key: string]: string } = {};

    if (options.mode !== undefined) {
      result["mode"] = options.mode;
    }

    if (options.amount !== undefined) {
      result["amount"] = String(options.amount);
    }

    return result;
  }

  private processOptions(
    assetId: string,
    options: CoinbaseExternalAddressStakeOptions = { mode: StakeOptionsMode.DEFAULT },
  ): void {
    if (options.mode == "default") {
      switch (assetId) {
        case Coinbase.assets.Eth:
          options.mode = StakeOptionsMode.PARTIAL;
      }
    }
  }
}
