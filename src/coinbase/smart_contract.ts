import { ethers } from "ethers";
import {
  DeploySmartContractRequest,
  SmartContract as SmartContractModel,
  SmartContractType as SmartContractTypeModel,
  SmartContractOptions as SmartContractOptionsModel,
  TokenContractOptions as TokenContractOptionsModel,
  NFTContractOptions as NFTContractOptionsModel,
  MultiTokenContractOptions as MultiTokenContractOptionsModel,
} from "../client/api";
import { Transaction } from "./transaction";
import {
  SmartContractOptions,
  SmartContractType,
  NFTContractOptions,
  TokenContractOptions,
  MultiTokenContractOptions,
  RegisterContractOptions,
  TransactionStatus,
  PaginationOptions,
  PaginationResponse,
  UpdateContractOptions,
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
   * Returns whether the SmartContract is external.
   *
   * @returns True if the SmartContract is external, false otherwise.
   */
  public get isExternal(): boolean {
    return this.model.is_external;
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
   * Register a smart contract.
   *
   * @param options - The options to register a smart contract.
   * @param options.networkId - The network ID.
   * @param options.contractAddress - The contract address.
   * @param options.abi - The ABI of the contract.
   * @param options.contractName - The contract name.
   * @returns The smart contract.
   */
  public static async register({
    networkId,
    contractAddress,
    abi,
    contractName,
  }: RegisterContractOptions): Promise<SmartContract> {
    const response = await Coinbase.apiClients.smartContract!.registerSmartContract(
      networkId,
      contractAddress,
      {
        abi: JSON.stringify(abi),
        contract_name: contractName,
      },
    );
    return SmartContract.fromModel(response.data);
  }

  /**
   * Lists Smart Contracts.
   *
   * @param options - The pagination options.
   * @param options.page - The cursor for pagination across multiple pages of Smart Contract. Don\&#39;t include this parameter on the first call. Use the next page value returned in a previous response to request subsequent results.
   *
   * @returns The paginated list response of Smart Contracts.
   */
  public static async list({ page = undefined }: PaginationOptions = {}): Promise<
    PaginationResponse<SmartContract>
  > {
    const data: SmartContract[] = [];
    let nextPage: string | undefined;

    const response = await Coinbase.apiClients.smartContract!.listSmartContracts(page);
    const smartContracts = response.data.data;
    for (const sc of smartContracts) {
      data.push(new SmartContract(sc));
    }

    const hasMore: boolean = response.data.has_more ? response.data.has_more : false;

    if (hasMore) {
      if (response.data.next_page) {
        nextPage = response.data.next_page;
      }
    }

    return {
      data,
      hasMore,
      nextPage,
    };
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
  public getWalletId(): string | undefined {
    if (!this.model.wallet_id) return undefined;

    return this.model.wallet_id!;
  }

  /**
   * Returns the name of the smart contract.
   *
   * @returns The contract name.
   */
  public getContractName(): string {
    return this.model.contract_name;
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
  public getDeployerAddress(): string | undefined {
    if (!this.model.deployer_address) return undefined;

    return this.model.deployer_address!;
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
      case SmartContractTypeModel.Erc1155:
        return SmartContractType.ERC1155;
      case SmartContractTypeModel.Custom:
        return SmartContractType.CUSTOM;
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
    if (this.isExternal)
      throw new Error("SmartContract options cannot be returned for external SmartContract");

    const options = this.model.options!;

    if (this.isERC20(this.getType(), options)) {
      return {
        name: options.name,
        symbol: options.symbol,
        totalSupply: options.total_supply,
      } as TokenContractOptions;
    } else if (this.isERC721(this.getType(), options)) {
      return {
        name: options.name,
        symbol: options.symbol,
        baseURI: options.base_uri,
      } as NFTContractOptions;
    } else if (this.isERC1155(this.getType(), options)) {
      return {
        uri: options.uri,
      } as MultiTokenContractOptions;
    } else {
      return options as string;
    }
  }

  /**
   * Returns the ABI of the smart contract.
   *
   * @returns The ABI as a JSON-encoded string.
   */
  public getAbi(): object {
    return JSON.parse(this.model.abi);
  }

  /**
   * Returns the Transaction of the smart contract deployment.
   *
   * @returns The Transaction.
   */
  public getTransaction(): Transaction | undefined {
    if (this.isExternal) return undefined;

    return new Transaction(this.model.transaction!);
  }

  /**
   * Signs the SmartContract deployment with the provided key and returns the hex signature
   * required for broadcasting the SmartContract deployment.
   *
   * @param key - The key to sign the SmartContract deployment with
   * @returns The hex-encoded signed payload
   */
  async sign(key: ethers.Wallet): Promise<string> {
    if (this.isExternal) throw new Error("Cannot sign an external SmartContract");

    return this.getTransaction()!.sign(key);
  }

  /**
   * Update a smart contract.
   *
   * @param options - The options to update a smart contract.
   * @param options.abi - The new ABI of the contract.
   * @param options.contractName - The new contract name.
   * @returns The smart contract.
   */
  public async update({ abi, contractName }: UpdateContractOptions): Promise<SmartContract> {
    const response = await Coinbase.apiClients.smartContract!.updateSmartContract(
      this.getNetworkId(),
      this.getContractAddress(),
      {
        abi: JSON.stringify(abi),
        contract_name: contractName,
      },
    );
    return SmartContract.fromModel(response.data);
  }

  /**
   * Broadcasts the SmartContract deployment to the Network.
   *
   * @returns The SmartContract object
   * @throws {APIError} if the API request to broadcast a SmartContract deployment fails.
   */
  public async broadcast(): Promise<SmartContract> {
    if (this.isExternal) throw new Error("Cannot broadcast an external SmartContract");

    if (!this.getTransaction()!.isSigned())
      throw new Error("Cannot broadcast unsigned SmartContract deployment");

    const deploySmartContractRequest: DeploySmartContractRequest = {
      signed_payload: this.getTransaction()!.getSignature()!,
    };

    const response = await Coinbase.apiClients.smartContract!.deploySmartContract(
      this.getWalletId()!,
      this.getDeployerAddress()!,
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
    if (this.isExternal) throw new Error("Cannot wait for an external SmartContract");

    const startTime = Date.now();

    while (Date.now() - startTime < timeoutSeconds * 1000) {
      await this.reload();

      // If the SmartContract deployment is in a terminal state, return the SmartContract.
      const status = this.getTransaction()!.getStatus();
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
    if (this.isExternal) throw new Error("Cannot reload an external SmartContract");

    const result = await Coinbase.apiClients.smartContract!.getSmartContract(
      this.getWalletId()!,
      this.getDeployerAddress()!,
      this.getId(),
    );
    this.model = result?.data;
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

  /**
   * Type guard for checking if the smart contract is an ERC20.
   *
   * @param type - The type of the smart contract.
   * @param options - The options of the smart contract.
   * @returns True if the smart contract is an ERC20, false otherwise.
   */
  private isERC20(
    type: SmartContractType,
    options: SmartContractOptionsModel,
  ): options is TokenContractOptionsModel {
    return type === SmartContractType.ERC20;
  }

  /**
   * Type guard for checking if the smart contract is an ERC721.
   *
   * @param type - The type of the smart contract.
   * @param options - The options of the smart contract.
   * @returns True if the smart contract is an ERC721, false otherwise.
   */
  private isERC721(
    type: SmartContractType,
    options: SmartContractOptionsModel,
  ): options is NFTContractOptionsModel {
    return type === SmartContractType.ERC721;
  }

  /**
   * Type guard for checking if the smart contract is an ERC1155.
   *
   * @param type - The type of the smart contract.
   * @param options - The options of the smart contract.
   * @returns True if the smart contract is an ERC1155, false otherwise.
   */
  private isERC1155(
    type: SmartContractType,
    options: SmartContractOptionsModel,
  ): options is MultiTokenContractOptionsModel {
    return type === SmartContractType.ERC1155;
  }
}
