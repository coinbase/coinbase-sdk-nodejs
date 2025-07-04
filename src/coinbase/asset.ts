import Decimal from "decimal.js";
import { Asset as AssetModel } from "./../client/api";
import { Coinbase } from "./coinbase";
import { GWEI_DECIMALS } from "./constants";
import { ArgumentError } from "./errors";

/** A representation of an Asset. */
export class Asset {
  public readonly networkId: string;
  public readonly assetId: string;
  public readonly contractAddress: string;
  public readonly decimals: number;

  /**
   * Private constructor for the Asset class.
   *
   * @param networkId - The network ID.
   * @param assetId - The asset ID.
   * @param contractAddress - The address ID.
   * @param decimals - The number of decimals.
   */
  private constructor(
    networkId: string,
    assetId: string,
    contractAddress: string,
    decimals: number,
  ) {
    this.networkId = networkId;
    this.assetId = assetId;
    this.contractAddress = contractAddress;
    this.decimals = decimals;
  }

  /**
   * Creates an Asset from an Asset Model.
   *
   * @param model - The Asset Model.
   * @param assetId - The Asset ID.
   * @throws If the Asset Model is invalid.
   * @returns The Asset Class.
   */
  public static fromModel(model: AssetModel, assetId?: string) {
    if (!model) {
      throw new Error("Invalid asset model");
    }

    let decimals = model.decimals!;
    // TODO: Push this logic down to the backend.
    if (assetId && model.asset_id) {
      const normalizedModelAssetId = model.asset_id.toLowerCase();
      const normalizedAssetId = assetId.toLowerCase();

      if (Coinbase.toAssetId(normalizedModelAssetId) !== Coinbase.toAssetId(normalizedAssetId)) {
        switch (normalizedAssetId) {
          case "gwei":
            decimals = GWEI_DECIMALS;
            break;
          case "wei":
            decimals = 0;
            break;
          case "eth":
            break;
          default:
            throw new ArgumentError(`Invalid asset ID: ${assetId}`);
        }
      }
    }
    return new Asset(
      model.network_id,
      assetId ?? model.asset_id,
      model.contract_address!,
      decimals,
    );
  }

  /**
   * Fetches the Asset with the provided Asset ID.
   *
   * @param networkId - The network ID.
   * @param assetId - The asset ID.
   * @throws If the Asset cannot be fetched.
   * @returns The Asset Class.
   */
  static async fetch(networkId: string, assetId: string) {
    const asset = await Coinbase.apiClients.asset!.getAsset(
      Coinbase.normalizeNetwork(networkId),
      Asset.primaryDenomination(assetId),
    );
    return Asset.fromModel(asset?.data, assetId);
  }

  /**
   * Returns the primary denomination for the provided Asset ID.
   * For `gwei` and `wei` the primary denomination is `eth`.
   * For all other assets, the primary denomination is the same asset ID.
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
   * Returns the primary denomination for the Asset.
   *
   * @returns The primary denomination for the Asset.
   */
  public primaryDenomination(): string {
    return Asset.primaryDenomination(this.assetId);
  }

  /**
   * Converts the amount of the Asset from whole to atomic units.
   *
   * @param wholeAmount - The whole amount to convert to atomic units.
   * @returns The amount in atomic units
   */
  toAtomicAmount(wholeAmount: Decimal): bigint {
    const atomicAmount = wholeAmount.times(new Decimal(10).pow(this.decimals));
    return BigInt(atomicAmount.toFixed());
  }

  /**
   * Converts the amount of the Asset from atomic to whole units.
   *
   * @param atomicAmount - The atomic amount to convert to whole units.
   * @returns The amount in atomic units
   */
  fromAtomicAmount(atomicAmount: Decimal): Decimal {
    return atomicAmount.dividedBy(new Decimal(10).pow(this.decimals));
  }

  /**
   * Returns a string representation of the Asset.
   *
   * @returns a string representation of the Asset
   */
  toString(): string {
    return `Asset{ networkId: ${this.networkId}, assetId: ${this.assetId}, contractAddress: ${this.contractAddress}, decimals: ${this.decimals} }`;
  }

  /**
   * Returns the Asset ID.
   *
   * @returns The Asset ID.
   */
  getAssetId(): string {
    return this.assetId;
  }
}
