import { Address } from "viem";
import { Coinbase } from "../coinbase/coinbase";
import { wait, WaitOptions } from "../utils/wait";
import { UserOperation, UserOperationStatusEnum } from "../client";
import { SendUserOperationReturnType } from "./sendUserOperation";

export type WaitForUserOperationOptions = {
  id: string;
  smartWalletAddress: Address;
  waitOptions?: WaitOptions;
}

export type FailedOperation = {
  id: string;
  smartWalletAddress: Address;
  status: typeof UserOperationStatusEnum.Failed;
}

export type CompletedOperation = {
  id: string;
  smartWalletAddress: Address;
  status: typeof UserOperationStatusEnum.Complete;
  transactionHash: string;
}

export type WaitForUserOperationReturnType = FailedOperation | CompletedOperation;

export async function waitForUserOperation(options: WaitForUserOperationOptions): Promise<WaitForUserOperationReturnType> {
  const { id, smartWalletAddress } = options;

  const reload = async () => {
    const response = await Coinbase.apiClients.smartWallet!.getUserOperation(smartWalletAddress, id);
    return response.data;
  }

  const isTerminal = (
    operation: UserOperation
  ): boolean => {
    return operation.status === UserOperationStatusEnum.Complete || operation.status === UserOperationStatusEnum.Failed;
  };

  const transform = (operation: UserOperation): WaitForUserOperationReturnType => {
    if (operation.status === UserOperationStatusEnum.Failed) {
      return {
        id: operation.id,
        smartWalletAddress: smartWalletAddress,
        status: operation.status,
      } satisfies FailedOperation;
    } else if (operation.status === UserOperationStatusEnum.Complete) {
      return {
        id: operation.id,
        smartWalletAddress: smartWalletAddress,
        status: operation.status,
        transactionHash: operation.transaction_hash,
      } as CompletedOperation;
    } else {
      throw new Error("User operation is not terminal");
    }
  }

  const waitOptions = options.waitOptions || {
    timeoutSeconds: 30,
  };

  return await wait(reload, isTerminal, transform, waitOptions);
}
