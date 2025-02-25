import type { SmartWallet } from "../wallets/types";
import { UserOperationStatusEnum } from "../client";
import { CHAIN_ID_TO_NETWORK_ID, type SupportedChainId } from "../types/chain";
import type { Address, Hex } from "../types/misc";
import type { Calls } from "../types/calls";
import { encodeFunctionData } from "viem";
import { Coinbase } from "../coinbase/coinbase";

/**
 * Options for sending a user operation
 * @template T - Array type for the calls parameter
 */
export type SendUserOperationOptions<T extends readonly unknown[]> = {
  /**
   * Array of contract calls to execute in the user operation.
   * Each call can either be:
   * - A direct call with `to`, `value`, and `data`
   * - A contract call with `to`, `abi`, `functionName`, and `args`
   *
   * @example
   * ```ts
   * const calls = [
   *   {
   *     to: "0x1234567890123456789012345678901234567890",
   *     value: parseEther("0.0000005"),
   *     data: "0x",
   *   },
   *   {
   *     to: "0x1234567890123456789012345678901234567890",
   *     abi: erc20Abi,
   *     functionName: "transfer",
   *     args: [to, amount],
   *   },
   * ]
   * ```
   */
  calls: Calls<T>;
  /** Chain ID of the network to execute on */
  chainId: SupportedChainId;
  /** Optional URL of the paymaster service to use for gas sponsorship. Must be ERC-7677 compliant. */
  paymasterUrl?: string;
};

/**
 * Return type for the sendUserOperation function
 */
export type SendUserOperationReturnType = {
  /** The address of the smart wallet */
  smartWalletAddress: Address;
  /** The status of the user operation */
  status: typeof UserOperationStatusEnum.Broadcast;
  /** The hash of the user operation. This is not the transaction hash which is only available after the operation is completed.*/
  userOpHash: Hex;
};

/**
 * Sends a user operation to the network
 *
 * @example
 * ```ts
 * import { sendUserOperation } from "@coinbase/coinbase-sdk";
 * import { parseEther } from "viem";
 *
 * const result = await sendUserOperation(wallet, {
 *   calls: [
 *     {
 *       abi: erc20Abi,
 *       functionName: "transfer",
 *       args: [to, amount],
 *     },
 *     {
 *       to: "0x1234567890123456789012345678901234567890",
 *       data: "0x",
 *       value: parseEther("0.0000005"),
 *     },
 *   ],
 *   chainId: 1,
 *   paymasterUrl: "https://api.developer.coinbase.com/rpc/v1/base/someapikey",
 * });
 * ```
 *
 * @param {SmartWallet} wallet - The smart wallet to send the user operation from
 * @param {SendUserOperationOptions<T>} options - The options for the user operation
 * @returns {Promise<SendUserOperationReturnType>} The result of the user operation
 */
export async function sendUserOperation<T extends readonly unknown[]>(
  wallet: SmartWallet,
  options: SendUserOperationOptions<T>,
): Promise<SendUserOperationReturnType> {
  const { calls, chainId, paymasterUrl } = options;
  const network = CHAIN_ID_TO_NETWORK_ID[chainId];

  if (calls.length === 0) {
    throw new Error("Calls array is empty");
  }

  const encodedCalls = calls.map(call => {
    const value = (call.value ?? BigInt(0)).toString();

    if ("abi" in call && call.abi && "functionName" in call) {
      return {
        to: call.to,
        data: encodeFunctionData({
          abi: call.abi,
          functionName: call.functionName,
          args: call.args,
        }),
        value,
      };
    }

    return {
      to: call.to,
      data: call.data ?? "0x",
      value,
    };
  });

  const createOpResponse = await Coinbase.apiClients.smartWallet!.createUserOperation(
    wallet.address,
    network,
    {
      calls: encodedCalls,
      paymaster_url: paymasterUrl,
    },
  );

  const owner = wallet.owners[0];

  const signature = await owner.sign({
    hash: createOpResponse.data.user_op_hash as Hex,
  });

  const broadcastResponse = await Coinbase.apiClients.smartWallet!.broadcastUserOperation(
    wallet.address,
    createOpResponse.data.user_op_hash,
    {
      signature,
    },
  );

  return {
    smartWalletAddress: wallet.address,
    status: broadcastResponse.data.status,
    userOpHash: createOpResponse.data.user_op_hash,
  } as SendUserOperationReturnType;
}
