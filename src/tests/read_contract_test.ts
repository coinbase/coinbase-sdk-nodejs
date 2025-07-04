import { readContract } from "../coinbase/read_contract";
import { Coinbase } from "../coinbase/coinbase";
import { SolidityValue } from "../client";
import { smartContractApiMock, testAllReadTypesABI } from "./utils";

describe("readContract", () => {
  beforeEach(() => {
    // Assign the mock to Coinbase.apiClients.smartContract
    Coinbase.apiClients.smartContract = smartContractApiMock;

    // Clear all mock calls before each test
    jest.clearAllMocks();
  });

  describe("With an ABI", () => {
    it("should correctly read a uint8 value from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "uint8",
          value: "123",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureUint8",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureUint8",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toBe(123);
    });

    it("should correctly read a uint16 value from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "uint16",
          value: "12345",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureUint16",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureUint16",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toBe(12345);
    });

    it("should correctly read a uint32 value from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "uint32",
          value: "4294967295",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureUint32",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureUint32",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toBe(4294967295);
    });

    it("should correctly read a uint64 value from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "uint64",
          value: "18446744073709551615",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureUint64",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureUint64",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toBe(18446744073709551615n);
    });

    it("should correctly read a uint128 value from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "uint128",
          value: "340282366920938463463374607431768211455",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureUint128",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureUint128",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toBe(340282366920938463463374607431768211455n);
    });

    it("should correctly read a uint256 value from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "uint256",
          value: "123456789",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureUint256",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureUint256",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      // Check if the result is correctly parsed
      expect(result).toBe(123456789n);
    });

    it("should correctly read an int8 value from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "int8",
          value: "-128",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureInt8",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureInt8",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toBe(-128);
    });

    it("should correctly read an int16 value from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "int16",
          value: "-32768",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureInt16",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureInt16",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toBe(-32768);
    });

    it("should correctly read an int32 value from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "int32",
          value: "-2147483648",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureInt32",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureInt32",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toBe(-2147483648);
    });

    it("should correctly read an int64 value from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "int64",
          value: "-9223372036854775808",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureInt64",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureInt64",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toBe(-9223372036854775808n);
    });

    it("should correctly read an int128 value from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "int128",
          value: "-170141183460469231731687303715884105728",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureInt128",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureInt128",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toBe(-170141183460469231731687303715884105728n);
    });

    it("should correctly read a int256 value from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "int256",
          value: "-170141183460469231731687303715884105728",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureInt256",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureInt256",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toBe(-170141183460469231731687303715884105728n);
    });

    it("should correctly read a bool value from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "bool",
          value: "true",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureBool",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureBool",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toBe(true);
    });

    it("should correctly read a string value from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "string",
          value: "Hello, World!",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureString",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureString",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toBe("Hello, World!");
    });

    it("should correctly read an address value from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "address",
          value: "0x1234567890123456789012345678901234567890",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureAddress",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureAddress",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toBe("0x1234567890123456789012345678901234567890");
    });

    it("should correctly read a bytes1 value from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "bytes1",
          value: "0x12",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureBytes1",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureBytes1",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toBe("0x12");
    });

    it("should correctly read a bytes2 value from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "bytes2",
          value: "0x1234",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureBytes2",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureBytes2",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toBe("0x1234");
    });

    it("should correctly read a bytes3 value from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "bytes3",
          value: "0x123456",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureBytes3",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureBytes3",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toBe("0x123456");
    });

    it("should correctly read a bytes4 value from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "bytes4",
          value: "0x12345678",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureBytes4",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureBytes4",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toBe("0x12345678");
    });

    it("should correctly read a bytes5 value from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "bytes5",
          value: "0x123456789",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureBytes5",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureBytes5",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toBe("0x123456789");
    });

    it("should correctly read a bytes6 value from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "bytes6",
          value: "0x123456789012",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureBytes6",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureBytes6",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toBe("0x123456789012");
    });

    it("should correctly read a bytes7 value from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "bytes7",
          value: "0x123456789012345",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureBytes7",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureBytes7",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toBe("0x123456789012345");
    });

    it("should correctly read a bytes8 value from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "bytes8",
          value: "0x123456789012345678",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureBytes8",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureBytes8",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toBe("0x123456789012345678");
    });

    it("should correctly read a bytes9 value from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "bytes9",
          value: "0x123456789012345678901",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureBytes9",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureBytes9",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toBe("0x123456789012345678901");
    });

    it("should correctly read a bytes10 value from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "bytes10",
          value: "0x123456789012345678901234",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureBytes10",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureBytes10",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toBe("0x123456789012345678901234");
    });

    it("should correctly read a bytes11 value from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "bytes11",
          value: "0x123456789012345678901234567",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureBytes11",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureBytes11",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toBe("0x123456789012345678901234567");
    });

    it("should correctly read a bytes12 value from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "bytes12",
          value: "0x123456789012345678901234567890",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureBytes12",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureBytes12",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toBe("0x123456789012345678901234567890");
    });

    it("should correctly read a bytes13 value from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "bytes13",
          value: "0x123456789012345678901234567890123",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureBytes13",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureBytes13",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toBe("0x123456789012345678901234567890123");
    });

    it("should correctly read a bytes14 value from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "bytes14",
          value: "0x123456789012345678901234567890123456",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureBytes14",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureBytes14",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toBe("0x123456789012345678901234567890123456");
    });

    it("should correctly read a bytes15 value from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "bytes15",
          value: "0x123456789012345678901234567890123456789",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureBytes15",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureBytes15",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toBe("0x123456789012345678901234567890123456789");
    });

    it("should correctly read a bytes16 value from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "bytes16",
          value: "0x12345678901234567890123456789012",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureBytes16",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureBytes16",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toBe("0x12345678901234567890123456789012");
    });

    it("should correctly read a bytes17 value from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "bytes17",
          value: "0x1234567890123456789012345678901234",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureBytes17",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureBytes17",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toBe("0x1234567890123456789012345678901234");
    });

    it("should correctly read a bytes18 value from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "bytes18",
          value: "0x123456789012345678901234567890123456",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureBytes18",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureBytes18",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toBe("0x123456789012345678901234567890123456");
    });

    it("should correctly read a bytes19 value from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "bytes19",
          value: "0x12345678901234567890123456789012345678",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureBytes19",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureBytes19",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toBe("0x12345678901234567890123456789012345678");
    });

    it("should correctly read a bytes20 value from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "bytes20",
          value: "0x1234567890123456789012345678901234567890",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureBytes20",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureBytes20",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toBe("0x1234567890123456789012345678901234567890");
    });

    it("should correctly read a bytes21 value from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "bytes21",
          value: "0x123456789012345678901234567890123456789012",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureBytes21",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureBytes21",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toBe("0x123456789012345678901234567890123456789012");
    });

    it("should correctly read a bytes22 value from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "bytes22",
          value: "0x12345678901234567890123456789012345678901234",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureBytes22",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureBytes22",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toBe("0x12345678901234567890123456789012345678901234");
    });

    it("should correctly read a bytes23 value from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "bytes23",
          value: "0x1234567890123456789012345678901234567890123456",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureBytes23",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureBytes23",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toBe("0x1234567890123456789012345678901234567890123456");
    });

    it("should correctly read a bytes24 value from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "bytes24",
          value: "0x123456789012345678901234567890123456789012345678",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureBytes24",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureBytes24",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toBe("0x123456789012345678901234567890123456789012345678");
    });

    it("should correctly read a bytes25 value from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "bytes25",
          value: "0x12345678901234567890123456789012345678901234567890",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureBytes25",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureBytes25",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toBe("0x12345678901234567890123456789012345678901234567890");
    });

    it("should correctly read a bytes26 value from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "bytes26",
          value: "0x1234567890123456789012345678901234567890123456789012",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureBytes26",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureBytes26",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toBe("0x1234567890123456789012345678901234567890123456789012");
    });

    it("should correctly read a bytes27 value from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "bytes27",
          value: "0x123456789012345678901234567890123456789012345678901234",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureBytes27",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureBytes27",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toBe("0x123456789012345678901234567890123456789012345678901234");
    });

    it("should correctly read a bytes28 value from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "bytes28",
          value: "0x12345678901234567890123456789012345678901234567890123456",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureBytes28",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureBytes28",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toBe("0x12345678901234567890123456789012345678901234567890123456");
    });

    it("should correctly read a bytes29 value from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "bytes29",
          value: "0x1234567890123456789012345678901234567890123456789012345678",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureBytes29",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureBytes29",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toBe("0x1234567890123456789012345678901234567890123456789012345678");
    });

    it("should correctly read a bytes30 value from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "bytes30",
          value: "0x123456789012345678901234567890123456789012345678901234567890",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureBytes30",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureBytes30",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toBe("0x123456789012345678901234567890123456789012345678901234567890");
    });

    it("should correctly read a bytes31 value from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "bytes31",
          value: "0x12345678901234567890123456789012345678901234567890123456789012",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureBytes31",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureBytes31",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toBe("0x12345678901234567890123456789012345678901234567890123456789012");
    });

    it("should correctly read a bytes32 value from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "bytes32",
          value: "0x1234567890123456789012345678901234567890123456789012345678901234",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureBytes32",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureBytes32",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toBe("0x1234567890123456789012345678901234567890123456789012345678901234");
    });

    it("should correctly read a bytes value from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "bytes",
          value: "0x1234567890123456789012345678901234567890123456789012345678901234",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureBytes",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureBytes",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toBe("0x1234567890123456789012345678901234567890123456789012345678901234");
    });

    it("should correctly read an array from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "array",
          values: [
            { type: "uint256", value: "1" },
            { type: "uint256", value: "2" },
            { type: "uint256", value: "3" },
            { type: "uint256", value: "4" },
            { type: "uint256", value: "5" },
          ],
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureArray",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureArray",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toEqual([1n, 2n, 3n, 4n, 5n]);
    });

    it("should correctly read a tuple from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "tuple",
          values: [
            { type: "uint256", value: "1", name: "a" },
            { type: "uint256", value: "2", name: "b" },
          ],
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureTuple",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureTuple",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toEqual({ a: 1n, b: 2n });
    });

    it("should correctly read a tuple with mixed types from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "tuple",
          values: [
            { type: "uint256", value: "1", name: "a" },
            { type: "address", value: "0x1234567890123456789012345678901234567890", name: "b" },
            { type: "bool", value: "true", name: "c" },
          ],
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureTupleMixedTypes",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureTupleMixedTypes",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toEqual({ a: 1n, b: "0x1234567890123456789012345678901234567890", c: true });
    });

    it("should correctly read a function type as bytes", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "bytes",
          value: "0x12341234123412341234123400000000",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "returnFunction",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "returnFunction",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toBe("0x12341234123412341234123400000000");
    });

    it("should correctly read a nested struct from a pure function", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "tuple",
          values: [
            { type: "uint256", value: "42", name: "a" },
            {
              type: "tuple",
              name: "nestedFields",
              values: [
                {
                  type: "tuple",
                  name: "nestedArray",
                  values: [
                    {
                      type: "array",
                      name: "a",
                      values: [
                        { type: "uint256", value: "1" },
                        { type: "uint256", value: "2" },
                        { type: "uint256", value: "3" },
                      ],
                    },
                  ],
                },
                { type: "uint256", value: "123", name: "a" },
              ],
            },
          ],
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureNestedStruct",
        args: {},
        abi: testAllReadTypesABI,
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureNestedStruct",
          args: "{}",
          abi: JSON.stringify(testAllReadTypesABI),
        },
      );

      expect(result).toEqual({
        a: 42n,
        nestedFields: {
          nestedArray: {
            a: [1n, 2n, 3n],
          },
          a: 123n,
        },
      });
    });
  });

  describe("Without an ABI", () => {
    it("should correctly read a string from a pure function without an ABI", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "string",
          value: "Hello, World!",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureString",
        args: {},
      });
      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureString",
          args: "{}",
        },
      );

      expect(result).toBe("Hello, World!");
      expect(typeof result).toBe("string");
    });

    it("should correctly read a boolean from a pure function without an ABI", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "bool",
          value: "true",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureBool",
        args: {},
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureBool",
          args: "{}",
        },
      );

      expect(result).toBe(true);
      expect(typeof result).toBe("boolean");
    });

    it("should correctly read an int8 from a pure function without an ABI", async () => {
      smartContractApiMock.readContract.mockResolvedValue({
        data: {
          type: "int8",
          value: "42",
        },
      });

      const result = await readContract({
        networkId: "1",
        contractAddress: "0x1234567890123456789012345678901234567890",
        method: "pureInt8",
        args: {},
      });

      expect(smartContractApiMock.readContract).toHaveBeenCalledWith(
        "1",
        "0x1234567890123456789012345678901234567890",
        {
          method: "pureInt8",
          args: "{}",
        },
      );

      expect(result).toBe(42);
      expect(typeof result).toBe("number");
    });
  });
});
