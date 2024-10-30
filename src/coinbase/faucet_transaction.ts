import { FaucetTransaction as FaucetTransactionModel } from "../client";
import { TransactionStatus } from "./types";
import { Transaction } from "./transaction";

/**
 * Represents a transaction from a faucet.
 */
export class FaucetTransaction {
  private model: FaucetTransactionModel;
  private _transaction: Transaction;

  /**
   * Creates a new FaucetTransaction instance.
   * Do not use this method directly - instead, use Address.faucet().
   *
   * @class
   * @param {FaucetTransactionModel} model - The FaucetTransaction model.
   * @throws {Error} If the model does not exist.
   */
  constructor(model: FaucetTransactionModel) {
    if (!model?.transaction) {
      throw new Error("FaucetTransaction model cannot be empty");
    }

    this.model = model;
    this._transaction = new Transaction(this.model.transaction!);
  }

  /**
   * Returns the Transaction of the FaucetTransaction.
   *
   * @returns The Faucet Transaction
   */
  public get transaction(): Transaction {
    return this._transaction;
  }

  /**
   * Returns the transaction hash.
   *
   * @returns {string} The transaction hash.
   */
  public getTransactionHash(): string {
    return this.transaction.getTransactionHash()!;
  }

  /**
   * Returns the link to the transaction on the blockchain explorer.
   *
   * @returns {string} The link to the transaction on the blockchain explorer
   */
  public getTransactionLink(): string {
    return this.transaction.getTransactionLink()!;
  }

  /**
   * Returns the Status of the FaucetTransaction.
   *
   * @returns The Status of the FaucetTransaction.
   */
  public getStatus(): TransactionStatus {
    return this.transaction.getStatus();
  }

  /**
   * Returns the network ID of the FaucetTransaction.
   *
   * @returns {string} The network ID.
   */
  public getNetworkId(): string {
    return this.transaction.getNetworkId();
  }

  /**
   * Returns the address that is being funded by the faucet.
   *
   * @returns {string} The address ID.
   */
  public getAddressId(): string {
    return this.transaction.toAddressId()!;
  }

  /**
   * Returns a string representation of the FaucetTransaction.
   *
   * @returns {string} A string representation of the FaucetTransaction.
   */
  public toString(): string {
    return `Coinbase::FaucetTransaction{transaction_hash: '${this.getTransactionHash()}', transaction_link: '${this.getTransactionLink()}'}`;
  }
}
