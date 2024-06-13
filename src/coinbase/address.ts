/**
 * A representation of a blockchain address, which is a user-controlled account on a network.
 */
export class Address {
  protected _networkId: string;
  protected _id: string;

  /**
   * Initializes a new Address instance.
   *
   * @param networkId - The network id.
   * @param id - The onchain address id.
   */
  constructor(networkId: string, id: string) {
    this._networkId = networkId;
    this._id = id;
  }

  /**
   * Returns the network ID.
   *
   * @returns {string} The network ID.
   */
  public getNetworkId(): string {
    return this._networkId;
  }

  /**
   * Returns the address ID.
   *
   * @returns {string} The address ID.
   */
  public getId(): string {
    return this._id;
  }

  /**
   * Returns a string representation of the address.
   *
   * @returns {string} A string representing the address.
   */
  public toString(): string {
    return `Coinbase:Address{addressId: '${this.getId()}', networkId: '${this.getNetworkId()}'}`;
  }
}
