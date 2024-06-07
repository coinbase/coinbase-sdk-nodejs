import Decimal from "decimal.js";
import {
  ATOMIC_UNITS_PER_USDC,
  SUPPORTED_ASSET_IDS,
  WEI_PER_ETHER,
  WEI_PER_GWEI,
} from "./constants";
import { Coinbase } from "./coinbase";

/** A representation of an Asset. */
export class Asset {
  /**
   * Converts an amount from the atomic value of the primary denomination of the provided Asset ID
   * to whole units of the specified asset ID.
   *
   * @param {Decimal} atomicAmount - The amount in atomic units.
   * @param {string} assetId - The asset ID.
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

  /**
   * Converts the amount of the Asset to the atomic units of the primary denomination of the Asset.
   *
   * @param amount - The amount to normalize.
   * @param assetId - The ID of the Asset being transferred.
   * @returns The normalized amount in atomic units.
   */
  static toAtomicAmount(amount: Decimal, assetId: string): Decimal {
    switch (assetId) {
      case "eth":
        return amount.mul(WEI_PER_ETHER);
      case "gwei":
        return amount.mul(WEI_PER_GWEI);
      case "usdc":
        return amount.mul(ATOMIC_UNITS_PER_USDC);
      case "weth":
        return amount.mul(WEI_PER_ETHER);
      default:
        return amount;
    }
  }

  /**
   * Returns the primary denomination for the provided Asset ID.
   *
   * @param assetId - The Asset ID.
   * @returns The primary denomination for the Asset ID.
   */
  public static primaryDenomination(assetId: string): string {
    return [Coinbase.assets.Gwei, Coinbase.assets.Wei].includes(assetId)
      ? Coinbase.assets.Eth
      : assetId;
  }

  /**
   * Returns whether the provided asset ID is supported.
   *
   * @param assetId - The Asset ID.
   * @returns Whether the Asset ID is supported.
   */
  public static isSupported(assetId): boolean {
    return SUPPORTED_ASSET_IDS.has(assetId);
  }
}
