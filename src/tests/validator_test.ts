import { Validator } from "../coinbase/validator";
import { Coinbase } from "../coinbase/coinbase";
import {
  mockEthereumValidator,
  mockReturnValue,
  VALID_ACTIVE_VALIDATOR_LIST,
  validatorApiMock,
} from "./utils";

describe("Validator", () => {
  beforeAll(() => {
    // Mock the validator functions.
    Coinbase.apiClients.validator = validatorApiMock;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    const validatorModel = mockEthereumValidator("100", "active_ongoing", "0xpublic_key_1");
    const validator = new Validator(validatorModel);
    it("initializes a new Validator", () => {
      expect(validator).toBeInstanceOf(Validator);
    });

    it("should raise an error when initialized with a model of a different type", () => {
      expect(() => new Validator(null!)).toThrow("Invalid model type");
    });
  });

  it("should return a list of validators for ethereum holesky and eth asset", async () => {
    Coinbase.apiClients.validator!.listValidators = mockReturnValue(VALID_ACTIVE_VALIDATOR_LIST);

    const validators = await Validator.list(
      Coinbase.networks.EthereumHolesky,
      Coinbase.assets.Eth,
      "active_ongoing",
    );

    expect(Coinbase.apiClients.validator!.listValidators).toHaveBeenCalledWith(
      Coinbase.networks.EthereumHolesky,
      Coinbase.assets.Eth,
      "active_ongoing",
    );

    expect(validators.length).toEqual(3);
    expect(validators[0].getValidatorId()).toEqual("0xpublic_key_1");
    expect(validators[0].getStatus()).toEqual("active_ongoing");
    expect(validators[1].getValidatorId()).toEqual("0xpublic_key_2");
    expect(validators[1].getStatus()).toEqual("active_ongoing");
    expect(validators[2].getValidatorId()).toEqual("0xpublic_key_3");
    expect(validators[2].getStatus()).toEqual("active_ongoing");
  });

  it("should return a validator for ethereum holesky and eth asset", async () => {
    Coinbase.apiClients.validator!.getValidator = mockReturnValue(
      mockEthereumValidator("100", "active_exiting", "0x123"),
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
    expect(validator.getStatus()).toEqual("active_exiting");
    expect(validator.toString()).toEqual("Id: 0x123, Status: active_exiting");
  });
});
