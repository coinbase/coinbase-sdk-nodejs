import { PayloadSignature as PayloadSignatureModel } from "../client";
import { PayloadSignatureStatus } from "./types";
import { delay } from "./utils";
import { TimeoutError } from "./errors";
import { Coinbase } from "./coinbase";

/**
 * A representation of a Payload Signature.
 */
export class PayloadSignature {
  private model: PayloadSignatureModel;

  /**
   * Constructs a Payload Signature.
   *
   * @class
   * @param model - The underlying Payload Signature object.
   */
  constructor(model: PayloadSignatureModel) {
    if (!model) {
      throw new Error("Invalid model type");
    }
    this.model = model;
  }

  /**
   * Returns the ID of the Payload Signature.
   *
   * @returns The ID of the Payload Signature
   */
  getId(): string {
    return this.model.payload_signature_id;
  }

  /**
   * Returns the Wallet ID of the Payload Signature.
   *
   * @returns The Wallet ID
   */
  getWalletId(): string {
    return this.model.wallet_id;
  }

  /**
   * Returns the Address ID of the Payload Signature.
   *
   * @returns The Address ID
   */
  getAddressId(): string {
    return this.model.address_id;
  }

  /**
   * Returns the Unsigned Payload of the Payload Signature.
   *
   * @returns The Unsigned Payload
   */
  getUnsignedPayload(): string {
    return this.model.unsigned_payload;
  }

  /**
   * Returns the Signature of the Payload Signature.
   *
   * @returns The Signature
   */
  getSignature(): string | undefined {
    return this.model.signature;
  }

  /**
   * Returns the Status of the Payload Signature.
   *
   * @returns The Status
   */
  getStatus(): PayloadSignatureStatus | undefined {
    switch (this.model.status) {
      case PayloadSignatureStatus.PENDING:
        return PayloadSignatureStatus.PENDING;
      case PayloadSignatureStatus.SIGNED:
        return PayloadSignatureStatus.SIGNED;
      case PayloadSignatureStatus.FAILED:
        return PayloadSignatureStatus.FAILED;
      default:
        return undefined;
    }
  }

  /**
   * Returns whether the Payload Signature is in a terminal State.
   *
   * @returns Whether the Payload Signature is in a terminal State
   */
  isTerminalState(): boolean {
    const status = this.getStatus();

    if (!status) return false;

    return [PayloadSignatureStatus.SIGNED, PayloadSignatureStatus.FAILED].includes(status);
  }

  /**
   * Waits for the Payload Signature to be signed or for the signature operation to fail.
   *
   * @param options - The options to configure the wait function.
   * @param options.intervalSeconds - The interval to check the status of the Payload Signature.
   * @param options.timeoutSeconds - The maximum time to wait for the Payload Signature to be confirmed.
   *
   * @returns The Payload Signature object in a terminal state.
   * @throws {Error} if the Payload Signature times out.
   */
  public async wait({
    intervalSeconds = 0.2,
    timeoutSeconds = 10,
  } = {}): Promise<PayloadSignature> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutSeconds * 1000) {
      await this.reload();

      // If the Payload Signature is in a terminal state, return the Payload Signature.
      if (this.isTerminalState()) {
        return this;
      }

      await delay(intervalSeconds);
    }

    throw new TimeoutError("Payload Signature timed out");
  }

  /**
   * Reloads the Payload Signature model with the latest data from the server.
   *
   * @throws {APIError} if the API request to get a Payload Signature fails.
   */
  public async reload(): Promise<void> {
    const result = await Coinbase.apiClients.address!.getPayloadSignature(
      this.getWalletId(),
      this.getAddressId(),
      this.getId(),
    );
    this.model = result?.data;
  }

  /**
   * Returns a string representation of the Payload Signature.
   *
   * @returns A string representation of the Payload Signature.
   */
  toString(): string {
    return `PayloadSignature { status: '${this.getStatus()}', unsignedPayload: '${this.getUnsignedPayload()}', signature: ${this.getSignature()} }`;
  }

  /**
   * Returns a JSON representation of the Payload Signature.
   *
   * @returns A JSON representation of the Payload Signature.
   */
  toJSON() {
    return {
      id: this.getId(),
      addressId: this.getAddressId(),
      walletId: this.getWalletId(),
      status: this.getStatus(),
      unsignedPayload: this.getUnsignedPayload(),
      signature: this.getSignature(),
    };
  }
}
