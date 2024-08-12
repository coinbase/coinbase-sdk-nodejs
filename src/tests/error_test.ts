import {
  ArgumentError,
  InternalError,
  InvalidAPIKeyFormat,
  InvalidConfiguration,
  InvalidUnsignedPayload,
  AlreadySignedError,
} from "../coinbase/errors";

describe("Error Classes", () => {
  it("InvalidAPIKeyFormat should have the correct message and name", () => {
    const error = new InvalidAPIKeyFormat();
    expect(error.message).toBe(InvalidAPIKeyFormat.DEFAULT_MESSAGE);
    expect(error.name).toBe("InvalidAPIKeyFormat");
  });

  it("InvalidAPIKeyFormat should accept a custom message", () => {
    const customMessage = "Custom invalid API key format message";
    const error = new InvalidAPIKeyFormat(customMessage);
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

  it("InternalError should have the correct message and name", () => {
    const error = new InternalError();
    expect(error.message).toBe(InternalError.DEFAULT_MESSAGE);
    expect(error.name).toBe("InternalError");
  });

  it("InternalError should accept a custom message", () => {
    const customMessage = "Custom internal error message";
    const error = new InternalError(customMessage);
    expect(error.message).toBe(customMessage);
  });

  it("InvalidConfiguration should have the correct message and name", () => {
    const error = new InvalidConfiguration();
    expect(error.message).toBe(InvalidConfiguration.DEFAULT_MESSAGE);
    expect(error.name).toBe("InvalidConfiguration");
  });

  it("InvalidConfiguration should accept a custom message", () => {
    const customMessage = "Custom invalid configuration message";
    const error = new InvalidConfiguration(customMessage);
    expect(error.message).toBe(customMessage);
  });

  it("InvalidUnsignedPayload should have the correct message and name", () => {
    const error = new InvalidUnsignedPayload();
    expect(error.message).toBe(InvalidUnsignedPayload.DEFAULT_MESSAGE);
    expect(error.name).toBe("InvalidUnsignedPayload");
  });

  it("InvalidUnsignedPayload should accept a custom message", () => {
    const customMessage = "Custom invalid unsigned payload message";
    const error = new InvalidUnsignedPayload(customMessage);
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
