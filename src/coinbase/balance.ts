import Decimal from "decimal.js";
import { Balance as BalanceModel } from "../client";
import { Asset } from "./asset";

/** A representation of a balance. */
export class Balance {
  public readonly amount: Decimal;
  public readonly assetId: string;

  /**
   * Private constructor to prevent direct instantiation outside of the factory methods.
   *
   * @ignore
   * @param {Decimal} amount - The amount of the balance.
   * @param {string} assetId - The asset ID.
   * @hideconstructor
   */
  private constructor(amount: Decimal, assetId: string) {
    this.amount = amount;
    this.assetId = assetId;
  }

  /**
   * Converts a BalanceModel into a Balance object.
   *
   * @param {BalanceModel} model - The balance model object.
   * @returns {Balance} The Balance object.
   */
  public static fromModel(model: BalanceModel): Balance {
    return this.fromModelAndAssetId(model, model.asset.asset_id);
  }

  /**
   * Converts a BalanceModel and asset ID into a Balance object.
   *
   * @param {BalanceModel} model - The balance model object.
   * @param {string} assetId - The asset ID.
   * @returns {Balance} The Balance object.
   */
  public static fromModelAndAssetId(model: BalanceModel, assetId: string): Balance {
    return new Balance(Asset.fromAtomicAmount(new Decimal(model.amount), assetId), assetId);
  }
}
