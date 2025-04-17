import { ethers } from "ethers";
import {
  StakingOperation as StakingOperationModel,
  StakingOperationStatusEnum,
} from "../client/api";
import { Transaction } from "./transaction";
import { Coinbase } from "./coinbase";
import { delay } from "./utils";
import { Amount, StakeOptionsMode } from "./types";
import { Asset } from "./asset";
import Decimal from "decimal.js";

export const UnstakeTypeExecution = "execution";
export const UnstakeTypeConsensus = "consensus";

/**
 * Checks if the given options contains the unstake type option.
 *
 * @param options - An object containing various options.
 * @returns True if the unstake type is consensus or execution, false otherwise.
 */
export function HasUnstakeTypeOption(options: { [key: string]: string }): boolean {
  return (
    options["unstake_type"] === UnstakeTypeConsensus ||
    options["unstake_type"] === UnstakeTypeExecution
  );
}

/**
 * Determines if the given parameters represent a native ETH unstake operation (version 2).
 *
 * @param assetId - The ID of the asset.
 * @param action - The action being performed.
 * @param mode - The mode of the stake options.
 * @param options - An object containing various options.
 * @returns True if the parameters represent a native ETH unstake operation (version 2), false otherwise.
 */
export function IsDedicatedEthUnstakeV2Operation(
  assetId: string,
  action: string,
  mode: string,
  options: { [key: string]: string },
): boolean {
  return (
    assetId === Coinbase.assets.Eth &&
    action == "unstake" &&
    mode === StakeOptionsMode.NATIVE &&
    HasUnstakeTypeOption(options)
  );
}

/**
 * A representation of a staking operation (stake, unstake, claim stake, etc.). It
 * may have multiple steps with some being transactions to sign, and others to wait.
 */
export class StakingOperation {
  private model: StakingOperationModel;
  private readonly transactions: Transaction[];

  /**
   * Creates a StakingOperation object.
   *
   * @class
   * @param model - The staking operation response from the API call.
   */
  constructor(model: StakingOperationModel) {
    if (!model) {
      throw new Error("Invalid model type");
    }

    this.model = model;
    this.transactions = [];
    this.loadTransactionsFromModel();
  }

  /**
   * Get the staking operation for the given ID.
   *
   * @param networkId - The network ID.
   * @param addressId - The address ID.
   * @param id - The staking operation ID.
   * @param walletId - The wallet ID of the staking operation.
   * @throws {Error} If the wallet id is defined but empty.
   *
   * @returns The staking operation object.
   */
  public static async fetch(
    networkId: string,
    addressId: string,
    id: string,
    walletId?: string,
  ): Promise<StakingOperation> {
    if (walletId === undefined) {
      const result = await Coinbase.apiClients.stake!.getExternalStakingOperation(
        networkId,
        addressId,
        id,
      );

      return new StakingOperation(result.data);
    } else if (walletId != undefined && walletId != "") {
      const result = await Coinbase.apiClients.walletStake!.getStakingOperation(
        walletId!,
        addressId,
        id,
      );

      return new StakingOperation(result.data);
    } else {
      throw new Error("Invalid wallet ID");
    }
  }

  /**
   * Returns the Staking Operation ID.
   *
   * @returns The Staking Operation ID.
   */
  public getID(): string {
    return this.model.id;
  }

  /**
   * Get the status of the staking operation.
   *
   * @returns The status of the staking operation.
   */
  public getStatus(): StakingOperationStatusEnum {
    return this.model.status;
  }

  /**
   * Returns the Wallet ID if it exists.
   *
   * @returns The Wallet ID.
   */
  public getWalletID(): string | undefined {
    return this.model.wallet_id;
  }

  /**
   * Returns the Address ID.
   *
   * @returns The Address ID.
   */
  public getAddressID(): string {
    return this.model.address_id;
  }

  /**
   * Returns the Network ID.
   *
   * @returns The Network ID.
   */
  public getNetworkID(): string {
    return this.model.network_id;
  }

