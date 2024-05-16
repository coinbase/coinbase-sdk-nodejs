/* eslint-disable jsdoc/require-jsdoc */
import { AxiosError } from "axios";
import { InternalError } from "./errors";

/**
 * The API error response type.
 */
type APIErrorResponseType = {
  code: string;
  message: string;
};

/**
 * A wrapper for API errors to provide more context.
 */
export class APIError extends AxiosError {
  httpCode: number | null;
  apiCode: string | null;
  apiMessage: string | null;

  /**
   * Initializes a new APIError object.
   *
   * @class
   * @param {AxiosError} error - The Axios error.
   */
  constructor(error) {
    super();
    this.name = this.constructor.name;
    this.httpCode = error.response ? error.response.status : null;
    this.apiCode = null;
    this.apiMessage = null;

    if (error.response && error.response.data) {
      const body = error.response.data;
      this.apiCode = body.code;
      this.apiMessage = body.message;
    }
  }

  /**
   * Creates a specific APIError based on the API error code.
   *
   * @param {AxiosError} error - The underlying error object.
   * @returns {APIError} A specific APIError instance.
   */
  static fromError(error: AxiosError) {
    const apiError = new APIError(error);
    if (!error.response || !error.response.data) {
      return apiError;
    }

    const body = error?.response?.data as APIErrorResponseType;
    switch (body?.code) {
      case "unimplemented":
        return new UnimplementedError(error);
      case "unauthorized":
        return new UnauthorizedError(error);
      case "internal":
        return new InternalError(error.message);
      case "not_found":
        return new NotFoundError(error);
      case "invalid_wallet_id":
        return new InvalidWalletIDError(error);
      case "invalid_address_id":
        return new InvalidAddressIDError(error);
      case "invalid_wallet":
        return new InvalidWalletError(error);
      case "invalid_address":
        return new InvalidAddressError(error);
      case "invalid_amount":
        return new InvalidAmountError(error);
      case "invalid_transfer_id":
        return new InvalidTransferIDError(error);
      case "invalid_page_token":
        return new InvalidPageError(error);
      case "invalid_page_limit":
        return new InvalidLimitError(error);
      case "already_exists":
        return new AlreadyExistsError(error);
      case "malformed_request":
        return new MalformedRequestError(error);
      case "unsupported_asset":
        return new UnsupportedAssetError(error);
      case "invalid_asset_id":
        return new InvalidAssetIDError(error);
      case "invalid_destination":
        return new InvalidDestinationError(error);
      case "invalid_network_id":
        return new InvalidNetworkIDError(error);
      case "resource_exhausted":
        return new ResourceExhaustedError(error);
      case "faucet_limit_reached":
        return new FaucetLimitReachedError(error);
      case "invalid_signed_payload":
        return new InvalidSignedPayloadError(error);
      case "invalid_transfer_status":
        return new InvalidTransferStatusError(error);
      default:
        return apiError;
    }
  }

  /**
   * Returns a String representation of the APIError.
   *
   * @returns {string} a String representation of the APIError
   */
  toString() {
    return `APIError{httpCode: ${this.httpCode}, apiCode: ${this.apiCode}, apiMessage: ${this.apiMessage}}`;
  }
}

export class UnimplementedError extends APIError {}
export class UnauthorizedError extends APIError {}
export class NotFoundError extends APIError {}
export class InvalidWalletIDError extends APIError {}
export class InvalidAddressIDError extends APIError {}
export class InvalidWalletError extends APIError {}
export class InvalidAddressError extends APIError {}
export class InvalidAmountError extends APIError {}
export class InvalidTransferIDError extends APIError {}
export class InvalidPageError extends APIError {}
export class InvalidLimitError extends APIError {}
export class AlreadyExistsError extends APIError {}
export class MalformedRequestError extends APIError {}
export class UnsupportedAssetError extends APIError {}
export class InvalidAssetIDError extends APIError {}
export class InvalidDestinationError extends APIError {}
export class InvalidNetworkIDError extends APIError {}
export class ResourceExhaustedError extends APIError {}
export class FaucetLimitReachedError extends APIError {}
export class InvalidSignedPayloadError extends APIError {}
export class InvalidTransferStatusError extends APIError {}
