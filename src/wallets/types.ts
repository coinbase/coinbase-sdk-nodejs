import type { Address } from "abitype";
import type { LocalAccount } from "viem";
import {
  SendUserOperationOptions,
  SendUserOperationReturnType,
} from "../actions/sendUserOperation";
import { Network, SupportedChainId } from "../types/chain";
import { Prettify } from "viem";

export type SmartWalletNetworkOptions = {
  chainId: SupportedChainId;
  paymasterUrl?: string;
};

export type SmartWallet = {
  address: Address;
  account: LocalAccount;
  type: "smart";
  sendUserOperation: <T extends readonly unknown[]>(
    options: SendUserOperationOptions<T>,
  ) => Promise<SendUserOperationReturnType>;
  useNetwork: (options: SmartWalletNetworkOptions) => NetworkScopedSmartWallet;
};

export type NetworkScopedSmartWallet = Prettify<
  Omit<SmartWallet, "sendUserOperation"> & {
    network: Network;
    paymasterUrl?: string;
    sendUserOperation: <T extends readonly unknown[]>(
      options: Prettify<Omit<SendUserOperationOptions<T>, "chainId" | "paymasterUrl">>,
    ) => Promise<SendUserOperationReturnType>;
  }
>;
