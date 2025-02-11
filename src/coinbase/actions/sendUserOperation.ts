import { UserOperationCalls } from "viem/_types/account-abstraction";
import { SmartWallet } from "../wallets/types";
import { NetworkIdentifier, UserOperationStatusEnum } from "../../client";
import { encodeFunctionData, Hex } from "viem";
import { Coinbase } from "../coinbase";
import { wait } from "../utils/wait";

export type SendUserOperationOptions<T extends readonly unknown[]> = {
  calls: UserOperationCalls<T>;
};

export type SendUserOperationReturnType = {
  id: string;
  networkId: NetworkIdentifier;
  smartWalletAddress: string;
  status: UserOperationStatusEnum;
  wait: () => Promise<SendUserOperationReturnType>;
};

export async function sendUserOperation<T extends readonly unknown[]>(
  wallet: SmartWallet,
  options: SendUserOperationOptions<T>,
): Promise<SendUserOperationReturnType> {
  const { networkId } = wallet;
  if (!networkId) {
    throw new Error("Network not set - call use({networkId}) first");
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
    networkId,
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

  if (!broadcastResponse.data || !broadcastResponse.data.status) {
    throw new Error("Failed to broadcast user operation");
  }

  const returnValue: SendUserOperationReturnType = {
    id: broadcastResponse.data.id,
    networkId,
    smartWalletAddress: wallet.address,
    status: broadcastResponse.data.status,
    wait: async () => {
      const reload = async () => {
        const result = await Coinbase.apiClients.smartWallet!.getUserOperation(
          wallet.address,
          broadcastResponse.data.id,
        );

        if (!result.data) {
          throw new Error("Failed to get user operation status");
        }

        return {
          ...returnValue,
          status: result.data.status!,
          wait: returnValue.wait,
        };
      };

      return wait(
        reload,
        op =>
          op.status === UserOperationStatusEnum.Complete ||
          op.status === UserOperationStatusEnum.Failed,
        { intervalSeconds: 0.2, timeoutSeconds: 10 },
      );
    },
  };

  return returnValue;
}
