import { AxiosResponse } from "axios";

/**
 * Prints Axios response to the console for debugging purposes.
 * @param response
 */
export const logApiResponse = (response: AxiosResponse, debugging = false): AxiosResponse => {
  if (debugging) {
    let output = typeof response.data === "string" ? response.data : "";

    if (typeof response.data === "object") {
      output = JSON.stringify(response.data, null, 4);
    }
    console.log(`API RESPONSE: ${response.status} ${response.config.url} ${output}`);
  }
  return response;
};
