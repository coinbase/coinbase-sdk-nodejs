import {
  FetchStakingRewardsRequestFormatEnum,
  StakingReward as StakingRewardModel,
} from "../client";
import Decimal from "decimal.js";
import { Coinbase } from "./coinbase";
import { Asset } from "./asset";
import { Amount } from "./types";

/**
 * A representation of a staking reward earned on a network for a given asset.
 */
export class StakingReward {
  private model: StakingRewardModel;
  private asset: Asset;
  private format: FetchStakingRewardsRequestFormatEnum;

  constructor(
    model: StakingRewardModel,
    asset: Asset,
    format: FetchStakingRewardsRequestFormatEnum,
  ) {
    this.model = model;
    this.asset = asset;
    this.format = format;
  }

  public static async listRewards(
    networkId: string,
    assetId: string,
    addressIds: Array<string>,
    startTime: string,
    endTime: string,
    format = FetchStakingRewardsRequestFormatEnum.Usd,
  ): Promise<Iterator<StakingReward>> {
    const request = {
      network_id: networkId,
      asset_id: assetId,
      address_ids: addressIds,
      start_time: startTime,
      end_time: endTime,
      format: format,
    };

    let index = 0;
    const response = await Coinbase.apiClients.stake!.fetchStakingRewards(request);
    const asset = await Asset.fetch(networkId, assetId);
    const rewards = response.data.data;

    return {
      [Symbol.iterator]: function () {
        return {
          next(): IteratorResult<StakingReward> {
            if (index < rewards.length) {
              return { value: new StakingReward(rewards[index++], asset, format), done: false };
            } else {
              return { done: true } as IteratorResult<StakingReward>;
            }
          },
        };
      },
    };
  }

  /**
   * Returns the amount of the StakingReward.
   *
   * @returns The amount.
   */
  public amount(): Amount {
    if (this.format == FetchStakingRewardsRequestFormatEnum.Usd) {
      return new Decimal(this.model.amount).div(new Decimal("100"));
    }
    return this.asset.fromAtomicAmount(new Decimal(this.model.amount));
  }

  /**
   * Returns the date of the StakingReward.
   *
   * @returns The date.
   */
  public date(): Date {
    return new Date(this.model.date);
  }

  public toString(): string {
    return `StakingReward { amount: '${this.amount().toString}' }`;
  }
}
