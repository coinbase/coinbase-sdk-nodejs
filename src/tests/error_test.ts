import {
  ArgumentError,
  InternalError,
  InvalidAPIKeyFormat,
  InvalidConfiguration,
  InvalidUnsignedPayload,
} from "../coinbase/errors";

describe("Error Classes", () => {
  test("InvalidAPIKeyFormat should have the correct message and name", () => {
    const error = new InvalidAPIKeyFormat();
    expect(error.message).toBe(InvalidAPIKeyFormat.DEFAULT_MESSAGE);
    expect(error.name).toBe("InvalidAPIKeyFormat");
  });

  test("InvalidAPIKeyFormat should accept a custom message", () => {
    const customMessage = "Custom invalid API key format message";
    const error = new InvalidAPIKeyFormat(customMessage);
    expect(error.message).toBe(customMessage);
  });

  test("ArgumentError should have the correct message and name", () => {
    const error = new ArgumentError();
    expect(error.message).toBe(ArgumentError.DEFAULT_MESSAGE);
    expect(error.name).toBe("ArgumentError");
  });

  test("ArgumentError should accept a custom message", () => {
    const customMessage = "Custom argument error message";
    const error = new ArgumentError(customMessage);
    expect(error.message).toBe(customMessage);
  });

  test("InternalError should have the correct message and name", () => {
    const error = new InternalError();
    expect(error.message).toBe(InternalError.DEFAULT_MESSAGE);
    expect(error.name).toBe("InternalError");
  });

  test("InternalError should accept a custom message", () => {
    const customMessage = "Custom internal error message";
    const error = new InternalError(customMessage);
    expect(error.message).toBe(customMessage);
  });

  test("InvalidConfiguration should have the correct message and name", () => {
    const error = new InvalidConfiguration();
    expect(error.message).toBe(InvalidConfiguration.DEFAULT_MESSAGE);
    expect(error.name).toBe("InvalidConfiguration");
  });

  test("InvalidConfiguration should accept a custom message", () => {
    const customMessage = "Custom invalid configuration message";
    const error = new InvalidConfiguration(customMessage);
    expect(error.message).toBe(customMessage);
  });

  test("InvalidUnsignedPayload should have the correct message and name", () => {
    const error = new InvalidUnsignedPayload();
    expect(error.message).toBe(InvalidUnsignedPayload.DEFAULT_MESSAGE);
    expect(error.name).toBe("InvalidUnsignedPayload");
  });

  test("InvalidUnsignedPayload should accept a custom message", () => {
    const customMessage = "Custom invalid unsigned payload message";
    const error = new InvalidUnsignedPayload(customMessage);
    expect(error.message).toBe(customMessage);
  });
});
