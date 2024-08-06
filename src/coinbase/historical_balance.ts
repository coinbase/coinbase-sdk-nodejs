import Decimal from "decimal.js";
import { HistoricalBalance as HistoricalBalanceModel } from "../client";
import { Asset } from "./asset";

/** A representation of a balance. */
export class HistoricalBalance {
  public readonly amount: Decimal;
  public readonly blockHash: string;
  public readonly blockHeight: Decimal;
  public readonly asset: Asset;

  /**
   * Private constructor to prevent direct instantiation outside of the factory methods.
   *
   * @ignore
   * @param {Decimal} amount - The amount of the balance.
   * @param {string} assetId - The asset ID.
   * @hideconstructor
   */
  private constructor(amount: Decimal, blockHeight: Decimal, blockHash: string, asset: Asset) {
    this.amount = amount;
    this.blockHeight = blockHeight;
    this.blockHash = blockHash;
    this.asset = asset;
  }

  /**
   * Converts a BalanceModel into a Balance object.
   *
   * @param {BalanceModel} model - The balance model object.
   * @returns {Balance} The Balance object.
   */
  public static fromModel(model: HistoricalBalanceModel): HistoricalBalance {
    const asset = Asset.fromModel(model.asset);
    return new HistoricalBalance(
      asset.fromAtomicAmount(new Decimal(model.amount)),
      new Decimal(model.block_height),
      model.block_hash,
      asset,
    );
  }
}
