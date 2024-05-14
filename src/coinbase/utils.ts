import { AxiosResponse } from "axios";

/**
 * Prints Axios response to the console for debugging purposes.
 * @param response - The Axios response object.
 * @param debugging - Flag to enable or disable logging.
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
