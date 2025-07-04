import { Validator } from "../coinbase/validator";
import { Coinbase } from "../coinbase/coinbase";
import {
  mockEthereumValidator,
  mockReturnValue,
  stakeApiMock,
  VALID_ACTIVE_VALIDATOR_LIST,
} from "./utils";
import { ValidatorStatus } from "../coinbase/types";
import { ValidatorStatus as APIValidatorStatus } from "../client/api";

describe("Validator", () => {
  beforeAll(() => {
    // Mock the validator functions.
    Coinbase.apiClients.stake = stakeApiMock;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    const validatorModel = mockEthereumValidator("100", ValidatorStatus.ACTIVE, "0xpublic_key_1");
    const validator = new Validator(validatorModel);
    it("initializes a new Validator", () => {
      expect(validator).toBeInstanceOf(Validator);
    });

    it("should raise an error when initialized with a model of a different type", () => {
      expect(() => new Validator(null!)).toThrow("Invalid model type");
    });
  });

  describe(".getStatus", () => {
    const testCases = [
      { input: APIValidatorStatus.Unknown, expected: ValidatorStatus.UNKNOWN },
      { input: APIValidatorStatus.Provisioning, expected: ValidatorStatus.PROVISIONING },
      { input: APIValidatorStatus.Provisioned, expected: ValidatorStatus.PROVISIONED },
      { input: APIValidatorStatus.Deposited, expected: ValidatorStatus.DEPOSITED },
      { input: APIValidatorStatus.PendingActivation, expected: ValidatorStatus.PENDING_ACTIVATION },
      { input: APIValidatorStatus.Active, expected: ValidatorStatus.ACTIVE },
      { input: APIValidatorStatus.Exiting, expected: ValidatorStatus.EXITING },
      { input: APIValidatorStatus.Exited, expected: ValidatorStatus.EXITED },
      {
        input: APIValidatorStatus.WithdrawalAvailable,
        expected: ValidatorStatus.WITHDRAWAL_AVAILABLE,
      },
      {
        input: APIValidatorStatus.WithdrawalComplete,
        expected: ValidatorStatus.WITHDRAWAL_COMPLETE,
      },
      { input: APIValidatorStatus.ActiveSlashed, expected: ValidatorStatus.ACTIVE_SLASHED },
      { input: APIValidatorStatus.ExitedSlashed, expected: ValidatorStatus.EXITED_SLASHED },
      { input: APIValidatorStatus.Reaped, expected: ValidatorStatus.REAPED },
      { input: "unknown_status" as APIValidatorStatus, expected: ValidatorStatus.UNKNOWN },
    ];

    testCases.forEach(({ input, expected }) => {
      it(`should return ${expected} for ${input}`, () => {
        const validatorModel = mockEthereumValidator("100", input, "0xpublic_key_1");
        const validator = new Validator(validatorModel);
        expect(validator.getStatus()).toBe(expected);
      });
    });
  });

  describe("#getAPIValidatorStatus", () => {
    const testCases = [
      { input: ValidatorStatus.UNKNOWN, expected: APIValidatorStatus.Unknown },
      { input: ValidatorStatus.PROVISIONING, expected: APIValidatorStatus.Provisioning },
      { input: ValidatorStatus.PROVISIONED, expected: APIValidatorStatus.Provisioned },
      { input: ValidatorStatus.DEPOSITED, expected: APIValidatorStatus.Deposited },
      { input: ValidatorStatus.PENDING_ACTIVATION, expected: APIValidatorStatus.PendingActivation },
      { input: ValidatorStatus.ACTIVE, expected: APIValidatorStatus.Active },
      { input: ValidatorStatus.EXITING, expected: APIValidatorStatus.Exiting },
      { input: ValidatorStatus.EXITED, expected: APIValidatorStatus.Exited },
      {
        input: ValidatorStatus.WITHDRAWAL_AVAILABLE,
        expected: APIValidatorStatus.WithdrawalAvailable,
      },
      {
        input: ValidatorStatus.WITHDRAWAL_COMPLETE,
        expected: APIValidatorStatus.WithdrawalComplete,
      },
      { input: ValidatorStatus.ACTIVE_SLASHED, expected: APIValidatorStatus.ActiveSlashed },
      { input: ValidatorStatus.EXITED_SLASHED, expected: APIValidatorStatus.ExitedSlashed },
      { input: ValidatorStatus.REAPED, expected: APIValidatorStatus.Reaped },
      { input: "unknown_status" as ValidatorStatus, expected: APIValidatorStatus.Unknown },
    ];

    testCases.forEach(({ input, expected }) => {
      it(`should return ${expected} for ${input}`, () => {
        const validatorModel = mockEthereumValidator("100", input, "0xpublic_key_1");
        const validator = new Validator(validatorModel);
        expect(validator.getStatus()).toBe(expected);
      });
    });
  });

  it("should return a list of validators for ethereum hoodi and eth asset", async () => {
    Coinbase.apiClients.stake!.listValidators = mockReturnValue(VALID_ACTIVE_VALIDATOR_LIST);

    const validators = await Validator.list(
      Coinbase.networks.EthereumHoodi,
      Coinbase.assets.Eth,
      ValidatorStatus.ACTIVE,
    );

    expect(Coinbase.apiClients.stake!.listValidators).toHaveBeenCalledWith(
      Coinbase.networks.EthereumHoodi,
      Coinbase.assets.Eth,
      ValidatorStatus.ACTIVE,
    );

    expect(validators.length).toEqual(3);
    expect(validators[0].getValidatorId()).toEqual("0xpublic_key_1");
    expect(validators[0].getStatus()).toEqual(ValidatorStatus.ACTIVE);
    expect(validators[1].getValidatorId()).toEqual("0xpublic_key_2");
    expect(validators[1].getStatus()).toEqual(ValidatorStatus.ACTIVE);
    expect(validators[2].getValidatorId()).toEqual("0xpublic_key_3");
    expect(validators[2].getStatus()).toEqual(ValidatorStatus.ACTIVE);
  });

  it("should return a validator for ethereum hoodi and eth asset", async () => {
    Coinbase.apiClients.stake!.getValidator = mockReturnValue(
      mockEthereumValidator("100", ValidatorStatus.EXITING, "0x123"),
    );

    const validator = await Validator.fetch(
      Coinbase.networks.EthereumHoodi,
      Coinbase.assets.Eth,
      "0x123",
    );

    expect(Coinbase.apiClients.stake!.getValidator).toHaveBeenCalledWith(
      Coinbase.networks.EthereumHoodi,
      Coinbase.assets.Eth,
      "0x123",
    );

    expect(validator.getValidatorId()).toEqual("0x123");
    expect(validator.getStatus()).toEqual(ValidatorStatus.EXITING);
    expect(validator.toString()).toEqual("Id: 0x123 Status: exiting");
  });
});
