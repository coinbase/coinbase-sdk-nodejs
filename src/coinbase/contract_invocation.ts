import { Decimal } from "decimal.js";
import { TransactionStatus } from "./types";
import { ITransaction, Transaction } from "./transaction";
import { Coinbase } from "./coinbase";
import { ContractInvocation as ContractInvocationModel } from "../client/api";
import { ethers } from "ethers";
import { delay } from "./utils";
import { TimeoutError } from "./errors";

export interface IContractInvocation {
  getId(): string;
  getNetworkId(): string;
  getWalletId(): string;
  getFromAddressId(): string;
  getContractAddressId(): string;
  getMethod(): string;
  getArgs(): object;
  getAbi(): object | undefined;
  getAmount(): Decimal;
  getTransactionHash(): string | undefined;
  getRawTransaction(): ethers.Transaction;
  sign(key: ethers.Wallet): Promise<string>;
  getStatus(): TransactionStatus | undefined;
  getTransaction(): ITransaction;
  getTransactionLink(): string;
  broadcast(): Promise<IContractInvocation>;
  wait({
    intervalSeconds,
    timeoutSeconds,
  }: {
    intervalSeconds: number;
    timeoutSeconds: number;
  }): Promise<ContractInvocation>;
  reload(): Promise<void>;
}

/**
 * A representation of a ContractInvocation, which calls a smart contract method
 * onchain. The fee is assumed to be paid in the native Asset of the Network.
 */
export class ContractInvocation implements IContractInvocation {
  private model: ContractInvocationModel;

  /**
   * Private constructor to prevent direct instantiation outside of the factory methods.
   *
   * @ignore
   * @param contractInvocationModel - The ContractInvocation model.
   * @hideconstructor
   */
  private constructor(contractInvocationModel: ContractInvocationModel) {
    if (!contractInvocationModel) {
      throw new Error("ContractInvocation model cannot be empty");
    }
    this.model = contractInvocationModel;
  }

  /**
   * Converts a ContractInvocationModel into a ContractInvocation object.
   *
   * @param contractInvocationModel - The ContractInvocation model object.
   * @returns The ContractInvocation object.
   */
  public static fromModel(contractInvocationModel: ContractInvocationModel): ContractInvocation {
    return new ContractInvocation(contractInvocationModel);
  }

  /**
   * Returns the ID of the ContractInvocation.
   *
   * @returns The ContractInvocation ID.
   */
  public getId(): string {
    return this.model.contract_invocation_id;
  }

  /**
   * Returns the Network ID of the ContractInvocation.
   *
   * @returns The Network ID.
   */
  public getNetworkId(): string {
    return this.model.network_id;
  }

  /**
   * Returns the Wallet ID of the ContractInvocation.
   *
   * @returns The Wallet ID.
   */
  public getWalletId(): string {
    return this.model.wallet_id;
  }

  /**
   * Returns the From Address ID of the ContractInvocation.
   *
   * @returns The From Address ID.
   */
  public getFromAddressId(): string {
    return this.model.address_id;
  }

  /**
   * Returns the Destination Address ID of the ContractInvocation.
   *
   * @returns The Destination Address ID.
   */
  public getContractAddressId(): string {
    return this.model.contract_address;
  }

  /**
   * Returns the Method of the ContractInvocation.
   *
   * @returns The Method.
   */
  public getMethod(): string {
    return this.model.method;
  }

  /**
   * Returns the Arguments of the ContractInvocation.
   *
   * @returns {object} The arguments object passed to the contract invocation.
   * The key is the argument name and the value is the argument value.
   */
  public getArgs(): object {
    return JSON.parse(this.model.args);
  }

  /**
   * Returns the ABI of the ContractInvocation, if specified.
   *
   * @returns The ABI as an object, or undefined if not available.
   */
  public getAbi(): object | undefined {
    if (!this.model.abi) return undefined;

    return JSON.parse(this.model.abi);
  }

  /**
   * Returns the amount of the native asset sent to a payable contract method, if applicable.
   *
   * @returns The amount in atomic units of the native asset.
   */
  public getAmount(): Decimal {
    return new Decimal(this.model.amount);
  }

  /**
   * Returns the Transaction Hash of the ContractInvocation.
   *
   * @returns The Transaction Hash as a Hex string, or undefined if not yet available.
   */
  public getTransactionHash(): string | undefined {
    return this.getTransaction().getTransactionHash();
  }

