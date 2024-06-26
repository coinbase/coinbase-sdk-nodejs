import { StakingRewardFormat, StakingReward as StakingRewardModel } from "../client";
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
  private format: StakingRewardFormat;

  /**
   * Creates the StakingReward object.
   *
   * @param model - The underlying staking reward object.
   * @param asset - The asset for the staking reward.
   * @param format - The format to return the rewards in. (usd, native). Defaults to usd.
   */
  constructor(model: StakingRewardModel, asset: Asset, format: StakingRewardFormat) {
    this.model = model;
    this.asset = asset;
    this.format = format;
  }

  /**
   * Returns a list of StakingRewards for the provided network, asset, and addresses.
   *
   * @param networkId - The network ID.
   * @param assetId - The asset ID.
   * @param addressIds - The address ID.
   * @param startTime - The start time.
   * @param endTime - The end time.
   * @param format - The format to return the rewards in. (usd, native). Defaults to usd.
   * @returns The staking rewards.
   */
  public static async list(
    networkId: string,
    assetId: string,
    addressIds: Array<string>,
    startTime: string,
    endTime: string,
    format = StakingRewardFormat.Usd,
  ): Promise<StakingReward[]> {
    const stakingRewards: StakingReward[] = [];
    const queue: string[] = [""];

    while (queue.length > 0) {
      const page = queue.shift();
      const request = {
        network_id: Coinbase.normalizeNetwork(networkId),
        asset_id: assetId,
        address_ids: addressIds,
        start_time: startTime,
        end_time: endTime,
        format: format,
      };

      const response = await Coinbase.apiClients.stake!.fetchStakingRewards(
        request,
        100,
        page?.length ? page : undefined,
      );
      const asset = await Asset.fetch(networkId, assetId);

      response.data.data.forEach(stakingReward => {
        stakingRewards.push(new StakingReward(stakingReward, asset, format));
      });

      if (response.data.has_more) {
        if (response.data.next_page) {
          queue.push(response.data.next_page);
        }
      }
    }

    return stakingRewards;
  }

  /**
   * Returns the amount of the StakingReward.
   *
   * @returns The amount.
   */
  public amount(): Amount {
    if (this.format == StakingRewardFormat.Usd) {
      return new Decimal(this.model.amount).div(new Decimal("100"));
    }
    return this.asset.fromAtomicAmount(new Decimal(this.model.amount)).toNumber();
  }

  /**
   * Returns the date of the StakingReward.
   *
   * @returns The date.
   */
  public date(): Date {
    return new Date(this.model.date);
  }

  /**
   * Print the Staking Reward as a string.
   *
   * @returns The string representation of the Staking Reward.
   */
  public toString(): string {
    return `StakingReward { amount: '${this.amount().toString()}' }`;
  }
}
