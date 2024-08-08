import { AssetAmount as AssetAmountModel } from "../client";

/** A representation of a balance. */
export class AssetAmount {
  public readonly amount: string;
  public readonly ticker: string;
  public readonly raw_numeric: string;
  public readonly exp: number;

  /**
   * Public constructor for the AssetAmount class.
   *
   * @param amount - the amount
   * @param raw_numeric - the raw numeric
   * @param exp - the exp
   * @param ticker - the ticker
   */
  public constructor(amount: string, raw_numeric: string, exp: number, ticker: string) {
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
    return new AssetAmount(model.amount, model.raw_numeric, model.exp, model.ticker);
  }

  /**
   * Returns the amount.
   *
   * @returns {string} The amount.
   * @memberof AssetAmount
   */
  public getAmount(): string {
    return this.amount;
  }

  /**
   * Returns the ticker.
   *
   * @returns {string} The ticker.
   * @memberof AssetAmount
   */
  public getTicker(): string {
    return this.ticker;
  }

  /**
   * Returns the raw numeric.
   *
   * @returns {string} The raw numeric.
   * @memberof AssetAmount
   */
  public getRawNumeric(): string {
    return this.raw_numeric;
  }

  /**
   * Returns the exp.
   *
   * @returns {number} The exp.
   * @memberof AssetAmount
   */
  public getExp(): number {
    return this.exp;
  }

  /**
   * Returns the string representation of a AssetAmount.
   *
   * @returns {string} The string representation of a AssetAmount.
   * @memberof AssetAmount
   */
  public toString(): string {
    return `{ amount: '${this.amount}', raw_numeric: '${this.raw_numeric}', exp: ${this.exp}, ticker: '${this.ticker}' }`;
  }
}
