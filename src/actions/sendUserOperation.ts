import type { SmartWallet } from "../wallets/types";
import { UserOperationStatusEnum } from "../client";
import { Address, encodeFunctionData, Hex } from "viem";
import { Coinbase } from "../coinbase/coinbase";
import { CHAIN_ID_TO_NETWORK_ID, type SupportedChainId } from "../types/chain";
import type { Calls } from "viem/types/calls";
import type { SendUserOperationParameters } from "viem/account-abstraction/";

/**
 * Options for sending a user operation
 * @template T - Array type for the calls parameter
 */
export type SendUserOperationOptions<T extends readonly unknown[]> = {
  /** Array of contract calls to execute in the user operation */
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
  /** The ID of the user operation */
  id: string;
  /** The address of the smart wallet */
  smartWalletAddress: Address;
  /** The status of the user operation */
  status: typeof UserOperationStatusEnum.Broadcast;
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

  const encodedCalls = calls.map(call => {
    if ("abi" in call) {
      return {
        data: encodeFunctionData({
          abi: call.abi,
          functionName: call.functionName,
          args: call.args,
        }),
        to: call.to,
        value: call.value.toString() || "0",
      };
    }
    return {
      data: call.data,
      to: call.to,
      value: call.value.toString() || "0",
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
    hash: createOpResponse.data.unsigned_payload as Hex,
  });

  const broadcastResponse = await Coinbase.apiClients.smartWallet!.broadcastUserOperation(
    wallet.address,
    createOpResponse.data.id,
    {
      signature,
    },
  );

  return {
    id: broadcastResponse.data.id,
    smartWalletAddress: wallet.address,
    status: broadcastResponse.data.status,
    transactionHash: broadcastResponse.data.transaction_hash,
  } as SendUserOperationReturnType;
}
