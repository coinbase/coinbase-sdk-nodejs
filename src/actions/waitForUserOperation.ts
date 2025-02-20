import type { Address, Hex } from "../types/misc";
import { Coinbase } from "../coinbase/coinbase";
import { wait, WaitOptions } from "../utils/wait";
import { UserOperation, UserOperationStatusEnum } from "../client";

/**
 * Options for waiting for a user operation
 */
export type WaitForUserOperationOptions = {
  /** The UUID of the user operation which was returned by the sendUserOperation function */
  id: string;
  /** The address of the smart wallet */
  smartWalletAddress: Address;
  /** Optional options for the wait operation */
  waitOptions?: WaitOptions;
};

/**
 * Represents a failed user operation
 */
export type FailedOperation = {
  /** The UUID of the user operation which was returned by the sendUserOperation function */
  id: string;
  /** The address of the smart wallet */
  smartWalletAddress: Address;
  /** The status of the user operation */
  status: typeof UserOperationStatusEnum.Failed;
  /** The hash of the user operation */
  userOpHash: Hex;
};

/**
 * Represents a completed user operation
 */
export type CompletedOperation = {
  /** The UUID of the user operation which was returned by the sendUserOperation function */
  id: string;
  /** The address of the smart wallet */
  smartWalletAddress: Address;
  /** The transaction hash of the user operation */
  transactionHash: string;
  /** The status of the user operation */
  status: typeof UserOperationStatusEnum.Complete;
  /** The hash of the user operation */
  userOpHash: Hex;
};

/**
 * Represents the return type of the waitForUserOperation function
 */
export type WaitForUserOperationReturnType = FailedOperation | CompletedOperation;

/**
 * Waits for a user operation to complete or fail
 *
 * @example
 * ```ts
 * import { waitForUserOperation } from "@coinbase/coinbase-sdk";
 *
 * const result = await waitForUserOperation({
 *   id: "123",
 *   smartWalletAddress: "0x1234567890123456789012345678901234567890",
 *   waitOptions: {
 *     timeoutSeconds: 30,
 *   },
 * });
 * ```
 *
 * @param {WaitForUserOperationOptions} options - The options for the wait operation
 * @returns {Promise<WaitForUserOperationReturnType>} The result of the user operation
 */
export async function waitForUserOperation(
  options: WaitForUserOperationOptions,
): Promise<WaitForUserOperationReturnType> {
  const { id, smartWalletAddress } = options;

  const reload = async () => {
    const response = await Coinbase.apiClients.smartWallet!.getUserOperation(
      smartWalletAddress,
      id,
    );
    return response.data;
  };

  const transform = (operation: UserOperation): WaitForUserOperationReturnType => {
    if (operation.status === UserOperationStatusEnum.Failed) {
      return {
        id: operation.id,
        smartWalletAddress: smartWalletAddress,
        status: UserOperationStatusEnum.Failed,
        userOpHash: operation.user_op_hash as Hex,
      } satisfies FailedOperation;
    } else if (operation.status === UserOperationStatusEnum.Complete) {
      return {
        id: operation.id,
        smartWalletAddress: smartWalletAddress,
        transactionHash: operation.transaction_hash!,
        status: UserOperationStatusEnum.Complete,
        userOpHash: operation.user_op_hash as Hex,
      } satisfies CompletedOperation;
    } else {
      throw new Error("User operation is not terminal");
    }
  };

  const waitOptions = options.waitOptions || {
    timeoutSeconds: 30,
  };

  return await wait(reload, isTerminal, transform, waitOptions);
}

const isTerminal = (operation: UserOperation): boolean => {
  return (
    operation.status === UserOperationStatusEnum.Complete ||
    operation.status === UserOperationStatusEnum.Failed
  );
};
