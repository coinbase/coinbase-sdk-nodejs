import { ethers } from "ethers";
import {
  DeploySmartContractRequest,
  SmartContract as SmartContractModel,
  SmartContractOptions,
  SmartContractType,
} from "../client/api";
import { Transaction } from "./transaction";
import {
  ContractOptions,
  ContractType,
  NFTContractOptions,
  TokenContractOptions,
  TransactionStatus,
} from "./types";
import { Coinbase } from "./coinbase";
import { delay } from "./utils";
import { TimeoutError } from "./errors";

/**
 * A representation of a Contract on the blockchain.
 */
export class Contract {
  private model: SmartContractModel;

  /**
   * Creates a new Contract instance.
   *
   * @param contractModel - The Contract model from the API.
   */
  constructor(contractModel: SmartContractModel) {
    if (!contractModel) {
      throw new Error("Contract model cannot be empty");
    }
    this.model = contractModel;
  }

  /**
   * Converts a SmartContractModel into a Contract object.
   *
   * @param contractModel - The SmartContract model object.
   * @returns The ContractInvocation object.
   */
  public static fromModel(contractModel: SmartContractModel): Contract {
    return new Contract(contractModel);
  }

  /**
   * Returns the ID of the Contract.
   *
   * @returns The Contract ID.
   */
  public getId(): string {
    return this.model.smart_contract_id;
  }

  /**
   * Returns the Network ID of the Contract.
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
  public getType(): ContractType {
    switch (this.model.type) {
      case SmartContractType.Erc20:
        return ContractType.ERC20;
      case SmartContractType.Erc721:
        return ContractType.ERC721;
      default:
        throw new Error(`Unknown smart contract type: ${this.model.type}`);
    }
  }

  /**
   * Returns the Options of the smart contract.
   *
   * @returns The Smart Contract Options.
   */
  public getOptions(): ContractOptions {
    if (this.getType() === ContractType.ERC20) {
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
   * Signs the Contract deployment with the provided key and returns the hex signature
   * required for broadcasting the Contract deployment.
   *
   * @param key - The key to sign the Contract deployment with
   * @returns The hex-encoded signed payload
   */
  async sign(key: ethers.Wallet): Promise<string> {
    return this.getTransaction().sign(key);
  }

  /**
   * Broadcasts the Contract deployment to the Network.
   *
   * @returns The Contract object
   * @throws {APIError} if the API request to broadcast a Contract deployment fails.
   */
  public async broadcast(): Promise<Contract> {
    if (!this.getTransaction()?.isSigned())
      throw new Error("Cannot broadcast unsigned Contract deployment");

    const deploySmartContractRequest: DeploySmartContractRequest = {
      signed_payload: this.getTransaction()!.getSignature()!,
    };

    const response = await Coinbase.apiClients.smartContract!.deploySmartContract(
      this.getWalletId(),
      this.getDeployerAddress(),
      this.getId(),
      deploySmartContractRequest,
    );

    return Contract.fromModel(response.data);
  }

  /**
   * Waits for the Contract deployment to be confirmed on the Network or fail on chain.
   * Waits until the Contract deployment is completed or failed on-chain by polling at the given interval.
   * Raises an error if the Contract deployment takes longer than the given timeout.
   *
   * @param options - The options to configure the wait function.
   * @param options.intervalSeconds - The interval to check the status of the Contract deployment.
   * @param options.timeoutSeconds - The maximum time to wait for the Contract deployment to be confirmed.
   *
   * @returns The Contract object in a terminal state.
   * @throws {Error} if the Contract deployment times out.
   */
  public async wait({ intervalSeconds = 0.2, timeoutSeconds = 10 } = {}): Promise<Contract> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutSeconds * 1000) {
      await this.reload();

      // If the Contract deployment is in a terminal state, return the Contract.
      const status = this.getTransaction().getStatus();
      if (status === TransactionStatus.COMPLETE || status === TransactionStatus.FAILED) {
        return this;
      }

      await delay(intervalSeconds);
    }

    throw new TimeoutError("Contract deployment timed out");
  }

  /**
   * Reloads the Contract model with the latest data from the server.
   *
   * @throws {APIError} if the API request to get a Contract fails.
   */
  public async reload(): Promise<void> {
    const result = await Coinbase.apiClients.smartContract!.getSmartContract(
      this.getWalletId(),
      this.getDeployerAddress(),
      this.getId(),
    );
    this.model = result?.data;
  }
}
