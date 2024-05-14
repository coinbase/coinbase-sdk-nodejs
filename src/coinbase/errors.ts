/**
 * InvalidaAPIKeyFormat error is thrown when the API key format is invalid.
 */
export class InvalidAPIKeyFormat extends Error {
  static DEFAULT_MESSAGE = "Invalid API key format";

  /**
   * Initializes a new InvalidAPIKeyFormat instance.
   *
   * @param message - The error message.
   */
  constructor(message: string = InvalidAPIKeyFormat.DEFAULT_MESSAGE) {
    super(message);
    this.name = "InvalidAPIKeyFormat";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidAPIKeyFormat);
    }
  }
}

/**
 * ArgumentError is thrown when an argument is invalid.
 */
export class ArgumentError extends Error {
  static DEFAULT_MESSAGE = "Argument Error";

  /**
   * Initializes a new ArgumentError instance.
   *
   * @param message - The error message.
   */
  constructor(message: string = ArgumentError.DEFAULT_MESSAGE) {
    super(message);
    this.name = "ArgumentError";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ArgumentError);
    }
  }
}

/**
 * InternalError is thrown when there is an internal error in the SDK.
 */
export class InternalError extends Error {
  static DEFAULT_MESSAGE = "Internal Error";

  /**
   * Initializes a new InternalError instance.
   *
   * @param message - The error message.
   */
  constructor(message: string = InternalError.DEFAULT_MESSAGE) {
    super(message);
    this.name = "InternalError";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InternalError);
    }
  }
}

/**
 * InvalidConfiguration error is thrown when apikey/privateKey configuration is invalid.
 */
export class InvalidConfiguration extends Error {
  static DEFAULT_MESSAGE = "Invalid configuration";

  /**
   * Initializes a new InvalidConfiguration instance.
   *
   * @param message - The error message.
   */
  constructor(message: string = InvalidConfiguration.DEFAULT_MESSAGE) {
    super(message);
    this.name = "InvalidConfiguration";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidConfiguration);
    }
  }
}

/**
 * InvalidUnsignedPayload error is thrown when the unsigned payload is invalid.
 */
export class InvalidUnsignedPayload extends Error {
  static DEFAULT_MESSAGE = "Invalid unsigned payload";

  /**
   * Initializes a new InvalidUnsignedPayload instance.
   * @param message - The error message.
   */
  constructor(message: string = InvalidUnsignedPayload.DEFAULT_MESSAGE) {
    super(message);
    this.name = "InvalidUnsignedPayload";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidUnsignedPayload);
    }
  }
}
