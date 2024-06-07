import { Decimal } from "decimal.js";
import { Trade as CoinbaseTrade } from "../client/api";
import { Coinbase } from "./coinbase";
import { InternalError } from "./errors";
import { Transaction } from "./transaction";
import { TransactionStatus } from "./types";
import { delay } from "./utils";
import { APIError } from "./api_error";

/**
 * A representation of a Trade, which trades an amount of an Asset to another Asset on a Network.
 * The fee is assumed to be paid in the native Asset of the Network.
 */
export class Trade {
  private model: CoinbaseTrade;
  private transaction?: Transaction;
  private approveTransaction?: Transaction;

  /**
   * Trades should be created through Wallet.trade or Address.trade.
   *
   * @class
   * @param model - The underlying Trade object.
   * @throws {InternalError} - If the Trade model is empty.
   */
  constructor(model: CoinbaseTrade) {
    if (!model) {
      throw new InternalError("Trade model cannot be empty");
    }
    this.model = model;
  }

  /**
   * Returns the Trade ID.
   *
   * @returns The Trade ID.
   */
  public getId(): string {
    return this.model.trade_id;
  }

  /**
   * Returns the Network ID of the Trade.
   *
   * @returns The Network ID.
   */
  public getNetworkId(): string {
    return this.model.network_id;
  }

  /**
   * Returns the Wallet ID of the Trade.
   *
   * @returns The Wallet ID.
   */
  public getWalletId(): string {
    return this.model.wallet_id;
  }

  /**
   * Returns the Address ID of the Trade.
   *
   * @returns The Address ID.
   */
  public getAddressId(): string {
    return this.model.address_id;
  }

  /**
   * Returns the From Asset ID of the Trade.
   *
   * @returns The From Asset ID.
   */
  public getFromAssetId(): string {
    return this.model.from_asset.asset_id;
  }

  /**
   * Returns the amount of the from asset for the Trade.
   *
   * @returns The amount of the from asset.
   */
  public getFromAmount(): Decimal {
    const amount = new Decimal(this.model.from_amount);
    return amount.div(Decimal.pow(10, this.model.from_asset.decimals!));
  }

  /**
   * Returns the To Asset ID of the Trade.
   *
   * @returns The To Asset ID.
   */
  public getToAssetId(): string {
    return this.model.to_asset.asset_id;
  }

  /**
   * Returns the amount of the to asset for the Trade.
   *
   * @returns The amount of the to asset.
   */
  public getToAmount(): Decimal {
    const amount = new Decimal(this.model.to_amount);
    return amount.div(Decimal.pow(10, this.model.to_asset.decimals!));
  }

  /**
   * Returns the Trade transaction.
   *
   * @returns The Trade transaction.
   */
  public getTransaction(): Transaction {
    this.transaction = new Transaction(this.model.transaction);
    return this.transaction;
  }

  /**
   * Returns the approve transaction if it exists.
   *
   * @returns The approve transaction.
   */
  public getApproveTransaction(): Transaction | undefined {
    if (!this.approveTransaction && this.model.approve_transaction) {
      this.approveTransaction = new Transaction(this.model.approve_transaction);
    }
    return this.approveTransaction;
  }

  /**
   * Returns the status of the Trade.
   *
   * @returns The status.
   */
  public getStatus(): TransactionStatus | undefined {
    return this.getTransaction()?.getStatus();
  }

  /**
   * Waits until the Trade is completed or failed by polling the Network at the given interval. Raises a
   * Error if the Trade takes longer than the given timeout.
   *
   * @param options - The options to configure the wait function.
   * @param options.intervalSeconds - The interval at which to poll the Network, in seconds
   * @param options.timeoutSeconds - The maximum amount of time to wait for the Trade to complete, in seconds
   * @throws {Error} If the Trade takes longer than the given timeout.
   * @throws {APIError} If the request fails.
   * @returns The completed Trade object.
   */
  public async wait({ intervalSeconds = 0.2, timeoutSeconds = 10 } = {}): Promise<Trade> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutSeconds * 1000) {
      await this.reload();
      if (this.getTransaction().isTerminalState()) {
        return this;
      }
      if (Date.now() - startTime > timeoutSeconds * 1000) {
        throw new Error("Trade timed out");
      }
      await delay(intervalSeconds);
    }
    throw new Error("Trade timed out");
  }

  /**
   * Reloads the Trade model with the latest version from the server side.
   *
   * @returns The most recent version of Trade from the server.
   */
  public async reload(): Promise<Trade> {
    const result = await Coinbase.apiClients.trade!.getTrade(
      this.getWalletId(),
      this.getAddressId(),
      this.getId(),
    );
    this.model = result?.data;

    this.transaction = new Transaction(this.model.transaction);
    this.approveTransaction = this.model.approve_transaction
      ? new Transaction(this.model.approve_transaction)
      : undefined;

    return this;
  }

  /**
   * Returns a String representation of the Trade.
   *
   * @returns A String representation of the Trade.
   */
  public toString(): string {
    return (
      `Trade { transfer_id: '${this.getId()}', network_id: '${this.getNetworkId()}', ` +
      `address_id: '${this.getAddressId()}', from_asset_id: '${this.getFromAssetId()}', ` +
      `to_asset_id: '${this.getToAssetId()}', from_amount: '${this.getFromAmount()}', ` +
      `to_amount: '${this.getToAmount()}', status: '${this.getStatus()}' }`
    );
  }
}
