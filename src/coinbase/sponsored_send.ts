import * as viem from "viem";
import { SponsoredSend as SponsoredSendModel } from "../client/api";
import { SponsoredSendStatus } from "./types";

/**
 * A representation of an onchain Sponsored Send.
 */
export class SponsoredSend {
  private model: SponsoredSendModel;

  /**
   * Sponsored Sends should be constructed via higher level abstractions like Transfer.
   *
   * @class
   * @param model - The underlying Sponsored Send object.
   */
  constructor(model: SponsoredSendModel) {
    if (!model) {
      throw new Error("Invalid model type");
    }
    this.model = model;
  }

  /**
   * Returns the Keccak256 hash of the typed data. This payload must be signed
   * by the sender to be used as an approval in the EIP-3009 transaction.
   *
   * @returns The Keccak256 hash of the typed data.
   */
  getTypedDataHash(): string {
    return this.model.typed_data_hash;
  }

  /**
   * Returns the raw typed data of the Sponsored Send.
   *
   * @returns The raw typed data
   * @throws Will throw an error if the raw typed data is not a valid JSON string.
   */
  getRawTypedData(): any {
    return JSON.parse(viem.fromHex(`0x${this.model.raw_typed_data}`, 'string'));
  }

  /**
   * Returns the signature of the typed data.
   *
   * @returns The hash of the typed data signature.
   */
  getSignature(): string | undefined {
    return this.model.signature;
  }

  /**
   * Signs the Sponsored Send with the provided key and returns the hex signature.
   *
   * @param key - The key to sign the Sponsored Send with
   * @returns The hex-encoded signature
   */
  async sign(account: viem.LocalAccount) {
    const signature = await account.signTypedData(this.getRawTypedData());
    this.model.signature = signature;
    return signature;
  }

  /**
   * Returns whether the Sponsored Send has been signed.
   *
   * @returns if the Sponsored Send has been signed.
   */
  isSigned(): boolean {
    return !!this.getSignature();
  }

  /**
   * Returns the Status of the Sponsored Send.
   *
   * @returns the Status of the Sponsored Send
   */
  getStatus(): SponsoredSendStatus | undefined {
    switch (this.model.status) {
      case SponsoredSendStatus.PENDING:
        return SponsoredSendStatus.PENDING;
      case SponsoredSendStatus.SIGNED:
        return SponsoredSendStatus.SIGNED;
      case SponsoredSendStatus.SUBMITTED:
        return SponsoredSendStatus.SUBMITTED;
      case SponsoredSendStatus.COMPLETE:
        return SponsoredSendStatus.COMPLETE;
      case SponsoredSendStatus.FAILED:
        return SponsoredSendStatus.FAILED;
      default:
        undefined;
    }
  }

  /**
   * Returns whether the Sponsored Send is in a terminal State.
   *
   * @returns Whether the Sponsored Send is in a terminal State
   */
  isTerminalState(): boolean {
    const status = this.getStatus();

    if (!status) return false;

    return [SponsoredSendStatus.COMPLETE, SponsoredSendStatus.FAILED].includes(status);
  }

  /**
   * Returns the Transaction Hash of the Sponsored Send.
   *
   * @returns The Transaction Hash
   */
  getTransactionHash(): string | undefined {
    return this.model.transaction_hash;
  }

  /**
   * Returns the link to the Sponsored Send on the blockchain explorer.
   *
   * @returns The link to the Sponsored Send on the blockchain explorer
   */
  getTransactionLink(): string | undefined {
    return this.model.transaction_link;
  }

  /**
   * Returns a string representation of the Sponsored Send.
   *
   * @returns A string representation of the Sponsored Send
   */
  toString(): string {
    return `SponsoredSend { transactionHash: '${this.getTransactionHash()}', status: '${this.getStatus()}', typedDataHash: '${this.getTypedDataHash()}', signature: ${this.getSignature()}, transactionLink: ${this.getTransactionLink()} }`;
  }
}
