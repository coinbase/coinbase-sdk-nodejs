import Decimal from "decimal.js";
import { BalanceHistory as BalanceHistoryModel } from "../client";
import { Asset } from "./asset";

/** A representation of a balance. */
export class BalanceHistory {
  public readonly amount: Decimal;
  public readonly blockHash: string;
  public readonly blockNumber: string;
  public readonly asset: Asset;

  /**
   * Private constructor to prevent direct instantiation outside of the factory methods.
   *
   * @ignore
   * @param {Decimal} amount - The amount of the balance.
   * @param {string} blockHash - The block hash at which the balance was recorded.
   * @param {string} blockNumber - The block number at which the balance was recorded.
   * @param {string} assetId - The asset ID.
   * @hideconstructor
   */
  private constructor(amount: Decimal, blockHash: string, blockNumber: string, asset: Asset) {
    this.amount = amount;
    this.blockHash = blockHash;
    this.blockNumber = blockNumber;
    this.asset = asset;
  }

  /**
   * Converts a BalanceHistoryModel into a Balance object.
   *
   * @param {BalanceHistoryModel} model - The balance model object.
   * @returns {Balance} The Balance object.
   */
  public static fromModel(model: BalanceHistoryModel): BalanceHistory {
    const asset = Asset.fromModel(model.asset);
    return new BalanceHistory(
        asset.fromAtomicAmount(new Decimal(model.amount)),
        model.block_hash,
        model.block_number,
        asset,
    );
  }
}
