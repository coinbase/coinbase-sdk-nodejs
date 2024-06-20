/**
 * A representation of a blockchain address, which is a user-controlled account on a network.
 */
export class Address {
  protected networkId: string;
  protected id: string;

  /**
   * Initializes a new Address instance.
   *
   * @param networkId - The network id.
   * @param id - The onchain address id.
   */
  constructor(networkId: string, id: string) {
    this.networkId = networkId;
    this.id = id;
  }

  /**
   * Returns the network ID.
   *
   * @returns {string} The network ID.
   */
  public getNetworkId(): string {
    return this.networkId;
  }

  /**
   * Returns the address ID.
   *
   * @returns {string} The address ID.
   */
  public getId(): string {
    return this.id;
  }

  /**
   * Returns a string representation of the address.
   *
   * @returns {string} A string representing the address.
   */
  public toString(): string {
    return `Address { addressId: '${this.getId()}', networkId: '${this.getNetworkId()}' }`;
  }
}