  /**
   * Return a human-readable string representation of the StakingOperation object.
   *
   * @returns The string representation of the StakingOperation object.
   */
  public toString(): string {
    return `StakingOperation { id: ${this.getID()} status: ${this.getStatus()} network_id: ${this.getNetworkID()} address_id: ${this.getAddressID()} }`;
  }

  /**
   * Returns whether the Staking operation is in a terminal State.
   *
   * @returns Whether the Staking operation is in a terminal State
   */
  isTerminalState(): boolean {
    return this.isCompleteState() || this.isFailedState();
  }

  /**
   * Returns whether the Staking operation is in a failed state.
   *
   * @returns Whether the Staking operation is in a failed state.
   */
  isFailedState(): boolean {
    return this.getStatus() === StakingOperationStatusEnum.Failed;
  }

  /**
   * Returns whether the Staking operation is in a complete state.
   *
   * @returns Whether the Staking operation is in a complete state.
   */
  isCompleteState(): boolean {
    return this.getStatus() === StakingOperationStatusEnum.Complete;
  }

  /**
   * Get the transactions associated with this staking operation.
   *
   * @returns The array of transactions.
   */
  public getTransactions(): Transaction[] {
    return this.transactions;
  }

  /**
   * Get signed voluntary exit messages for native eth unstaking
   *
   * @returns The signed voluntary exit messages for a native eth unstaking operation.
   */
  public getSignedVoluntaryExitMessages(): string[] {
    const signedVoluntaryExitMessages: string[] = [];

    if (this.model.metadata) {
      this.model.metadata.forEach(metadata => {
        const decodedSignedVoluntaryExitMessage = atob(metadata.signed_voluntary_exit);

        signedVoluntaryExitMessages.push(decodedSignedVoluntaryExitMessage);
      });
    }

    return signedVoluntaryExitMessages;
  }

  /**
   * Reloads the StakingOperation model with the latest data from the server.
   * If the StakingOperation object was created by an ExternalAddress then it will
   * not have a wallet ID.
   *
   * @throws {APIError} if the API request to get the StakingOperation fails.
   * @throws {Error} if this function is called on a StakingOperation without a wallet ID.
   */
  public async reload(): Promise<void> {
    if (this.getWalletID() === undefined) {
      const result = await Coinbase.apiClients.stake!.getExternalStakingOperation(
        this.getNetworkID(),
        this.getAddressID(),
        this.getID(),
      );

      this.model = result.data;
    } else if (this.getWalletID() != undefined && this.getWalletID() != "") {
      const result = await Coinbase.apiClients.walletStake!.getStakingOperation(
        this.getWalletID()!,
        this.getAddressID(),
        this.getID(),
      );

      this.model = result.data;
    }

    this.loadTransactionsFromModel();
  }

  /**
   * Waits until the Staking Operation is completed or failed by polling its status at the given interval.
   *
   * @param options - The options to configure the wait function.
   * @param options.intervalSeconds - The interval at which to poll, in seconds
   * @param options.timeoutSeconds - The maximum amount of time to wait for the StakingOperation to complete, in seconds
   * @throws {Error} If the StakingOperation takes longer than the given timeout.
   * @returns The completed StakingOperation object.
   */
  public async wait({
    intervalSeconds = 5,
    timeoutSeconds = 3600,
  } = {}): Promise<StakingOperationModel> {
    if (this.getWalletID() != undefined) {
      throw new Error("cannot wait on staking operation for wallet address.");
    }

    const startTime = Date.now();
    while (Date.now() - startTime < timeoutSeconds * 1000) {
      await this.reload();
      if (this.isTerminalState()) {
        return this.model;
      }

      if (Date.now() - startTime > timeoutSeconds * 1000) {
        throw new Error("Staking operation timed out");
      }

      await delay(intervalSeconds);
    }

    throw new Error("Staking operation timed out");
  }

  /**
   * Sign the transactions in the StakingOperation object.
   *
   * @param key - The key used to sign the transactions.
   */
  public async sign(key: ethers.Wallet): Promise<void> {
    for (const tx of this.transactions) {
      if (!tx.isSigned()) {
        await tx.sign(key);
      }
    }
  }

