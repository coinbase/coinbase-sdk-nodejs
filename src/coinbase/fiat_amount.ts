import { FiatAmount as FiatAmountModel } from "../client/api";

/**
 * A representation of a FiatAmount that includes the amount and currency.
 */
export class FiatAmount {
  private amount: string;
  private currency: string;

  /**
   * Initialize a new FiatAmount. Do not use this directly, use the fromModel method instead.
   *
   * @param amount - The amount in the fiat currency
   * @param currency - The currency code (e.g. 'USD')
   */
  constructor(amount: string, currency: string) {
    this.amount = amount;
    this.currency = currency;
  }

  /**
   * Convert a FiatAmount model to a FiatAmount.
   *
   * @param fiatAmountModel - The fiat amount from the API.
   * @returns The converted FiatAmount object.
   */
  public static fromModel(fiatAmountModel: FiatAmountModel): FiatAmount {
    return new FiatAmount(fiatAmountModel.amount, fiatAmountModel.currency);
  }

  /**
   * Get the amount in the fiat currency.
   *
   * @returns The amount in the fiat currency.
   */
  public getAmount(): string {
    return this.amount;
  }

  /**
   * Get the currency code.
   *
   * @returns The currency code.
   */
  public getCurrency(): string {
    return this.currency;
  }

  /**
   * Get a string representation of the FiatAmount.
   *
   * @returns A string representation of the FiatAmount.
   */
  public toString(): string {
    return `FiatAmount(amount: '${this.amount}', currency: '${this.currency}')`;
  }
}
