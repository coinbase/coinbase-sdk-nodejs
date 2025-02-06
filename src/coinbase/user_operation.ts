import { Coinbase } from "./coinbase";
import { UserOperation as UserOperationModel, UserOperationStatusEnum } from "../client/api";
import { delay } from "./utils";
import { TimeoutError } from "./errors";

/**
 * A representation of a UserOperation, which calls a smart contract method
 * onchain.
 */
export class UserOperation {
  private model: UserOperationModel;

  /**
   * Private constructor to prevent direct instantiation outside of the factory methods.
   *
   * @ignore
   * @param userOperationModel - The UserOperation model.
   * @hideconstructor
   */
  public constructor(userOperationModel: UserOperationModel) {
    this.model = userOperationModel;
  }

  /**
   * Returns the ID of the UserOperation.
   *
   * @returns The UserOperation ID.
   */
  public getId(): string {
    return this.model.id!; // TODO remove the !
  }

  /**
   * Returns the Network ID of the UserOperation.
   *
   * @returns The Network ID.
   */
  public getNetworkId(): string {
    return this.model.network;
  }


  /** 
   * TODO
   * 
   * Returns the Transaction Hash of the ContractInvocation.
   *
   * @returns The Transaction Hash as a Hex string, or undefined if not yet available.
   */
  // public getTransactionHash(): string | undefined {
  //   return this.getTransaction().getTransactionHash();
  // }

  /**
   * Returns the Status of the ContractInvocation.
   *
   * @returns The Status of the ContractInvocation.
   */
  public getStatus(): UserOperationStatusEnum | undefined {
    return this.model.status;
  }

  /**
   * TODO
   * 
   * Returns the link to the Transaction on the blockchain explorer.
   *
   * @returns The link to the Transaction on the blockchain explorer.
   */
  // public getTransactionLink(): string {
  //   return this.getTransaction().getTransactionLink();
  // }

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
  } = {}): Promise<UserOperation> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutSeconds * 1000) {
      await this.reload();

      // If the UserOperation is in a terminal state, return the UserOperation.
      const status = this.getStatus();
      if (status === UserOperationStatusEnum.Complete || status === UserOperationStatusEnum.Failed) {
        return this;
      }

      await delay(intervalSeconds);
    }

    throw new TimeoutError("UserOperation timed out");
  }

  /**
   * Reloads the ContractInvocation model with the latest data from the server.
   *
   * @throws {APIError} if the API request to get a ContractInvocation fails.
   */
  public async reload(): Promise<void> {
    const result = await Coinbase.apiClients.smartWallet!.getUserOperation(
      this.model.id!,
    );
    this.model = result?.data;
  }
}
