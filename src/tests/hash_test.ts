import { ethers } from "ethers";
import { hashMessage, hashTypedDataMessage } from "../coinbase/hash";

describe("hashMessage", () => {
  const mockHashMessage = jest.spyOn(ethers, "hashMessage");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should hash a string message correctly using EIP-191", () => {
    const message = "Hello, Ethereum!";
    const expectedHash = "0xExpectedHash";

    mockHashMessage.mockReturnValue(expectedHash);

    const result = hashMessage(message);
    expect(result).toBe(expectedHash);
    expect(mockHashMessage).toHaveBeenCalledWith(message);
    expect(mockHashMessage).toHaveBeenCalledTimes(1);
  });

  it("should throw an error if ethers throws an error", () => {
    const invalidMessage = 12345;
    const expectedError = new Error("invalid message");

    mockHashMessage.mockImplementation(() => {
      throw expectedError;
    });

    expect(() => hashMessage(invalidMessage as any)).toThrow(expectedError);
    expect(mockHashMessage).toHaveBeenCalledWith(invalidMessage);
    expect(mockHashMessage).toHaveBeenCalledTimes(1);
  });
});

describe("hashTypedDataMessage", () => {
  const mockTypedDataEncoderHash = jest.spyOn(ethers.TypedDataEncoder, "hash");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should hash typed data message correctly using EIP-712", () => {
    const domain = {
      name: "Ether Mail",
      version: "1",
      chainId: 1,
      verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
    };

    const types = {
      Person: [
        { name: "name", type: "string" },
        { name: "wallet", type: "address" },
      ],
    };

    const value = {
      name: "Alice",
      wallet: "0x123456789abcdef123456789abcdef123456789a",
    };

    const expectedHash = "0xExpectedHash";

    mockTypedDataEncoderHash.mockReturnValue(expectedHash);

    const result = hashTypedDataMessage(domain, types, value);
    expect(result).toBe(expectedHash);
    expect(mockTypedDataEncoderHash).toHaveBeenCalledWith(domain, types, value);
    expect(mockTypedDataEncoderHash).toHaveBeenCalledTimes(1);
  });

  it("should throw an error if ethers throws an error", () => {
    const domain = {
      name: "Invalid",
      version: "1",
      chainId: 1,
      verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
    };

    const types = {
      Person: [
        { name: "name", type: "string" },
        { name: "wallet", type: "address" },
      ],
    };

    const value = {
      name: "InvalidName",
      wallet: "invalidWallet",
    };

    const expectedError = new Error("invalid typed data message");

    mockTypedDataEncoderHash.mockImplementation(() => {
      throw expectedError;
    });

    expect(() => {
      hashTypedDataMessage(domain, types, value);
    }).toThrow(expectedError);
    expect(mockTypedDataEncoderHash).toHaveBeenCalledWith(domain, types, value);
    expect(mockTypedDataEncoderHash).toHaveBeenCalledTimes(1);
  });
});
