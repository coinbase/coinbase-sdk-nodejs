import { Address } from "../address";
import { Amount } from "../types";
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
    mode = "default",
    options: { [key: string]: string } = {},
  ): Promise<Transaction> {
    await this.validateCanStake(amount, assetId, mode, options);
    return this.buildStakingOperation(amount, assetId, "stake", mode, options);
  }

  public async buildUnstakeOperation(
    amount: Amount,
    assetId: string,
    mode = "default",
    options: { [key: string]: string } = {},
  ): Promise<Transaction> {
    await this.validateCanUnstake(amount, assetId, mode, options);
    return this.buildStakingOperation(amount, assetId, "unstake", mode, options);
  }

  public async buildClaimStakeOperation(
    amount: Amount,
    assetId: string,
    mode = "default",
    options: { [key: string]: string } = {},
  ): Promise<Transaction> {
    await this.validateCanClaimStake(amount, assetId, mode, options);
    return this.buildStakingOperation(amount, assetId, "claim_stake", mode, options);
  }

  public async getStakeableBalance(
    asset_id: string,
    mode = "default",
    options: { [key: string]: string } = {},
  ): Promise<string> {
    const balances = await this.getStakingBalances(asset_id, mode, options);
    return balances["stakeableBalance"];
  }

  public async getUnstakeableBalance(
    asset_id: string,
    mode = "default",
    options: { [key: string]: string } = {},
  ): Promise<string> {
    const balances = await this.getStakingBalances(asset_id, mode, options);
    return balances["unstakeableBalance"];
  }

  public async getClaimableBalance(
    asset_id: string,
    mode = "default",
    options: { [key: string]: string } = {},
  ): Promise<string> {
    const balances = await this.getStakingBalances(asset_id, mode, options);
    return balances["claimableBalance"];
  }

  private async validateCanStake(
    amount: Amount,
    assetId: string,
    mode = "default",
    options: { [key: string]: string } = {},
  ): Promise<void> {
    const stakeableBalance = await this.getStakeableBalance(assetId, mode, options);

    if (new Decimal(stakeableBalance).lessThan(amount.toString())) {
      throw new Error(
        `Insufficient funds ${amount} requested to stake, only ${stakeableBalance} available.`,
      );
    }
  }

  private async validateCanUnstake(
    amount: Amount,
    assetId: string,
    mode = "default",
    options: { [key: string]: string } = {},
  ): Promise<void> {
    const unstakeableBalance = new Decimal(
      await this.getUnstakeableBalance(assetId, mode, options),
    );

    if (unstakeableBalance.lessThan(amount.toString())) {
      throw new Error(
        `Insufficient funds ${amount} requested to unstake, only ${unstakeableBalance} available.`,
      );
    }
  }

  private async validateCanClaimStake(
    amount: Amount,
    assetId: string,
    mode = "default",
    options: { [key: string]: string } = {},
  ): Promise<void> {
    const claimableBalance = new Decimal(await this.getClaimableBalance(assetId, mode, options));

    if (claimableBalance.lessThan(amount.toString())) {
      throw new Error(
        `Insufficient funds ${amount} requested to claim stake, only ${claimableBalance} available.`,
      );
    }
  }

  private async getStakingBalances(
    assetId: string,
    mode = "default",
    options: { [key: string]: string } = {},
  ): Promise<{ [key: string]: string }> {
    this.processOptions(mode, assetId, options);

    const request = {
      network_id: this.networkId,
      asset_id: assetId,
      address_id: this.id,
      options: options,
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
    mode = "default",
    options: { [key: string]: string } = {},
  ): Promise<Transaction> {
    const request = {
      network_id: this.networkId,
      asset_id: assetId,
      address_id: this.id,
      action: action,
      options: options,
    };

    this.processOptions(mode, assetId, options);

    options["amount"] = Asset.toAtomicAmount(new Decimal(amount.toString()), assetId).toString();

    const stakingAmount = new Decimal(amount.toString());
    if (stakingAmount.lessThanOrEqualTo(0)) {
      throw new Error(`Amount required greater than zero.`);
    }

    const response = await Coinbase.apiClients.stake?.buildStakingOperation(request);

    return new Transaction(response!.data.transaction);
  }

  private processOptions(
    mode = "default",
    assetId: string,
    options: { [key: string]: string } = {},
  ): void {
    if (mode == "default") {
      switch (assetId) {
        case "eth":
          options["mode"] = "partial";
      }
    }
  }
}
