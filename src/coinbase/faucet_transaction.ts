import { FaucetTransaction as FaucetTransactionModel } from "../client";
import { InternalError } from "./errors";

/**
 * Represents a transaction from a faucet.
 */
export class FaucetTransaction {
  private model: FaucetTransactionModel;

  /**
   * Creates a new FaucetTransaction instance.
   * Do not use this method directly - instead, use Address.faucet().
   * @constructor
   * @param {FaucetTransactionModel} model - The FaucetTransaction model.
   * @throws {InternalError} If the model does not exist.
   */
  constructor(model: FaucetTransactionModel) {
    if (!model) {
      throw new InternalError("FaucetTransaction model cannot be empty");
    }
    this.model = model;
  }

  /**
   * Returns the transaction hash.
   * @returns {string} The transaction hash.
   */
  public getTransactionHash(): string {
    return this.model.transaction_hash;
  }

  /**
   * Returns the link to the transaction on the blockchain explorer.
   * @returns {string} The link to the transaction on the blockchain explorer
   */
  public getTransactionLink(): string {
    // TODO: Parameterize this by Network.
    return `https://sepolia.basescan.org/tx/${this.getTransactionHash()}`;
  }

  /**
   * Returns a string representation of the FaucetTransaction.
   * @returns {string} A string representation of the FaucetTransaction.
   */
  public toString(): string {
    return `Coinbase::FaucetTransaction{transaction_hash: '${this.getTransactionHash()}', transaction_link: '${this.getTransactionLink()}'}`;
  }
}
