/* eslint-disable @typescript-eslint/no-explicit-any */
import { Axios, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { Destination } from "./types";
import { APIError } from "./api_error";
import { Wallet } from "./wallet";
import { Address } from "./address";
import { InternalError, InvalidUnsignedPayload } from "./errors";
import { Coinbase } from "./coinbase";
import { ATOMIC_UNITS_PER_USDC, WEI_PER_ETHER, WEI_PER_GWEI } from "./constants";

/**
 * Prints Axios response to the console for debugging purposes.
 *
 * @param response - The Axios response object.
 * @param debugging - Flag to enable or disable logging.
 * @returns The Axios response object.
 */
export const logApiResponse = (response: AxiosResponse, debugging = false): AxiosResponse => {
  if (debugging) {
    let output = typeof response.data === "string" ? response.data : "";

    if (typeof response.data === "object") {
      output = JSON.stringify(response.data, null, 4);
    }

    console.log(`API RESPONSE: 
      Status: ${response.status} 
      URL: ${response.config.url} 
      Data: ${output}`);
  }
  return response;
};

/**
 * Axios Request interceptor function type.
 *
 * @param value - The Axios request configuration.
 * @returns The modified Axios request configuration.
 */
type RequestFunctionType = (
  value: InternalAxiosRequestConfig<any>,
) => Promise<InternalAxiosRequestConfig> | InternalAxiosRequestConfig;

/**
 * Axios Response interceptor function type.
 *
 * @param value - The Axios response object.
 * @returns The modified Axios response object.
 */
type ResponseFunctionType = (value: AxiosResponse<any, any>) => AxiosResponse<any, any>;

/**
 * Registers request and response interceptors to an Axios instance.
 *
 * @param axiosInstance - The Axios instance to register the interceptors.
 * @param requestFn - The request interceptor function.
 * @param responseFn - The response interceptor function.
 */
export const registerAxiosInterceptors = (
  axiosInstance: Axios,
  requestFn: RequestFunctionType,
  responseFn: ResponseFunctionType,
) => {
  axiosInstance.interceptors.request.use(requestFn);
  axiosInstance.interceptors.response.use(responseFn, error => {
    return Promise.reject(APIError.fromError(error));
  });
};

/**
 * Converts a Uint8Array to a hex string.
 *
 * @param key - The key to convert.
 * @returns The converted hex string.
 */
export const convertStringToHex = (key: Uint8Array): string => {
  return Buffer.from(key).toString("hex");
};

/**
 * Delays the execution of the function by the specified number of seconds.
 *
 * @param seconds - The number of seconds to delay the execution.
 * @returns A promise that resolves after the specified number of seconds.
 */
export async function delay(seconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

/**
 * Converts a Destination to an Address hex string.
 *
 * @param destination - The Destination to convert.
 * @returns The Address Hex string.
 * @throws {Error} If the Destination is an unsupported type.
 */
export function destinationToAddressHexString(destination: Destination): string {
  if (typeof destination === "string") {
    return destination;
  } else if (destination instanceof Address) {
    return destination.getId();
  } else if (destination instanceof Wallet) {
    return destination.getDefaultAddress()!.getId();
  } else {
    throw new Error("Unsupported type");
  }
}

/**
 * Parses an Unsigned Payload and returns the JSON object.
 *
 * @throws {InvalidUnsignedPayload} If the Unsigned Payload is invalid.
 * @param payload - The Unsigned Payload.
 * @returns The parsed JSON object.
 */
export function parseUnsignedPayload(payload: string): Record<string, any> {
  const rawPayload = payload.match(/../g)?.map(byte => parseInt(byte, 16));
  if (!rawPayload) {
    throw new InvalidUnsignedPayload("Unable to parse unsigned payload");
  }

  let parsedPayload;
  try {
    const rawPayloadBytes = new Uint8Array(rawPayload);
    const decoder = new TextDecoder();
    parsedPayload = JSON.parse(decoder.decode(rawPayloadBytes));
  } catch (error) {
    throw new InvalidUnsignedPayload("Unable to decode unsigned payload JSON");
  }

  return parsedPayload;
}

/**
 * Converts the given amount to a normalized value based on the specified asset ID.
 *
 * @param {Decimal} amount - The amount to be normalized.
 * @param {string} assetId - The identifier of the asset to determine the normalization factor.
 * @returns {Decimal} The normalized amount.
 * @throws {InternalError} If the asset ID is unsupported.
 */
export const convertAmount = (amount, assetId) => {
  switch (assetId) {
    case Coinbase.assets.Eth:
      return amount.mul(WEI_PER_ETHER);
    case Coinbase.assets.Gwei:
      return amount.mul(WEI_PER_GWEI);
    case Coinbase.assets.Wei:
      return amount;
    case Coinbase.assets.Weth:
      return amount.mul(WEI_PER_ETHER);
    case Coinbase.assets.Usdc:
      return amount.mul(ATOMIC_UNITS_PER_USDC);
    default:
      throw new InternalError(`Unsupported asset ID: ${assetId}`);
  }
};

/**
 * Returns the normalized asset ID based on the provided asset ID.
 *
 * @param {string} assetId - The identifier of the asset to be normalized.
 * @returns {string} The normalized asset ID.
 */
export const getNormalizedAssetId = (assetId: string) => {
  switch (assetId) {
    case Coinbase.assets.Gwei:
      return Coinbase.assets.Eth;
    case Coinbase.assets.Wei:
      return Coinbase.assets.Eth;
    default:
      return assetId;
  }
};
