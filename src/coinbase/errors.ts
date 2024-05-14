/**
 * InvalidaAPIKeyFormat error is thrown when the API key format is invalid.
 * @extends {Error}
 */
export class InvalidAPIKeyFormat extends Error {
  static DEFAULT_MESSAGE = "Invalid API key format";

  /**
   * Initializes a new InvalidAPIKeyFormat instance.
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
 * InternalError is thrown when there is an internal error in the SDK.
 */
export class InternalError extends Error {
  static DEFAULT_MESSAGE = "Internal Error";

  /**
   * Initializes a new InternalError instance.
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
