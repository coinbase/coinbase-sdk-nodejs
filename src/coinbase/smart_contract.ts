import { ethers } from "ethers";
import {
  DeploySmartContractRequest,
  SmartContract as SmartContractModel,
  SmartContractType as SmartContractTypeModel,
} from "../client/api";
import { Transaction } from "./transaction";
import {
  SmartContractOptions,
  SmartContractType,
  NFTContractOptions,
  TokenContractOptions,
  TransactionStatus,
} from "./types";
import { Coinbase } from "./coinbase";
import { delay } from "./utils";
import { TimeoutError } from "./errors";
import { ContractEvent } from "./contract_event";

/**
 * A representation of a SmartContract on the blockchain.
 */
export class SmartContract {
  private model: SmartContractModel;

  /**
   * Creates a new SmartContract instance.
   *
   * @param contractModel - The SmartContract model from the API.
   */
  constructor(contractModel: SmartContractModel) {
    if (!contractModel) {
      throw new Error("SmartContract model cannot be empty");
    }
    this.model = contractModel;
  }

  /**
   * Converts a SmartContractModel into a SmartContract object.
   *
   * @param contractModel - The SmartContract model object.
   * @returns The SmartContract object.
   */
  public static fromModel(contractModel: SmartContractModel): SmartContract {
    return new SmartContract(contractModel);
  }

  /**
   * Returns the ID of the SmartContract.
   *
   * @returns The SmartContract ID.
   */
  public getId(): string {
    return this.model.smart_contract_id;
  }

  /**
   * Returns the Network ID of the SmartContract.
   *
   * @returns The Network ID.
   */
  public getNetworkId(): string {
    return this.model.network_id;
  }

  /**
   * Returns the Wallet ID that deployed the smart contract.
   *
   * @returns The Wallet ID.
   */
  public getWalletId(): string {
    return this.model.wallet_id;
  }

  /**
   * Returns the Contract Address of the smart contract.
   *
   * @returns The Contract Address.
   */
  public getContractAddress(): string {
    return this.model.contract_address;
  }

  /**
   * Returns the Deployer Address of the smart contract.
   *
   * @returns The Deployer Address.
   */
  public getDeployerAddress(): string {
    return this.model.deployer_address;
  }

  /**
   * Returns the Type of the smart contract.
   *
   * @returns The Smart Contract Type.
   */
  public getType(): SmartContractType {
    switch (this.model.type) {
      case SmartContractTypeModel.Erc20:
        return SmartContractType.ERC20;
      case SmartContractTypeModel.Erc721:
        return SmartContractType.ERC721;
      default:
        throw new Error(`Unknown smart contract type: ${this.model.type}`);
    }
  }

  /**
   * Returns the Options of the smart contract.
   *
   * @returns The Smart Contract Options.
   */
  public getOptions(): SmartContractOptions {
    if (this.getType() === SmartContractType.ERC20) {
      return this.model.options as TokenContractOptions;
    }
    return this.model.options as NFTContractOptions;
  }

  /**
   * Returns the ABI of the smart contract.
   *
   * @returns The ABI as a JSON-encoded string.
   */
  public getAbi(): string {
    return this.model.abi;
  }

  /**
   * Returns the Transaction of the smart contract deployment.
   *
   * @returns The Transaction.
   */
  public getTransaction(): Transaction {
    return new Transaction(this.model.transaction);
  }

  /**
   * Signs the SmartContract deployment with the provided key and returns the hex signature
   * required for broadcasting the SmartContract deployment.
   *
   * @param key - The key to sign the SmartContract deployment with
   * @returns The hex-encoded signed payload
   */
  async sign(key: ethers.Wallet): Promise<string> {
    return this.getTransaction().sign(key);
  }

