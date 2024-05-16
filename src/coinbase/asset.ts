import Decimal from "decimal.js";
import { ATOMIC_UNITS_PER_USDC, WEI_PER_ETHER, WEI_PER_GWEI } from "./constants";

/** # A representation of an Asset. */
export class Asset {
  /**
   * Converts an amount from the atomic value of the primary denomination of the provided Asset ID
   * to whole units of the specified asset ID.
   *
   * @param atomicAmount - The amount in atomic units.
   * @param assetId - The assset ID.
   * @returns The amount in whole units of the asset with the specified ID.
   */
  static fromAtomicAmount(atomicAmount: Decimal, assetId: string): Decimal {
    switch (assetId) {
      case "eth":
        return atomicAmount.div(WEI_PER_ETHER);
      case "gwei":
        return atomicAmount.div(WEI_PER_GWEI);
      case "usdc":
        return atomicAmount.div(ATOMIC_UNITS_PER_USDC);
      case "weth":
        return atomicAmount.div(WEI_PER_ETHER);
      default:
        return atomicAmount;
    }
  }
}
