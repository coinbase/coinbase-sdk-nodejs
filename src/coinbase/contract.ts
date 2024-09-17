import {
  SmartContract as SmartContractModel,
  SmartContractOptions,
  SmartContractType,
} from "../client/api";
import { Transaction } from "./transaction";
import { ContractOptions, ContractType, NFTContractOptions, TokenContractOptions } from "./types";

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
}
