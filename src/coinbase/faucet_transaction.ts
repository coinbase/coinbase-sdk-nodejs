import { FaucetTransaction as FaucetTransactionModel } from "../client";
import { TransactionStatus } from "./types";
import { Coinbase } from "./coinbase";
import { Transaction } from "./transaction";
import { delay } from "./utils";
import { TimeoutError } from "./errors";

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
   * Waits for the FaucetTransaction to be confirmed on the Network or fail on chain.
   * Waits until the FaucetTransaction is completed or failed on-chain by polling at the given interval.
   * Raises an error if the FaucetTransaction takes longer than the given timeout.
   *
   * @param options - The options to configure the wait function.
   * @param options.intervalSeconds - The interval to check the status of the FaucetTransaction.
   * @param options.timeoutSeconds - The maximum time to wait for the FaucetTransaction to be confirmed.
   *
   * @returns The FaucetTransaction object in a terminal state.
   * @throws {Error} if the FaucetTransaction times out.
   */
  public async wait({
    intervalSeconds = 0.2,
    timeoutSeconds = 10,
  } = {}): Promise<FaucetTransaction> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutSeconds * 1000) {
      await this.reload();

      // If the FaucetTransaction is in a terminal state, return the FaucetTransaction.
      if (this.transaction.isTerminalState()) {
        return this;
      }

      await delay(intervalSeconds);
    }

    throw new TimeoutError("FaucetTransaction timed out");
  }

  /**
   * Reloads the FaucetTransaction model with the latest data from the server.
   *
   * @returns {FaucetTransaction} The reloaded FaucetTransaction object.
   * @throws {APIError} if the API request to get a FaucetTransaction fails.
   */
  public async reload(): Promise<FaucetTransaction> {
    const result = await Coinbase.apiClients.externalAddress!.getFaucetTransaction(
      this.transaction.getNetworkId(),
      this.getAddressId(),
      this.getTransactionHash(),
    );

    this.model = result?.data;

    if (!this.model?.transaction) {
      throw new Error("FaucetTransaction model cannot be empty");
    }

    this._transaction = new Transaction(this.model.transaction!);

    return this;
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
