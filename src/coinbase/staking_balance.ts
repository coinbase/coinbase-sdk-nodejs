import { StakingBalance as StakingBalanceModel } from "../client";
import { Coinbase } from "./coinbase";
import { AssetAmount } from "./asset_amount";

/**
 * A representation of a staking reward earned on a network for a given asset.
 */
export class StakingBalance {
  private model: StakingBalanceModel;

  /**
   * Creates the StakingBalance object.
   *
   * @param model - The underlying staking balance object.
   */
  constructor(model: StakingBalanceModel) {
    this.model = model;
  }

  /**
   * Returns a list of StakingBalances for the provided network, asset, and address.
   *
   * @param networkId - The network ID.
   * @param assetId - The asset ID.
   * @param addressId - The address ID.
   * @param startTime - The start time.
   * @param endTime - The end time.
   * @returns The staking balances.
   */
  public static async list(
    networkId: string,
    assetId: string,
    addressId: string,
    startTime: string,
    endTime: string,
  ): Promise<StakingBalance[]> {
    const stakingBalances: StakingBalance[] = [];
    const queue: string[] = [""];

    while (queue.length > 0) {
      const page = queue.shift();
      const request = {
        network_id: Coinbase.normalizeNetwork(networkId),
        asset_id: assetId,
        address_id: addressId,
        start_time: startTime,
        end_time: endTime,
      };

      const response = await Coinbase.apiClients.stake!.fetchHistoricalStakingBalances(
        request,
        100,
        page?.length ? page : undefined,
      );

      response.data.data.forEach(stakingBalance => {
        stakingBalances.push(new StakingBalance(stakingBalance));
      });

      if (response.data.has_more) {
        if (response.data.next_page) {
          queue.push(response.data.next_page);
        }
      }
    }

    return stakingBalances;
  }

  /**
   * Returns the bonded stake amount of the StakingBalance.
   *
   * @returns The amount.
   */
  public bondedStake(): AssetAmount {
    return AssetAmount.fromModel(this.model.bonded_stake);
  }

  /**
   * Returns the unbonded stake amount of the StakingBalance.
   *
   * @returns The amount.
   */
  public unbondedBalance(): AssetAmount {
    return AssetAmount.fromModel(this.model.unbonded_balance);
  }

  /**
   * Returns the participant type of the address.
   *
   * @returns The participant type.
   */
  public participantType(): string {
    return this.model.participant_type;
  }

  /**
   * Returns the date of the StakingBalance.
   *
   * @returns The date.
   */
  public date(): Date {
    return new Date(this.model.date);
  }

  /**
   * Returns the onchain address of the StakingBalance.
   *
   * @returns The onchain address.
   */
  public addressId(): string {
    return this.model.address_id;
  }

  /**
   * Print the Staking Balance as a string.
   *
   * @returns The string representation of the Staking Balance.
   */
  public toString(): string {
    return `StakingBalance { date: '${this.date().toISOString()}' address: '${this.addressId()}' bondedStake: '${this.bondedStake().toString()}' unbondedBalance: '${this.unbondedBalance().toString()}' participantType: '${this.participantType()}' }`;
  }
}
