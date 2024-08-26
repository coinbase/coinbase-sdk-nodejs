import Decimal from "decimal.js";
import { Coinbase } from "./coinbase";
import { Asset } from "./asset";
import { Balance } from "./balance";
import { BalanceMap } from "./balance_map";
import { FaucetTransaction } from "./faucet_transaction";
import { HistoricalBalance } from "./historical_balance";
import {
  Amount,
  StakeOptionsMode,
  ListHistoricalBalancesResult,
  ListHistoricalBalancesOptions,
} from "./types";
import { formatDate, getWeekBackDate } from "./utils";
import { StakingRewardFormat } from "../client";
import { StakingReward } from "./staking_reward";
import { StakingBalance } from "./staking_balance";

/**
 * A representation of a blockchain address, which is a user-controlled account on a network.
 */
export class Address {
  private static MAX_HISTORICAL_BALANCE = 1000;

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
   * Returns the historical balances of the provided asset.
   *
   * @param options - The options to list historical balances.
   * @param options.assetId - The asset ID.
   * @param options.limit - A limit on the number of objects to be returned. Limit can range between 1 and 100, and the default is 10.
   * @param options.page - A cursor for pagination across multiple pages of results. Don\&#39;t include this parameter on the first call. Use the next_page value returned in a previous response to request subsequent results.
   * @returns The list of historical balance of the asset and next page token.
   */
  public async listHistoricalBalances({
    assetId,
    limit,
    page,
  }: ListHistoricalBalancesOptions): Promise<ListHistoricalBalancesResult> {
    const historyList: HistoricalBalance[] = [];

    if (limit !== undefined || page !== undefined) {
      const response = await Coinbase.apiClients.externalAddress!.listAddressHistoricalBalance(
        this.getNetworkId(),
        this.getId(),
        Asset.primaryDenomination(assetId),
        limit ? limit : undefined,
        page ? page : undefined,
      );

      response.data.data.forEach(historicalBalanceModel => {
        const historicalBalance = HistoricalBalance.fromModel(historicalBalanceModel);
        historyList.push(historicalBalance);
      });

      return {
        historicalBalances: historyList,
        nextPageToken: response.data.next_page,
      };
    }

    const queue: string[] = [""];
    while (queue.length > 0 && historyList.length < Address.MAX_HISTORICAL_BALANCE) {
      const page = queue.shift();
      const response = await Coinbase.apiClients.externalAddress!.listAddressHistoricalBalance(
        this.getNetworkId(),
        this.getId(),
        Asset.primaryDenomination(assetId),
        100,
        page ? page : undefined,
      );

      response.data.data.forEach(historicalBalanceModel => {
        const historicalBalance = HistoricalBalance.fromModel(historicalBalanceModel);
        historyList.push(historicalBalance);
      });

      if (response.data.has_more) {
        if (response.data.next_page) {
          queue.push(response.data.next_page);
        }
      }
    }

    return {
      historicalBalances: historyList,
      nextPageToken: "",
    };
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
    startTime = getWeekBackDate(new Date()),
    endTime = formatDate(new Date()),
    format: StakingRewardFormat = StakingRewardFormat.Usd,
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
   * Lists the historical staking balances for the address.
   *
   * @param assetId - The asset ID.
   * @param startTime - The start time.
   * @param endTime - The end time.
   * @returns The staking balances.
   */
  public async historicalStakingBalances(
    assetId: string,
    startTime = getWeekBackDate(new Date()),
    endTime = formatDate(new Date()),
  ): Promise<StakingBalance[]> {
    return StakingBalance.list(
      Coinbase.normalizeNetwork(this.getNetworkId()),
      assetId,
      this.getId(),
      startTime,
      endTime,
    );
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
   * A. Dedicated ETH Staking
   *  - `validator_pub_keys` (optional): List of comma separated validator public keys to retrieve unstakeable balance for. Defaults to all validators.
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
   * Validate if the operation is able to stake with the supplied input.
   *
   * @param amount - The amount of the asset to stake.
   * @param assetId - The asset to stake.
   * @param mode - The staking mode. Defaults to DEFAULT.
   * @param options - Additional options for the stake operation.
   * @private
   * @throws {Error} If the supplied input is not able to create a stake operation.
   */
  protected async validateCanStake(
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
  protected async validateCanUnstake(
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
  protected async validateCanClaimStake(
    amount: Amount,
    assetId: string,
    mode: StakeOptionsMode,
    options: { [key: string]: string },
  ): Promise<void> {
    if (assetId === "eth" && mode === StakeOptionsMode.NATIVE) {
      throw new Error(`Claiming stake for ETH is not supported in native mode.`);
    }

    const claimableBalance = new Decimal(await this.claimableBalance(assetId, mode, options));

    if (claimableBalance.lessThan(amount.toString())) {
      throw new Error(
        `Insufficient funds ${amount} requested to claim stake, only ${claimableBalance} available.`,
      );
    }
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
