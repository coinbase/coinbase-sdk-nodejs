import { AxiosError } from "axios";
import {
  APIError,
  UnimplementedError,
  UnauthorizedError,
  NotFoundError,
  InvalidWalletIDError,
  InvalidAddressIDError,
  InvalidWalletError,
  InvalidAddressError,
  InvalidAmountError,
  InvalidTransferIDError,
  InvalidPageError,
  InvalidLimitError,
  AlreadyExistsError,
  MalformedRequestError,
  UnsupportedAssetError,
  InvalidAssetIDError,
  InvalidDestinationError,
  InvalidNetworkIDError,
  ResourceExhaustedError,
  FaucetLimitReachedError,
  InvalidSignedPayloadError,
  InvalidTransferStatusError,
  NetworkFeatureUnsupportedError,
} from "./../coinbase/api_error"; // Adjust the import path accordingly

describe("APIError", () => {
  test("should create default APIError without response data", () => {
    const axiosError = new AxiosError("Network Error");

    const apiError = new APIError(axiosError);

    expect(apiError.httpCode).toBeNull();
    expect(apiError.apiCode).toBeNull();
    expect(apiError.apiMessage).toBeNull();
    expect(apiError.correlationId).toBeNull();
    expect(apiError.toString()).toBe("APIError{}");
  });

  test("should create APIError with response data", () => {
    const axiosError = {
      response: {
        status: 400,
        data: {
          code: "invalid_wallet_id",
          message: "Invalid wallet ID",
          correlation_id: "123",
        },
      },
    } as AxiosError;

    const apiError = new APIError(axiosError);

    expect(apiError.httpCode).toBe(400);
    expect(apiError.apiCode).toBe("invalid_wallet_id");
    expect(apiError.apiMessage).toBe("Invalid wallet ID");
    expect(apiError.correlationId).toBe("123");
    expect(apiError.toString()).toBe(
      "APIError{httpCode: 400, apiCode: invalid_wallet_id, apiMessage: Invalid wallet ID, correlationId: 123}",
    );
  });

  test.each([
    ["unimplemented", UnimplementedError],
    ["unauthorized", UnauthorizedError],
    ["not_found", NotFoundError],
    ["invalid_wallet_id", InvalidWalletIDError],
    ["invalid_address_id", InvalidAddressIDError],
    ["invalid_wallet", InvalidWalletError],
    ["invalid_address", InvalidAddressError],
    ["invalid_amount", InvalidAmountError],
    ["invalid_transfer_id", InvalidTransferIDError],
    ["invalid_page_token", InvalidPageError],
    ["invalid_page_limit", InvalidLimitError],
    ["already_exists", AlreadyExistsError],
    ["malformed_request", MalformedRequestError],
    ["unsupported_asset", UnsupportedAssetError],
    ["invalid_asset_id", InvalidAssetIDError],
    ["invalid_destination", InvalidDestinationError],
    ["invalid_network_id", InvalidNetworkIDError],
    ["resource_exhausted", ResourceExhaustedError],
    ["faucet_limit_reached", FaucetLimitReachedError],
    ["invalid_signed_payload", InvalidSignedPayloadError],
    ["invalid_transfer_status", InvalidTransferStatusError],
    ["network_feature_unsupported", NetworkFeatureUnsupportedError],
  ])("should create %s error type", (code, ErrorType) => {
    const axiosError = {
      response: {
        status: 400,
        data: {
          code,
          message: "Error message",
        },
      },
    } as AxiosError;

    const apiError = APIError.fromError(axiosError);
    expect(apiError).toBeInstanceOf(ErrorType);
  });
});
