import { ContractEvent as ContractEventModel } from "../client";

export interface IContractEvent {
  networkId(): string;
  protocolName(): string;
  contractName(): string;
  eventName(): string;
  sig(): string;
  fourBytes(): string;
  contractAddress(): string;
  blockTime(): Date;
  blockHeight(): number;
  txHash(): string;
  txIndex(): number;
  eventIndex(): number;
  data(): string;
}

/**
 * A representation of a single contract event.
 */
export class ContractEvent implements IContractEvent {
  private model: ContractEventModel;

  /**
   * Creates the ContractEvent object.
   *
   * @param model - The underlying contract event object.
   */
  constructor(model: ContractEventModel) {
    this.model = model;
  }

  /**
   * Returns the network ID of the ContractEvent.
   *
   * @returns The network ID.
   */
  public networkId(): string {
    return this.model.network_id;
  }

  /**
   * Returns the protocol name of the ContractEvent.
   *
   * @returns The protocol name.
   */
  public protocolName(): string {
    return this.model.protocol_name;
  }

  /**
   * Returns the contract name of the ContractEvent.
   *
   * @returns The contract name.
   */
  public contractName(): string {
    return this.model.contract_name;
  }

  /**
   * Returns the event name of the ContractEvent.
   *
   * @returns The event name.
   */
  public eventName(): string {
    return this.model.event_name;
  }

  /**
   * Returns the signature of the ContractEvent.
   *
   * @returns The event signature.
   */
  public sig(): string {
    return this.model.sig;
  }

  /**
   * Returns the four bytes of the Keccak hash of the event signature.
   *
   * @returns The four bytes of the event signature hash.
   */
  public fourBytes(): string {
    return this.model.four_bytes;
  }

  /**
   * Returns the contract address of the ContractEvent.
   *
   * @returns The contract address.
   */
  public contractAddress(): string {
    return this.model.contract_address;
  }

  /**
   * Returns the block time of the ContractEvent.
   *
   * @returns The block time.
   */
  public blockTime(): Date {
    return new Date(this.model.block_time);
  }

  /**
   * Returns the block height of the ContractEvent.
   *
   * @returns The block height.
   */
  public blockHeight(): number {
    return this.model.block_height;
  }

  /**
   * Returns the transaction hash of the ContractEvent.
   *
   * @returns The transaction hash.
   */
  public txHash(): string {
    return this.model.tx_hash;
  }

  /**
   * Returns the transaction index of the ContractEvent.
   *
   * @returns The transaction index.
   */
  public txIndex(): number {
    return this.model.tx_index;
  }

  /**
   * Returns the event index of the ContractEvent.
   *
   * @returns The event index.
   */
  public eventIndex(): number {
    return this.model.event_index;
  }

  /**
   * Returns the event data of the ContractEvent.
   *
   * @returns The event data.
   */
  public data(): string {
    return this.model.data;
  }

  /**
   * Print the ContractEvent as a string.
   *
   * @returns The string representation of the ContractEvent.
   */
  public toString(): string {
    return `ContractEvent { networkId: '${this.networkId()}' protocolName: '${this.protocolName()}' contractName: '${this.contractName()}' eventName: '${this.eventName()}' contractAddress: '${this.contractAddress()}' blockHeight: ${this.blockHeight()} txHash: '${this.txHash()}' }`;
  }
}
