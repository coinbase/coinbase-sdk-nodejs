import {
  ArgumentError,
  InvalidAPIKeyFormatError,
  InvalidConfigurationError,
  InvalidUnsignedPayloadError,
  AlreadySignedError,
} from "../coinbase/errors";

describe("Error Classes", () => {
  it("InvalidAPIKeyFormatError should have the correct message and name", () => {
    const error = new InvalidAPIKeyFormatError();
    expect(error.message).toBe(InvalidAPIKeyFormatError.DEFAULT_MESSAGE);
    expect(error.name).toBe("InvalidAPIKeyFormatError");
  });

  it("InvalidAPIKeyFormatError should accept a custom message", () => {
    const customMessage = "Custom invalid API key format message";
    const error = new InvalidAPIKeyFormatError(customMessage);
    expect(error.message).toBe(customMessage);
  });

  it("ArgumentError should have the correct message and name", () => {
    const error = new ArgumentError();
    expect(error.message).toBe(ArgumentError.DEFAULT_MESSAGE);
    expect(error.name).toBe("ArgumentError");
  });

  it("ArgumentError should accept a custom message", () => {
    const customMessage = "Custom argument error message";
    const error = new ArgumentError(customMessage);
    expect(error.message).toBe(customMessage);
  });

  it("InvalidConfigurationError should have the correct message and name", () => {
    const error = new InvalidConfigurationError();
    expect(error.message).toBe(InvalidConfigurationError.DEFAULT_MESSAGE);
    expect(error.name).toBe("InvalidConfigurationError");
  });

  it("InvalidConfigurationError should accept a custom message", () => {
    const customMessage = "Custom invalid configuration message";
    const error = new InvalidConfigurationError(customMessage);
    expect(error.message).toBe(customMessage);
  });

  it("InvalidUnsignedPayloadError should have the correct message and name", () => {
    const error = new InvalidUnsignedPayloadError();
    expect(error.message).toBe(InvalidUnsignedPayloadError.DEFAULT_MESSAGE);
    expect(error.name).toBe("InvalidUnsignedPayloadError");
  });

  it("InvalidUnsignedPayloadError should accept a custom message", () => {
    const customMessage = "Custom invalid unsigned payload message";
    const error = new InvalidUnsignedPayloadError(customMessage);
    expect(error.message).toBe(customMessage);
  });

  it("AlreadySignedError should have the correct message and name", () => {
    const error = new AlreadySignedError();
    expect(error.message).toBe(AlreadySignedError.DEFAULT_MESSAGE);
    expect(error.name).toBe("AlreadySignedError");
  });

  it("AlreadySignedError should accept a custom message", () => {
    const customMessage = "Custom already signed error message";
    const error = new AlreadySignedError(customMessage);
    expect(error.message).toBe(customMessage);
  });
});
