import { SmartWallet } from "../wallets/types";
import { UserOperationStatusEnum } from "../client";
import { encodeFunctionData, Hex, Prettify } from "viem";
import { Coinbase } from "../coinbase/coinbase";
import { CHAIN_ID_TO_NETWORK_ID, Network, SupportedChainId } from "../types/chain";
import { Calls } from "viem/_types/types/calls";

export type SendUserOperationOptions<T extends readonly unknown[]> = {
  calls: Calls<T>;
  chainId: SupportedChainId;
  paymasterUrl?: string;
};

export type BroadcastedOperation = {
  id: string;
  status: typeof UserOperationStatusEnum.Broadcast;
}

export type CompletedOperation = {
  id: string;
  status: typeof UserOperationStatusEnum.Complete;
  transactionHash: string;
}

export type SendUserOperationReturnType = BroadcastedOperation | CompletedOperation;

export async function sendUserOperation<T extends readonly unknown[]>(
  wallet: SmartWallet,
  options: SendUserOperationOptions<T>,
): Promise<BroadcastedOperation> {
  const { calls, chainId, paymasterUrl } = options
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
    },
  );

  if (!createOpResponse.data) {
    throw new Error("Failed to create user operation");
  }

  if (!wallet.account.sign) {
    throw new Error("Account does not support signing");
  }

  const signature = await wallet.account.sign({
    hash: createOpResponse.data.unsigned_payload as Hex,
  });

  const broadcastResponse = await Coinbase.apiClients.smartWallet!.broadcastUserOperation(
    wallet.address,
    createOpResponse.data.id,
    {
      signature,
    },
  );

  if (!broadcastResponse.data.status) {
    throw new Error("Failed to broadcast user operation");
  }

  const returnValue = {
    id: broadcastResponse.data.id,
    status: broadcastResponse.data.status,
    transactionHash: broadcastResponse.data.transaction_hash,
  } as BroadcastedOperation;

  return returnValue;
}
