/* eslint-disable  @typescript-eslint/no-explicit-any */
import type { Abi } from "abitype";
import { Coinbase } from "./coinbase";
import { ContractFunctionName } from "viem";
import { SolidityValue } from "../client";
import { ContractFunctionReturnType } from "./types/contract";

/**
 * Converts a SolidityValue to its corresponding JavaScript type.
 *
 * @param {SolidityValue} solidityValue - The Solidity value to convert.
 * @returns {unknown} The converted JavaScript value.
 */
function convertSolidityValue(solidityValue: SolidityValue): unknown {
  const { type, value, values } = solidityValue;

  switch (type) {
    case "uint8":
    case "uint16":
    case "uint32":
    case "int8":
    case "int16":
    case "int32":
      return Number(value);
    case "uint64":
    case "uint128":
    case "uint256":
    case "int64":
    case "int128":
    case "int256":
      return BigInt(value!);
    case "address":
      return value as `0x${string}`;
    case "bool":
      return value === "true";
    case "string":
      return value;
    case "bytes":
    case "bytes1":
    case "bytes2":
    case "bytes3":
    case "bytes4":
    case "bytes5":
    case "bytes6":
    case "bytes7":
    case "bytes8":
    case "bytes9":
    case "bytes10":
    case "bytes11":
    case "bytes12":
    case "bytes13":
    case "bytes14":
    case "bytes15":
    case "bytes16":
    case "bytes17":
    case "bytes18":
    case "bytes19":
    case "bytes20":
    case "bytes21":
    case "bytes22":
    case "bytes23":
    case "bytes24":
    case "bytes25":
    case "bytes26":
    case "bytes27":
    case "bytes28":
    case "bytes29":
    case "bytes30":
    case "bytes31":
    case "bytes32":
      return value as `0x${string}`;
    case "array":
      return values!.map(convertSolidityValue);
    case "tuple":
      return values!.reduce(
        (acc, val) => {
          if (!val.name) {
            throw new Error("Tuple field missing name");
          }
          acc[val.name] = convertSolidityValue(val);
          return acc;
        },
        {} as Record<string, unknown>,
      );
    default:
      throw new Error(`Unsupported Solidity type: ${type}`);
  }
}

/**
 * Parses a SolidityValue to a specific type T.
 *
 * @template T
 * @param {SolidityValue} solidityValue - The Solidity value to parse.
 * @returns {T} The parsed value of type T.
 */
function parseSolidityValue<T>(solidityValue: SolidityValue): T {
  return convertSolidityValue(solidityValue) as T;
}

/**
 * Reads data from a smart contract using the Coinbase API.
 *
 * @template TAbi - The ABI type.
 * @template TFunctionName - The contract function name type.
 * @template TArgs - The function arguments type.
 * @param {object} params - The parameters for reading the contract.
 * @param {string} params.networkId - The network ID.
 * @param {string} params.contractAddress - The contract address (as a hexadecimal string).
 * @param {TFunctionName} params.method - The contract method to call.
 * @param {TArgs} params.args - The arguments for the contract method.
 * @param {TAbi} [params.abi] - The contract ABI (optional).
 * @returns {Promise<any>} The result of the contract call.
 */
export async function readContract<
  TAbi extends Abi | undefined,
  TFunctionName extends TAbi extends Abi ? ContractFunctionName<TAbi, "view" | "pure"> : string,
  TArgs extends Record<string, any>,
>(params: {
  networkId: string;
  contractAddress: `0x${string}`;
  method: TFunctionName;
  args: TArgs;
  abi?: TAbi;
}): Promise<
  TAbi extends Abi
    ? ContractFunctionReturnType<
        TAbi,
        Extract<TFunctionName, ContractFunctionName<TAbi, "view" | "pure">>,
        TArgs
      >
    : any
> {
  const response = await Coinbase.apiClients.smartContract!.readContract(
    params.networkId,
    params.contractAddress,
    {
      method: params.method,
      args: JSON.stringify(params.args || {}),
      abi: params.abi ? JSON.stringify(params.abi) : undefined,
    },
  );

  return parseSolidityValue<
    TAbi extends Abi
      ? ContractFunctionReturnType<
          TAbi,
          Extract<TFunctionName, ContractFunctionName<TAbi, "view" | "pure">>,
          TArgs
        >
      : unknown
  >(response.data);
}
