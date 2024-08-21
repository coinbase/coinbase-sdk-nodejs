import { Validator } from "../coinbase/validator";
import { Coinbase } from "../coinbase/coinbase";
import {
  mockEthereumValidator,
  mockReturnValue,
  VALID_ACTIVE_VALIDATOR_LIST,
  validatorApiMock,
} from "./utils";
import { ValidatorStatus } from "../coinbase/types";
import { ValidatorStatus as APIValidatorStatus } from "../client/api";

describe("Validator", () => {
  beforeAll(() => {
    // Mock the validator functions.
    Coinbase.apiClients.validator = validatorApiMock;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    const validatorModel = mockEthereumValidator("100", ValidatorStatus.Active, "0xpublic_key_1");
    const validator = new Validator(validatorModel);
    it("initializes a new Validator", () => {
      expect(validator).toBeInstanceOf(Validator);
    });

    it("should raise an error when initialized with a model of a different type", () => {
      expect(() => new Validator(null!)).toThrow("Invalid model type");
    });
  });

  describe("getStatus", () => {
    const testCases = [
      { input: ValidatorStatus.Unknown, expected: APIValidatorStatus.Unknown },
      { input: ValidatorStatus.Provisioning, expected: APIValidatorStatus.Provisioning },
      { input: ValidatorStatus.Provisioned, expected: APIValidatorStatus.Provisioned },
      { input: ValidatorStatus.Deposited, expected: APIValidatorStatus.Deposited },
      { input: ValidatorStatus.PendingActivation, expected: APIValidatorStatus.PendingActivation },
      { input: ValidatorStatus.Active, expected: APIValidatorStatus.Active },
      { input: ValidatorStatus.Exiting, expected: APIValidatorStatus.Exiting },
      { input: ValidatorStatus.Exited, expected: APIValidatorStatus.Exited },
      {
        input: ValidatorStatus.WithdrawalAvailable,
        expected: APIValidatorStatus.WithdrawalAvailable,
      },
      {
        input: ValidatorStatus.WithdrawalComplete,
        expected: APIValidatorStatus.WithdrawalComplete,
      },
      { input: ValidatorStatus.ActiveSlashed, expected: APIValidatorStatus.ActiveSlashed },
      { input: ValidatorStatus.ExitedSlashed, expected: APIValidatorStatus.ExitedSlashed },
      { input: ValidatorStatus.Reaped, expected: APIValidatorStatus.Reaped },
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

  it("should return a list of validators for ethereum holesky and eth asset", async () => {
    Coinbase.apiClients.validator!.listValidators = mockReturnValue(VALID_ACTIVE_VALIDATOR_LIST);

    const validators = await Validator.list(
      Coinbase.networks.EthereumHolesky,
      Coinbase.assets.Eth,
      ValidatorStatus.Active,
    );

    expect(Coinbase.apiClients.validator!.listValidators).toHaveBeenCalledWith(
      Coinbase.networks.EthereumHolesky,
      Coinbase.assets.Eth,
      ValidatorStatus.Active,
    );

    expect(validators.length).toEqual(3);
    expect(validators[0].getValidatorId()).toEqual("0xpublic_key_1");
    expect(validators[0].getStatus()).toEqual(ValidatorStatus.Active);
    expect(validators[1].getValidatorId()).toEqual("0xpublic_key_2");
    expect(validators[1].getStatus()).toEqual(ValidatorStatus.Active);
    expect(validators[2].getValidatorId()).toEqual("0xpublic_key_3");
    expect(validators[2].getStatus()).toEqual(ValidatorStatus.Active);
  });

  it("should return a validator for ethereum holesky and eth asset", async () => {
    Coinbase.apiClients.validator!.getValidator = mockReturnValue(
      mockEthereumValidator("100", ValidatorStatus.Exiting, "0x123"),
    );

    const validator = await Validator.fetch(
      Coinbase.networks.EthereumHolesky,
      Coinbase.assets.Eth,
      "0x123",
    );

    expect(Coinbase.apiClients.validator!.getValidator).toHaveBeenCalledWith(
      Coinbase.networks.EthereumHolesky,
      Coinbase.assets.Eth,
      "0x123",
    );

    expect(validator.getValidatorId()).toEqual("0x123");
    expect(validator.getStatus()).toEqual(ValidatorStatus.Exiting);
    expect(validator.toString()).toEqual("Id: 0x123, Status: exiting");
  });
});