  /**
   * loadTransactionsFromModel loads new unsigned transactions from the model into the transactions array.
   * Note: For External Address model since tx signing and broadcast status happens by the end user and not our backend
   * we need to be careful to not overwrite the transactions array with the response from the API. Ex: End user could have used
   * stakingOperation.sign() method to sign the transactions, and we should not overwrite them with the response from the API.
   * This however is ok to do so for the Wallet Address model since the transactions states are maintained by our backend.
   * This method attempts to be safe for both address models, and only adds newly created unsigned transactions that are not
   *  already in the transactions array.
   */
  private loadTransactionsFromModel() {
    // Only overwrite the transactions if the response is populated.
    if (this.model.transactions && this.model.transactions.length > 0) {
      // Create a set of existing unsigned payloads to avoid duplicates.
      const existingUnsignedPayloads = new Set(
        this.transactions.map(tx => tx.getUnsignedPayload()),
      );

      // Add transactions that are not already in the transactions array.
      this.model.transactions.forEach(transaction => {
        if (!existingUnsignedPayloads.has(transaction.unsigned_payload)) {
          this.transactions.push(new Transaction(transaction));
        }
      });
    }
  }
}

/**
 * A builder class for creating execution layer withdrawal options.
 */
export class ExecutionLayerWithdrawalOptionsBuilder {
  private readonly networkId: string;
  private validatorAmounts: { [key: string]: Amount } = {};

  /**
   * Creates an instance of ExecutionLayerWithdrawalOptionsBuilder.
   *
   * @param networkId - The network ID.
   */
  constructor(networkId: string) {
    this.networkId = networkId;
  }

  /**
   * Adds a validator withdrawal with the specified public key and amount.
   *
   * @param pubKey - The public key of the validator.
   * @param amount - The amount to withdraw.
   */
  addValidatorWithdrawal(pubKey: string, amount: Amount) {
    this.validatorAmounts[pubKey] = amount;
  }

  /**
   * Builds the execution layer withdrawal options.
   *
   * @param options - Existing options to merge with the built options.
   * @returns A promise that resolves to an object containing the execution layer withdrawal options merged with any provided options.
   */
  async build(options: { [key: string]: string } = {}): Promise<{ [key: string]: string }> {
    const asset = await Asset.fetch(this.networkId, Coinbase.assets.Eth);

    const validatorAmounts: { [key: string]: string } = {};

    for (const pubKey in this.validatorAmounts) {
      const amount = this.validatorAmounts[pubKey];
      validatorAmounts[pubKey] = asset.toAtomicAmount(new Decimal(amount.toString())).toString();
    }

    const executionLayerWithdrawalOptions = {
      unstake_type: UnstakeTypeExecution,
      validator_unstake_amounts: JSON.stringify(validatorAmounts),
    };

    return Object.assign({}, options, executionLayerWithdrawalOptions);
  }
}

/**
 * A builder class for creating consensus layer exit options.
 */
export class ConsensusLayerExitOptionBuilder {
  private validatorPubKeys: string[] = [];

  /**
   * Adds a validator public key to the list of validators.
   *
   * @param pubKey - The public key of the validator.
   */
  addValidator(pubKey: string) {
    if (!this.validatorPubKeys.includes(pubKey)) {
      this.validatorPubKeys.push(pubKey);
    }
  }

  /**
   * Builds the consensus layer exit options.
   *
   * @param options - Existing options to merge with the built options.
   * @returns A promise that resolves to an object containing the consensus layer exit options merged with any provided options.
   */
  async build(options: { [key: string]: string } = {}): Promise<{ [key: string]: string }> {
    const consensusLayerExitOptions = {
      unstake_type: UnstakeTypeConsensus,
      validator_pub_keys: this.validatorPubKeys.join(","),
    };

    return Object.assign({}, options, consensusLayerExitOptions);
  }
}
