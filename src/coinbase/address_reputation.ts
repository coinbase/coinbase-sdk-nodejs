import { AddressReputation as AddressReputationModel, AddressReputationMetadata } from "../client";

/**
 * A representation of the reputation of a blockchain address.
 */
export class AddressReputation {
  private model: AddressReputationModel;
  /**
   * A representation of the reputation of a blockchain address.
   *
   * @param {AddressReputationModel} model - The reputation model instance.
   */
  constructor(model: AddressReputationModel) {
    if (!model) {
      throw new Error("Address reputation model cannot be empty");
    }
    this.model = model;
  }

  /**
   * Returns the address ID.
   *
   * @returns {string} The address ID.
   */
  public get risky(): boolean {
    return this.model.score < 0;
  }

  /**
   * Returns the score of the address.
   * The score is a number between -100 and 100.
   *
   * @returns {number} The score of the address.
   */
  public get score(): number {
    return this.model.score;
  }

  /**
   * Returns the metadata of the address reputation.
   * The metadata contains additional information about the address reputation.
   *
   * @returns {AddressReputationMetadata} The metadata of the address reputation.
   */
  public get metadata(): AddressReputationMetadata {
    return this.model.metadata;
  }

  /**
   * Returns the address ID.
   *
   * @returns {string} The address ID.
   */
  toString(): string {
    const metadata = Object.entries(this.model.metadata).map(([key, value]) => {
      return `${key}: ${value}`;
    });
    return `AddressReputation(score: ${this.score}, metadata: {${metadata.join(", ")}})`;
  }
}
