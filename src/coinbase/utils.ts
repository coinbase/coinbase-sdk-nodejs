/* eslint-disable @typescript-eslint/no-explicit-any */
import { Axios, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { APIError } from "./api_error";

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