  /**
   * Returns the Transaction of the ContractInvocation.
   *
   * @returns The ethers.js Transaction object.
   * @throws (InvalidUnsignedPayload) If the Unsigned Payload is invalid.
   */
  public getRawTransaction(): ethers.Transaction {
    return this.getTransaction().rawTransaction();
  }

  /**
   * Signs the ContractInvocation with the provided key and returns the hex signature
   * required for broadcasting the ContractInvocation.
   *
   * @param key - The key to sign the ContractInvocation with
   * @returns The hex-encoded signed payload
   */
  async sign(key: ethers.Wallet): Promise<string> {
    return this.getTransaction().sign(key);
  }

  /**
   * Returns the Status of the ContractInvocation.
   *
   * @returns The Status of the ContractInvocation.
   */
  public getStatus(): TransactionStatus | undefined {
    return this.getTransaction().getStatus();
  }

  /**
   * Returns the Transaction of the ContractInvocation.
   *
   * @returns The Transaction
   */
  public getTransaction(): Transaction {
    return new Transaction(this.model.transaction);
  }

  /**
   * Returns the link to the Transaction on the blockchain explorer.
   *
   * @returns The link to the Transaction on the blockchain explorer.
   */
  public getTransactionLink(): string {
    return this.getTransaction().getTransactionLink();
  }

  /**
   * Broadcasts the ContractInvocation to the Network.
   *
   * @returns The ContractInvocation object
   * @throws {APIError} if the API request to broadcast a ContractInvocation fails.
   */
  public async broadcast(): Promise<ContractInvocation> {
    if (!this.getTransaction()?.isSigned())
      throw new Error("Cannot broadcast unsigned ContractInvocation");

    const broadcastContractInvocationRequest = {
      signed_payload: this.getTransaction()!.getSignature()!,
    };

    const response = await Coinbase.apiClients.contractInvocation!.broadcastContractInvocation(
      this.getWalletId(),
      this.getFromAddressId(),
      this.getId(),
      broadcastContractInvocationRequest,
    );

    return ContractInvocation.fromModel(response.data);
  }

  /**
   * Waits for the ContractInvocation to be confirmed on the Network or fail on chain.
   * Waits until the ContractInvocation is completed or failed on-chain by polling at the given interval.
   * Raises an error if the ContractInvocation takes longer than the given timeout.
   *
   * @param options - The options to configure the wait function.
   * @param options.intervalSeconds - The interval to check the status of the ContractInvocation.
   * @param options.timeoutSeconds - The maximum time to wait for the ContractInvocation to be confirmed.
   *
   * @returns The ContractInvocation object in a terminal state.
   * @throws {Error} if the ContractInvocation times out.
   */
  public async wait({
    intervalSeconds = 0.2,
    timeoutSeconds = 10,
  } = {}): Promise<ContractInvocation> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutSeconds * 1000) {
      await this.reload();

      // If the ContractInvocation is in a terminal state, return the ContractInvocation.
      const status = this.getStatus();
      if (status === TransactionStatus.COMPLETE || status === TransactionStatus.FAILED) {
        return this;
      }

      await delay(intervalSeconds);
    }

    throw new TimeoutError("ContractInvocation timed out");
  }

  /**
   * Reloads the ContractInvocation model with the latest data from the server.
   *
   * @throws {APIError} if the API request to get a ContractInvocation fails.
   */
  public async reload(): Promise<void> {
    const result = await Coinbase.apiClients.contractInvocation!.getContractInvocation(
      this.getWalletId(),
      this.getFromAddressId(),
      this.getId(),
    );
    this.model = result?.data;
  }

  /**
   * Returns a string representation of the ContractInvocation.
   *
   * @returns The string representation of the ContractInvocation.
   */
  public toString(): string {
    return (
      `ContractInvocation{contractInvocationId: '${this.getId()}', networkId: '${this.getNetworkId()}', ` +
      `fromAddressId: '${this.getFromAddressId()}', contractAddressId: '${this.getContractAddressId()}', ` +
      `method: '${this.getMethod()}', args: '${this.getArgs()}', transactionHash: '${this.getTransactionHash()}', ` +
      `transactionLink: '${this.getTransactionLink()}', status: '${this.getStatus()}'}`
    );
  }
}
