import Decimal from "decimal.js";
import { CryptoAmount as CryptoAmountModel } from "../client/api";
import { Asset } from "./asset";

/**
 * A representation of a CryptoAmount that includes the amount and asset.
 */
export class CryptoAmount {
  private amount: Decimal;
  private assetObj: Asset;
  private assetId: string;

  /**
   * Creates a new CryptoAmount instance.
   *
   * @param amount - The amount of the Asset
   * @param asset - The Asset
   * @param assetId - Optional Asset ID override
   */
  constructor(amount: Decimal, asset: Asset, assetId?: string) {
    if (!amount || !asset) {
      throw new Error("Amount and asset cannot be empty");
    }
    this.amount = amount;
    this.assetObj = asset;
    this.assetId = assetId || asset.getAssetId();
  }

  /**
   * Converts a CryptoAmount model to a CryptoAmount.
   *
   * @param amountModel - The crypto amount from the API
   * @returns The converted CryptoAmount object
   */
  public static fromModel(amountModel: CryptoAmountModel): CryptoAmount {
    const asset = Asset.fromModel(amountModel.asset);
    return new CryptoAmount(asset.fromAtomicAmount(new Decimal(amountModel.amount)), asset);
  }

  /**
   * Converts a CryptoAmount model and asset ID to a CryptoAmount.
   * This can be used to specify a non-primary denomination that we want the amount
   * to be converted to.
   *
   * @param amountModel - The crypto amount from the API
   * @param assetId - The Asset ID of the denomination we want returned
   * @returns The converted CryptoAmount object
   */
  public static fromModelAndAssetId(amountModel: CryptoAmountModel, assetId: string): CryptoAmount {
    const asset = Asset.fromModel(amountModel.asset);
    return new CryptoAmount(
      asset.fromAtomicAmount(new Decimal(amountModel.amount)),
      asset,
      assetId,
    );
  }

  /**
   * Gets the amount of the Asset.
   *
   * @returns The amount of the Asset
   */
  public getAmount(): Decimal {
    return this.amount;
  }

  /**
   * Gets the Asset.
   *
   * @returns The Asset
   */
  public getAsset(): Asset {
    return this.assetObj;
  }

  /**
   * Gets the Asset ID.
   *
   * @returns The Asset ID
   */
  public getAssetId(): string {
    return this.assetId;
  }

  /**
   * Converts the amount to atomic units.
   *
   * @returns The amount in atomic units
   */
  public toAtomicAmount(): bigint {
    return this.assetObj.toAtomicAmount(this.amount);
  }

  /**
   * Returns a string representation of the CryptoAmount.
   *
   * @returns A string representation of the CryptoAmount
   */
  public toString(): string {
    return `CryptoAmount{amount: '${this.amount}', assetId: '${this.assetId}'}`;
  }
}
