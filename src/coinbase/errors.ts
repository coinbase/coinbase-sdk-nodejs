export class InvalidAPIKeyFormat extends Error {
  constructor(message: string = "Invalid API key format") {
    super(message);
    this.name = "InvalidAPIKeyFormat";
  }
}

export class InternalError extends Error {
  constructor(message: string = "Internal Error") {
    super(message);
    this.name = "InternalError";
  }
}

export class InvalidConfiguration extends Error {
  constructor(message: string = "Invalid configuration") {
    super(message);
    this.name = "InvalidConfiguration";
  }
}
