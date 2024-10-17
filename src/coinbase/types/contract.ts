import {
  Abi,
  AbiFunction,
  AbiParameter,
  AbiParametersToPrimitiveTypes,
  ExtractAbiFunction,
} from "abitype";
import { ContractFunctionName } from "viem";

/**
 * Converts an array of ABI parameters to a dictionary type.
 * Each parameter name becomes a key in the resulting dictionary, with a string value.
 */
type AbiParametersToDictionary<T extends readonly AbiParameter[]> = {
  [K in T[number]["name"] as K extends string ? K : never]: string;
};

/**
 * Checks if two types are exactly the same.
 * Returns true if TArgs and TParams are identical, false otherwise.
 */
type MatchesParams<TArgs, TParams> = TArgs extends TParams
  ? TParams extends TArgs
    ? true
    : false
  : false;

/**
 * Matches the provided arguments to a specific function in the ABI.
 * Returns the matched AbiFunction if found, never otherwise.
 */
type MatchArgsToFunction<
  TAbi extends Abi,
  TFunctionName extends string,
  TArgs extends Record<string, string>,
> =
  ExtractAbiFunction<TAbi, TFunctionName> extends infer TFunctions
    ? TFunctions extends AbiFunction
      ? MatchesParams<TArgs, AbiParametersToDictionary<TFunctions["inputs"]>> extends true
        ? TFunctions
        : never
      : never
    : never;

/**
 * Determines the return type of a contract function based on the ABI, function name, and arguments.
 *
 * @template TAbi - The ABI of the contract
 * @template TFunctionName - The name of the function to call
 * @template TArgs - The arguments to pass to the function (optional)
 *
 * @returns The return type of the function:
 *  - void if the function has no outputs
 *  - The single output type if there's only one output
 *  - A tuple of output types if there are multiple outputs
 *  - unknown if the function or its return type cannot be determined
 */
export type ContractFunctionReturnType<
  TAbi extends Abi,
  TFunctionName extends ContractFunctionName<TAbi, "view" | "pure">,
  TArgs extends Record<string, string> = {},
> =
  MatchArgsToFunction<TAbi, TFunctionName, TArgs> extends infer TFunction
    ? TFunction extends AbiFunction
      ? AbiParametersToPrimitiveTypes<TFunction["outputs"]> extends infer TOutputs
        ? TOutputs extends readonly []
          ? void
          : TOutputs extends readonly [infer TOutput]
            ? TOutput
            : TOutputs
        : never
      : unknown
    : unknown;
