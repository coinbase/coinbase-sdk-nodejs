import { Decimal } from "decimal.js";
import { TransactionStatus, SponsoredSendStatus, TransferStatus } from "./types";
import { Transaction } from "./transaction";
import { SponsoredSend } from "./sponsored_send";
import { Coinbase } from "./coinbase";
import { Transfer as TransferModel } from "../client/api";
import { ethers } from "ethers";
import { InternalError } from "./errors";

/**
 * A representation of a Transfer, which moves an Amount of an Asset from
 * a user-controlled Wallet to another Address. The fee is assumed to be paid
 * in the native Asset of the Network.
 */
export class Transfer {
  private model: TransferModel;

  /**
   * Private constructor to prevent direct instantiation outside of the factory methods.
   *
   * @ignore
   * @param transferModel - The Transfer model.
   * @hideconstructor
   */
  private constructor(transferModel: TransferModel) {
    if (!transferModel) {
      throw new InternalError("Transfer model cannot be empty");
    }
    this.model = transferModel;
  }

  /**
   * Converts a TransferModel into a Transfer object.
   *
   * @param transferModel - The Transfer model object.
   * @returns The Transfer object.
   */
  public static fromModel(transferModel: TransferModel): Transfer {
    return new Transfer(transferModel);
  }

  /**
   * Returns the ID of the Transfer.
   *
   * @returns The Transfer ID.
   */
  public getId(): string {
    return this.model.transfer_id;
  }

  /**
   * Returns the Network ID of the Transfer.
   *
   * @returns The Network ID.
   */
  public getNetworkId(): string {
    return this.model.network_id;
  }

  /**
   * Returns the Wallet ID of the Transfer.
   *
   * @returns The Wallet ID.
   */
  public getWalletId(): string {
    return this.model.wallet_id;
  }

  /**
   * Returns the From Address ID of the Transfer.
   *
   * @returns The From Address ID.
   */
  public getFromAddressId(): string {
    return this.model.address_id;
  }

  /**
   * Returns the Destination Address ID of the Transfer.
   *
   * @returns The Destination Address ID.
   */
  public getDestinationAddressId(): string {
    return this.model.destination;
  }

  /**
   * Returns the Asset ID of the Transfer.
   *
   * @returns The Asset ID.
   */
  public getAssetId(): string {
    return this.model.asset_id;
  }

  /**
   * Returns the Amount of the Transfer.
   *
   * @returns The Amount of the Asset.
   */
  public getAmount(): Decimal {
    const amount = new Decimal(this.model.amount);
    return amount.dividedBy(new Decimal(10).pow(this.model.asset.decimals!));
  }

  /**
   * Returns the Transaction Hash of the Transfer.
   *
   * @returns The Transaction Hash as a Hex string, or undefined if not yet available.
   */
  public getTransactionHash(): string | undefined {
    return this.getSendTransactionDelegate()?.getTransactionHash();
  }

  /**
   * Returns the Transaction of the Transfer.
   *
   * @returns The ethers.js Transaction object.
   * @throws (InvalidUnsignedPayload) If the Unsigned Payload is invalid.
   */
  public getRawTransaction(): ethers.Transaction | undefined {
    if (!this.getTransaction()) return undefined;
    return this.getTransaction()!.rawTransaction();
  }

  /**
   * Signs the Transfer with the provided key and returns the hex signature
   * required for broadcasting the Transfer.
   *
   * @param key - The key to sign the Transfer with
   * @returns The hex-encoded signed payload
   */
  async sign(key: ethers.Wallet): Promise<string> {
    return this.getSendTransactionDelegate()!.sign(key);
  }

  /**
   * Returns the Status of the Transfer.
   *
   * @returns The Status of the Transfer.
   */
  public getStatus(): TransferStatus | undefined {
    switch (this.getSendTransactionDelegate()!.getStatus()!) {
      case TransactionStatus.PENDING:
        return TransferStatus.PENDING;
      case SponsoredSendStatus.PENDING:
        return TransferStatus.PENDING;
      case SponsoredSendStatus.SIGNED:
        return TransferStatus.PENDING;
      case TransactionStatus.BROADCAST:
        return TransferStatus.BROADCAST;
      case SponsoredSendStatus.SUBMITTED:
        return TransferStatus.BROADCAST;
      case TransactionStatus.COMPLETE:
        return TransferStatus.COMPLETE;
      case SponsoredSendStatus.COMPLETE:
        return TransferStatus.COMPLETE;
      case TransactionStatus.FAILED:
        return TransferStatus.FAILED;
      case SponsoredSendStatus.FAILED:
        return TransferStatus.FAILED;
      default:
        return undefined;
    }
  }

  /**
   * Returns the Transaction of the Transfer.
   *
   * @returns The Transaction
   */
  public getTransaction(): Transaction | undefined {
    if (!this.model.transaction) return undefined;
    return new Transaction(this.model.transaction!);
  }

  /**
   * Returns the Sponsored Send of the Transfer.
   *
   * @returns The Sponsored Send
   */
  public getSponsoredSend(): SponsoredSend | undefined {
    if (!this.model.sponsored_send) return undefined;
    return new SponsoredSend(this.model.sponsored_send!);
  }

  /**
   * Returns the Send Transaction Delegate of the Transfer.
   *
   * @returns Either the Transaction or the Sponsored Send
   */
  public getSendTransactionDelegate(): Transaction | SponsoredSend | undefined {
    return !this.getTransaction() ? this.getSponsoredSend() : this.getTransaction();
  }

  /**
   * Returns the link to the Transaction on the blockchain explorer.
   *
   * @returns The link to the Transaction on the blockchain explorer.
   */
  public getTransactionLink(): string | undefined {
    return this.getSendTransactionDelegate()?.getTransactionLink();
  }

  /**
   * Broadcasts the Transfer to the Network.
   *
   * @returns The Transfer object
   * @throws {APIError} if the API request to broadcast a Transfer fails.
   */
  public async broadcast(): Promise<Transfer> {
    if (!this.getSendTransactionDelegate()?.isSigned())
      throw new Error("Cannot broadcast unsigned Transfer");

    const broadcastTransferRequest = {
      signed_payload: this.getSendTransactionDelegate()!.getSignature()!,
    };

    const response = await Coinbase.apiClients.transfer!.broadcastTransfer(
      this.getWalletId(),
      this.getFromAddressId(),
      this.getId(),
      broadcastTransferRequest,
    );

    return Transfer.fromModel(response.data);
  }

  /**
   * Reloads the Transfer model with the latest data from the server.
   *
   * @throws {APIError} if the API request to get a Transfer fails.
   */
  public async reload(): Promise<void> {
    const result = await Coinbase.apiClients.transfer!.getTransfer(
      this.getWalletId(),
      this.getFromAddressId(),
      this.getId(),
    );
    this.model = result?.data;
  }

  /**
   * Returns a string representation of the Transfer.
   *
   * @returns The string representation of the Transfer.
   */
  public toString(): string {
    return (
      `Transfer{transferId: '${this.getId()}', networkId: '${this.getNetworkId()}', ` +
      `fromAddressId: '${this.getFromAddressId()}', destinationAddressId: '${this.getDestinationAddressId()}', ` +
      `assetId: '${this.getAssetId()}', amount: '${this.getAmount()}', transactionHash: '${this.getTransactionHash()}', ` +
      `transactionLink: '${this.getTransactionLink()}', status: '${this.getStatus()}'}`
    );
  }
}
