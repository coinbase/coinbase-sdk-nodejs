import { AssetAmount as AssetAmountModel } from "../client";

/** A representation of a balance. */
export class AssetAmount {
  public readonly amount: string;
  public readonly ticker: string;
  public readonly raw_numeric: string;
  public readonly exp: number;

  /**
   * constructor for the AssetAmount class.
   *
   * @param amount - The amount of the asset in the most common denomination such as ETH, BTC, etc.
   * @param raw_numeric - The raw, unadulterated numeric value, such as Wei (in Ethereum) and Lamports (in Solana).
   * @param exp - The number of decimals needed to convert from the raw numeric value to the most common denomination.
   * @param ticker - The ticker of this asset (USD, ETH, SOL).
   */
  constructor(amount: string, raw_numeric: string, exp: number, ticker: string) {
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
   * @returns {string} The amount of the asset in the most common denomination.
   * @memberof AssetAmount
   */
  public getAmount(): string {
    return this.amount;
  }

  /**
   * Returns the ticker.
   *
   * @returns {string} The ticker (USD, ETH, SOL).
   * @memberof AssetAmount
   */
  public getTicker(): string {
    return this.ticker;
  }

  /**
   * Returns the raw numeric.
   *
   * @returns {string} The raw, unadulterated numeric value.
   * @memberof AssetAmount
   */
  public getRawNumeric(): string {
    return this.raw_numeric;
  }

  /**
   * Returns the exp.
   *
   * @returns {number} The number of decimals needed to convert from the raw numeric value to the most common denomination.
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
