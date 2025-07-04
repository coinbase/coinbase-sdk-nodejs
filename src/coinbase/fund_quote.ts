import { Decimal } from "decimal.js";
import { FundQuote as FundQuoteModel } from "../client/api";
import { Asset } from "./asset";
import { CryptoAmount } from "./crypto_amount";
import { Coinbase } from "./coinbase";
import { FundOperation } from "./fund_operation";

/**
 * A representation of a Fund Operation Quote.
 */
export class FundQuote {
  private model: FundQuoteModel;
  private asset: Asset | null = null;

  /**
   * Creates a new FundQuote instance.
   *
   * @param model - The model representing the fund quote
   */
  constructor(model: FundQuoteModel) {
    this.model = model;
  }

  /**
   * Converts a FundQuoteModel into a FundQuote object.
   *
   * @param fundQuoteModel - The FundQuote model object.
   * @returns The FundQuote object.
   */
  public static fromModel(fundQuoteModel: FundQuoteModel): FundQuote {
    return new FundQuote(fundQuoteModel);
  }

  /**
   * Create a new Fund Operation Quote.
   *
   * @param walletId - The Wallet ID
   * @param addressId - The Address ID
   * @param amount - The amount of the Asset
   * @param assetId - The Asset ID
   * @param networkId - The Network ID
   * @returns The new FundQuote object
   */
  public static async create(
    walletId: string,
    addressId: string,
    amount: Decimal,
    assetId: string,
    networkId: string,
  ): Promise<FundQuote> {
    const asset = await Asset.fetch(networkId, assetId);

    const response = await Coinbase.apiClients.fund!.createFundQuote(walletId, addressId, {
      asset_id: Asset.primaryDenomination(assetId),
      amount: asset.toAtomicAmount(amount).toString(),
    });

    return FundQuote.fromModel(response.data);
  }

  /**
   * Gets the Fund Quote ID.
   *
   * @returns {string} The unique identifier of the fund quote
   */
  public getId(): string {
    return this.model.fund_quote_id;
  }

  /**
   * Gets the Network ID.
   *
   * @returns {string} The network identifier
   */
  public getNetworkId(): string {
    return this.model.network_id;
  }

  /**
   * Gets the Wallet ID.
   *
   * @returns {string} The wallet identifier
   */
  public getWalletId(): string {
    return this.model.wallet_id;
  }

  /**
   * Gets the Address ID.
   *
   * @returns {string} The address identifier
   */
  public getAddressId(): string {
    return this.model.address_id;
  }

  /**
   * Gets the Asset.
   *
   * @returns {Asset} The asset associated with this quote
   */
  public getAsset(): Asset {
    if (!this.asset) {
      this.asset = Asset.fromModel(this.model.crypto_amount.asset);
    }
    return this.asset;
  }

  /**
   * Gets the crypto amount.
   *
   * @returns {CryptoAmount} The cryptocurrency amount
   */
  public getAmount(): CryptoAmount {
    return CryptoAmount.fromModel(this.model.crypto_amount);
  }

  /**
   * Gets the fiat amount.
   *
   * @returns {Decimal} The fiat amount in decimal format
   */
  public getFiatAmount(): Decimal {
    return new Decimal(this.model.fiat_amount.amount);
  }

  /**
   * Gets the fiat currency.
   *
   * @returns {string} The fiat currency code
   */
  public getFiatCurrency(): string {
    return this.model.fiat_amount.currency;
  }

  /**
   * Gets the buy fee.
   *
   * @returns {{ amount: string; currency: string }} The buy fee amount and currency
   */
  public getBuyFee(): { amount: string; currency: string } {
    return {
      amount: this.model.fees.buy_fee.amount,
      currency: this.model.fees.buy_fee.currency,
    };
  }

  /**
   * Gets the transfer fee.
   *
   * @returns {CryptoAmount} The transfer fee as a crypto amount
   */
  public getTransferFee(): CryptoAmount {
    return CryptoAmount.fromModel(this.model.fees.transfer_fee);
  }

  /**
   * Execute the fund quote to create a fund operation.
   *
   * @returns {Promise<FundOperation>} A promise that resolves to the created fund operation
   */
  public async execute(): Promise<FundOperation> {
    return FundOperation.create(
      this.getWalletId(),
      this.getAddressId(),
      this.getAmount().getAmount(),
      this.getAsset().getAssetId(),
      this.getNetworkId(),
      this,
    );
  }
}
