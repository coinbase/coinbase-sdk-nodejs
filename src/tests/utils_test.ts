import { AxiosResponse } from "axios";
import { InvalidUnsignedPayloadError } from "../coinbase/errors";
import { logApiResponse, parseUnsignedPayload } from "./../coinbase/utils"; // Adjust the path as necessary

describe("parseUnsignedPayload", () => {
  it("should parse and return a valid payload", () => {
    const payload = "7b226b6579223a2276616c7565227d"; // {"key":"value"} in hex
    const expectedOutput = { key: "value" };
    expect(parseUnsignedPayload(payload)).toEqual(expectedOutput);
  });

  it("should throw InvalidUnsignedPayload error if payload cannot be parsed", () => {
    const payload = "invalidhexstring";
    expect(() => parseUnsignedPayload(payload)).toThrow(InvalidUnsignedPayloadError);
  });

  it("should throw InvalidUnsignedPayload error if payload cannot be decoded to JSON", () => {
    const payload = "000102"; // Invalid JSON
    expect(() => parseUnsignedPayload(payload)).toThrow(InvalidUnsignedPayloadError);
  });

  it("should throw InvalidUnsignedPayload error if payload is an empty string", () => {
    const payload = "";
    expect(() => parseUnsignedPayload(payload)).toThrow(InvalidUnsignedPayloadError);
  });

  it("should throw InvalidUnsignedPayload error if payload contains non-hex characters", () => {
    const payload = "7b226b6579223a2276616c75657g7d"; // Invalid hex due to 'g'
    expect(() => parseUnsignedPayload(payload)).toThrow(InvalidUnsignedPayloadError);
  });
});

describe("logApiResponse", () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("should log response data as string when debugging is true and response data is a string", () => {
    const response = {
      data: "Response data",
      status: 200,
      statusText: "OK",
      headers: {},
      config: { url: "http://example.com" },
    } as AxiosResponse;
    logApiResponse(response, true);
    expect(consoleSpy).toHaveBeenCalledWith(`API RESPONSE: 
      Status: ${response.status} 
      URL: ${response.config.url} 
      Data: ${response.data}`);
  });

  it("should log response data as JSON string when debugging is true and response data is an object", () => {
    const response = {
      data: { key: "value" },
      status: 200,
      statusText: "OK",
      headers: {},
      config: { url: "http://example.com" },
    } as AxiosResponse;
    const expectedOutput = JSON.stringify(response.data, null, 4);
    logApiResponse(response, true);
    expect(consoleSpy).toHaveBeenCalledWith(`API RESPONSE: 
      Status: ${response.status} 
      URL: ${response.config.url} 
      Data: ${expectedOutput}`);
  });

  it("should not log anything when debugging is false", () => {
    const response = {
      data: { key: "value" },
      status: 200,
      statusText: "OK",
      headers: {},
      config: { url: "http://example.com" },
    } as AxiosResponse;
    logApiResponse(response, false);
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it("should return the response object", () => {
    const response = {
      data: { key: "value" },
      status: 200,
      statusText: "OK",
      headers: {},
      config: { url: "http://example.com" },
    } as AxiosResponse;
    const result = logApiResponse(response, false);
    expect(result).toBe(response);
  });
});
