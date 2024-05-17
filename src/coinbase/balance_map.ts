import { Balance } from "./balance";
import { Balance as BalanceModel } from "../client";
import { Decimal } from "decimal.js";

/**
 * A convenience class for storing and manipulating Asset balances in a human-readable format.
 */
export class BalanceMap extends Map<string, Decimal> {
  /**
   * Converts a list of Balance models to a BalanceMap.
   *
   * @param {BalanceModel[]} balances - The list of balances fetched from the API.
   * @returns {BalanceMap} The converted BalanceMap object.
   */
  public static fromBalances(balances: BalanceModel[]): BalanceMap {
    const balanceMap = new BalanceMap();
    balances.forEach(balanceModel => {
      const balance = Balance.fromModel(balanceModel);
      balanceMap.add(balance);
    });
    return balanceMap;
  }

  /**
   * Adds a balance to the map.
   *
   * @param {Balance} balance - The balance to add to the map.
   */
  public add(balance: Balance): void {
    if (!(balance instanceof Balance)) {
      throw new Error("balance must be a Balance");
    }
    this.set(balance.assetId, balance.amount);
  }

  /**
   * Returns a string representation of the balance map.
   *
   * @returns The string representation of the balance map.
   */
  public toString(): string {
    const result: Record<string, string> = {};
    this.forEach((value, key) => {
      let str = value.toString();
      if (value.isInteger()) {
        str = value.toNumber().toString();
      }
      result[key] = str;
    });
    return JSON.stringify(result);
  }
}
