import { ethers } from "ethers";
import { Transaction as TransactionModel } from "../client/api";
import { TransactionStatus } from "./types";
import { parseUnsignedPayload } from "./utils";

/**
 * A representation of an onchain Transaction.
 */
export class Transaction {
  private model: TransactionModel;
  private raw?: ethers.Transaction;

  /**
   * Transactions should be constructed via higher level abstractions like Trade or Transfer.
   *
   * @class
   * @param model - The underlying Transaction object.
   */
  constructor(model: TransactionModel) {
    if (!model) {
      throw new Error("Invalid model type");
    }
    this.model = model;
  }

  /**
   * Returns the Unsigned Payload of the Transaction.
   *
   * @returns The Unsigned Payload
   */
  getUnsignedPayload(): string {
    return this.model.unsigned_payload;
  }

  /**
   * Returns the Signed Payload of the Transaction.
   *
   * @returns The Signed Payload
   */
  getSignedPayload(): string | undefined {
    return this.model.signed_payload;
  }

  /**
   * Returns the Transaction Hash of the Transaction.
   *
   * @returns The Transaction Hash
   */
  getTransactionHash(): string | undefined {
    return this.model.transaction_hash;
  }

  /**
   * Returns the status of the Transaction.
   *
   * @returns The Status
   */
  getStatus(): string {
    return this.model.status;
  }

  /**
   * Returns the from address for the Transaction.
   *
   * @returns The from address
   */
  fromAddressId(): string {
    return this.model.from_address_id;
  }

  /**
   * Returns whether the Transaction is in a terminal state.
   *
   * @returns Whether the Transaction is in a terminal state
   */
  isTerminalState(): boolean {
    return this.getStatus() in [TransactionStatus.COMPLETE, TransactionStatus.FAILED];
  }

  /**
   * Returns the link to the transaction on the blockchain explorer.
   *
   * @returns The link to the transaction on the blockchain explorer
   */
  getTransactionLink(): string {
    // TODO: Parameterize this by Network.
    return `https://sepolia.basescan.org/tx/${this.getTransactionHash()}`;
  }

  /**
   * Returns the underlying raw transaction.
   *
   * @throws {InvalidUnsignedPayload} If the payload is invalid.
   * @returns The raw transaction
   */
  rawTransaction(): ethers.Transaction {
    if (this.raw) {
      return this.raw;
    }
    const parsedPayload = parseUnsignedPayload(this.getUnsignedPayload());
    const transaction = new ethers.Transaction();
    transaction.chainId = BigInt(parsedPayload.chainId);
    transaction.nonce = BigInt(parsedPayload.nonce);
    transaction.maxPriorityFeePerGas = BigInt(parsedPayload.maxPriorityFeePerGas);
    transaction.maxFeePerGas = BigInt(parsedPayload.maxFeePerGas);
    // TODO: Handle multiple currencies.
    transaction.gasLimit = BigInt(parsedPayload.gas);
    transaction.to = parsedPayload.to;
    transaction.value = BigInt(parsedPayload.value);
    transaction.data = parsedPayload.input;

    this.raw = transaction;
    return this.raw;
  }

  /**
   * Signs the Transaction with the provided key and returns the hex signing payload.
   *
   * @param key - The key to sign the transaction with
   * @returns The hex-encoded signed payload
   */
  async sign(key: ethers.Wallet) {
    const signedPayload = await key!.signTransaction(this.rawTransaction());
    return signedPayload?.slice(2);
  }

  /**
   * Returns a string representation of the Transaction.
   *
   * @returns A string representation of the Transaction.
   */
  toString(): string {
    return `Transaction { transactionHash: '${this.getTransactionHash()}', status: '${this.getStatus()}' }`;
  }
}
