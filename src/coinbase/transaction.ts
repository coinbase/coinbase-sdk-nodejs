import * as viem from "viem";
import { Transaction as TransactionModel } from "../client/api";
import { TransactionStatus } from "./types";
import { parseUnsignedPayload } from "./utils";

/**
 * A representation of an onchain Transaction.
 */
export class Transaction {
  private model: TransactionModel;
  private raw?: viem.TransactionSerializable;

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
   * Returns the Status of the Transaction.
   *
   * @returns The Status
   */
  getStatus(): TransactionStatus | undefined {
    switch (this.model.status) {
      case TransactionStatus.PENDING:
        return TransactionStatus.PENDING;
      case TransactionStatus.BROADCAST:
        return TransactionStatus.BROADCAST;
      case TransactionStatus.COMPLETE:
        return TransactionStatus.COMPLETE;
      case TransactionStatus.FAILED:
        return TransactionStatus.FAILED;
      default:
        return undefined;
    }
  }

  /**
   * Returns the From Address ID for the Transaction.
   *
   * @returns The From Address ID
   */
  fromAddressId(): string {
    return this.model.from_address_id;
  }

  /**
   * Returns the To Address ID for the Transaction if it's available.
   *
   * @returns The To Address ID
   */
  toAddressId(): string | undefined {
    return this.model.to_address_id;
  }

  /**
   * Returns whether the Transaction is in a terminal State.
   *
   * @returns Whether the Transaction is in a terminal State
   */
  isTerminalState(): boolean {
    const status = this.getStatus();

    if (!status) return false;

    return [TransactionStatus.COMPLETE, TransactionStatus.FAILED].includes(status);
  }

  /**
   * Returns the link to the Transaction on the blockchain explorer.
   *
   * @returns The link to the Transaction on the blockchain explorer
   */
  getTransactionLink(): string {
    return this.model.transaction_link!;
  }

  /**
   * Returns the underlying raw transaction.
   *
   * @throws {InvalidUnsignedPayload} If the Unsigned Payload is invalid.
   * @returns The Viem Transaction object
   */
  rawTransaction(): viem.TransactionSerializable {
    if (this.raw) {
      return this.raw;
    }
    const parsedPayload = parseUnsignedPayload(this.getUnsignedPayload());
    const transaction: viem.TransactionSerializable = {
      chainId: Number(parsedPayload.chainId),
      data: parsedPayload.input,
      nonce: Number(parsedPayload.nonce),
      maxPriorityFeePerGas: BigInt(parsedPayload.maxPriorityFeePerGas),
      maxFeePerGas: BigInt(parsedPayload.maxFeePerGas),
      // TODO: Handle multiple currencies.
      gas: BigInt(parsedPayload.gas),
      to: parsedPayload.to,
      value: BigInt(parsedPayload.value),
    };
 
    this.raw = transaction;
    return this.raw;
  }

  /**
   * Signs the Transaction with the provided key and returns the hex signing payload.
   *
   * @param key - The key to sign the transaction with
   * @returns The hex-encoded signed payload
   */
  async sign(key: viem.LocalAccount): Promise<string> {
    const signedPayload = await key.signTransaction(this.rawTransaction());
    this.model.signed_payload = signedPayload;
    // Removes the '0x' prefix as required by the API.
    return signedPayload.slice(2);
  }

  /**
   * Returns the Signed Payload of the Transaction.
   *
   * @returns The Signed Payload
   */
  getSignature(): string | undefined {
    return this.getSignedPayload()?.slice(2);
  }

  /**
   * Returns whether the transaction has been signed.
   *
   * @returns if the transaction has been signed.
   */
  isSigned(): boolean {
    return !!this.getSignature();
  }

  /**
   * Returns a string representation of the Transaction.
   *
   * @returns A string representation of the Transaction.
   */
  toString(): string {
    return `Transaction { transactionHash: '${this.getTransactionHash()}', status: '${this.getStatus()}', unsignedPayload: '${this.getUnsignedPayload()}', signedPayload: ${this.getSignedPayload()}, transactionLink: ${this.getTransactionLink()} }`;
  }
}
