import { Coinbase } from "./coinbase";
import { Validator as ValidatorModel, ValidatorStatus as APIValidatorStatus } from "../client/api";
import { ValidatorStatus } from "./types";
import { InternalError } from "./errors";

/**
 * A representation of a validator onchain.
 */
export class Validator {
  private model: ValidatorModel;

  /**
   * Creates a Validator object.
   *
   * @class
   * @param model - The underlying Validator object.
   * @throws {InternalError} - If the Validator model is empty.
   */
  constructor(model: ValidatorModel) {
    if (!model) {
      throw new InternalError("Invalid model type");
    }

    this.model = model;
  }

  /**
   * Returns the list of Validators.
   *
   * @param networkId - The network ID.
   * @param assetId - The asset ID.
   * @param status - The status to filter by.
   * @returns The list of Validators.
   */
  public static async list(
    networkId: string,
    assetId: string,
    status?: ValidatorStatus,
  ): Promise<Validator[]> {
    const validators: Validator[] = [];
    const response = await Coinbase.apiClients.validator!.listValidators(
      networkId,
      assetId,
      status,
    );

    response.data.data.forEach(validator => {
      validators.push(new Validator(validator));
    });

    return validators;
  }

  /**
   *
   * Returns the details of a specific validator.
   *
   * @param networkId - The network ID.
   * @param assetId - The asset ID.
   * @param id - The unique publicly identifiable id of the validator for which to fetch the data.
   * @returns The requested validator details.
   */
  public static async fetch(networkId: string, assetId: string, id: string): Promise<Validator> {
    const response = await Coinbase.apiClients.validator!.getValidator(networkId, assetId, id);

    return new Validator(response.data);
  }

  /**
   * Returns the Validator ID.
   *
   * @returns The Validator ID.
   */
  public getValidatorId(): string {
    return this.model.validator_id;
  }

  /**
   * Returns the Validator status.
   *
   * @returns The Validator status.
   */
  public getStatus(): string {
    switch (this.model.status) {
      case ValidatorStatus.Unknown:
        return APIValidatorStatus.Unknown;
      case ValidatorStatus.Provisioning:
        return APIValidatorStatus.Provisioning;
      case ValidatorStatus.Provisioned:
        return APIValidatorStatus.Provisioned;
      case ValidatorStatus.Deposited:
        return APIValidatorStatus.Deposited;
      case ValidatorStatus.PendingActivation:
        return APIValidatorStatus.PendingActivation;
      case ValidatorStatus.Active:
        return APIValidatorStatus.Active;
      case ValidatorStatus.Exiting:
        return APIValidatorStatus.Exiting;
      case ValidatorStatus.Exited:
        return APIValidatorStatus.Exited;
      case ValidatorStatus.WithdrawalAvailable:
        return APIValidatorStatus.WithdrawalAvailable;
      case ValidatorStatus.WithdrawalComplete:
        return APIValidatorStatus.WithdrawalComplete;
      case ValidatorStatus.ActiveSlashed:
        return APIValidatorStatus.ActiveSlashed;
      case ValidatorStatus.ExitedSlashed:
        return APIValidatorStatus.ExitedSlashed;
      case ValidatorStatus.Reaped:
        return APIValidatorStatus.Reaped;
      default:
        return APIValidatorStatus.Unknown;
    }
  }

  /**
   * Returns the string representation of the Validator.
   *
   * @returns The string representation of the Validator.
   */
  public toString(): string {
    return `Id: ${this.getValidatorId()} Status: ${this.getStatus()}`;
  }
}
