import {
  Abi,
  AbiFunction,
  AbiParameter,
  AbiParametersToPrimitiveTypes,
  ExtractAbiFunction,
} from "abitype";
import { ContractFunctionName } from "viem";

export type NestedArgsValue = string | NestedArgs | NestedArgsValue[];

export interface NestedArgs {
  [key: string]: NestedArgsValue;
}
/**
 * Converts an array of ABI parameters to a nested dictionary type.
 * Each parameter name becomes a key in the resulting dictionary, with a NestedArgs value.
 */
type AbiParametersToNestedDictionary<T extends readonly AbiParameter[]> = {
  [K in T[number]["name"] as K extends string ? K : never]: NestedArgs[string];
};

/**
 * Checks if two types are compatible, allowing for nested structures.
 * Returns true if TArgs is assignable to TParams, false otherwise.
 */
type IsCompatibleWithParams<TArgs, TParams> = TParams extends NestedArgs
  ? TArgs extends NestedArgs
    ? true
    : false
  : TParams extends string
  ? TArgs extends string
    ? true
    : false
  : TParams extends Array<infer TParamItem>
  ? TArgs extends Array<infer TArgItem>
    ? IsCompatibleWithParams<TArgItem, TParamItem>
    : false
  : TParams extends object
  ? TArgs extends object
    ? {
        [K in keyof TParams]: K extends keyof TArgs
          ? IsCompatibleWithParams<TArgs[K], TParams[K]>
          : false;
      }[keyof TParams] extends true
      ? true
      : false
    : false
  : false;

/**
 * Matches the provided arguments to a specific function in the ABI.
 * Returns the matched AbiFunction if found, never otherwise.
 */
type MatchArgsToFunction<
  TAbi extends Abi,
  TFunctionName extends string,
  TArgs extends NestedArgs,
> = ExtractAbiFunction<TAbi, TFunctionName> extends infer TFunctions
  ? TFunctions extends AbiFunction
    ? IsCompatibleWithParams<TArgs, AbiParametersToNestedDictionary<TFunctions["inputs"]>> extends true
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
  TArgs extends NestedArgs = {},
> = MatchArgsToFunction<TAbi, TFunctionName, TArgs> extends infer TFunction
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