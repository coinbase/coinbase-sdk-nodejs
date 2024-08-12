import Decimal from "decimal.js";
import { Balance as BalanceModel } from "../client";
import { Asset } from "./asset";

/** A representation of a balance. */
export class Balance {
  public readonly amount: Decimal;
  public readonly assetId: string;
  public readonly asset?: Asset;

  /**
   * Private constructor to prevent direct instantiation outside of the factory methods.
   *
   * @ignore
   * @param {Decimal} amount - The amount of the balance.
   * @param {string} assetId - The asset ID.
   * @hideconstructor
   */
  private constructor(amount: Decimal, assetId: string, asset?: Asset) {
    this.amount = amount;
    this.assetId = assetId;
    this.asset = asset;
  }

  /**
   * Converts a BalanceModel into a Balance object.
   *
   * @param {BalanceModel} model - The balance model object.
   * @returns {Balance} The Balance object.
   */
  public static fromModel(model: BalanceModel): Balance {
    const asset = Asset.fromModel(model.asset);
    return new Balance(
      asset.fromAtomicAmount(new Decimal(model.amount)),
      asset.getAssetId(),
      asset,
    );
  }

  /**
   * Converts a BalanceModel and asset ID into a Balance object.
   *
   * @param {BalanceModel} model - The balance model object.
   * @param {string} assetId - The asset ID.
   * @returns {Balance} The Balance object.
   */
  public static fromModelAndAssetId(model: BalanceModel, assetId: string): Balance {
    const asset = Asset.fromModel(model.asset, assetId);
    return new Balance(
      asset.fromAtomicAmount(new Decimal(model.amount)),
      asset.getAssetId(),
      asset,
    );
  }

  /**
   * Converts a BalanceModel of which the amount is in the most common denomination such as ETH, BTC, etc.
   *
   * @param {BalanceModel} model - The balance model object.
   * @returns {Balance} The Balance object.
   */
  public static fromModelWithAmountInWholeUnits(model: BalanceModel): Balance {
    const asset = Asset.fromModel(model.asset);
    return new Balance(new Decimal(model.amount), asset.getAssetId(), asset);
  }

  /**
   * Print the Balance as a string.
   *
   * @returns The string representation of the Balance.
   */
  public toString(): string {
    return `Balance { amount: '${this.amount}' asset: '${this.asset?.toString()}' }`;
  }
}
