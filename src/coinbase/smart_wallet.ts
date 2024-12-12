import { Decimal } from "decimal.js";
import { TransactionStatus } from "./types";
import { Transaction } from "./transaction";
import { Coinbase } from "./coinbase";
import { SmartWallet as SmartWalletModel } from "../client/api";
import { ethers } from "ethers";
import { delay } from "./utils";
import { TimeoutError } from "./errors";
import { Wallet } from "./wallet";

/**
 * A representation of a SmartWallet, which is a smart wallet onchain.
 */
export class SmartWallet {
  private model: SmartWalletModel;

  /**
   * Private constructor to prevent direct instantiation outside of the factory methods.
   *
   * @ignore
   * @param smartWalletModel - The SmartWallet model.
   * @hideconstructor
   */
  private constructor(smartWalletModel: SmartWalletModel) {
    if (!smartWalletModel) {
      throw new Error("SmartWallet model cannot be empty");
    }
    this.model = smartWalletModel;
  }

  /**
   * Creates a SmartWallet.
   *
   * @returns The SmartWallet object
   */
  public static async create(): Promise<SmartWallet> {
    // create a wallet
    const wallet = await Wallet.create();

    // use the default address of the wallet
    const address = await wallet.getDefaultAddress();

    // faucet the address
    const faucet_tx = await address.faucet();
    await faucet_tx.wait();

    // view balance
    const balance = await address.getBalance("eth");
    console.log("Balance:", balance);


    const resp = await Coinbase.apiClients.smartWallet!.createSmartWallet(
      wallet.getId()!,
      address.getId(),
    );

    // log address
    console.log("Deployer and owner of smart wallet:", address);

    // log smart wallet
    const smartWallet = SmartWallet.fromModel(resp?.data);
    console.log("Smart wallet:", JSON.stringify(smartWallet, null, 2));

    return smartWallet;
  }

  /**
   * Converts a SmartWalletModel into a SmartWallet object.
   *
   * @param smartWalletModel - The SmartWallet model object.
   * @returns The SmartWallet object.
   */
  public static fromModel(smartWalletModel: SmartWalletModel): SmartWallet {
    return new SmartWallet(smartWalletModel);
  }

  /**
   * Returns the ID of the SmartWallet.
   *
   * @returns The SmartWallet ID.
   */
  public getId(): string {
    return this.model.smart_wallet_id;
  }

  /**
   * Returns the Network ID of the SmartWallet.
   *
   * @returns The Network ID.
   */
  public getNetworkId(): string {
    return this.model.contractInvocation!.network_id;
  }

  /**
   * Returns the Wallet ID of the owner of the SmartWallet.
   *
   * @returns The Wallet ID.
   */
  public getWalletId(): string {
    return this.model.contractInvocation!.wallet_id;
  }

  /**
   * Returns the From Address ID of the owner of the SmartWallet.
   *
   * @returns The From Address ID.
   */
  public getFromAddressId(): string {
    return this.model.contractInvocation!.address_id;
  }

  /**
   * Returns the contract aadress of the newly deployed smart wallet.
   *
   * @returns The Destination Address ID.
   */
  public getContractAddressId(): string | undefined {
    return this.model.smart_wallet_address;
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
   * Returns the Transaction of the SmartWallet.
   *
   * @returns The Transaction
   */
  public getTransaction(): Transaction {
    return new Transaction(this.model.contractInvocation!.transaction);
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
   * @returns The SmartWallet object
   * @throws {APIError} if the API request to broadcast a SmartWallet fails.
   */
//   public async broadcast(): Promise<SmartWallet> {
//     if (!this.getTransaction()?.isSigned())
//       throw new Error("Cannot broadcast unsigned SmartWallet");

//     const broadcastContractInvocationRequest = {
//       signed_payload: this.getTransaction()!.getSignature()!,
//     };

//     const response = await Coinbase.apiClients.contractInvocation!.broadcastContractInvocation(
//       this.getWalletId(),
//       this.getFromAddressId(),
//       this.getId(),
//       broadcastContractInvocationRequest,
//     );

//     return SmartWallet.fromModel(response.data);
//   }

  /**
   * Waits for the SmartWallet to be confirmed on the Network or fail on chain.
   * Waits until the SmartWallet is completed or failed on-chain by polling at the given interval.
   * Raises an error if the SmartWallet takes longer than the given timeout.
   *
   * @param options - The options to configure the wait function.
   * @param options.intervalSeconds - The interval to check the status of the ContractInvocation.
   * @param options.timeoutSeconds - The maximum time to wait for the ContractInvocation to be confirmed.
   *
   * @returns The ContractInvocation object in a terminal state.
   * @throws {Error} if the ContractInvocation times out.
   */
//   public async wait({
//     intervalSeconds = 0.2,
//     timeoutSeconds = 10,
//   } = {}): Promise<ContractInvocation> {
//     const startTime = Date.now();

//     while (Date.now() - startTime < timeoutSeconds * 1000) {
//       await this.reload();

//       // If the ContractInvocation is in a terminal state, return the ContractInvocation.
//       const status = this.getStatus();
//       if (status === TransactionStatus.COMPLETE || status === TransactionStatus.FAILED) {
//         return this;
//       }

//       await delay(intervalSeconds);
//     }

//     throw new TimeoutError("ContractInvocation timed out");
//   }

  /**
   * Reloads the ContractInvocation model with the latest data from the server.
   *
   * @throws {APIError} if the API request to get a ContractInvocation fails.
   */
//   public async reload(): Promise<void> {
//     const result = await Coinbase.apiClients.contractInvocation!.getContractInvocation(
//       this.getWalletId(),
//       this.getFromAddressId(),
//       this.getId(),
//     );
//     this.model = result?.data;
//   }

//   /**
//    * Returns a string representation of the ContractInvocation.
//    *
//    * @returns The string representation of the ContractInvocation.
//    */
//   public toString(): string {
//     return (
//       `ContractInvocation{contractInvocationId: '${this.getId()}', networkId: '${this.getNetworkId()}', ` +
//       `fromAddressId: '${this.getFromAddressId()}', contractAddressId: '${this.getContractAddressId()}', ` +
//       `method: '${this.getMethod()}', args: '${this.getArgs()}', transactionHash: '${this.getTransactionHash()}', ` +
//       `transactionLink: '${this.getTransactionLink()}', status: '${this.getStatus()}'}`
//     );
//   }
}