  /**
   * Broadcasts the SmartContract deployment to the Network.
   *
   * @returns The SmartContract object
   * @throws {APIError} if the API request to broadcast a SmartContract deployment fails.
   */
  public async broadcast(): Promise<SmartContract> {
    if (!this.getTransaction()?.isSigned())
      throw new Error("Cannot broadcast unsigned SmartContract deployment");

    const deploySmartContractRequest: DeploySmartContractRequest = {
      signed_payload: this.getTransaction()!.getSignature()!,
    };

    const response = await Coinbase.apiClients.smartContract!.deploySmartContract(
      this.getWalletId(),
      this.getDeployerAddress(),
      this.getId(),
      deploySmartContractRequest,
    );

    return SmartContract.fromModel(response.data);
  }

  /**
   * Waits for the SmartContract deployment to be confirmed on the Network or fail on chain.
   * Waits until the SmartContract deployment is completed or failed on-chain by polling at the given interval.
   * Raises an error if the SmartContract deployment takes longer than the given timeout.
   *
   * @param options - The options to configure the wait function.
   * @param options.intervalSeconds - The interval to check the status of the SmartContract deployment.
   * @param options.timeoutSeconds - The maximum time to wait for the SmartContract deployment to be confirmed.
   *
   * @returns The SmartContract object in a terminal state.
   * @throws {Error} if the SmartContract deployment times out.
   */
  public async wait({ intervalSeconds = 0.2, timeoutSeconds = 10 } = {}): Promise<SmartContract> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutSeconds * 1000) {
      await this.reload();

      // If the SmartContract deployment is in a terminal state, return the SmartContract.
      const status = this.getTransaction().getStatus();
      if (status === TransactionStatus.COMPLETE || status === TransactionStatus.FAILED) {
        return this;
      }

      await delay(intervalSeconds);
    }

    throw new TimeoutError("SmartContract deployment timed out");
  }

  /**
   * Reloads the SmartContract model with the latest data from the server.
   *
   * @throws {APIError} if the API request to get a SmartContract fails.
   */
  public async reload(): Promise<void> {
    const result = await Coinbase.apiClients.smartContract!.getSmartContract(
      this.getWalletId(),
      this.getDeployerAddress(),
      this.getId(),
    );
    this.model = result?.data;
  }

  /**
   * Returns a list of ContractEvents for the provided network, contract, and event details.
   *
   * @param networkId - The network ID.
   * @param protocolName - The protocol name.
   * @param contractAddress - The contract address.
   * @param contractName - The contract name.
   * @param eventName - The event name.
   * @param fromBlockHeight - The start block height.
   * @param toBlockHeight - The end block height.
   * @returns The contract events.
   */
  public static async listEvents(
    networkId: string,
    protocolName: string,
    contractAddress: string,
    contractName: string,
    eventName: string,
    fromBlockHeight: number,
    toBlockHeight: number,
  ): Promise<ContractEvent[]> {
    const contractEvents: ContractEvent[] = [];
    const queue: string[] = [""];

    while (queue.length > 0) {
      const page = queue.shift();

      const response = await Coinbase.apiClients.contractEvent!.listContractEvents(
        networkId,
        protocolName,
        contractAddress,
        contractName,
        eventName,
        fromBlockHeight,
        toBlockHeight,
        page?.length ? page : undefined,
      );

      response.data.data.forEach(contractEvent => {
        contractEvents.push(new ContractEvent(contractEvent));
      });

      if (response.data.has_more) {
        if (response.data.next_page) {
          queue.push(response.data.next_page);
        }
      }
    }

    return contractEvents;
  }

  /**
   * Returns a string representation of the SmartContract.
   *
   * @returns The string representation of the SmartContract.
   */
  public toString(): string {
    return (
      `SmartContract{id: '${this.getId()}', networkId: '${this.getNetworkId()}', ` +
      `contractAddress: '${this.getContractAddress()}', deployerAddress: '${this.getDeployerAddress()}', ` +
      `type: '${this.getType()}'}`
    );
  }
}
