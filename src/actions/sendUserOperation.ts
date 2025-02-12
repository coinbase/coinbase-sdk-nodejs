import { UserOperationCalls } from "viem/_types/account-abstraction";
import { SmartWallet } from "../wallets/types";
import { UserOperationStatusEnum } from "../client";
import { encodeFunctionData, Hex, Prettify } from "viem";
import { Coinbase } from "../coinbase/coinbase";
import { wait } from "../utils/wait";
import { Network } from "../types/chain";

export type SendUserOperationOptions<T extends readonly unknown[]> = {
  calls: UserOperationCalls<T>;
};

type BaseUserOperation = {
  id: string;
  network: Network;
  smartWalletAddress: Hex;
  wait: () => Promise<SendUserOperationReturnType>;
};

type CompletedOperation = Prettify<BaseUserOperation & {
  status: typeof UserOperationStatusEnum.Complete;
  transactionHash: string;
}>

type FailedOperation = Prettify<BaseUserOperation & {
  status: typeof UserOperationStatusEnum.Failed;
  transactionHash?: string;
}>

type PendingOperation = Prettify<BaseUserOperation & {
  status: Extract<
    UserOperationStatusEnum, 
    typeof UserOperationStatusEnum.Pending | 
    typeof UserOperationStatusEnum.Signed | 
    typeof UserOperationStatusEnum.Broadcast
  >;
  transactionHash?: string;
}>

export type SendUserOperationReturnType = CompletedOperation | PendingOperation | FailedOperation;

export async function sendUserOperation<T extends readonly unknown[]>(
  wallet: SmartWallet,
  options: { calls: UserOperationCalls<T> },
): Promise<SendUserOperationReturnType> {
  const { network } = wallet;
  if (!network) {
    throw new Error("Network not set - call useNetwork({chainId}) first");
  }

  const encodedCalls = options.calls.map(call => {
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
    network.networkId,
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

  const returnValue: SendUserOperationReturnType = {
    id: broadcastResponse.data.id,
    network,
    smartWalletAddress: wallet.address,
    status: broadcastResponse.data.status,
    transactionHash: broadcastResponse.data.transaction_hash,
    wait: async () => {
      const reload = async () => {
        const result = await Coinbase.apiClients.smartWallet!.getUserOperation(
          wallet.address,
          broadcastResponse.data.id,
        );

        if (!result.data) {
          throw new Error("Failed to get user operation status");
        }

        if (result.data.status === UserOperationStatusEnum.Complete) {
          return {
            ...returnValue,
            status: result.data.status,
            transactionHash: result.data.transaction_hash!,
            wait: returnValue.wait,
          } as CompletedOperation;
        } else if (result.data.status === UserOperationStatusEnum.Failed) {
          return {
            ...returnValue,
            status: result.data.status,
            transactionHash: result.data.transaction_hash,
            wait: returnValue.wait,
          } as FailedOperation;
        } else {
          return {
            ...returnValue,
            status: result.data.status,
            transactionHash: result.data.transaction_hash,
            wait: returnValue.wait,
          } as PendingOperation;
        }
      };

      return wait(
        reload,
        (op: SendUserOperationReturnType) =>
          op.status === UserOperationStatusEnum.Complete ||
          op.status === UserOperationStatusEnum.Failed,
        { intervalSeconds: 0.2 },
      );
    },
  } as SendUserOperationReturnType;

  return returnValue;
}
