import { Address } from "viem";
import { Network } from "../types/chain";
import { Coinbase } from "../coinbase/coinbase";
import { wait, WaitOptions } from "../utils/wait";
import { UserOperationStatusEnum } from "../client";

export type WaitForUserOperationOptions = {
  id: string;
  smartWalletAddress: Address;
  waitOptions?: WaitOptions
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
    const userOperation = await Coinbase.apiClients.smartWallet!.getUserOperation(smartWalletAddress, id);

    if (!userOperation.data) {
      throw new Error("User operation not found");
    }

    return {
      id: userOperation.data.id,
      smartWalletAddress: smartWalletAddress,
      status: userOperation.data.status,
      transactionHash: userOperation.data.transaction_hash,
    } as WaitForUserOperationReturnType;
  }
  
  return wait(reload, (userOperation: WaitForUserOperationReturnType) => {
    return userOperation.status === UserOperationStatusEnum.Complete || userOperation.status === UserOperationStatusEnum.Failed;
  }, options.waitOptions);
}
