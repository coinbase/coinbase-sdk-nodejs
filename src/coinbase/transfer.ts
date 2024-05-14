import { ApiClients, TransferStatus } from "./types";
import { Coinbase } from "./coinbase";
import { Transfer as TransferModel } from "../client/api";
import { ethers } from "ethers";
import { InternalError, InvalidUnsignedPayload } from "./errors";

/**
 * A representation of a transfer, which moves an amount of an asset from
 * a user-controlled wallet to another address. The fee is assumed to be paid
 * in the native asset of the network.
 */
export class Transfer {
  private model: TransferModel;
  private client: ApiClients;
  private transaction?: ethers.Transaction;

  /**
   * Initializes a new Transfer instance.
   * @param {TransferModel} transferModel - The transfer model.
   * @param {ApiClients} client - The API clients.
   */
  constructor(transferModel: TransferModel, client: ApiClients) {
    if (!transferModel) {
      throw new InternalError("Transfer model cannot be empty");
    }
    this.model = transferModel;

    if (!client) {
      throw new InternalError("API clients cannot be empty");
    }
    this.client = client;
  }

  /**
   * Returns the ID of the transfer.
   * @returns {string} The transfer ID.
   */
  public getId(): string {
    return this.model.transfer_id;
  }

  /**
   * Returns the network ID of the transfer.
   * @returns {string} The network ID.
   */
  public getNetworkId(): string {
    return this.model.network_id;
  }

  /**
   * Returns the wallet ID of the transfer.
   * @returns {string} The wallet ID.
   */
  public getWalletId(): string {
    return this.model.wallet_id;
  }

  /**
   * Returns the from address ID of the transfer.
   * @returns {string} The from address ID.
   */
  public getFromAddressId(): string {
    return this.model.address_id;
  }

  /**
   * Returns the destination address ID of the transfer.
   * @returns {string} The destination address ID.
   */
  public getDestinationAddressId(): string {
    return this.model.destination;
  }

  /**
   * Returns the asset ID of the transfer.
   * @returns {string} The asset ID.
   */
  public getAssetId(): string {
    return this.model.asset_id;
  }

  /**
   * Returns the amount of the transfer.
   * @returns {string} The amount of the asset.
   */
  public getAmount(): bigint {
    const amount = BigInt(this.model.amount);

    if (this.getAssetId() === "eth") {
      return amount / BigInt(Coinbase.WEI_PER_ETHER);
    }
    return BigInt(this.model.amount);
  }

  /**
   * Returns the unsigned payload of the transfer.
   * @returns {string} The unsigned payload as a hex string.
   */
  public getUnsignedPayload(): string {
    return this.model.unsigned_payload;
  }

  /**
   * Returns the signed payload of the transfer.
   * @returns {string | undefined} The signed payload as a hex string, or undefined if not yet available.
   */
  public getSignedPayload(): string | undefined {
    return this.model.signed_payload;
  }

  /**
   * Returns the transaction hash of the transfer.
   * @returns {string | undefined} The transaction hash as a hex string, or undefined if not yet available.
   */
  public getTransactionHash(): string | undefined {
    return this.model.transaction_hash;
  }

  /**
   * Returns the transaction of the transfer.
   * @returns {ethers.Transaction} The ethers.js Transaction object.
   * @throws (InvalidUnsignedPayload) If the unsigned payload is invalid.
   */
  public getTransaction(): ethers.Transaction {
    if (this.transaction) return this.transaction;

    const transaction = new ethers.Transaction();

    const rawPayload = this.getUnsignedPayload()
      .match(/../g)
      ?.map(byte => parseInt(byte, 16));
    if (!rawPayload) {
      throw new InvalidUnsignedPayload("Unable to parse unsigned payload");
    }

    const rawPayloadBytes = new Uint8Array(rawPayload);

    const decoder = new TextDecoder();

    let parsedPayload;
    try {
      parsedPayload = JSON.parse(decoder.decode(rawPayloadBytes));
    } catch (error) {
      throw new InvalidUnsignedPayload("Unable to decode unsigned payload JSON");
    }

    transaction.chainId = BigInt(parsedPayload["chainId"]);
    transaction.nonce = BigInt(parsedPayload["nonce"]);
    transaction.maxPriorityFeePerGas = BigInt(parsedPayload["maxPriorityFeePerGas"]);
    transaction.maxFeePerGas = BigInt(parsedPayload["maxFeePerGas"]);
    transaction.gasLimit = BigInt(parsedPayload["gas"]);
    transaction.to = parsedPayload["to"];
    transaction.value = BigInt(parsedPayload["value"]);
    transaction.data = parsedPayload["input"];

    this.transaction = transaction;
    return transaction;
  }

  /**
   * Sets the signed transaction of the transfer.
   * @param {ethers.Transaction} transaction - The signed transaction.
   */
  public setSignedTransaction(transaction: ethers.Transaction): void {
    this.transaction = transaction;
  }

  /**
   * Returns the status of the transfer.
   * @returns {Promise<TransferStatus>} The status of the transfer.
   */
  public async getStatus(): Promise<TransferStatus> {
    const transactionHash = this.getTransactionHash();
    if (!transactionHash) return TransferStatus.PENDING;

    const onchainTransansaction =
      await this.client.baseSepoliaProvider!.getTransaction(transactionHash);
    if (!onchainTransansaction) return TransferStatus.PENDING;
    if (!onchainTransansaction.blockHash) return TransferStatus.BROADCAST;

    const transactionReceipt =
      await this.client.baseSepoliaProvider!.getTransactionReceipt(transactionHash);
    return transactionReceipt?.status ? TransferStatus.COMPLETE : TransferStatus.FAILED;
  }

  /**
   * Waits until the transfer is completed or failed by polling the network at the given interval.
   * Raises an error if the transfer takes longer than the given timeout.
   * @param {number} intervalSeconds - The interval at which to poll the network, in seconds.
   * @param {number} timeoutSeconds - The maximum amount of time to wait for the transfer to complete, in seconds.
   * @returns {Promise<Transfer>} The completed Transfer object.
   */
  public async wait(intervalSeconds = 0.2, timeoutSeconds = 10): Promise<Transfer> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutSeconds * 1000) {
      const status = await this.getStatus();
      if (status === TransferStatus.COMPLETE || status === TransferStatus.FAILED) {
        return this;
      }
      await new Promise(resolve => setTimeout(resolve, intervalSeconds * 1000));
    }
    throw new Error("Transfer timed out");
  }

  /**
   * Returns the link to the transaction on the blockchain explorer.
   * @returns {string} The link to the transaction on the blockchain explorer.
   */
  public getTransactionLink(): string {
    return `https://sepolia.basescan.org/tx/${this.getTransactionHash()}`;
  }

  /**
   * Returns a string representation of the Transfer.
   * @returns {Promise<string>} a string representation of the Transfer.
   */
  public async toString(): Promise<string> {
    const status = await this.getStatus();
    return (
      `Coinbase::Transfer{transfer_id: '${this.getId()}', network_id: '${this.getNetworkId()}', ` +
      `from_address_id: '${this.getFromAddressId()}', destination_address_id: '${this.getDestinationAddressId()}', ` +
      `asset_id: '${this.getAssetId()}', amount: '${this.getAmount()}', transaction_hash: '${this.getTransactionHash()}', ` +
      `transaction_link: '${this.getTransactionLink()}', status: '${status}'}`
    );
  }
}
