import { AxiosResponse } from "axios";
import {
  convertAmount,
  destinationToAddressHexString,
  getNormalizedAssetId,
  logApiResponse,
  parseUnsignedPayload,
} from "./../coinbase/utils"; // Adjust the path as necessary
import { Address } from "../coinbase/address";
import { Wallet } from "../coinbase/wallet";
import { VALID_ADDRESS_MODEL, VALID_WALLET_MODEL } from "./utils";
import { Destination } from "../coinbase/types";
import { InvalidUnsignedPayload } from "../coinbase/errors";
import Decimal from "decimal.js";
import { Coinbase } from "../coinbase";
import { ATOMIC_UNITS_PER_USDC, WEI_PER_ETHER, WEI_PER_GWEI } from "../coinbase/constants";

describe("destinationToAddressHexString", () => {
  it("should return the string if destination is a string", () => {
    const destination = "0x12345";
    expect(destinationToAddressHexString(destination)).toBe(destination);
  });

  it("should return the ID if destination is an Address instance", () => {
    const address = new Address(VALID_ADDRESS_MODEL);
    jest.spyOn(address, "getId").mockReturnValue("0xabcde");
    expect(destinationToAddressHexString(address)).toBe("0xabcde");
  });

  it("should return the default address ID if destination is a Wallet instance", async () => {
    const address = new Address(VALID_ADDRESS_MODEL);
    const wallet = await Wallet.init(VALID_WALLET_MODEL);

    jest.spyOn(wallet, "getDefaultAddress").mockReturnValue(address);
    jest.spyOn(address, "getId").mockReturnValue("0x67890");
    expect(destinationToAddressHexString(wallet)).toBe("0x67890");
  });

  it("should throw an error if destination is an unsupported type", () => {
    const destination = 12345;
    expect(() => destinationToAddressHexString(destination as unknown as Destination)).toThrow(
      "Unsupported type",
    );
  });
});

describe("parseUnsignedPayload", () => {
  it("should parse and return a valid payload", () => {
    const payload = "7b226b6579223a2276616c7565227d"; // {"key":"value"} in hex
    const expectedOutput = { key: "value" };
    expect(parseUnsignedPayload(payload)).toEqual(expectedOutput);
  });

  it("should throw InvalidUnsignedPayload error if payload cannot be parsed", () => {
    const payload = "invalidhexstring";
    expect(() => parseUnsignedPayload(payload)).toThrow(InvalidUnsignedPayload);
  });

  it("should throw InvalidUnsignedPayload error if payload cannot be decoded to JSON", () => {
    const payload = "000102"; // Invalid JSON
    expect(() => parseUnsignedPayload(payload)).toThrow(InvalidUnsignedPayload);
  });

  it("should throw InvalidUnsignedPayload error if payload is an empty string", () => {
    const payload = "";
    expect(() => parseUnsignedPayload(payload)).toThrow(InvalidUnsignedPayload);
  });

  it("should throw InvalidUnsignedPayload error if payload contains non-hex characters", () => {
    const payload = "7b226b6579223a2276616c75657g7d"; // Invalid hex due to 'g'
    expect(() => parseUnsignedPayload(payload)).toThrow(InvalidUnsignedPayload);
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

describe("convertAmount", () => {
  test("should normalize ETH amount", () => {
    const amount = new Decimal(1);
    const assetId = Coinbase.assets.Eth;
    const expected = amount.mul(WEI_PER_ETHER);
    expect(convertAmount(amount, assetId).toString()).toBe(expected.toString());
  });

  test("should normalize Gwei amount", () => {
    const amount = new Decimal(1);
    const assetId = Coinbase.assets.Gwei;
    const expected = amount.mul(WEI_PER_GWEI);
    expect(convertAmount(amount, assetId).toString()).toBe(expected.toString());
  });

  test("should return the same amount for Wei", () => {
    const amount = new Decimal(1);
    const assetId = Coinbase.assets.Wei;
    expect(convertAmount(amount, assetId).toString()).toBe(amount.toString());
  });

  test("should normalize Weth amount", () => {
    const amount = new Decimal(1);
    const assetId = Coinbase.assets.Weth;
    const expected = amount.mul(WEI_PER_ETHER);
    expect(convertAmount(amount, assetId).toString()).toBe(expected.toString());
  });

  test("should normalize Usdc amount", () => {
    const amount = new Decimal(1);
    const assetId = Coinbase.assets.Usdc;
    const expected = amount.mul(ATOMIC_UNITS_PER_USDC);
    expect(convertAmount(amount, assetId).toString()).toBe(expected.toString());
  });

  test("should throw an error for unsupported asset ID", () => {
    const amount = new Decimal(1);
    const assetId = "unsupported_asset";
    expect(() => convertAmount(amount, assetId)).toThrow("Unsupported asset ID: unsupported_asset");
  });
});

describe("getNormalizedAssetId", () => {
  test("should return Eth for Gwei", () => {
    expect(getNormalizedAssetId(Coinbase.assets.Gwei)).toBe(Coinbase.assets.Eth);
  });

  test("should return Eth for Wei", () => {
    expect(getNormalizedAssetId(Coinbase.assets.Wei)).toBe(Coinbase.assets.Eth);
  });

  test("should return Usdc for Usdc", () => {
    expect(getNormalizedAssetId(Coinbase.assets.Usdc)).toBe(Coinbase.assets.Usdc);
  });

  test("should return the same asset ID for unsupported assets", () => {
    const unsupportedAsset = "unsupported_asset";
    expect(getNormalizedAssetId(unsupportedAsset)).toBe(unsupportedAsset);
  });
});
