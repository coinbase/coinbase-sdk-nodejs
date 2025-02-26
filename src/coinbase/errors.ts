/**
 * InvalidAPIKeyFormatError error is thrown when the API key format is invalid.
 */
export class InvalidAPIKeyFormatError extends Error {
  static DEFAULT_MESSAGE = "Invalid API key format";

  /**
   * Initializes a new InvalidAPIKeyFormat instance.
   *
   * @param message - The error message.
   */
  constructor(message: string = InvalidAPIKeyFormatError.DEFAULT_MESSAGE) {
    super(message);
    this.name = "InvalidAPIKeyFormatError";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidAPIKeyFormatError);
    }
  }
}

/**
 * TimeoutError is thrown when an operation times out.
 */
export class TimeoutError extends Error {
  /**
   * Initializes a new TimeoutError instance.
   *
   * @param message - The error message.
   */
  constructor(message: string = "Timeout Error") {
    super(message);
    this.name = "TimeoutError";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TimeoutError);
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
 * InvalidConfigurationError error is thrown when apikey/privateKey configuration is invalid.
 */
export class InvalidConfigurationError extends Error {
  static DEFAULT_MESSAGE = "Invalid configuration";

  /**
   * Initializes a new InvalidConfiguration instance.
   *
   * @param message - The error message.
   */
  constructor(message: string = InvalidConfigurationError.DEFAULT_MESSAGE) {
    super(message);
    this.name = "InvalidConfigurationError";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidConfigurationError);
    }
  }
}

/**
 * InvalidUnsignedPayload error is thrown when the unsigned payload is invalid.
 */
export class InvalidUnsignedPayloadError extends Error {
  static DEFAULT_MESSAGE = "Invalid unsigned payload";

  /**
   * Initializes a new InvalidUnsignedPayload instance.
   *
   * @param message - The error message.
   */
  constructor(message: string = InvalidUnsignedPayloadError.DEFAULT_MESSAGE) {
    super(message);
    this.name = "InvalidUnsignedPayloadError";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidUnsignedPayloadError);
    }
  }
}

/**
 * NotSignedError is thrown when a resource is not signed.
 */
export class NotSignedError extends Error {
  /**
   * Initializes a new NotSignedError instance.
   *
   * @param message - The error message.
   */
  constructor(message: string = "Resource not signed") {
    super(message);
    this.name = "NotSignedError";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NotSignedError);
    }
  }
}

/**
 * AlreadySignedError is thrown when a resource is already signed.
 */
export class AlreadySignedError extends Error {
  static DEFAULT_MESSAGE = "Resource already signed";

  /**
   * Initializes a new AlreadySignedError instance.
   *
   * @param message - The error message.
   */
  constructor(message: string = AlreadySignedError.DEFAULT_MESSAGE) {
    super(message);
    this.name = "AlreadySignedError";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AlreadySignedError);
    }
  }
}

/**
 * UninitializedSDKError is thrown when the Coinbase instance is not initialized.
 */
export class UninitializedSDKError extends Error {
  static DEFAULT_MESSAGE =
    "Coinbase SDK has not been initialized. Please initialize by calling either:\n\n" +
    "- Coinbase.configure({apiKeyName: '...', privateKey: '...'})\n" +
    "- Coinbase.configureFromJson({filePath: '/path/to/api_keys.json'})\n\n" +
    "If needed, register for API keys at https://portal.cdp.coinbase.com/ or view the docs at https://docs.cdp.coinbase.com/wallet-api/docs/welcome";

  /**
   * Initializes a new UninitializedSDKError instance.
   *
   * @param message - The error message.
   */
  constructor(message: string = UninitializedSDKError.DEFAULT_MESSAGE) {
    super(message);
    this.name = "UninitializedSDKError";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UninitializedSDKError);
    }
  }
}
