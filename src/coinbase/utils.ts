/* eslint-disable @typescript-eslint/no-explicit-any */
import { Axios, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { APIError } from "./api_error";
import { InvalidUnsignedPayload } from "./errors";

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
 * Formats the input date to 'YYYY-MM-DD'
 *
 * @param date - The date to format.
 *
 * @returns a formated date of 'YYYY-MM-DD'
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-based, so add 1
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}T00:00:00Z`;
}

/**
 *
 * Takes a date and subtracts a week from it. (7 days)
 *
 * @param date - The date to be formatted.
 *
 * @returns a formatted date that is one week ago.
 */
export function getWeekBackDate(date: Date): string {
  date.setDate(date.getDate() - 7);
  return formatDate(date);
}
