import { Coinbase } from "./coinbase";
import {
  Balance,
  Validator as ValidatorModel,
  ValidatorStatus as APIValidatorStatus,
} from "../client/api";
import { ValidatorStatus } from "./types";
import { BalanceMap } from "./balance_map";

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
   * @throws {Error} - If the Validator model is empty.
   */
  constructor(model: ValidatorModel) {
    if (!model) {
      throw new Error("Invalid model type");
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
    const response = await Coinbase.apiClients.stake!.listValidators(
      networkId,
      assetId,
      Validator.getAPIValidatorStatus(status),
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
    const response = await Coinbase.apiClients.stake!.getValidator(networkId, assetId, id);

    return new Validator(response.data);
  }
  /**
   * Returns the Validator status.
   *
   * @param status - The API Validator status.
   * @returns The Validator status.
   */
  private static getAPIValidatorStatus(status?: ValidatorStatus): APIValidatorStatus {
    /* istanbul ignore next */
    switch (status) {
      case ValidatorStatus.UNKNOWN:
        return APIValidatorStatus.Unknown;
      case ValidatorStatus.PROVISIONING:
        return APIValidatorStatus.Provisioning;
      case ValidatorStatus.PROVISIONED:
        return APIValidatorStatus.Provisioned;
      case ValidatorStatus.DEPOSITED:
        return APIValidatorStatus.Deposited;
      case ValidatorStatus.PENDING_ACTIVATION:
        return APIValidatorStatus.PendingActivation;
      case ValidatorStatus.ACTIVE:
        return APIValidatorStatus.Active;
      case ValidatorStatus.EXITING:
        return APIValidatorStatus.Exiting;
      case ValidatorStatus.EXITED:
        return APIValidatorStatus.Exited;
      case ValidatorStatus.WITHDRAWAL_AVAILABLE:
        return APIValidatorStatus.WithdrawalAvailable;
      case ValidatorStatus.WITHDRAWAL_COMPLETE:
        return APIValidatorStatus.WithdrawalComplete;
      case ValidatorStatus.ACTIVE_SLASHED:
        return APIValidatorStatus.ActiveSlashed;
      case ValidatorStatus.EXITED_SLASHED:
        return APIValidatorStatus.ExitedSlashed;
      case ValidatorStatus.REAPED:
        return APIValidatorStatus.Reaped;
      default:
        return APIValidatorStatus.Unknown;
    }
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
      case APIValidatorStatus.Unknown:
        return ValidatorStatus.UNKNOWN;
      case APIValidatorStatus.Provisioning:
        return ValidatorStatus.PROVISIONING;
      case APIValidatorStatus.Provisioned:
        return ValidatorStatus.PROVISIONED;
      case APIValidatorStatus.Deposited:
        return ValidatorStatus.DEPOSITED;
      case APIValidatorStatus.PendingActivation:
        return ValidatorStatus.PENDING_ACTIVATION;
      case APIValidatorStatus.Active:
        return ValidatorStatus.ACTIVE;
      case APIValidatorStatus.Exiting:
        return ValidatorStatus.EXITING;
      case APIValidatorStatus.Exited:
        return ValidatorStatus.EXITED;
      case APIValidatorStatus.WithdrawalAvailable:
        return ValidatorStatus.WITHDRAWAL_AVAILABLE;
      case APIValidatorStatus.WithdrawalComplete:
        return ValidatorStatus.WITHDRAWAL_COMPLETE;
      case APIValidatorStatus.ActiveSlashed:
        return ValidatorStatus.ACTIVE_SLASHED;
      case APIValidatorStatus.ExitedSlashed:
        return ValidatorStatus.EXITED_SLASHED;
      case APIValidatorStatus.Reaped:
        return ValidatorStatus.REAPED;
      default:
        return ValidatorStatus.UNKNOWN;
    }
  }
  /**
   * Returns the network ID.
   *
   * @returns The network ID.
   */
  public getNetworkId(): string {
    return this.model.network_id;
  }

  /**
   * Returns the asset ID.
   *
   * @returns The asset ID.
   */
  public getAssetId(): string {
    return this.model.asset_id;
  }

  /**
   * Returns the activation epoch of the validator.
   *
   * @returns The activation epoch as a string.
   */
  public getActivationEpoch(): string {
    return this.model.details?.activationEpoch || "";
  }

  /**
   * Returns the balance of the validator.
   *
   * @returns The balance object.
   */
  public getBalance(): Balance | undefined {
    return this.model.details?.balance;
  }

  /**
   * Returns the effective balance of the validator.
   *
   * @returns The effective balance object.
   */
  public getEffectiveBalance(): Balance | undefined {
    return this.model.details?.effective_balance;
  }

  /**
   * Returns the exit epoch of the validator.
   *
   * @returns The exit epoch as a string.
   */
  public getExitEpoch(): string {
    return this.model.details?.exitEpoch || "";
  }

  /**
   * Returns the index of the validator.
   *
   * @returns The validator index as a string.
   */
  public getIndex(): string {
    return this.model.details?.index || "";
  }

  /**
   * Returns the public key of the validator.
   *
   * @returns The validator's public key as a string.
   */
  public getPublicKey(): string {
    return this.model.details?.public_key || "";
  }

  /**
   * Returns whether the validator has been slashed.
   *
   * @returns True if the validator has been slashed, false otherwise.
   */
  public isSlashed(): boolean {
    return this.model.details?.slashed || false;
  }

  /**
   * Returns the withdrawable epoch of the validator.
   *
   * @returns The withdrawable epoch as a string.
   */
  public getWithdrawableEpoch(): string {
    return this.model.details?.withdrawableEpoch || "";
  }

  /**
   * Returns the withdrawal address of the validator.
   *
   * @returns The withdrawal address as a string.
   */
  public getWithdrawalAddress(): string {
    return this.model.details?.withdrawal_address || "";
  }

  /**
   * Returns the string representation of the Validator including all its details.
   *
   * @returns The string representation of the Validator including all its details.
   */
  public toString(): string {
    return `Validator { Id: ${this.getValidatorId()}, Status: ${this.getStatus()}, Exit Epoch: ${this.getExitEpoch()}, Network ID: ${this.getNetworkId()}, Asset ID: ${this.getAssetId()}, Index: ${this.getIndex()}, Public Key: ${this.getPublicKey()}, Slashed: ${this.isSlashed()}, Withdrawable Epoch: ${this.getWithdrawableEpoch()}, Withdrawal Address: ${this.getWithdrawalAddress()}, Effective Balance: { Amount: ${this.getEffectiveBalance()?.amount}, AssetID: { ${this.getEffectiveBalance()?.asset.asset_id}, Decimals: ${this.getEffectiveBalance()?.asset.decimals}, NetworkID: ${this.getEffectiveBalance()?.asset.network_id} } }, Balance: { Amount ${this.getBalance()?.amount}, Asset: { AssetID: ${this.getBalance()?.asset.asset_id}, Decimals: ${this.getBalance()?.asset.decimals}, NetworkID: ${this.getBalance()?.asset.network_id} } }, Activation Epoch: ${this.getActivationEpoch()} }`;
  }

  /**
   * Returns the JSON representation of the Validator.
   *
   * @returns The JSON representation of the Validator.
   */
  public toJSON(): string {
    return JSON.stringify(this.model);
  }
}
