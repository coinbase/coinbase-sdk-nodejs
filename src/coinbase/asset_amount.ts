import { AssetAmount as AssetAmountModel } from "../client";

/** A representation of a balance. */
export class AssetAmount {
  public readonly amount: string;
  public readonly ticker: string;
  public readonly raw_numeric: string;
  public readonly exp: number;

  public constructor(amount: string, raw_numeric: string, exp: number,  ticker: string) {
    this.amount = amount;
    this.ticker = ticker;
    this.raw_numeric = raw_numeric;
    this.exp = exp;
  }

  /**
   * Converts a AssetAmountModel into a AssetAmount object.
   *
   * @param {AssetAmountModel} model - The assetAmount model object.
   * @returns {AssetAmount} The Balance object.
   */
  public static fromModel(model: AssetAmountModel): AssetAmount {
    return new AssetAmount(
      model.amount,
      model.raw_numeric,
      model.exp,
      model.ticker,
    );
  }

  public getAmount(): string {
    return this.amount;
  }

  public getTicker(): string {
    return this.ticker;
  }

  public getRawNumeric(): string {
    return this.raw_numeric;
  }

  public getExp(): number {
    return this.exp;
  }

  public toString(): string {
    return `{ amount: '${this.amount}', raw_numeric: '${this.raw_numeric}', exp: ${this.exp}, ticker: '${this.ticker}' }`;
  }
}
