export class InvalidAPIKeyFormat extends Error {
  static DEFAULT_MESSAGE = "Invalid API key format";

  constructor(message: string = InvalidAPIKeyFormat.DEFAULT_MESSAGE) {
    super(message);
    this.name = "InvalidAPIKeyFormat";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidAPIKeyFormat);
    }
  }
}

export class InternalError extends Error {
  static DEFAULT_MESSAGE = "Internal Error";

  constructor(message: string = InternalError.DEFAULT_MESSAGE) {
    super(message);
    this.name = "InternalError";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InternalError);
    }
  }
}

export class InvalidConfiguration extends Error {
  static DEFAULT_MESSAGE = "Invalid configuration";

  constructor(message: string = InvalidConfiguration.DEFAULT_MESSAGE) {
    super(message);
    this.name = "InvalidConfiguration";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidConfiguration);
    }
  }
}
